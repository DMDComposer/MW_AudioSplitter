const { get, request } = require("https")
const winFFmpeg = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

Download2()

async function Download2() {
    return new Promise((success, reject) => {
    let received_bytes = 0
    let total_bytes = 0
    
    const options = {
        // url: winFFmpeg,
        hostname: 'www.gyan.dev',
        path: '/ffmpeg/builds/ffmpeg-release-essentials.zip',
        method: 'POST',
        followAllRedirects: true,
        jar: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Content-Type": "application/zip"
        }
        
      };
      
      const req = request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
      
        res.on('data', (d) => {
          process.stdout.write(d);
        });
      });
      
      req.on('error', (e) => {
        console.error(e);
      });
      req.end();
    
    /* get(winFFmpeg, (res) => {
      console.log("\u001b[" + 33 + "m" + JSON.stringify(res.headers) + "\u001b[0m")
      if (res.headers["content-length"]) {
        total_bytes = parseInt(res.headers["content-length"])
        console.log("\u001b[" + 32 + "m" + total_bytes + "\u001b[0m")
      }
        res.on("error", (e) => {
          console.log(e)
          throw new Error("Error downloading files...")
        })
      }) */
    })
  }