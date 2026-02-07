const fs = require("fs");
const path = require("path");
const state = require("../state");
const streamToIcecast = require("./player");
const { FALLBACK_DIR } = require("../config");

function randomFallback() {
  const files = fs.readdirSync(FALLBACK_DIR).filter(f => f.endsWith(".mp3"));
  return path.join(FALLBACK_DIR, files[Math.floor(Math.random() * files.length)]);
}

function playUserSong(bot) {
  if (state.isPlaying) return;

  const next = state.songQueue.peek();
  if (!next) return playFallback(bot);

  const file = state.downloadCache.get(next.songName);

  // DOWNLOAD FAILED OR NEVER ARRIVED
  if (!file && next.status !== "ready") return;

  // FILE MISSING ON DISK
  if (!fs.existsSync(file)) {

    state.songQueue.dequeue();
    state.downloadCache.delete(next.songName);

    const requester = next.user?.username || "Unknown";

    bot.message.send(`❌ Could not play: ${next.songName}\n🙋 ${requester}, file not found. Skipping.`);

    return playUserSong(bot);
  }

  // 🛑 STOP FALLBACK BEFORE USER SONG
  if (state.currentProcess) {
    state.currentProcess.kill("SIGINT");
    state.currentProcess = null;
  }

  state.songQueue.dequeue();
  state.downloadCache.delete(next.songName);

  state.currentSong = next;
  state.isPlaying = true;
  state.isFallbackPlaying = false;

  const cleanName = path.basename(file, ".mp3");
  const requester = next.user?.username || "Unknown";

  bot.message.send(`🎵 Now playing: ${cleanName}\n🙋 Requested by: ${requester}`);

  state.currentProcess = streamToIcecast(file);

  state.currentProcess.on("close", () => {
    state.isPlaying = false;
    state.currentProcess = null;

    if (fs.existsSync(file)) fs.unlinkSync(file);

    playUserSong(bot);
  });
}


function playFallback(bot) {
  if (state.isPlaying || state.isFallbackPlaying) return;

  state.isFallbackPlaying = true;

  const file = randomFallback();

  state.currentSong = { songName: path.basename(file, ".mp3") };

  state.currentProcess = streamToIcecast(file);

  state.currentProcess.on("close", () => {
    state.isFallbackPlaying = false;
    playUserSong(bot);
  });
}

module.exports = bot => {
  playFallback(bot);

  // DJ heartbeat
  setInterval(() => playUserSong(bot), 2000);
};
