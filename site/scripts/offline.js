let registration;
export async function connectOffline() {
  if (!('serviceWorker' in navigator) || !('caches' in window) || !crypto.subtle) throw Error('OFFLINE_UNAVAILABLE');
  registration = await navigator.serviceWorker.register(new URL('../service-worker.js', import.meta.url), { scope: new URL('../', import.meta.url).pathname, updateViaCache: 'none' });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('OFFLINE_UNAVAILABLE')), 15000);
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
  return registration;
}
export function workerRequest(type, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const worker = navigator.serviceWorker.controller;
    if (!worker) { reject(Error('OFFLINE_UNAVAILABLE')); return; }
    const channel = new MessageChannel();
    let timer;
    const arm = () => { clearTimeout(timer); timer = setTimeout(() => { channel.port1.close(); reject(Error('DOWNLOAD_INTERRUPTED')); }, 60000); };
    arm();
    channel.port1.onmessage = ({ data }) => {
      arm();
      if (data.progress) { onProgress(data); return; }
      clearTimeout(timer); channel.port1.close();
      if (data.error) reject(Error(data.error)); else resolve(data);
    };
    worker.postMessage({ type }, [channel.port2]);
  });
}
