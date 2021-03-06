import {
  split1MXAudio,
  split2MXAudio,
  split6MXAudio,
  convertInterleavedAudio,
} from "./splitMXAudio.js"
import { checkAudioNull } from "./checkAudioNull.js"
const currDestPath = api.getLastSavedDestPath()
const ffprobe = api.platform !== "darwin" ? "ffprobe" : "/usr/local/bin/ffprobe"

const INNER_BAR_LOADING = document.getElementById("inner-bar-loading"),
  MAIN_APP = document.getElementById("main-app"),
  OUTER_BAR_LOADING = document.getElementById("outer-bar-loading"),
  FINAL_MESSAGE = document.getElementById("finalMessage"),
  dropZone = document.getElementById("dropZone"),
  initDestPath = document.getElementById("inputDestPath"),
  dropZoneHover = document.querySelector("#dropZone .icon"),
  hiddenInputFile = document.getElementById("hiddenInputFile"),
  browseButton = document.getElementById("browseButton"),
  interleavedSwitch = document.getElementById("interleavedSwitch"),
  silenceToleranceInput = document.getElementById("silenceToleranceInput")

// setting user recalled destination path, if still valid then color border green
initDestPath.value = currDestPath
if (await api.isFolder(currDestPath)) initDestPath.style.border = "2px solid #5bcc7f"

async function openBrowseDialog() {
  const result = await api.openBrowse()
  // console.log(result)
  if (result.canceled) return
  initDestPath.value = result.filePaths[0]
}

browseButton.addEventListener("click", (e) => {
  openBrowseDialog()
})

// interleavedSwitch.addEventListener("click", (e) => {
//   console.log("yel")
//   interleavedSwitch.checked = true
// })

hiddenInputFile.addEventListener("change", async (e) => {
  let droppedItem = e.target.files[0].path
  // let droppedItem = e.target.baseURI
  let parentDirectory = api.path.dirname(droppedItem)
  const isFolder = await api.isFolder(parentDirectory)
  if (isFolder) {
    FINAL_MESSAGE.innerText = ""
    initDestPath.value = api.setLastSavedDestPath(parentDirectory)
    initDestPath.style.border = "2px solid #5bcc7f"
    return
  }
  initDestPath.value = currDestPath
  initDestPath.style.border = "2px solid rgb(224, 88, 115)"
  FINAL_MESSAGE.innerText = "need a valid folder path to continue..."

  /* //list of files dropped in
  for (let file of Array.from(e.target.files)) {
    console.log(file.path)
  } */
})

initDestPath.addEventListener("dragover", (e) => {
  e.stopPropagation()
  e.preventDefault()
  initDestPath.style.border = "2px solid #085ED7"
})

initDestPath.addEventListener("drop", async (e) => {
  e.stopPropagation()
  e.preventDefault()
  initDestPath.style.border = ""
  const files = e.dataTransfer.files
  for (const file of files) {
    const isFolder = await window.api.isFolder(file.path)
    if (isFolder) {
      FINAL_MESSAGE.innerText = ""
      initDestPath.value = api.setLastSavedDestPath(file.path)
      initDestPath.style.border = "1px solid #5bcc7f"
      return
    }
    initDestPath.value = currDestPath
    initDestPath.style.border = "1px solid rgb(224, 88, 115)"
    FINAL_MESSAGE.innerText = "need a valid folder path to continue..."
  }
})
;[("mouseover", "dragover")].forEach((event) => {
  dropZone.addEventListener(event, (e) => {
    e.stopPropagation()
    e.preventDefault()
    dropZone.style.border = "3px dotted #5bcc7f"
    dropZoneHover.style.color = "#5bcc7f"
    dropZoneHover.style.animation = "bounceDropZoneIcon 1s infinite linear"
  })
})

dropZone.addEventListener("mouseleave", (e) => {
  dropZone.style.border = "3px dotted crimson"
  dropZoneHover.style.color = "crimson"
  dropZoneHover.style.animation = "bounceDropZoneIcon 1s "
})

dropZone.addEventListener("drop", async (e) => {
  e.stopPropagation()
  e.preventDefault()

  // clear any user messages
  FINAL_MESSAGE.innerText = ""

  if (!checkValidFolderPath()) return console.log("path exists but not valid folderPath")

  splitAudioFiles(e)
})

function checkValidFolderPath() {
  const folderPath = initDestPath.value,
    isFolder = window.api.isFolder(folderPath) // expecting boolean

  if (folderPath == "" || folderPath == null) return console.log("what is happening")

  // if pathway does not exist, check to see if it???s a folderPath before creating
  if (!window.api.fs.existsSync(folderPath)) {
    const confirmCreation = confirm(
      `Path doesn't exist, would you like to create this new folder?\n${folderPath}`
    )
    if (confirmCreation) {
      console.log("making the folder: ")
      window.api.fs.mkdirSync(folderPath)
      return true
    }
    return false
  }
  return isFolder
}

