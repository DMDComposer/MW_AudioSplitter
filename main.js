const { app, BrowserWindow, ipcMain } = require("electron")
const { lstatSync, readdirSync } = require("fs")
const os = require("os")
const path = require("path")
const { execSync, spawnSync } = require("child_process")
const { getWindowsBounds, saveBounds } = require("./settings")
app.isPackaged ? require("electron-reload")(__dirname) : ""

let loadingWindow,
  mainWindow,
  userRecallWindow = true // TODO: need to create option for this

app.whenReady().then(main)

async function main() {
  const { x, y, width, height } = getWindowsBounds()
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 360,
    transparent: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: "#181A1B",
  })

  loadingWindow.loadFile(path.join(__dirname, "./loadingWindow/loading.html"))
  loadingWindow.center()

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: userRecallWindow ? x : screen.width / 2 - screen.width,
    y: userRecallWindow ? y : screen.height / 2 - screen.height,
    show: false, // to show loading window instead
    icon: path.join(
      __dirname,
      os.platform() == "darwin"
        ? "./assets/icons/mac/icon.icns"
        : "./assets/icons/win/icon.ico"
    ),
    frame: true, // hide titleBar = false
    autoHideMenuBar: true, // hide alt Menu Bar = true
    webPreferences: {
      devTools: app.isPackaged ? false : true,
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
  })
  mainWindow.on("resized", () => saveBounds(mainWindow.getBounds()))
  mainWindow.on("moved", () => saveBounds(mainWindow.getBounds()))
  mainWindow.webContents.openDevTools()
  mainWindow.loadFile(path.join(__dirname + "/index.html"))
  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
    loadingWindow.close()
  })
}

// set title of Notification
app.setAppUserModelId("MW Audio Splitter")

ipcMain.handle("is-file", async (_, path) => {
  return lstatSync(path).isFile()
})

ipcMain.handle("is-folder", async (_, path) => {
  try {
    return lstatSync(path).isDirectory()
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle("pbUpdateListener", async (_, progress) => {
  console.log(`setProgressBar: ${progress}`)
  mainWindow.setProgressBar(progress)
  if (progress >= 1) {
    console.log("cleared the progressBar")
    mainWindow.setProgressBar(-1)
  }
})

ipcMain.handle("ffmpeg-actions", async (_, args) => {
  // console.log(args[0], args[1])
  await execSync(args[0], args[1])
})

ipcMain.handle("audioChannelsString", async (_, args) => {
  return execSync(args[0], args[1]).toString()
})

ipcMain.handle("getTotalSilence", async (_, args) => {
  return spawnSync(args[0], args[1], args[2]).stderr
})

ipcMain.handle("getCountAudioSplits", async (_, destPath) => {
  let filesPrinted = readdirSync(destPath), // https://stackoverflow.com/questions/32511789/looping-through-files-in-a-folder-node-js
    totalPrintedStems = 0,
    stemsList = [
      "2MIX",
      "6MIX",
      "CLK",
      "MX01",
      "MX02",
      "MX03",
      "MX04",
      "MX05",
      "MX06",
      "MX07",
      "MX08",
      "MX09",
      "MX10",
      "MX11",
      "MX12",
      "MX13",
      "MX14",
    ],
    results = {}
  // console.log(filesPrinted)
  for (let value in stemsList) {
    let sum = 0
    for (let b in filesPrinted) {
      console.log(filesPrinted[b])
      if (filesPrinted[b].includes(stemsList[value])) sum += 1
    }
    if (sum == 0) continue
    totalPrintedStems += sum
    results[value] = sum
  }
  // console.log("results: " + results)
  // console.log("totalPrintedStems: " + totalPrintedStems)
  return [results, totalPrintedStems]
})

ipcMain.handle("getTotalFilesInDestPath", async (_, destPath) => {
  let sum = 0
  const totalFilesInDestPath = readdirSync(destPath)

  totalFilesInDestPath.forEach((file) => {
    if (path.extname(file) == ".wav") sum += 1
  })

  return sum
})

ipcMain.handle("app/close", async (_, error) => {
  mainWindow.close()
})

ipcMain.handle("openBrowse", async (_, args) => {
  const { openBrowse } = require("./openBrowse")
  const openedDir = await openBrowse()
  return openedDir
})
