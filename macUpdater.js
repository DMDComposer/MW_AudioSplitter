const fetch = require("electron-fetch").default
const { extname } = require("path")

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

async function macUpdater(options) {
  return await GetUpdateURL(options)
}

module.exports = { macUpdater }
