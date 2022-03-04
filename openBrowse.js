const { dialog } = require("electron")

async function openBrowse() {
  const result = dialog.showOpenDialog({
    properties: ["openDirectory"],
  })

  return new Promise((resolve, reject) => {
    result.then((results) => {
      resolve(results)
    })
    result.catch((err) => {
      reject(err)
    })
  })
}

module.exports = {
  openBrowse: openBrowse,
}
