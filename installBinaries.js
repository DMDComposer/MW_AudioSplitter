const { app } = require("electron")
const { resolve } = require("path")
const { platform } = require("os")
const { get } = require("https")
const request = require("request")
const { createWriteStream, rm } = require("fs")

const sleep = (ms = 0) => new Promise((res) => setTimeout(res, ms))
const appData = resolve(app.getPath("userData"), "tmpDownload.zip")

// binaries to Download
const macFFmpeg = "https://evermeet.cx/ffmpeg/ffmpeg-5.0.zip"
const macFFprobe = "https://evermeet.cx/ffmpeg/ffprobe-5.0.zip"
const macFFPlay = "https://evermeet.cx/ffmpeg/ffplay-5.0.zip"
const winFFmpeg = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

async function downloadBinaries() {
  console.log("\u001b[" + 31 + "m" + "made it here" + "\u001b[0m")
  if (platform() === "darwin") {
  }
  const results = await Download(winFFmpeg, appData)
  //   return results
}

// testing
async function Download2() {
  console.log("\u001b[" + 33 + "m" + "in new download functyion" + "\u001b[0m")
  const pathToFfmpeg = "D:/Users/Dillon/Downloads/New Folder (3)/testFile"
  return new Promise((success, reject) => {
    let file = createWriteStream(pathToFfmpeg)
    // let total_bytes = BINARY_BYTES.ffmpeg
    let total_bytes = 76000000
    let recieved_bytes = 0

    get(winFFmpeg, (res) => {
      if (res.headers["content-length"]) {
        total_bytes = parseInt(res.headers["content-length"])
      }

      res.pipe(file).on("finish", () => {
        success(pathToFfmpeg)
      })

      res.on("data", (chunk) => {
        recieved_bytes += chunk.length
        const percentage_downloaded = recieved_bytes / total_bytes
        console.log("\u001b[" + 31 + "m" + percentage_downloaded + "\u001b[0m")
        /* if (win) {
          sendProgressUpdate(
            parseFloat(percentage_downloaded.toFixed(2)),
            "installing-dependecies",
            win,
            "Installing FFMPEG Dependecies"
          )
        } */
      })

      res.on("error", (e) => {
        console.log(e)
        throw new Error("Error downloading files. sadge")
      })
    })
  })
}

async function Download(url, path) {
  console.log("\u001b[" + 32 + "m" + "here iun down" + "\u001b[0m")

  // updateHeader(options.stageTitles.Downloading) // update window header
  let received_bytes = 0
  let total_bytes = 0

  const req = request({
    method: "GET",
    uri: url,
  })

  let out = createWriteStream(path)
  req.pipe(out)

  req.on("response", (data) => {
    total_bytes = parseInt(data.headers["content-length"])
    console.log("\u001b[" + 35 + "m" + total_bytes + "\u001b[0m")
  })

  req.on("data", (chunk) => {
    received_bytes += chunk.length
    console.log("\u001b[" + 32 + "m" + received_bytes + "\u001b[0m")
    // showProgress(received_bytes, total_bytes)
  })

  req.on("end", async () => {
    await Install(path)
    console.log("done downloading")
    return true
  })
}

async function Install(path) {
  console.log("\u001b[" + 33 + "m" + "in the install" + "\u001b[0m")
  // updateHeader(options.stageTitles.Unzipping)
  const AdmZip = require("adm-zip")
  const zip = new AdmZip(path)

  zip.extractAllTo("D:/Users/Dillon/Downloads/New Folder (3)", true)
  setTimeout(() => CleanUp(path), 2000)
}

function CleanUp(path) {
  // updateHeader(options.stageTitles.Cleaning)
  console.log(`\u001b[${35}mremoving: ${path}\u001b[0m`)
  rm(path, { recursive: true }, (err) => {
    if (err) console.log(err)
    console.log("tmpDownload.zip has been successfully deleted")
  })
  setTimeout(() => sleep(100), 2000)
  return true
}

module.exports = { downloadBinaries }
