import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const root = new URL('../public/planner/', import.meta.url)
const read = (name) => readFile(new URL(name, root), 'utf8')

const [app, styles, serviceWorker, manifestText, index, icon] = await Promise.all([
  read('app.js'),
  read('styles.css'),
  read('sw.js'),
  read('manifest.webmanifest'),
  read('index.html'),
  read('icon.svg'),
])

const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

try { new Function(app) } catch (error) { failures.push(`app.js syntax error: ${error.message}`) }
try { new Function(serviceWorker) } catch (error) { failures.push(`sw.js syntax error: ${error.message}`) }

let manifest
try { manifest = JSON.parse(manifestText) } catch (error) { failures.push(`manifest.webmanifest is invalid JSON: ${error.message}`) }

const cssBalance = (styles.match(/{/g) ?? []).length - (styles.match(/}/g) ?? []).length
check(cssBalance === 0, `styles.css brace balance is ${cssBalance}`)
check((styles.match(/(^|\n)\s*:root\s*\{/g) ?? []).length === 1, 'styles.css should keep one consolidated :root variable registry')
check((styles.match(/@media \(prefers-reduced-motion: reduce\)/g) ?? []).length === 1, 'styles.css should keep one reduced-motion block')
check(!styles.includes('DASHBOARD GRIMOIRE PASS') || styles.includes('BUILD 1 — 1800s GRIMOIRE COVER'), 'cover CSS must remain after the dashboard grimoire layer')

check(index.includes('./styles.css') && index.includes('./app.js'), 'index.html must load readable production assets')
check(!index.includes('payload/') && !index.includes('DecompressionStream'), 'index.html still references obsolete compressed payload loading')
check(index.includes('id="mobile-menu"') && index.includes('aria-controls="sidebar"') && index.includes('aria-expanded="false"'), 'mobile navigation button must expose sidebar state')
check(icon.includes('viewBox="0 0 512 512"'), 'planner icon must keep a scalable 512x512 viewBox')

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

const requiredRoutes = ['dashboard','today','week','calendar','school','projects','home','brain','goals','scrapbook','settings']

check(manifest?.id === './', 'manifest id must stay scoped to the planner root')
check(manifest?.start_url === './#cover', 'manifest must start on the spellbook cover')
check(manifest?.scope === './', 'manifest scope must stay inside the planner')
check(manifest?.display === 'standalone', 'manifest display mode must remain standalone')
check(!Object.prototype.hasOwnProperty.call(manifest ?? {}, 'display_override'), 'manifest should not request unsupported window-controls-overlay behavior')
check(manifest?.theme_color === '#120b08' && manifest?.background_color === '#120b08', 'manifest theme/background colors must match the planner shell')
check(Array.isArray(manifest?.icons) && manifest.icons.some(iconEntry => iconEntry?.src === './icon.svg' && iconEntry?.type === 'image/svg+xml'), 'manifest must include the planner SVG icon')
check(Array.isArray(manifest?.shortcuts) && manifest.shortcuts.length >= 1, 'manifest should expose planner shortcuts')
for (const shortcut of manifest?.shortcuts ?? []) {
  const match = /^\.\/#([a-z-]+)$/.exec(shortcut?.url ?? '')
  check(Boolean(match), `manifest shortcut has invalid scoped URL: ${String(shortcut?.url)}`)
  if (match) check(requiredRoutes.includes(match[1]), `manifest shortcut points to unknown route #${match[1]}`)
}

const requiredShellAssets = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg']
for (const asset of requiredShellAssets) check(serviceWorker.includes(`'${asset}'`), `service worker shell is missing ${asset}`)
check(serviceWorker.includes("const CACHE_PREFIX = 'loc-planner-'"), 'service worker cache namespace is missing')
check(serviceWorker.includes('key.startsWith(CACHE_PREFIX) && key !== CACHE'), 'service worker must delete only old planner caches')
check(serviceWorker.includes('NETWORK_TIMEOUT_MS'), 'service worker network timeout is missing')
check(serviceWorker.includes('new AbortController()'), 'service worker network timeout must be abortable')
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
check(/function loadState\(\)\s*\{[\s\S]*?try\s*\{[\s\S]*?localStorage\.getItem\(STORAGE_KEY\)/.test(app), 'planner startup must guard localStorage reads')
check(app.includes('organized-chaos-recovery-'), 'blocked storage should export the preserved recovery copy instead of fallback starter data')
check(app.includes("localStorage.getItem(STATE_RECOVERY_KEY)"), 'recovery export must read the preserved raw storage value')
check(app.includes("const previousRaw = localStorage.getItem(STORAGE_KEY) || JSON.stringify(previousState)"), 'import must preserve the exact pre-import stored value when possible')
check(app.includes("schema: 'laurels-organized-chaos-planner'") && app.includes('schemaVersion: STATE_VERSION'), 'JSON export metadata must identify the planner schema/version')
check(app.includes('file.size > 15 * 1024 * 1024'), 'JSON import size guard is missing')
check(app.includes('file.size > 12 * 1024 * 1024'), 'image upload size guard is missing')
check(app.includes('const maxCanvasPixels = 3_000_000'), 'image canvas pixel cap is missing')
check(app.includes('const maxCanvasDimension = 4096'), 'image canvas dimension cap is missing')
check(app.includes("window.addEventListener('storage'"), 'cross-tab storage synchronization is missing')

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
for (const route of requiredRoutes) check(app.includes(`['${route}',`), `route ${route} is missing from navigation`)

check(app.includes('function finishTimerEarly()'), 'early timer finish handling is missing')
check(app.includes('function recordCompletedActivity('), 'task completion deduplication helper is missing')
check(app.includes('function handleModalKeydown('), 'modal keyboard containment is missing')
check(index.includes('role="dialog"') && index.includes('aria-modal="true"') && index.includes('aria-labelledby="modal-title"'), 'modal dialog semantics are incomplete')
check(index.includes('id="main-content" tabindex="-1"'), 'main content must remain programmatically focusable after navigation')
check(app.includes("e.key === 'Enter' || e.key === ' '") && app.includes('data-action="calendar-day"'), 'calendar keyboard activation handling is missing')
check(app.includes("window.addEventListener('beforeinstallprompt'"), 'PWA install prompt capture is missing')
check(styles.includes('@media (max-width: 780px)') && styles.includes('.sidebar.open'), 'mobile sidebar responsive rules are missing')
check(styles.includes('@media (max-width: 760px)') && styles.includes('.antique-cover-stage'), 'responsive antique cover rules are missing')
check(app.includes('function handleDocumentClick(') && app.includes("document.addEventListener('click', handleDocumentClick)"), 'delegated click handler must remain named and registered')
check(app.includes('function handleDocumentChange(') && app.includes("document.addEventListener('change', handleDocumentChange)"), 'delegated change handler must remain named and registered')
check(app.includes('function handleDocumentInput(') && app.includes("document.addEventListener('input', handleDocumentInput)"), 'delegated input handler must remain named and registered')
check(app.includes('function handleDocumentSubmit(') && app.includes("document.addEventListener('submit', handleDocumentSubmit)"), 'delegated submit handler must remain named and registered')
check(app.includes("document.addEventListener('pointercancel', finishPointerDrag)"), 'pointer drag cancellation cleanup is missing')
check(app.includes("navigator.serviceWorker.register('./sw.js')"), 'planner service worker registration is missing')
check(!app.includes('payload/'), 'planner app still references obsolete compressed payload files')

async function checkServiceWorkerRuntime() {
  const listeners = new Map()
  const cacheObjects = new Map()
  const cacheAdds = []
  const cachePuts = []
  const deletedCaches = []
  let cacheKeys = []
  let skipWaitingCalled = false
  let claimCalled = false
  let fetchMode = 'network'

  const keyFor = (request) => typeof request === 'string' ? request : request?.url

  const makeCache = (name) => {
    if (cacheObjects.has(name)) return cacheObjects.get(name)
    const entries = new Map()
    const cache = {
      entries,
      async addAll(assets) {
        cacheAdds.push({ name, assets: [...assets] })
      },
      async match(request) {
        return entries.get(keyFor(request))
      },
      async put(request, response) {
        cachePuts.push({ name, key: keyFor(request) })
        entries.set(keyFor(request), response)
      },
    }
    cacheObjects.set(name, cache)
    return cache
  }

  const context = {
    self: {
      location: { origin: 'https://planner.test' },
      clients: { async claim() { claimCalled = true } },
      skipWaiting() { skipWaitingCalled = true },
      addEventListener(type, handler) { listeners.set(type, handler) },
    },
    caches: {
      async open(name) { return makeCache(name) },
      async keys() { return [...cacheKeys] },
      async delete(name) { deletedCaches.push(name); return true },
    },
    async fetch() {
      if (fetchMode === 'offline') throw new Error('offline')
      return new Response('network', { status: 200 })
    },
    URL,
    AbortController,
    Response,
    setTimeout,
    clearTimeout,
    console,
  }

  runInNewContext(serviceWorker, context)

  check(listeners.has('install') && listeners.has('activate') && listeners.has('fetch'), 'service worker runtime handlers did not register')

  let pending
  listeners.get('install')?.({ waitUntil(value) { pending = value } })
  if (pending) await pending

  const currentCache = cacheAdds[0]?.name
  check(skipWaitingCalled, 'service worker install must call skipWaiting')
  check(Boolean(currentCache), 'service worker install did not open a cache')
  check(requiredShellAssets.every(asset => cacheAdds[0]?.assets.includes(asset)), 'service worker install did not precache the complete app shell')

  cacheKeys = [currentCache, 'loc-planner-old-test', 'hearthwise-unrelated-cache']
  pending = undefined
  listeners.get('activate')?.({ waitUntil(value) { pending = value } })
  if (pending) await pending
  check(claimCalled, 'service worker activate must claim clients')
  check(deletedCaches.includes('loc-planner-old-test'), 'service worker activate did not delete an old planner cache')
  check(!deletedCaches.includes('hearthwise-unrelated-cache'), 'service worker activate deleted an unrelated origin cache')

  let responsePromise
  listeners.get('fetch')?.({
    request: { method: 'GET', url: 'https://planner.test/app.js', mode: 'same-origin' },
    respondWith(value) { responsePromise = value },
  })
  const networkResponse = responsePromise ? await responsePromise : null
  check((await networkResponse?.text()) === 'network', 'service worker same-origin GET did not use the network path')
  check(cachePuts.some(entry => entry.key === 'https://planner.test/app.js'), 'service worker did not refresh the cache after a successful GET')

  fetchMode = 'offline'
  const cache = makeCache(currentCache)
  cache.entries.set('https://planner.test/styles.css', new Response('cached-style', { status: 200 }))
  responsePromise = undefined
  listeners.get('fetch')?.({
    request: { method: 'GET', url: 'https://planner.test/styles.css', mode: 'same-origin' },
    respondWith(value) { responsePromise = value },
  })
  const cachedResponse = responsePromise ? await responsePromise : null
  check((await cachedResponse?.text()) === 'cached-style', 'service worker did not return a cached asset while offline')

  cache.entries.set('./index.html', new Response('offline-shell', { status: 200 }))
  responsePromise = undefined
  listeners.get('fetch')?.({
    request: { method: 'GET', url: 'https://planner.test/today', mode: 'navigate' },
    respondWith(value) { responsePromise = value },
  })
  const navigationResponse = responsePromise ? await responsePromise : null
  check((await navigationResponse?.text()) === 'offline-shell', 'service worker did not fall back to the cached index for offline navigation')

  responsePromise = undefined
  listeners.get('fetch')?.({
    request: { method: 'GET', url: 'https://other.test/app.js', mode: 'same-origin' },
    respondWith(value) { responsePromise = value },
  })
  check(responsePromise === undefined, 'service worker should ignore cross-origin requests')

  responsePromise = undefined
  listeners.get('fetch')?.({
    request: { method: 'POST', url: 'https://planner.test/app.js', mode: 'same-origin' },
    respondWith(value) { responsePromise = value },
  })
  check(responsePromise === undefined, 'service worker should ignore non-GET requests')
}

try {
  await checkServiceWorkerRuntime()
} catch (error) {
  failures.push(`service worker runtime check failed: ${error instanceof Error ? error.message : String(error)}`)
}

if (failures.length) {
  console.error('Planner validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Planner validation passed (${requiredRoutes.length} routes, ${requiredDomIds.length} DOM hooks, ${requiredShellAssets.length} offline shell assets, storage/recovery checks, and service-worker runtime behavior).`)
