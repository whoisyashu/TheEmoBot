const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

function downloadAudio(songName) {
  return new Promise((resolve, reject) => {

    const outputDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Snapshot files BEFORE download
    const beforeFiles = fs.readdirSync(outputDir);

    const cmd = `yt-dlp --js-runtimes node --cookies-from-browser firefox "ytsearch1:${songName}" -x --audio-format mp3 --match-filter "duration < 720" --no-write-thumbnail --no-write-info-json --no-playlist -o "${outputDir}/%(title)s.%(ext)s"`;

    exec(cmd, (err) => {
      if (err) return reject(err);

      // Snapshot AFTER download
      const afterFiles = fs.readdirSync(outputDir);

      // Find newly created mp3
      const newFile = afterFiles.find(f =>
        !beforeFiles.includes(f) && f.endsWith(".mp3")
      );

      if (!newFile) return reject("File not found");

      const filePath = path.join(outputDir, newFile);


      resolve(filePath);
    });
  });
}

module.exports = async function triggerDownload(songName) {
  try {

    const file = await downloadAudio(songName);

    console.log("Saved at:", file);
    console.log("Downloaded!");

    return file;

  } catch (e) {
    console.error(e);
  }
};
