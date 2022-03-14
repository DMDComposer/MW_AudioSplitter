const fetch = require("electron-fetch").default
const { extname } = require("path")

const appData = resolve(app.getPath("userData"), "tmpDownload.zip")

async function GetUpdateURL(options) {
  let json
  let git_api = `https://api.github.com/repos/${options.gitUsername}/${options.gitRepo}/releases/latest`

  return fetch(git_api)
    .then((response) => response.json())
    .then((data) => {
      json = data
    })
    .catch((e) => {
      try {
        // Electron
        alert(`Something went wrong: ${e}`)
      } catch {
        // NodeJS
        console.error(`Something went wrong: ${e}`)
        return
      }
    })
    .then((e) => {
      // loop through all assests
      // find the assetName that ends with ".dmg"
      // and return the downloadURL
      let dmg
      for (var i = 0; i < json["assets"].length; i++)
        if (extname(json["assets"][i]["name"]) === ".dmg") dmg = json["assets"][i]
      return dmg["browser_download_url"]
    })
}

async function downloadDMG(window, url, path) {
  let path = appData
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
    await installDMG(window, path)
    console.log("done downloading")
    return true
  })
  console.log("down here")
}

async function installDMG(window, path) {
  console.log("\u001b[" + 35 + "m" + "installDMG: " + "\u001b[0m")
}

async function macUpdater(options) {
  return await GetUpdateURL(options)
}

module.exports = { macUpdater, downloadDMG }
