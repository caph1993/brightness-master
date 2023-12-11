//@ts-check
const { contextBridge, ipcRenderer } = require('electron/renderer')


// My convention: {target}_{event}
const electronAPI = {
  back_console: (...args) => ipcRenderer.send('back_console', ...args),

  back_update: (key, cnt, mode) => ipcRenderer.send('back_update', key, cnt, mode),
  front_value: (callback) => ipcRenderer.on('front_value', (_event, key, value) => callback(key, value)),

  back_hide: () => ipcRenderer.send('back_hide'),
  front_focus: (callback) => ipcRenderer.on('front_focus', (_event, key, value) => callback(key, value)),
  // front_command_line: (callback) => ipcRenderer.on('front_command_line', (_event, value) => callback(value)),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI);


module.exports = {electronAPI}