import { readFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'

const manifest = JSON.parse(await readFile('public/assets/ASSET_MANIFEST.json', 'utf8'))
const missing = []

for (const asset of manifest.assets) {
  try {
    await access(`public/${asset.file}`)
  } catch {
    missing.push(asset.file)
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} manifest asset(s):\n${missing.join('\n')}`)
  process.exit(1)
}

console.log(`Verified ${manifest.assets.length} licensed assets.`)
