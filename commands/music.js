const state = require("../state");
const triggerDownload = require("../music/songdownload");

module.exports = bot => {

  bot.on("chatCreate", async (user, message) => {

    /* ===== PLAY ===== */

    if (message.startsWith("!play ")) {
      const songName = message.slice(6);

      state.songQueue.enqueue({
        user,
        songName,
        status: "pending"
      });


      bot.message.send(`✅ Added: ${songName}`);

      // start background download
      if (!state.downloadCache.has(songName)) {
        state.isDownloading = true;

        triggerDownload(songName)
        .then(file => {
          if (file) {
            state.downloadCache.set(songName, file);

            // mark READY
            let head = state.songQueue.head;
            while (head) {
              if (head.value.songName === songName) {
                head.value.status = "ready";
                break;
              }
              head = head.next;
            }
          }
          state.isDownloading = false;
        })
      }

      return;
    }

    /* ===== QUEUE ===== */

    if (message === "!queue") {

      if (state.songQueue.isEmpty())
        return bot.message.send("Queue empty.");

      const list = state.songQueue.toArray().map(
        (s,i)=>`${i+1}. ${s.songName}`
      ).join("\n");

      bot.message.send(list);
    }

    /* ===== NOW PLAYING ===== */

    if (message === "!nowplaying") {
      if (!state.currentSong)
        return bot.message.send("Nothing playing.");

      bot.message.send(state.currentSong.songName);
    }

    /* ===== SKIP ===== */

    if (message === "!skip" && user.id === bot.info.owner.id) {
      state.currentProcess?.kill("SIGINT");
    }

  });
};
