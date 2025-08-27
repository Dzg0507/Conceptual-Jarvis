const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  onDrawHighlight: (callback) => ipcRenderer.on('draw-highlight', (event, ...args) => callback(...args)),
});
