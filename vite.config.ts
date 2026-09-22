import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const maxContextLength = 1200

function companionApi(): Plugin {
  return {
    name: 'hearthwise-companion-api',
    configureServer(server) {
      server.middlewares.use('/api/companion', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.setHeader('Allow', 'POST')
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const body = await readJsonBody(request)
          const input = validateCompanionRequest(body)
          const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL
          const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY
          const model = process.env.OPENAI_COMPATIBLE_MODEL

          if (!baseUrl || !apiKey || !model) {
            response.statusCode = 503
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ error: 'Companion provider is not configured' }))
            return
          }

          const providerResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              temperature: 0.7,
              max_tokens: 240,
              messages: [
                {
                  role: 'system',
                  content: `You are ${input.companionName}, a supportive Hearthwise companion. You are assigned to ${input.realm}. Your role is ${input.companionRole}. Only use the user-provided context below. Never claim to know private facts, diagnose, impersonate a real person, or make high-stakes decisions. Give one practical, kind next step. User-provided context: ${input.companionContext}`,
                },
                { role: 'user', content: input.userMessage },
              ],
            }),
          })

          if (!providerResponse.ok) {
            response.statusCode = providerResponse.status === 429 ? 429 : 502
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ error: 'Companion provider request failed' }))
            return
          }

          const providerData = await providerResponse.json() as { choices?: { message?: { content?: string } }[] }
          const reply = providerData.choices?.[0]?.message?.content?.trim()
          if (!reply) throw new Error('Provider returned no message')
          sendJson(response, { reply: reply.slice(0, 1600) })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Invalid companion request'
          response.statusCode = message === 'Request body too large' ? 413 : 400
          sendJson(response, { error: message })
        }
      })
    },
  }
}

function readJsonBody(request: import('node:http').IncomingMessage): Promise<unknown> {
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

function validateCompanionRequest(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Request body must be an object')
  const body = value as Record<string, unknown>
  const fields = ['companionName', 'companionRole', 'companionContext', 'realm', 'userMessage']
  for (const field of fields) if (typeof body[field] !== 'string' || !body[field]) throw new Error(`${field} is required`)
  for (const field of fields) if ((body[field] as string).length > maxContextLength) throw new Error(`${field} is too long`)
  return body as { companionName: string; companionRole: string; companionContext: string; realm: string; userMessage: string }
}

function sendJson(response: import('node:http').ServerResponse, body: object) {
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export default defineConfig({
  plugins: [react(), companionApi()],
  server: {
    watch: {
      ignored: ['**/*.glb', '**/*.gltf', '**/*.bin', '**/textures/**'],
    },
  },
})
