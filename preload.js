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
    quit: () => ipcRenderer.send("app/quit"),
  },
  appName: () => ipcRenderer.invoke("get/appName"),
  appVersion: () => ipcRenderer.invoke("get/appVersion"),
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
  newDialog: (args) => ipcRenderer.invoke("newDialog", args),
  toggleLoadingWindow: (args) => ipcRenderer.invoke("toggleLoadingWindow", args),
  showLoadingWindow: () => ipcRenderer.send("showLoadingWindow"),
  skipUpdate: (args) => ipcRenderer.invoke("skipUpdate", args),
  continueDialog: (args) => ipcRenderer.invoke("continueDialog/AfterDrop", args),
  platform: os.platform(),
  path: path,
  os: os,
  fs: fs,
  test: "hello",
}

contextBridge.exposeInMainWorld("api", api)
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer)
