import { readFile } from 'node:fs/promises'

const root = new URL('../public/planner/', import.meta.url)
const read = (name) => readFile(new URL(name, root), 'utf8')

const [app, styles, serviceWorker, manifestText, index] = await Promise.all([
  read('app.js'),
  read('styles.css'),
  read('sw.js'),
  read('manifest.webmanifest'),
  read('index.html'),
])

const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

try { new Function(app) } catch (error) { failures.push(`app.js syntax error: ${error.message}`) }
try { new Function(serviceWorker) } catch (error) { failures.push(`sw.js syntax error: ${error.message}`) }

let manifest
try { manifest = JSON.parse(manifestText) } catch (error) { failures.push(`manifest.webmanifest is invalid JSON: ${error.message}`) }

const cssBalance = (styles.match(/{/g) ?? []).length - (styles.match(/}/g) ?? []).length
check(cssBalance === 0, `styles.css brace balance is ${cssBalance}`)
check(index.includes('./styles.css') && index.includes('./app.js'), 'index.html must load readable production assets')
check(!index.includes('payload/') && !index.includes('DecompressionStream'), 'index.html still references obsolete compressed payload loading')
check(manifest?.start_url === './#cover', 'manifest must start on the spellbook cover')
check(serviceWorker.includes('./styles.css') && serviceWorker.includes('./app.js'), 'service worker must cache planner production assets')
check(app.includes('function renderCover()'), 'cover renderer is missing')
check(app.includes("location.hash='cover'"), 'planner must default to the cover route')
check(app.includes("route() === 'cover'"), 'cover mode route handling is missing')

const requiredRenderers = ['renderDashboard','renderToday','renderWeek','renderCalendar','renderSchool','renderProjects','renderHome','renderBrain','renderGoals','renderScrapbook','renderSettings']
for (const renderer of requiredRenderers) check(app.includes(`function ${renderer}(`), `${renderer} is missing`)

if (failures.length) {
  console.error('Planner validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Planner validation passed.')
