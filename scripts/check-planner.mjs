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
check(!styles.includes('DASHBOARD GRIMOIRE PASS') || styles.includes('BUILD 1 — 1800s GRIMOIRE COVER'), 'cover CSS must remain after the dashboard grimoire layer')

check(index.includes('./styles.css') && index.includes('./app.js'), 'index.html must load readable production assets')
check(!index.includes('payload/') && !index.includes('DecompressionStream'), 'index.html still references obsolete compressed payload loading')
check(index.includes('id="mobile-menu"') && index.includes('aria-controls="sidebar"') && index.includes('aria-expanded="false"'), 'mobile navigation button must expose sidebar state')

const requiredDomIds = [
  'app-shell',
  'sidebar',
  'main-nav',
  'theme-toggle',
  'mobile-menu',
  'quick-add-mobile',
  'main-content',
  'floating-add',
  'modal-backdrop',
  'modal-close',
  'modal-body',
  'toast-region',
]
for (const id of requiredDomIds) check(index.includes(`id="${id}"`), `index.html is missing required #${id}`)

check(manifest?.id === './', 'manifest id must stay scoped to the planner root')
check(manifest?.start_url === './#cover', 'manifest must start on the spellbook cover')
check(manifest?.scope === './', 'manifest scope must stay inside the planner')
check(manifest?.display === 'standalone', 'manifest display mode must remain standalone')
check(Array.isArray(manifest?.icons) && manifest.icons.some(icon => icon?.src === './icon.svg'), 'manifest must include the planner icon')

const requiredShellAssets = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg']
for (const asset of requiredShellAssets) check(serviceWorker.includes(`'${asset}'`), `service worker shell is missing ${asset}`)
check(serviceWorker.includes("self.addEventListener('install'"), 'service worker install handler is missing')
check(serviceWorker.includes("self.addEventListener('activate'"), 'service worker activate handler is missing')
check(serviceWorker.includes("self.addEventListener('fetch'"), 'service worker fetch handler is missing')
check(serviceWorker.includes('networkFirst('), 'service worker must keep the network-first strategy')

check(app.includes("const STORAGE_KEY = 'loc_planner_v1'"), 'planner storage key changed unexpectedly')
check(app.includes('const STATE_VERSION = 1'), 'planner state version constant changed unexpectedly')
check(app.includes('const STATE_RECOVERY_KEY ='), 'planner recovery storage key is missing')
check(app.includes('function parseCompatibleState('), 'planner state compatibility parser is missing')
check(app.includes('function preserveUnreadableState('), 'planner unreadable-state recovery is missing')
check(app.includes('function hydrateState('), 'planner state hydration is missing')
check(app.includes('function renderCover()'), 'cover renderer is missing')
check(app.includes("location.hash='cover'"), 'planner must default to the cover route')
check(app.includes("route() === 'cover'"), 'cover mode route handling is missing')
check(app.includes('data-route="dashboard"'), 'Open the Book must currently enter the dashboard')
check(app.includes('Laurel’s') && app.includes('Organized Chaos'), 'cover title is missing')
check(app.includes('Book of Daily Order &amp; Domestic Sorcery'), 'cover subtitle is missing')

const requiredRenderers = [
  'renderDashboard',
  'renderToday',
  'renderWeek',
  'renderCalendar',
  'renderSchool',
  'renderProjects',
  'renderHome',
  'renderBrain',
  'renderGoals',
  'renderScrapbook',
  'renderSettings',
]
for (const renderer of requiredRenderers) check(app.includes(`function ${renderer}(`), `${renderer} is missing`)

const requiredRoutes = ['dashboard','today','week','calendar','school','projects','home','brain','goals','scrapbook','settings']
for (const route of requiredRoutes) check(app.includes(`['${route}',`), `route ${route} is missing from navigation`)

check(app.includes('function finishTimerEarly()'), 'early timer finish handling is missing')
check(app.includes('function recordCompletedActivity('), 'task completion deduplication helper is missing')
check(app.includes('function handleModalKeydown('), 'modal keyboard containment is missing')
check(app.includes('function handleDocumentClick(') && app.includes("document.addEventListener('click', handleDocumentClick)"), 'delegated click handler must remain named and registered')
check(app.includes('function handleDocumentChange(') && app.includes("document.addEventListener('change', handleDocumentChange)"), 'delegated change handler must remain named and registered')
check(app.includes('function handleDocumentInput(') && app.includes("document.addEventListener('input', handleDocumentInput)"), 'delegated input handler must remain named and registered')
check(app.includes('function handleDocumentSubmit(') && app.includes("document.addEventListener('submit', handleDocumentSubmit)"), 'delegated submit handler must remain named and registered')
check(app.includes("document.addEventListener('pointercancel', finishPointerDrag)"), 'pointer drag cancellation cleanup is missing')
check(app.includes("navigator.serviceWorker.register('./sw.js')"), 'planner service worker registration is missing')
check(!app.includes('payload/'), 'planner app still references obsolete compressed payload files')

if (failures.length) {
  console.error('Planner validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Planner validation passed (${requiredRoutes.length} routes, ${requiredDomIds.length} DOM hooks, ${requiredShellAssets.length} offline shell assets).`)
