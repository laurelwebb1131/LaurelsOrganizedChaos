import { access, readFile } from 'node:fs/promises'

const raw = await readFile('public/assets/ASSET_MANIFEST.json', 'utf8')
let manifest

try {
  manifest = JSON.parse(raw)
} catch (error) {
  console.error(`Asset manifest is invalid JSON: ${error.message}`)
  process.exit(1)
}

if (!manifest || !Array.isArray(manifest.assets)) {
  console.error('Asset manifest must contain an assets array.')
  process.exit(1)
}

const problems = []
const seenFiles = new Set()

for (const [index, asset] of manifest.assets.entries()) {
  const label = `asset #${index + 1}`
  if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
    problems.push(`${label} is not an object`)
    continue
  }

  for (const field of ['file', 'name', 'license', 'creator', 'source']) {
    if (typeof asset[field] !== 'string' || !asset[field].trim()) {
      problems.push(`${label} is missing ${field}`)
    }
  }

  if (typeof asset.file !== 'string' || !asset.file.trim()) continue
  if (seenFiles.has(asset.file)) problems.push(`duplicate manifest path: ${asset.file}`)
  seenFiles.add(asset.file)

  if (typeof asset.license === 'string' && asset.license !== 'CC0 1.0 Universal') {
    problems.push(`${asset.file} violates the manifest CC0-only policy: ${asset.license}`)
  }

  try {
    await access(`public/${asset.file}`)
  } catch {
    problems.push(`missing file: ${asset.file}`)
  }
}

if (problems.length) {
  console.error(`Asset verification failed with ${problems.length} problem(s):\n${problems.map(problem => `- ${problem}`).join('\n')}`)
  process.exit(1)
}

console.log(`Verified ${manifest.assets.length} licensed CC0 assets and manifest records.`)
