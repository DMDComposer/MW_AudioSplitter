const express = require("express")
const app = express()

app.get("/", (req, res) => {
  console.log("here")
  res.download("https://clip-compressor.herokuapp.com/download/ffprobe/win")
})

app.listen(3000)
