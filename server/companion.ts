import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

const maxFieldLength = 1200
const maxRequestBytes = 9000
const maxContextItems = 50
const requestWindowMs = 60_000
const requestLimit = 20
const requestCounts = new Map<string, { startedAt: number; count: number }>()
const allowedOrigins = new Set(
  (process.env.HEARTHWISE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

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

class RequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
    this.name = 'RequestError'
  }
}

class ProviderTimeoutError extends Error {
  constructor() {
    super('Companion provider timed out')
    this.name = 'ProviderTimeoutError'
  }
}

export function handleHealth(_request: IncomingMessage, response: ServerResponse) {
  writeJson(response, 200, { ok: true, service: 'hearthwise-companion' })
}

export async function handleCompanion(request: IncomingMessage, response: ServerResponse) {
  const requestId = randomUUID()
  response.setHeader('X-Request-Id', requestId)
  response.setHeader('Cache-Control', 'no-store')

  const origin = request.headers.origin
  if (origin) response.setHeader('Vary', 'Origin')
  if (origin && allowedOrigins.size > 0 && !allowedOrigins.has(origin)) {
    writeJson(response, 403, { error: 'Origin not allowed', requestId })
    return
  }
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS')
    writeJson(response, 405, { error: 'Method not allowed', requestId })
    return
  }

  const clientKey = request.headers['x-forwarded-for']?.toString().split(',')[0].trim()
    ?? request.socket.remoteAddress
    ?? 'unknown'
  const now = Date.now()
  for (const [key, bucket] of requestCounts) {
    if (now - bucket.startedAt >= requestWindowMs) requestCounts.delete(key)
  }
  const existing = requestCounts.get(clientKey)
  const window = existing && now - existing.startedAt < requestWindowMs
    ? existing
    : { startedAt: now, count: 0 }
  window.count += 1
  requestCounts.set(clientKey, window)

  if (window.count > requestLimit) {
    response.setHeader('Retry-After', String(Math.ceil(requestWindowMs / 1000)))
    writeJson(response, 429, { error: 'Too many requests', requestId })
    return
  }

  let input: CompanionRequest
  try {
    input = validateRequest(await readJson(request))
  } catch (error) {
    const requestError = error instanceof RequestError
      ? error
      : new RequestError(error instanceof Error ? error.message : 'Invalid companion request')
    writeJson(response, requestError.status, { error: requestError.message, requestId })
    return
  }

  const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL
  const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY
  const model = process.env.OPENAI_COMPATIBLE_MODEL
  if (!baseUrl || !apiKey || !model) {
    writeJson(response, 503, { error: 'Companion provider is not configured', requestId })
    return
  }

  let providerResponse: Response
  try {
    providerResponse = await fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
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
    }, 12_000)
  } catch (error) {
    const status = error instanceof ProviderTimeoutError ? 504 : 502
    const message = error instanceof ProviderTimeoutError ? error.message : 'Companion provider is unavailable'
    writeJson(response, status, { error: message, requestId })
    return
  }

  if (!providerResponse.ok) {
    writeJson(response, providerResponse.status === 429 ? 429 : 502, {
      error: 'Companion provider request failed',
      requestId,
    })
    return
  }

  try {
    const data = await providerResponse.json() as CompanionProviderResponse
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('Provider returned no message')
    writeJson(response, 200, { reply: reply.slice(0, 1600), requestId })
  } catch {
    writeJson(response, 502, { error: 'Companion provider returned an invalid response', requestId })
  }
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new ProviderTimeoutError()
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    let bytes = 0
    let settled = false

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    request.on('data', (chunk: Buffer) => {
      if (settled) return
      bytes += chunk.byteLength
      if (bytes > maxRequestBytes) {
        fail(new RequestError('Request body too large', 413))
        return
      }
      raw += chunk.toString()
    })

    request.on('end', () => {
      if (settled) return
      settled = true
      if (!raw.trim()) {
        reject(new RequestError('Request body must be valid JSON'))
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new RequestError('Request body must be valid JSON'))
      }
    })

    request.on('error', (error) => fail(error))
  })
}

function validateRequest(value: unknown): CompanionRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError('Request body must be an object')
  }

  const body = value as Record<string, unknown>
  const required = ['companionName', 'companionRole', 'companionContext', 'realm', 'userMessage'] as const
  const normalized = {} as Record<(typeof required)[number], string>

  for (const field of required) {
    const raw = body[field]
    if (typeof raw !== 'string') throw new RequestError(`${field} is required`)
    const trimmed = raw.trim()
    if (!trimmed) throw new RequestError(`${field} is required`)
    if (trimmed.length > maxFieldLength) throw new RequestError(`${field} is too long`)
    normalized[field] = trimmed
  }

  if (body.goals !== undefined && !Array.isArray(body.goals)) throw new RequestError('goals must be an array')
  if (body.habits !== undefined && !Array.isArray(body.habits)) throw new RequestError('habits must be an array')
  if (Array.isArray(body.goals) && body.goals.length > maxContextItems) throw new RequestError('goals has too many items')
  if (Array.isArray(body.habits) && body.habits.length > maxContextItems) throw new RequestError('habits has too many items')

  return {
    ...normalized,
    goals: body.goals as unknown[] | undefined,
    habits: body.habits as unknown[] | undefined,
  }
}

function writeJson(response: ServerResponse, status: number, body: object) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}
