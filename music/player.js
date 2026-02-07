const { spawn } = require("child_process");
const path = require("path");

module.exports = function streamToRadio(filePath) {
  const absolute = path.resolve(filePath);

  const ffmpeg = spawn("ffmpeg", [
    "-re",
    "-i", absolute,

    "-vn",
    "-acodec", "libmp3lame",
    "-ab", "128k",
    "-ac", "2",
    "-ar", "44100",

    "-f", "mp3",
    "http://localhost:3000/live"
  ]);

  ffmpeg.stderr.on("data", d => console.log(d.toString()));

  ffmpeg.on("close", () => console.log("Streaming finished"));

  return ffmpeg;
};
