const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Notification,
  dialog,
} = require("electron")
const { autoUpdater } = require("electron-updater")
const { lstatSync, readdirSync, existsSync } = require("fs")
const { platform } = require("os")
const { execSync, spawnSync } = require("child_process")
const { getWindowsBounds, saveBounds } = require("./settings")
const { resolve, join, extname } = require("path")
const isDev = require("electron-is-dev")
if (isDev) require("electron-reload")(__dirname)

let loadingWindow,
  mainWindow,
  userRecallWindow = true // TODO: need to create option for this

app.whenReady().then(main)

async function main() {
  const { x, y, width, height } = getWindowsBounds()
  const webPreferences = {
    devTools: isDev ? true : false,
    nodeIntegration: false, // is default value after Electron v5
    contextIsolation: true, // protect against prototype pollution
    enableRemoteModule: false, // turn off remote
    preload: join(__dirname, "preload.js"), // use a preload script
  }

  // loadingWindow
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 360,
    transparent: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    frame: false,
    show: false,
    backgroundColor: "#181A1B",
    webPreferences: webPreferences,
  })

  loadingWindow.loadFile(join(__dirname, ".", "loadingWindow", "loading.html"))
  loadingWindow.webContents.openDevTools()

  loadingWindow.on("ready-to-show", async () => {
    loadingWindow.show()
  })

  loadingWindow.on("show", async () => {
    const binariesInstalled = await checkForBinaries()
    if (!binariesInstalled) await getUserDecisionBinaries()
    console.log("\u001b[" + 31 + "m" + "log before checking updates" + "\u001b[0m")
    autoUpdater.checkForUpdates()
  })

  // mainWindow
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: userRecallWindow ? x : screen.width / 2 - screen.width,
    y: userRecallWindow ? y : screen.height / 2 - screen.height,
    show: false, // to show loading window instead
    icon: join(
      __dirname,
      platform() == "darwin"
        ? "./assets/icons/mac/icon.icns"
        : "./assets/icons/win/icon.ico"
    ),
    frame: true, // hide titleBar = false
    autoHideMenuBar: true, // hide alt Menu Bar = true
    webPreferences: webPreferences,
  })
  mainWindow.on("resized", () => saveBounds(mainWindow.getBounds()))
  mainWindow.on("moved", () => saveBounds(mainWindow.getBounds()))

  if (isDev) mainWindow.webContents.openDevTools()

  mainWindow.loadFile(join(__dirname, "index.html"))
}

ipcMain.on("showLoadingWindow", (_, error) => {
  showLoadingWindow()
})

function showLoadingWindow() {
  loadingWindow.show()
  autoUpdater.checkForUpdates()
}

// check for Binaries ffmpeg/ffprobe
async function checkForBinaries() {
  if (platform() === "darwin") {
    const ffmpegPath = existsSync("/usr/local/bin/ffmpeg")
    const ffprobePath = existsSync("/usr/local/bin/ffprobe")
    return ffmpegPath && ffprobePath
  }
  const ffmpegPath = existsSync("C:/Program Files (x86)/FFmpeg/bin/ffmpeg.exe")
  const ffprobePath = existsSync("C:/Program Files (x86)/FFmpeg/bin/ffprobe.exe")
  return ffmpegPath && ffprobePath
}

async function getUserDecisionBinaries() {
  const dialogOptions = {
    type: "question",
    defaultId: 0,
    cancelId: 1,
    buttons: ["Yes", "Quit"],
    noLink: true,
    message: `FFmpeg & FFprobe are missing, the application needs them to run. Would you like to install them now?`,
  }

  await dialog.showMessageBox(loadingWindow, dialogOptions).then(async (userResponse) => {
    if (userResponse.response === 0) await awaitDownloadBinaries()
    if (userResponse.response === 1) app.exit(0)
  })
  console.log("end of getUserDecisionBinaries()")
}

async function awaitDownloadBinaries() {
  const { downloadBinaries } = require("./loadingWindow/installBinaries.js")
  await downloadBinaries(loadingWindow)
  // showLoadingWindow()
}

// autoUpdater START
autoUpdater.autoDownload = false // set Download to false
function sendStatusToWindow(text) {
  // mainWindow.webContents.send("message", text)
  console.log("\u001b[" + 32 + "m" + text + "\u001b[0m")
}

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...")
})
autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("Update available.")
})
autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.")
  closeLoaderOpenMainWindow()
})
autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err)
})

autoUpdater.on("update-available", (updateInfo) => {
  getUserDecisionWin(updateInfo)
})

async function getUserDecisionWin(updateInfo) {
  const { releaseNotes, releaseName, releaseDate, path, files, version, tag } = updateInfo
  const dialogOptions = {
    type: "question",
    defaultId: 1,
    cancelId: 1,
    buttons: ["Yes", "No", "Quit"],
    noLink: true,
    message: `${version} - Update is available, would you like to download the update?`,
  }

  await dialog.showMessageBox(loadingWindow, dialogOptions).then(async (userResponse) => {
    if (userResponse.response === 0) await downloadUpdateMac(updateInfo)
    if (userResponse.response === 1) closeLoaderOpenMainWindow()
    if (userResponse.response === 2) app.exit(0)
  })
}

