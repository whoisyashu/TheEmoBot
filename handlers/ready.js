const { Facing } = require("highrise.sdk.dev");
const startFallback = require("../music/fallback");

module.exports = bot => {

  bot.on("ready", async (session) => {
    console.log(`Bot is now online in ${session.room_info.room_name}.`);

    try {
      // 1️⃣ TELEPORT BOT
      await bot.player.teleport(
        bot.info.user.id,
        9.5,
        9.75,
        2.5,
        Facing.FrontRight
      );

      console.log("✅ Bot teleported.");

      // safety delay
      await new Promise(r => setTimeout(r, 500));

      // 2️⃣ START FALLBACK MUSIC
      startFallback(bot);
      console.log("🎵 Fallback radio started.");

      // 3️⃣ BOT JOINS DANCE STAGE (same as user command)
      bot.emit("chatCreate", bot.info.user, "!dance");

      console.log("🕺 Bot joined dance stage.");

    } catch (e) {
      console.error("Startup error:", e);
    }

  });

};
