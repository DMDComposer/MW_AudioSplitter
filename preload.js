const { ipcRenderer, contextBridge } = require("electron")
const { Update, CheckForUpdates, GetAppLibrary } = require("uaup-js")
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
  skipUpdate: (args) => ipcRenderer.invoke("skipUpdate", args),
  platform: os.platform(),
  path: path,
  os: os,
  fs: fs,
  uaupUpdate: (args) => Update(args),
  uaupCheckForUpdates: (args) => CheckForUpdates(args),
  uaupGetAppLibrary: (args) => GetAppLibrary(args),
}

contextBridge.exposeInMainWorld("api", api)
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer)
