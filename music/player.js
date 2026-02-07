const { spawn } = require("child_process");
const path = require("path");

// change these
const ICECAST_PASSWORD = "hackme";
const ICECAST_MOUNT = "live";

module.exports = function streamToIcecast(filePath) {
  const absolute = path.resolve(filePath);

  const ffmpeg = spawn("ffmpeg", [
    "-re",
    "-i", absolute,

    // re-encode audio for streaming
    "-vn",
    "-acodec", "libmp3lame",
    "-ab", "128k",
    "-ac", "2",
    "-ar", "44100",

    // Icecast output
    "-f", "mp3",
    `icecast://source:${ICECAST_PASSWORD}@localhost:8000/${ICECAST_MOUNT}`
  ]);

  ffmpeg.stderr.on("data", data => {
    console.log(data.toString());
  });

  ffmpeg.on("close", () => {
    console.log("Streaming finished.");
  });

  return ffmpeg;
}

