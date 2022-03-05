const { ipcRenderer, contextBridge } = require("electron")
const { getLastSavedPath, setLastSavedPath } = require("./settings"),
  path = require("path"),
  os = require("os"),
  fs = require("fs")
const api = {
  on: (message, callback) =>
    ipcRenderer.on(message, (_, data) => {
      callback(data)
    }),
  window: {
    close: () => ipcRenderer.send("app/close"),
    minimize: () => ipcRenderer.send("app/minimize"),
  },
  isFile: (path) => ipcRenderer.invoke("is-file", path),
  isFolder: (path) => ipcRenderer.invoke("is-folder", path),
  ffmpeg: (args) => ipcRenderer.invoke("ffmpeg", args),
  audioChannelsString: (args) => ipcRenderer.invoke("audioChannelsString", args),
  getTotalSilence: (args) => ipcRenderer.invoke("getTotalSilence", args),
  getCountAudioSplits: (destPath) => ipcRenderer.invoke("getCountAudioSplits", destPath),
  getTotalFilesInDestPath: (destPath) =>
    ipcRenderer.invoke("getTotalFilesInDestPath", destPath),
  getLastSavedDestPath: () => getLastSavedPath(),
  setLastSavedDestPath: (currPath) => setLastSavedPath(currPath),
  openBrowse: () => ipcRenderer.invoke("openBrowse", true),
  resetProgressBar: () => ipcRenderer.send("resetProgressBar"),
  newNotification: (args) => ipcRenderer.invoke("newNotification", args),
  platform: os.platform(),
  path: path,
  os: os,
  fs: fs,
}

contextBridge.exposeInMainWorld("api", api)
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer)
