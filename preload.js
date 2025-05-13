const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendPrompt: (messages) => ipcRenderer.invoke('send-prompt', messages),
  toggleStealth: (stealth) => ipcRenderer.invoke('toggle-stealth', stealth)
});
