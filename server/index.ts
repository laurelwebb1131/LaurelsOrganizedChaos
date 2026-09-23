import { createServer } from 'node:http'
import { handleCompanion, handleHealth } from './companion'

const port = Number(process.env.PORT ?? 8787)

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  if (url.pathname === '/health') return handleHealth(request, response)
  if (url.pathname === '/api/companion') return void handleCompanion(request, response)
  response.statusCode = 404
  response.end('Not found')
}).listen(port, () => {
  console.log(`Hearthwise companion API listening on ${port}`)
})
