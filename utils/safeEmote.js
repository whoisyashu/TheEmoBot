module.exports = async function safeEmote(bot, userId, emote) {
  try {
    await bot.player.emote(userId, emote);
  } catch (e) {
    console.error("❌ Failed emote:", emote);
    console.error(e.message);
  }
};
