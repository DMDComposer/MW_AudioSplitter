const { app } = require("electron")
const fetch = require("electron-fetch").default
const { extname, resolve } = require("path")
const request = require("request")
const { createWriteStream, rmSync } = require("fs")
const { execSync } = require("child_process")
const Sudoer = require("electron-sudo").default

const sleep = (ms = 0) => new Promise((res) => setTimeout(res, ms))

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
      return { url: dmg["browser_download_url"], tagName: json["tag_name"] }
    })
}

async function downloadDMG(window, dmgOptions) {
  console.log("downloading")

  window.webContents.send("update/statusTitle", "Downloading...")
  let path = resolve(
    app.getPath("userData"),
    `${app.getName()}_${dmgOptions.tagName}.dmg`
  )
  let received_bytes = 0
  let total_bytes = 0

  return new Promise((resolve, reject) => {
    const req = request({
      method: "GET",
      uri: dmgOptions.url,
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
      const results = await installDMG(window, path, dmgOptions)
      console.log("done downloading")
      resolve(results)
    })
    console.log("down here")
  })
}

async function installDMG(window, path, dmgOptions) {
  console.log("\u001b[" + 35 + "m" + "installDMG: " + "\u001b[0m")
  window.webContents.send("update/statusTitle", "Mounting DMG...")
  const appName = app.getName()
  const appVersion = dmgOptions["tagName"].substring(1)
  const appPath = `/Volumes/${appName} ${appVersion}/${appName}.app`
  execSync(`hdiutil attach "${path}"`)
  try {
    console.log("we're in this catch")
    const execCMD = `yes | cp -rf "${appPath}" "/Applications"`
    let options = { name: "electron sudo application" }
    const sudoer = new Sudoer(options)

    window.webContents.send("update/statusTitle", "Copying to Applications...")
    let cp = await sudoer.exec(execCMD)

    console.log(cp.stdout)
  } catch (error) {
    console.log(error)
    return false
  }

  window.webContents.send("update/statusTitle", "Unmounting DMG...")
  try {
    execSync(`hdiutil detach "/Volumes/${appName} ${appVersion}" -force`)
  } catch (error) {
    console.log(error.stderr.toString())
  }
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

async function macUpdater(options) {
  return await GetUpdateURL(options)
}

module.exports = { macUpdater, downloadDMG }
