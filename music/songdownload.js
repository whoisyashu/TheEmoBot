const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const DOWNLOAD_DIR = path.join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

module.exports = function triggerDownload(songName) {

  return new Promise(resolve => {

    const filename = `${Date.now()}.mp3`;
    const output = path.join(DOWNLOAD_DIR, filename);

    const args = [
      "ytsearch5:" + songName,
      "--no-playlist",
      "--user-agent", "Mozilla/5.0",
      "--match-filter", "duration < 720",
      "-x",
      "--audio-format", "mp3",
      "--no-write-thumbnail",
      "--no-write-info-json",
      "-o", output
    ];

    console.log("yt-dlp", args.join(" "));

    const proc = spawn("yt-dlp", args);

    proc.stderr.on("data", d => console.log(d.toString()));

    proc.on("close", () => {
      if (fs.existsSync(output)) resolve(output);
      else resolve(null);
    });
  });
};
