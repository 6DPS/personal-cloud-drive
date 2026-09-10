(function () {
  const currentScript = document.currentScript;
  let serverVer = "";
  if (currentScript && currentScript.src) {
    try {
      const url = new URL(currentScript.src, window.location.href);
      serverVer = url.searchParams.get("v") || "";
    } catch {}
  }
  if (!serverVer) serverVer = String(Date.now());

  const STORAGE_KEY = "pcd.activeAssetVersion";

  async function purgeCachesAndSync() {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      
      const localVer = localStorage.getItem(STORAGE_KEY);
      if (localVer !== serverVer) {
        localStorage.setItem(STORAGE_KEY, serverVer);
      }
    } catch {}
  }

  purgeCachesAndSync();

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      purgeCachesAndSync();
    }
  });
})();