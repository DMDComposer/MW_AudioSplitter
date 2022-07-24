const path = api.path
const execSyncOptions =
  api.platform === "win32"
    ? { shell: "powershell", windowsHide: true }
    : { windowsHide: true }
const ffmpeg = api.platform !== "darwin" ? "ffmpeg" : "/usr/local/bin/ffmpeg"

// NOTE: don't need to escape double quotes using execSync compared to AHK runCMD
export function split1MXAudio(fileName, destPath) {
  const outNNE = path.parse(fileName).name,
    outExt = path.parse(fileName).ext.substring(1)
  let outPath = destPath,
    splitAudioCMD = `${ffmpeg} -y -i "${fileName}" -filter_complex 'channelsplit=channel_layout=mono[FC]' -acodec pcm_s24le -write_bext 1 -map '[FC]' "${outPath}\\${outNNE}.${outExt}"`

  api.ffmpeg([splitAudioCMD.replaceAll(/\\/g, "/"), execSyncOptions])
}

export function split2MXAudio(fileName, destPath) {
  const outNNE = path.parse(fileName).name,
    outExt = path.parse(fileName).ext.substring(1)
  let outPath = destPath,
    splitAudioCMD = `${ffmpeg} -y -i "${fileName}" -filter_complex 'channelsplit=channel_layout=stereo[FL][FR]' -acodec pcm_s24le -write_bext 1 -map '[FL]' "${outPath}\\${outNNE}.L.${outExt}" -acodec pcm_s24le -write_bext 1 -map '[FR]' "${outPath}\\${outNNE}.R.${outExt}"`

  api.ffmpeg([splitAudioCMD.replaceAll(/\\/g, "/"), execSyncOptions])
}

export function split6MXAudio(fileName, destPath) {
  const outNNE = path.parse(fileName).name,
    outExt = path.parse(fileName).ext.substring(1)
  let outPath = destPath,
    splitAudioCMD = `${ffmpeg} -y -i "${fileName}" -filter_complex 'channelsplit=channel_layout=5.1[FL][FR][FC][LFE][SL][SR]' -acodec pcm_s24le -write_bext 1 -map '[FL]' "${outPath}\\${outNNE}.L.${outExt}" -acodec pcm_s24le -write_bext 1 -map '[FR]' "${outPath}\\${outNNE}.R.${outExt}" -acodec pcm_s24le -write_bext 1 -map '[FC]' "${outPath}\\${outNNE}.C.${outExt}" -acodec pcm_s24le -write_bext 1 -map '[LFE]' "${outPath}\\${outNNE}.LFE.${outExt}" -acodec pcm_s24le -write_bext 1 -map '[SL]' "${outPath}\\${outNNE}.Ls.${outExt}" -acodec pcm_s24le -write_bext 1 -map '[SR]' "${outPath}\\${outNNE}.Rs.${outExt}"`

  api.ffmpeg([splitAudioCMD.replaceAll(/\\/g, "/"), execSyncOptions])
}

export function convertInterleavedAudio(fileName, destPath) {
  const outNNE = path.parse(fileName).name,
    outExt = path.parse(fileName).ext.substring(1)
  let outPath = destPath,
    splitAudioCMD = `${ffmpeg} -y -i "${fileName}" -acodec pcm_s24le -write_bext 1 "${outPath}\\${outNNE}.${outExt}"`

  api.ffmpeg([splitAudioCMD.replaceAll(/\\/g, "/"), execSyncOptions])
}
