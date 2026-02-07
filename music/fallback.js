const fs = require("fs");
const path = require("path");
const state = require("../state");
const streamToRadio = require("./player");
const triggerDownload = require("./songdownload");

let heartbeatStarted = false;

// fallback search terms
const FALLBACK_QUERIES = [
  "lofi hindi radio",
  "chill punjabi beats",
  "bollywood instrumental",
  "ambient study music",
  "soft english acoustic"
];

function randomFallbackQuery() {
  return FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];
}

async function playUserSong(bot) {
  if (state.isPlaying) return;

  const next = state.songQueue.peek();

  // no user songs → fallback
  if (!next) return playFallback(bot);

  if (next.status !== "ready") return;

  const file = state.downloadCache.get(next.songName);

  if (!file || !fs.existsSync(file)) {
    state.songQueue.dequeue();
    return playUserSong(bot);
  }

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

  bot.message.send(`🎵 Now playing: ${cleanName}\n🙋 ${requester}`);

  state.currentProcess = streamToRadio(file);

  state.currentProcess.on("close", () => {
    state.isPlaying = false;
    state.currentProcess = null;

    if (fs.existsSync(file)) fs.unlinkSync(file);

    playUserSong(bot);
  });
}

async function playFallback(bot) {
  if (state.isPlaying || state.isFallbackPlaying) return;

  state.isFallbackPlaying = true;

  const query = randomFallbackQuery();
  console.log("Fallback query:", query);

  const file = await triggerDownload(query);
  if (!file) {
    state.isFallbackPlaying = false;
    return;
  }

  state.currentSong = { songName: query };

  state.currentProcess = streamToRadio(file);

  state.currentProcess.on("close", () => {
    state.isFallbackPlaying = false;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    playUserSong(bot);
  });
}

module.exports = bot => {
  if (heartbeatStarted) return;
  heartbeatStarted = true;

  playFallback(bot);
  setInterval(() => playUserSong(bot), 2000);
};
