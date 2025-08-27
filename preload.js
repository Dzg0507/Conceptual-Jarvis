const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: (prompt) => ipcRenderer.invoke('capture-screen', prompt),
  onToggleMoveMode: (callback) => ipcRenderer.on('toggle-move-mode', (event, ...args) => callback(...args)),
});
