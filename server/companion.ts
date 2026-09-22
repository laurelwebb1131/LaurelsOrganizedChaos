import type { IncomingMessage, ServerResponse } from 'node:http'

const maxFieldLength = 1200

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
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    writeJson(response, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const input = validateRequest(await readJson(request))
    const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL
    const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY
    const model = process.env.OPENAI_COMPATIBLE_MODEL
    if (!baseUrl || !apiKey || !model) {
      writeJson(response, 503, { error: 'Companion provider is not configured' })
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
      writeJson(response, providerResponse.status === 429 ? 429 : 502, { error: 'Companion provider request failed' })
      return
    }
    const data = await providerResponse.json() as CompanionProviderResponse
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('Provider returned no message')
    writeJson(response, 200, { reply: reply.slice(0, 1600) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid companion request'
    writeJson(response, message === 'Request body too large' ? 413 : 400, { error: message })
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
  return body as CompanionRequest
}

function writeJson(response: ServerResponse, status: number, body: object) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}
