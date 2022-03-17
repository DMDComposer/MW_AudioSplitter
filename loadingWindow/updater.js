const progressBar = document.getElementById("download")
const label = document.getElementById("download-label")
const appVersion = document.querySelector(".appVersion")

const currVersion = await window.api.appVersion()
appVersion.innerHTML = `<h3>${currVersion} Application Is Starting...</h3>`

window.api.on("update/progressBar", (args) => {
  // console.table({ args })
  console.log(args)
  try {
    if (progressBar !== null) progressBar.setAttribute("value", args)
  } catch {}
})

window.api.on("update/statusTitle", (args) => {
  try {
    if (label !== null) label.innerHTML = args
  } catch {}
})

/* function updateHeader(value) {
    console.log(value)
    try {
      if (dl_label !== null) dl_label.innerHTML = value
    } catch {}
  } */

/* const defaultStages = {
  Checking: "Checking For Updates!", // When Checking For Updates.
  Found: "Update Found!", // If an Update is Found.
  NotFound: "No Update Found.", // If an Update is Not Found.
  Downloading: "Downloading...", // When Downloading Update.
  Unzipping: "Installing...", // When Unzipping the Archive into the Application Directory.
  Cleaning: "Finalizing...", // When Removing Temp Directories and Files (ex: update archive and tmp directory).
  Launch: "Launching...", // When Launching the Application.
}

const updateOptions = {
  useGithub: true, // {Default is true} [Optional] Only Github is currently Supported.
  gitRepo: "MW_AudioSplitter", // [Required] Your Repo Name
  gitUsername: "DMDComposer", // [Required] Your GitHub Username.
  isGitRepoPrivate: false, // {Default is false} [Optional] If the Repo is Private or Public  (Currently not Supported).
  gitRepoToken: "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", // {Default is null} [Optional] The Token from GitHub to Access a Private Repo.  Only for Private Repos.

  appName: "MW_AudioSplitter", //[Required] The Name of the app archive and the app folder.
  appExecutableName: `MW_AudioSplitter.exe`, //[Required] The Executable of the Application to be Run after updating.

  appDirectory: "D:/Users/Dillon/Downloads/tempDir", //{Default is "Application Data/AppName"} [Optional]  Where the app will receide, make sure your app has permissions to be there.
  // versionFile: "./version.json", // {Default is "Application directory/settings/version.json"} [Optional] The Path to the Local Version File.
  //   tempDirectory: "/tmp", // {Default is "Application directory/tmp"} [Optional] Where the Update archive will download to.

  progressBar: document.getElementById("download"), // {Default is null} [Optional] If Using Electron with a HTML Progressbar, use that element here, otherwise ignore
  label: document.getElementById("download-label"), // {Default is null} [Optional] If Using Electron, this will be the area where we put status updates using InnerHTML
  forceUpdate: false, // {Default is false} [Optional] If the Application should be forced updated.  This will change to true if any errors occur while launching.
  stageTitles: defaultStages, // {Default is defaultStages} [Optional] Sets the Status Title for Each Stage
}
 */
/* let isUpdateAvailable = await window.api.uaupCheckForUpdates(updateOptions)

if (isUpdateAvailable) getUserDecision()

if (!isUpdateAvailable) window.api.skipUpdate()

async function getUserDecision() {
  const userResponse = await window.api.newDialog({
    type: "none",
    defaultId: 1,
    cancelId: 1,
    buttons: ["Yes", "No", "Quit"],
    noLink: true,
    message: "Update is available, would you like to update?",
  })

  if (userResponse === 0) {
    window.api.toggleLoadingWindow()
    window.api.uaupUpdate(updateOptions)
  }
  if (userResponse === 1) window.api.skipUpdate()
  if (userResponse === 2) window.api.window.quit()
} */
