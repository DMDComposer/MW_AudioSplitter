const Store = require("electron-store")
const storage = new Store()

function getWindowsBounds() {
  const defaultBounds = { x: 800, y: 800, width: 800, height: 800 }
  const size = storage.get("win-size")

  if (size) return size
  else {
    storage.set("win-size", defaultBounds)
    return defaultBounds
  }
}

function saveBounds(bounds) {
  storage.set("win-size", bounds)
}

function getLastSavedPath() {
  const defaultPath = ""
  const currPath = storage.get("currentSavedPath")

  if (currPath) return currPath
  else {
    storage.set("currentSavedPath", defaultPath)
    return defaultPath
  }
}

function setLastSavedPath(currPath) {
  //   console.log("setLastSavedPath is: ", currPath)
  storage.set("currentSavedPath", currPath)
  return currPath
}

module.exports = {
  getWindowsBounds: getWindowsBounds,
  saveBounds: saveBounds,
  getLastSavedPath: getLastSavedPath,
  setLastSavedPath: setLastSavedPath,
}