async function downloadUpdateMac(updateInfo) {
  const { releaseNotes, releaseName, releaseDate, path, files, version, tag } = updateInfo
  const { macUpdater, downloadDMG } = require("./macUpdater")
  let options = {
    gitUsername: "DMDComposer",
    gitRepo: "MW_AudioSplitter",
  }
  const macDmgLink = await macUpdater(options)
  const downloadDmgResults = await downloadDMG(loadingWindow, macDmgLink)
  if (downloadDmgResults === true) app.relaunch(), app.exit()
  if (downloadDmgResults === false) console.log("something went wrong with install...")
}

autoUpdater.on("download-progress", (progressObj) => {
  const { percent } = progressObj
  loadingWindow.webContents.send("update/progressBar", percent)
})

autoUpdater.on(
  "update-downloaded",
  (_, releaseNotes, releaseName, releaseDate, updateURL) => {
    const dialogOptions = {
      type: "info",
      buttons: ["Restart", "Later"],
      title: "Application Update",
      message: platform() === "win32" ? releaseNotes : releaseName,
      detail:
        "A new version is been successfully downloaded. Would you like to restart the application to apply the update?",
    }
    dialog.showMessageBox(loadingWindow, dialogOptions).then((userResponse) => {
      console.log(userResponse)
      if (userResponse.response === 0) autoUpdater.quitAndInstall()
      if (userResponse.response === 1) {
        closeLoaderOpenMainWindow()
        new Notification({
          title: "Update Downloaded",
          icon: "./assets/icons/png/icon.png",
          sound: resolve(__dirname, ".", "assets", "audio", "tada.wav"),
          silent: false,
          body: "the update will be installed on the next restart of the application",
          timeoutType: "default",
        }).show()
      }
    })
  }
)

// autoUpdater END

// set title of Notification
app.setAppUserModelId("MW Audio Splitter")

ipcMain.handle("is-file", async (_, path) => {
  return lstatSync(path).isFile()
})

ipcMain.handle("is-folder", async (_, path) => {
  try {
    return lstatSync(path).isDirectory()
  } catch (error) {
    // console.log(error)
    return false
  }
})

ipcMain.handle("pbUpdateListener", async (_, progress) => {
  progress >= 1 ? mainWindow.setProgressBar(-1) : mainWindow.setProgressBar(progress)
})

ipcMain.handle("resetProgressBar", async (_, args) => {
  mainWindow.setProgressBar(-1)
})

ipcMain.handle("ffmpeg", async (_, args) => {
  try {
    execSync(args[0], args[1])
  } catch (error) {
    const err = error.stderr.toString().split("\n")
    new Notification({
      title: "Audio Splits Error",
      icon: "./assets/icons/png/icon.png",
      sound: resolve(__dirname, ".", "assets", "audio", "ding.wav"),
      silent: false,
      body: `Something went wrong: ${err[err.length - 2]}`,
      timeoutType: "default",
    }).show()
  }
})

ipcMain.handle("audioChannelsString", async (_, args) => {
  return execSync(args[0], args[1]).toString()
})

ipcMain.handle("getTotalSilence", async (_, args) => {
  return spawnSync(args[0], args[1], args[2]).stderr
})

ipcMain.handle("getCountAudioSplits", async (_, destPath) => {
  // https://stackoverflow.com/questions/32511789/looping-through-files-in-a-folder-node-js
  let filesPrinted = readdirSync(destPath),
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
    if (extname(file) == ".wav") sum += 1
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

ipcMain.handle("newNotification", async (_, args) => {
  const countAudioSplits = args?.[0]
  const totalFilesInDestPath = args?.[1]
  const fileMissingError = args?.[2]

  new Notification({
    title: "Audio Splits Completed",
    icon: "./assets/icons/png/icon.png",
    sound: resolve(__dirname, ".", "assets", "audio", "tada.wav"),
    silent: false,
    body: `Total Number of Stems: ${countAudioSplits} \n ${countAudioSplits} / ${totalFilesInDestPath} ${fileMissingError}`,
    timeoutType: "default",
  }).show()
})

ipcMain.handle("newDialog", async (_, args) => {
  const userResponse = dialog.showMessageBoxSync(
    loadingWindow,
    args,
    (response, checkboxChecked) => {
      console.log(response)
      console.log(checkboxChecked) //true or false
    }
  )
  return userResponse
})

ipcMain.handle("toggleLoadingWindow", async (_, args) => {
  !loadingWindow.isVisible() ? loadingWindow.show() : loadingWindow.hide()
})

ipcMain.handle("skipUpdate", async (_, args) => {
  mainWindow.show()
  // need to make an updatingWindow & loadingWindow separate.
  // if loadingWindow closes than continue, if updatingWindow closes than restart app
  try {
    loadingWindow.hide()
  } catch (error) {
    console.log(`\u001b[${35}mloadingWindow: ${error}\u001b[0m`)
  }
})

ipcMain.on("app/quit", (_, error) => {
  app.exit(0)
})

ipcMain.handle("get/appName", async (_) => {
  return app.getName()
})
ipcMain.handle("get/appVersion", async (_) => {
  return app.getVersion()
})

async function closeLoaderOpenMainWindow() {
  mainWindow.show()
  try {
    loadingWindow.close()
  } catch (error) {
    console.log(`\u001b[${35}mloadingWindow: ${error}\u001b[0m`)
  }
}
