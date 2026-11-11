/* Single-adventure, version-atomic offline packages. No runtime third-party fetches.
 * Protocol 1 remains compatible across cosmetic/content-only updates.
 * Complete old packages are retained; active clients keep a durable version pin.
 */
const ROOT = new URL('./', self.location.href);
const PREFIX = `berea:${ROOT.pathname}:`;
const META = `${PREFIX}metadata-v1`;
const PACKAGE = `${PREFIX}package:`;
const markerURL = new URL('__package__', ROOT).href;
const activeURL = new URL('__active__', ROOT).href;
const pinURL = id => new URL(`__client__/${encodeURIComponent(id)}`, ROOT).href;
let downloadInFlight = false;
self.addEventListener('install', () => { /* Waiting workers never evict an open app. */ });
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
const asJSON = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
async function metadata(key) {
  const response = await (await caches.open(META)).match(key);
  return response ? response.json() : null;
}
async function setMetadata(key, data) { await (await caches.open(META)).put(key, asJSON(data)); }
async function packageInfo(id) {
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const response = await (await caches.open(`${PACKAGE}${id}`)).match(markerURL);
  return response ? response.json() : null;
}
async function clientPackage(clientId) {
  // Persist pins in CacheStorage: a service worker may stop between any requests.
  const pin = clientId && await metadata(pinURL(clientId));
  if (pin) return { id: pin.id, info: await packageInfo(pin.id) };
  const active = await metadata(activeURL);
  if (active && clientId) await setMetadata(pinURL(clientId), active);
  return { id: active?.id || null, info: await packageInfo(active?.id) };
}
function validateManifest(manifest) {
  if (manifest.adventureId !== 'berea-case-01' || manifest.schemaVersion !== 1 || manifest.stateCompatibility !== 1 ||
      manifest.applicationImplemented !== true || !Array.isArray(manifest.resources) || !manifest.resources.length || manifest.resources.length > 500) throw Error('INCOMPATIBLE_PACKAGE');
  const paths = new Set();
  for (const r of manifest.resources) {
    if (typeof r.path !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(r.path) || r.path.startsWith('/') || r.path.split('/').some(v => !v || v === '..' || v === '.') ||
        !/^[a-f0-9]{64}$/.test(r.sha256) || !Number.isSafeInteger(r.byteLength) || r.byteLength < 1 || r.required !== true || paths.has(r.path)) throw Error('INVALID_PACKAGE');
    paths.add(r.path);
  }
  for (const path of ['index.html', 'scripts/app.js', 'scripts/engine.js', 'styles/app.css', 'content/adventure.json', 'content/preparation.json', 'manifest.webmanifest', 'service-worker.js']) {
    if (!paths.has(path)) throw Error('INVALID_PACKAGE');
  }
}
async function validBytes(response, resource) {
  if (!response?.ok) return false;
  const bytes = await response.arrayBuffer();
  return bytes.byteLength === resource.byteLength && await digest(bytes) === resource.sha256;
}
async function verify(id, progress = () => {}, cacheName = `${PACKAGE}${id}`) {
  const cache = await caches.open(cacheName);
  const marker = await cache.match(markerURL);
  const info = marker ? await marker.json() : null;
  if (!info) return false;
  try { validateManifest(info.manifest); } catch { return false; }
  let count = 0;
  for (const resource of info.manifest.resources) {
    if (!await validBytes(await cache.match(new URL(resource.path, ROOT).href), resource)) return false;
    progress({ progress: true, phase: 'check', done: ++count, total: info.manifest.resources.length });
  }
  return true;
}
async function network(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(new URL(path, ROOT), { cache: 'no-store', credentials: 'same-origin', signal: controller.signal, redirect: 'error' });
    if (!response.ok) throw Error();
    const bytes = await response.arrayBuffer(); // timeout covers headers and the entire body
    const headers = new Headers(response.headers);
    // Fetch has already decoded HTTP compression. Cache the decoded bytes with
    // matching headers, including when the static host serves gzip/Brotli.
    for (const key of ['Content-Encoding', 'Content-Length', 'Transfer-Encoding']) headers.delete(key);
    return new Response(bytes, { status: response.status, headers });
  } finally { clearTimeout(timeout); }
}
async function download(progress) {
  if (downloadInFlight) throw Error('DOWNLOAD_BUSY');
  downloadInFlight = true;
  let id, stageName, wasComplete = false;
  try {
    const bootstrap = await network('content/offline-resources.json');
    const bytes = await bootstrap.clone().arrayBuffer();
    const manifest = await bootstrap.json();
    validateManifest(manifest);
    id = await digest(bytes);
    const active = await metadata(activeURL), old = await packageInfo(active?.id);
    if (old && (old.manifest.adventureId !== manifest.adventureId || old.manifest.stateCompatibility !== manifest.stateCompatibility || old.manifest.schemaVersion !== manifest.schemaVersion)) throw Error('INCOMPATIBLE_PACKAGE');
    wasComplete = await verify(id);
    if (!wasComplete) {
      // Staging is isolated even when repairing an evicted active package.
      stageName = `${PREFIX}staging:${id}`;
      await caches.delete(stageName);
      const cache = await caches.open(stageName);
      let done = 0, downloadedBytes = 0;
      for (const resource of manifest.resources) {
        const response = await network(resource.path);
        if (!await validBytes(response.clone(), resource)) throw Error('DOWNLOAD_INTERRUPTED');
        await cache.put(new URL(resource.path, ROOT).href, response);
        downloadedBytes += resource.byteLength;
        progress({ progress: true, phase: 'download', done: ++done, total: manifest.resources.length, bytes: downloadedBytes, totalBytes: manifest.resources.reduce((n, r) => n + r.byteLength, 0) });
      }
      await cache.put(new URL('content/offline-resources.json', ROOT).href, new Response(bytes, { headers: { 'Content-Type': 'application/json' } }));
      await cache.put(markerURL, asJSON({ id, manifest }));
      if (!await verify(id, () => {}, stageName)) throw Error('DOWNLOAD_INTERRUPTED');
      const finalCache = await caches.open(`${PACKAGE}${id}`);
      for (const key of await cache.keys()) {
        if (key.url !== markerURL) await finalCache.put(key, await cache.match(key));
      }
      await finalCache.put(markerURL, asJSON({ id, manifest }));
      if (!await verify(id)) throw Error('DOWNLOAD_INTERRUPTED');
    }
    await setMetadata(activeURL, { id }); // single commit point after complete verification
    return { id, version: manifest.contentVersion, ready: true };
  } catch (error) {
    if (id && !wasComplete && id !== (await metadata(activeURL))?.id) await caches.delete(`${PACKAGE}${id}`);
    if (['INCOMPATIBLE_PACKAGE', 'INVALID_PACKAGE'].includes(error.message)) throw error;
    throw Error('DOWNLOAD_INTERRUPTED');
  } finally { if (stageName) await caches.delete(stageName); downloadInFlight = false; }
}
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  event.waitUntil((async () => {
    try {
      const { id, info } = await clientPackage(event.source?.id);
      switch (event.data?.type) {
        case 'STATUS': port.postMessage({ id, ready: false, version: info?.manifest.contentVersion || null, hasPackage: !!info }); break;
        case 'CHECK': port.postMessage({ id, ready: await verify(id, data => port.postMessage(data)), version: info?.manifest.contentVersion || null }); break;
        case 'DOWNLOAD': port.postMessage(await download(data => port.postMessage(data))); break;
        default: port.postMessage({ error: 'OFFLINE_UNAVAILABLE' });
      }
    } catch (error) {
      const allowed = ['INCOMPATIBLE_PACKAGE', 'INVALID_PACKAGE', 'DOWNLOAD_BUSY', 'DOWNLOAD_INTERRUPTED'];
      port.postMessage({ error: allowed.includes(error.message) ? error.message : 'OFFLINE_UNAVAILABLE' });
    }
  })());
});
function recoveryPage() {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Berea investigation</title><style>body{font:18px/1.6 system-ui;background:#121b22;color:#f4f0e5;max-width:36em;margin:3em auto;padding:1em}button{font:inherit;min-height:48px;padding:.7em}a{color:#eac46a}</style><h1>Preparation needs repair</h1><p>The complete local package is unavailable. Your saved investigation has not been reset. Connect to the internet and retry the complete download, then reopen. Removed device data cannot be recovered here.</p><button id="repair">Retry complete download</button><p id="status" role="status"></p><script>document.querySelector('button').onclick=()=>{const s=document.querySelector('#status');s.textContent='Downloading…';const c=new MessageChannel();c.port1.onmessage=({data:d})=>{if(d.progress)s.textContent='Checking package: '+d.done+' / '+d.total;else if(d.error)s.textContent='Preparation incomplete. Check connectivity and available storage, then retry.';else location.reload()};navigator.serviceWorker.controller.postMessage({type:'DOWNLOAD'},[c.port2])}</script></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 });
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname) || event.request.method !== 'GET') return;
  event.respondWith((async () => {
    if (event.request.mode === 'navigate') {
      const active = await metadata(activeURL);
      if (!active) return fetch(event.request);
      if (!await verify(active.id)) return recoveryPage();
      if (event.resultingClientId) await setMetadata(pinURL(event.resultingClientId), active);
      return (await caches.open(`${PACKAGE}${active.id}`)).match(new URL('index.html', ROOT).href);
    }
    const { id, info } = await clientPackage(event.clientId);
    if (!info) {
      if (id) return new Response('Preparation incomplete. Reopen with connectivity to repair.', { status: 503 });
      return fetch(event.request);
    }
    const relative = url.pathname.slice(ROOT.pathname.length);
    const response = await (await caches.open(`${PACKAGE}${id}`)).match(new URL(relative, ROOT).href);
    return response || new Response('Preparation incomplete. Reopen with connectivity to repair.', { status: 503 });
  })().catch(() => event.request.mode === 'navigate' ? recoveryPage() : new Response('Local package unavailable.', { status: 503 })));
});
