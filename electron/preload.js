const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronClient', {
  isElectron: true,
  platform: process.platform,
  getLanAddresses: () => ipcRenderer.invoke('get-lan-addresses'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});

// 桌面客户端专属增强交互
window.addEventListener('DOMContentLoaded', () => {
  const updateNetStatusInteractive = () => {
    const netStatus = document.getElementById('networkStatus');
    if (!netStatus) return;
    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    if (!isLocal) {
      netStatus.style.cursor = 'pointer';
      netStatus.title = '【桌面端专属快捷操作】点击可直接切回本机极速模式 (127.0.0.1)';
      if (!netStatus.dataset.hasDesktopClick) {
        netStatus.dataset.hasDesktopClick = 'true';
        netStatus.addEventListener('click', () => {
          window.location.href = 'http://127.0.0.1:8081';
        });
      }
    }
  };

  updateNetStatusInteractive();
  const observer = new MutationObserver(updateNetStatusInteractive);
  const target = document.getElementById('networkStatus');
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
  }
});
