const { app, BrowserWindow } = require("electron")
const { resolve } = require("path")
const { platform } = require("os")
const request = require("request")
const { createWriteStream, rm } = require("fs")

const sleep = (ms = 0) => new Promise((res) => setTimeout(res, ms))
const appData = resolve(app.getPath("userData"), "tmpDownload.zip")

// binaries to Download
const macFFmpeg = "https://evermeet.cx/ffmpeg/ffmpeg-5.0.zip"
const macFFprobe = "https://evermeet.cx/ffmpeg/ffprobe-5.0.zip"
const macFFPlay = "https://evermeet.cx/ffmpeg/ffplay-5.0.zip"
const winFFmpeg = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

async function downloadBinaries(window) {
  console.log("\u001b[" + 31 + "m" + "made it here" + "\u001b[0m")
  if (platform() === "darwin") {
  }
  const results = await Download(window, winFFmpeg, appData)
  // const results = await Download2(window)
  return results
}

async function Download(window, url, path) {
  console.log("downloading")
  // updateHeader("Downloading FFmpeg & FFprobe") // update window header
  let received_bytes = 0
  let total_bytes = 0

  const req = request({
    method: "GET",
    uri: url,
  })

  req.pipe(createWriteStream(path))

  req.on("response", (data) => {
    console.log("\u001b[" + 32 + "m" + JSON.stringify(data.headers) + "\u001b[0m")
    total_bytes = parseInt(data.headers["content-length"])
  })

  req.on("data", (chunk) => {
    received_bytes += chunk.length
    const percentage_downloaded = (received_bytes / total_bytes) * 100
    console.log("\u001b[" + 32 + "m" + received_bytes + "\u001b[0m")
    window.webContents.send("update/progressBar", percentage_downloaded.toFixed(2))
    window.webContents.send("update/statusTitle", "Downloading...")
  })

  req.on("end", async () => {
    await Install(window, path)
    console.log("done downloading")
    return true
  })
  console.log("down here")
}

async function Install(window, path) {
  console.log("\u001b[" + 33 + "m" + "in the install" + "\u001b[0m")
  window.webContents.send("update/statusTitle", "Unzipping...")
  const AdmZip = require("adm-zip")
  const zip = new AdmZip(path)

  zip.extractAllTo("D:/Users/Dillon/Downloads/New Folder (3)", true)
  setTimeout(() => CleanUp(window, path), 2000)
}

function CleanUp(window, path) {
  window.webContents.send("update/statusTitle", "Cleaning up install...")
  console.log(`\u001b[${35}mremoving: ${path}\u001b[0m`)
  rm(path, { recursive: true }, (err) => {
    if (err) console.log(err)
    console.log("tmpDownload.zip has been successfully deleted")
  })
  setTimeout(() => sleep(100), 2000)
  return true
}

module.exports = { downloadBinaries }
