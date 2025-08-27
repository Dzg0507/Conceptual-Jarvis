const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: (prompt) => ipcRenderer.invoke('capture-screen', prompt),
});
