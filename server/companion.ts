import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

const maxFieldLength = 1200
const requestWindowMs = 60_000
const requestLimit = 20
const requestCounts = new Map<string, { startedAt: number; count: number }>()
const allowedOrigins = new Set((process.env.HEARTHWISE_ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean))

export type CompanionRequest = {
  companionName: string
  companionRole: string
  companionContext: string
  realm: string
  userMessage: string
  goals?: unknown[]
  habits?: unknown[]
}

type CompanionProviderResponse = { choices?: { message?: { content?: string } }[] }

export function handleHealth(_request: IncomingMessage, response: ServerResponse) {
  writeJson(response, 200, { ok: true, service: 'hearthwise-companion' })
}

export async function handleCompanion(request: IncomingMessage, response: ServerResponse) {
  const requestId = randomUUID()
  response.setHeader('X-Request-Id', requestId)
  const origin = request.headers.origin
  if (origin && allowedOrigins.size > 0 && !allowedOrigins.has(origin)) {
    writeJson(response, 403, { error: 'Origin not allowed', requestId })
    return
  }
  if (origin && allowedOrigins.size > 0) response.setHeader('Access-Control-Allow-Origin', origin)
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    writeJson(response, 405, { error: 'Method not allowed' })
    return
  }
  const clientKey = request.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? request.socket.remoteAddress ?? 'unknown'
  const now = Date.now()
  const existing = requestCounts.get(clientKey)
  for (const [key, bucket] of requestCounts) if (now - bucket.startedAt >= requestWindowMs) requestCounts.delete(key)
  const window = existing && now - existing.startedAt < requestWindowMs ? existing : { startedAt: now, count: 0 }
  window.count += 1
  requestCounts.set(clientKey, window)
  if (window.count > requestLimit) {
    response.setHeader('Retry-After', '60')
    writeJson(response, 429, { error: 'Too many requests', requestId })
    return
  }

  try {
    const input = validateRequest(await readJson(request))
    const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL
    const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY
    const model = process.env.OPENAI_COMPATIBLE_MODEL
    if (!baseUrl || !apiKey || !model) {
      writeJson(response, 503, { error: 'Companion provider is not configured', requestId })
      return
    }

    const providerResponse = await fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 240,
        messages: [
          {
            role: 'system',
            content: `You are ${input.companionName}, a supportive Hearthwise companion assigned to ${input.realm}. Your role is ${input.companionRole}. Only use supplied context. Never claim private knowledge, diagnose, impersonate a real person, or make high-stakes decisions. Give one practical, kind next step. Context: ${input.companionContext}. Goals: ${JSON.stringify(input.goals ?? [])}. Habits: ${JSON.stringify(input.habits ?? [])}`,
          },
          { role: 'user', content: input.userMessage },
        ],
      }),
    }, 12000)

    if (!providerResponse.ok) {
      writeJson(response, providerResponse.status === 429 ? 429 : 502, { error: 'Companion provider request failed', requestId })
      return
    }
    const data = await providerResponse.json() as CompanionProviderResponse
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('Provider returned no message')
    writeJson(response, 200, { reply: reply.slice(0, 1600), requestId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid companion request'
    writeJson(response, message === 'Request body too large' ? 413 : 400, { error: message, requestId })
  }
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(input, { ...init, signal: controller.signal }) } finally { clearTimeout(timeout) }
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    request.on('data', (chunk: Buffer) => {
      raw += chunk.toString()
      if (raw.length > 9000) reject(new Error('Request body too large'))
    })
    request.on('end', () => {
      try { resolve(JSON.parse(raw)) } catch { reject(new Error('Request body must be valid JSON')) }
    })
    request.on('error', reject)
  })
}

function validateRequest(value: unknown): CompanionRequest {
  if (!value || typeof value !== 'object') throw new Error('Request body must be an object')
  const body = value as Record<string, unknown>
  const required = ['companionName', 'companionRole', 'companionContext', 'realm', 'userMessage']
  for (const field of required) {
    if (typeof body[field] !== 'string' || !body[field]) throw new Error(`${field} is required`)
    if ((body[field] as string).length > maxFieldLength) throw new Error(`${field} is too long`)
  }
  if (body.goals !== undefined && !Array.isArray(body.goals)) throw new Error('goals must be an array')
  if (body.habits !== undefined && !Array.isArray(body.habits)) throw new Error('habits must be an array')
  return body as CompanionRequest
}

function writeJson(response: ServerResponse, status: number, body: object) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}
