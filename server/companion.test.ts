import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { handleCompanion, handleHealth } from './companion'

function request(path: string, method = 'GET', body?: string) {
  return new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }>((resolve, reject) => {
    const server = createServer((req, res) => {
      if (path === '/health') return handleHealth(req, res)
      return void handleCompanion(req, res)
    }).listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') return reject(new Error('Test server did not bind'))
      const request = fetch(`http://127.0.0.1:${address.port}${path}`, { method, body, headers: body ? { 'Content-Type': 'application/json' } : undefined })
      request.then(async (response) => {
        const result = { status: response.status, headers: Object.fromEntries(response.headers.entries()), body: await response.text() }
        server.close(() => resolve(result))
      }).catch((error) => { server.close(); reject(error) })
    })
  })
}

test('health endpoint returns service status', async () => {
  const response = await request('/health')
  assert.equal(response.status, 200)
  assert.deepEqual(JSON.parse(response.body), { ok: true, service: 'hearthwise-companion' })
})

test('companion endpoint rejects unsupported methods', async () => {
  const response = await request('/api/companion')
  assert.equal(response.status, 405)
  assert.equal(response.headers.allow, 'POST')
})

test('companion endpoint validates JSON', async () => {
  const response = await request('/api/companion', 'POST', JSON.stringify({}))
  assert.equal(response.status, 400)
  assert.match(response.body, /companionName is required/)
})

test('companion endpoint rejects malformed nested state', async () => {
  const response = await request('/api/companion', 'POST', JSON.stringify({
    companionName: 'Juniper',
    companionRole: 'Guide',
    companionContext: 'Context',
    realm: 'The Library',
    userMessage: 'Help',
    goals: 'not-an-array',
  }))
  assert.equal(response.status, 400)
  assert.match(response.body, /goals must be an array/)
})
