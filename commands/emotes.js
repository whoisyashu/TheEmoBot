const Names = require("../emotes.json");
const safeEmote = require("../utils/safeEmote");

// userId -> interval
const userLoops = new Map();

module.exports = bot => {

  bot.on("chatCreate", async (user, message) => {

    /* ================= SINGLE EMOTE ================= */

    if (message.startsWith("!emote ")) {

      const key = message.slice(7).toLowerCase();
      if (!Names[key]) return bot.message.send("Unknown emote.");

      // Stop existing loop if any
      if (userLoops.has(user.id)) {
        clearInterval(userLoops.get(user.id));
        userLoops.delete(user.id);
      }

      const [emote] = Names[key];
      await safeEmote(bot, id, emote);

      return;
    }

    /* ================= LOOP EMOTE ================= */

    if (message.startsWith("!loop ")) {

      const key = message.slice(6).toLowerCase();
      if (!Names[key]) return bot.message.send("Unknown emote.");

      // Replace existing loop
      if (userLoops.has(user.id)) {
        clearInterval(userLoops.get(user.id));
      }

      const [emote, duration] = Names[key];

      bot.whisper.send(`🔁 Looping ${key}`, user);

      const loop = setInterval(() => {
        bot.player.emote(user.id, emote).catch(console.error);
      }, (duration + 0.3) * 1000);

      userLoops.set(user.id, loop);

      return;
    }

    /* ================= STOP EMOTE ================= */

    if (message === "!stop") {

      if (!userLoops.has(user.id))
        return bot.whisper.send("You have no active emote.", user);

      clearInterval(userLoops.get(user.id));
      userLoops.delete(user.id);

      bot.whisper.send("⏹ Emote stopped.", user);
    }

  });

    // AUTO STOP EMOTE WHEN USER LEAVES
  bot.on("playerLeave", (user) => {
    if (userLoops.has(user.id)) {
      clearInterval(userLoops.get(user.id));
      userLoops.delete(user.id);
      console.log(`Emote loop cleared for ${user.username}`);
    }
  });


};
