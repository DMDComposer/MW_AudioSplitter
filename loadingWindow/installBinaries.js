const { app } = require("electron")
const { resolve } = require("path")
const { platform } = require("os")
const Sudoer = require("electron-sudo").default
const request = require("request")
const { createWriteStream, rmSync } = require("fs")

const sleep = (ms = 0) => new Promise((res) => setTimeout(res, ms))
const appData = resolve(app.getPath("userData"), "tmpDownload.zip")

// binaries to Download
const macFFmpeg = "https://evermeet.cx/ffmpeg/ffmpeg-5.0.zip"
const macFFprobe = "https://evermeet.cx/ffmpeg/ffprobe-5.0.zip"
// const macFFPlay = "https://evermeet.cx/ffmpeg/ffplay-5.0.zip"
const winFFmpeg = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

async function downloadBinaries(window) {
  console.log("\u001b[" + 31 + "m" + "made it here" + "\u001b[0m")
  if (platform() === "darwin") {
    const resultsFFmpeg = await Download(window, macFFmpeg, appData)
    const resultsFFprobe = await Download(window, macFFprobe, appData)
    console.log("\u001b[" + 32 + "m" + "WERE DONE!!!!" + "\u001b[0m")
    return resultsFFmpeg && resultsFFprobe
  }
  const results = await Download(window, winFFmpeg, appData)
  console.log("\u001b[" + 32 + "m" + "WERE DONE!!!!" + "\u001b[0m")
  return results
}

async function Download(window, url, path) {
  console.log("downloading")

  window.webContents.send("update/statusTitle", "Downloading...")
  let received_bytes = 0
  let total_bytes = 0

  return new Promise((resolve, reject) => {
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
    })

    req.on("end", async () => {
      const results = await Install(window, path)
      console.log("done downloading")
      resolve(results)
    })
    console.log("down here")
  })
}

async function Install(window, path) {
  console.log("\u001b[" + 33 + "m" + "in the install" + "\u001b[0m")
  window.webContents.send("update/statusTitle", "Unzipping...")

  // make sure zip has finished building.
  await sleep(2000)

  const AdmZip = require("adm-zip")
  const zip = new AdmZip(path)
  const zipExtractPath =
    platform() === "darwin" ? "/usr/local/bin/" : "C:/Program Files (x86)/FFmpeg"

  try {
    console.log(path)
    zip.extractAllTo(zipExtractPath, true)
  } catch (e) {
    if (e.code == "EACCES") {
      console.log("Cannot create directory, permission denied!")

      try {
        console.log("we're in this catch")
        const execCMD = `cp -R "${path.replace(/\s/g, "\\ ")}" "${zipExtractPath.replace(
          /\s/g,
          "\\ "
        )}tmpDownload.zip"`
        let options = { name: "electron sudo application" }
        const sudoer = new Sudoer(options)

        let cp = await sudoer.exec(execCMD)

        console.log(cp.stdout)
      } catch (error) {
        console.log(error)
        return false
      }

      /*
      // Granting both read and write permission
      const result = chmodSync(zipExtractPath, 0o777)
        // Check the file mode
        console.log("Current File Mode:", statSync(zipExtractPath).mode)

        console.log("Trying to extract files to path")
        try {
          zip.extractAllTo(zipExtractPath, true)
        } catch (error) {
          if (e.code === "EACCES")
            console.log("Cannot create directory, permission STILL denied!")
        }
        */
    } else {
      console.log(e.code)
      try {
        console.log("we're trying manual Unzipping")
        const execMacCMD = `ditto -xk "${path.replace(
          /\s/g,
          "\\ "
        )}" "${zipExtractPath.replace(/\s/g, "\\ ")}"`
        const execWinCMD = `tar -xf "${path.replace(
          /\s/g,
          "\\ "
        )}" "${zipExtractPath.replace(/\s/g, "\\ ")}"`
        let options = { name: "electron sudo application" }
        const sudoer = new Sudoer(options)

        let cp = await sudoer.exec(platform() === "darwin" ? execMacCMD : execWinCMD)

        console.log(cp.stdout)
      } catch (error) {
        console.log(error)
        return false
      }
    }
  }
  console.log("outside now")
  const results = await CleanUp(window, path)
  return results
}

async function CleanUp(window, path) {
  window.webContents.send("update/statusTitle", "Cleaning up install...")
  await sleep(2000)
  console.log(`\u001b[${35}mremoving: ${path}\u001b[0m`)
  const results = await rmSync(path, { recursive: true })
  console.log("\u001b[" + 33 + "m" + "rmSync completed " + "\u001b[0m")
  await sleep(2000)
  return true
}

module.exports = { downloadBinaries }
