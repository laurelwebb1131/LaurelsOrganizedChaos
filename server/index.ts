import { createServer } from 'node:http'
import { handleCompanion, handleHealth } from './companion'

const port = parsePort(process.env.PORT)

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  if (url.pathname === '/health') return handleHealth(request, response)
  if (url.pathname === '/api/companion') return void handleCompanion(request, response)

  response.statusCode = 404
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.end('Not found')
})

server.on('error', (error) => {
  console.error('Hearthwise companion API failed to start:', error)
  process.exitCode = 1
})

server.listen(port, () => {
  console.log(`Hearthwise companion API listening on ${port}`)
})

function parsePort(value: string | undefined) {
  if (!value) return 8787
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received "${value}"`)
  }
  return parsed
}