async function splitAudioFiles(e) {
  const files = e.dataTransfer.files,
    totalAudio = files.length,
    destPath = initDestPath.value
  let silentAudioList = [],
    totalAudioNull = 0,
    progressCount = 0

  let noiseToleranceValue = silenceToleranceInput.value

  if (
    typeof noiseToleranceValue !== Number &&
    (noiseToleranceValue <= 0 || noiseToleranceValue >= 127)
  ) {
    api.newNotification([
      "Error!",
      "Silent Detection Threshold: ",
      "Please select a valid value range from 0 to 127",
    ])
    silenceToleranceInput.value = 80
    return
  }

  // MW default total stems are 17, if not that ask to continue
  if (totalAudio !== 17) {
    const results = await api.continueDialog(totalAudio)
    if (results === false) return
  }

  // Init progressBar counter
  OUTER_BAR_LOADING.style.display = "block"

  // Loop over dragged Audio files
  for (const file of files) {
    const isFile = await window.api.isFile(file.path) // check if file and not folder
    if (isFile) {
      let fileName = file.path,
        audioChannels = ""
      if (await checkAudioNull(fileName, noiseToleranceValue)) {
        silentAudioList.push(window.api.path.basename(fileName)) // fileName.wav
        totalAudioNull++
        continue
      }
      let audioChannelsString = await api.audioChannelsString([
        `${ffprobe} -i "${fileName}" -show_streams -select_streams a:0`,
      ])

      audioChannelsString
        .toString()
        .split("\n")
        .forEach((i) => {
          if (i.includes("channels")) {
            audioChannels = i.split("=")[1]
          }
        })

      let switchValue = interleavedSwitch.checked

      if (!switchValue) {
        if (audioChannels == 1) split1MXAudio(fileName, destPath)
        if (audioChannels == 2) split2MXAudio(fileName, destPath)
        if (audioChannels == 6) split6MXAudio(fileName, destPath)
      }

      if (switchValue) convertInterleavedAudio(fileName, destPath)

      progressBarUpdate((progressCount += 1), totalAudio)
    }
  }

  MAIN_APP.style.display = "block"
  MAIN_APP.innerText = "Finalizing Audio..."
  INNER_BAR_LOADING.style.width = `100%`

  const silentAudioListTotal = silentAudioList.length ? `(${silentAudioList.length})` : ""
  FINAL_MESSAGE.innerHTML = `<b>List of Silent Audio Stems Below: ${silentAudioListTotal}</b>${getSilentAudioList(
    silentAudioList
  )}`

  let countAudioSplits = await api.getCountAudioSplits(destPath),
    totalFilesInDestPath = await api.getTotalFilesInDestPath(destPath),
    fileMissingError =
      countAudioSplits[1] != totalFilesInDestPath
        ? "ERROR: MISSING STEMS"
        : "\n Complete: All Files Accounted For"

  // finalMessage
  api.newNotification([countAudioSplits[1], totalFilesInDestPath, fileMissingError])

  resetProgressBar()
}

function getSilentAudioList(data) {
  return data.length
    ? getSilentAudioListTable(data)
    : "<i>No audio files were silent...</i>"
}

function getSilentAudioListTable(data) {
  var result = "<table border=0 style='font-family: Arial;'>"
  let index = 0
  for (var i = 0; i < data.length; i++) {
    result += `<tr>`
    for (var j = 0; j < data[i].length; j++) {
      result += `<td>${data[i][j]}</td>`
    }
    result += "</tr>"
  }
  result += "</table>"

  return result
}

async function progressBarUpdate(percentage, totalAudio) {
  let percentageFraction = (percentage / totalAudio).toFixed(2) * 100
  let completionTimer = 0
  await window.ipcRenderer.invoke("pbUpdateListener", percentageFraction / 100)

  // clear progress bar after completion
  if (percentage >= totalAudio) {
    INNER_BAR_LOADING.style.width = `${percentageFraction}%`
    const progress_interval = setInterval(() => {
      completionTimer += 1
      if (completionTimer == 5) {
        clearInterval(progress_interval)
        resetProgressBar()
        window.api.resetProgressBar()
      }
    }, 1000)
    return
  }

  MAIN_APP.style.display = "block"
  MAIN_APP.innerText = `${percentage} / ${totalAudio}`
  INNER_BAR_LOADING.style.width = `${percentageFraction}%`
  INNER_BAR_LOADING.style.border = "2px solid #333"
}
function resetProgressBar() {
  MAIN_APP.innerText = ""
  MAIN_APP.style.display = "none"
  INNER_BAR_LOADING.style.width = `0%`
  INNER_BAR_LOADING.style.border = ""
  OUTER_BAR_LOADING.style.display = "none"
}
