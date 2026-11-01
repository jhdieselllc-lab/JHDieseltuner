const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jhDesktop', Object.freeze({
  openOemPortal: (id) => ipcRenderer.invoke('jh:open-oem-portal', id),
  launchPcmHammer: (family) => ipcRenderer.invoke('jh:launch-pcmhammer', family),
  runtimeInfo: () => ipcRenderer.invoke('jh:runtime-info'),
  discover: () => ipcRenderer.invoke('jh:native', 'discover'),
  connect: (args) => ipcRenderer.invoke('jh:native', 'connect', args),
  poll: () => ipcRenderer.invoke('jh:native', 'poll'),
  disconnect: () => ipcRenderer.invoke('jh:native', 'disconnect'),
}));
