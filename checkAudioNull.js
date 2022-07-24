const ffprobe = api.platform !== "darwin" ? "ffprobe" : "/usr/local/bin/ffprobe"
const ffmpeg = api.platform !== "darwin" ? "ffmpeg" : "/usr/local/bin/ffmpeg"

export async function checkAudioNull(filePath, noiseTolerance = 80) {
  const totalDuration = await getTotalDuration(filePath),
    totalSilence = await getTotalSilence(filePath, noiseTolerance)
  return totalDuration == totalSilence
}

async function getTotalDuration(filePath) {
  const cmdTotalDuration = `${ffprobe} -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`,
    totalDuration = await api.audioChannelsString([
      cmdTotalDuration,
      { encoding: "UTF-8" },
    ])
  return Number(totalDuration).toFixed(4)
}

async function getTotalSilence(filePath, noiseTolerance) {
  // noise=0.001 is equivalent to -60dB
  // noise=0.0001 is equivalent to -80dB
  const cmdTotalSilence = `${ffmpeg} -i "${filePath}" -af silencedetect=noise=-${noiseTolerance}dB:mono=0 -f null - `,
    audioNullResult = await api.getTotalSilence([
      cmdTotalSilence,
      [],
      {
        shell: true,
        encoding: "UTF-8",
      },
    ])
  let totalSilence = 0
  audioNullResult
    .toString()
    .split("\n")
    .forEach((i) => {
      if (i.includes("silence_duration: ")) {
        let duration = i.split("silence_duration: ")[1]
        totalSilence += duration
      }
    })
  console.log(
    "🚀 ~ file: checkAudioNull.js ~ line 21 ~ getTotalSilence ~ cmdTotalSilence",
    cmdTotalSilence
  )
  return Number(totalSilence).toFixed(4)
}
