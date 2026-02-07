const { DANCE_ZONE } = require("../config");
const safeEmote = require("../utils/safeEmote");

// ALL STAGE EMOTES (your list)
const DANCE_EMOTES = [
  "dance-aerobics",
  "dance-anime",
  "dance-blackpink",
  "dance-creepypuppet",
  "dance-duckwalk",
  "dance-employee",
  "dance-handsup",
  "dance-icecream",
  "dance-jinglebell",
  "dance-kawai",
  "dance-macarena",
  "dance-metal",
  "dance-orangejustice",
  "dance-pennywise",
  "dance-pinguin",
  "dance-russian",
  "dance-sexy",
  "dance-shoppingcart",
  "dance-singleladies",
  "dance-smoothwalk",
  "dance-tiktok10",
  "dance-tiktok2",
  "dance-tiktok8",
  "dance-tiktok9",
  "dance-touch",
  "dance-voguehands",
  "dance-weird",
  "dance-wrong",
  "dance-zombie",
  "dance-hipshake",
  "emote-disco",
  "emote-gangnam",
  "emote-harlemshake",
  "emote-nightfever",
  "emote-tapdance",
  "emote-gordonshuffle",
  "emote-hyped",
  "emote-looping"
];

// users currently on stage
const dancers = new Set();

let stageLoop = null;

function randomStageEmote() {
  return DANCE_EMOTES[Math.floor(Math.random() * DANCE_EMOTES.length)];
}

function insideZone(pos) {
  return (
    pos.x >= DANCE_ZONE.minX &&
    pos.x <= DANCE_ZONE.maxX &&
    pos.z >= DANCE_ZONE.minZ &&
    pos.z <= DANCE_ZONE.maxZ
  );
}

function startStage(bot) {
  if (stageLoop) return;

  stageLoop = setInterval(() => {
    if (dancers.size === 0) return;

    const emote = randomStageEmote();

    dancers.forEach(id => {
      safeEmote(bot, id, emote);
    });

  }, 9000);
}

function stopStage() {
  clearInterval(stageLoop);
  stageLoop = null;
}

module.exports = bot => {

  /* ============ ZONE BASED AUTO JOIN ============ */

  bot.on("playerMove", (user, position) => {

    if (insideZone(position)) {
      if (!dancers.has(user.id)) {
        dancers.add(user.id);
        startStage(bot);
      }
    } else {
      if (dancers.has(user.id)) {
        dancers.delete(user.id);
      }
    }

    if (dancers.size === 0) stopStage();
  });

  /* ============ MANUAL COMMANDS ============ */

  bot.on("chatCreate", (user, msg) => {

    if (msg === "!dance") {
      dancers.add(user.id);
      startStage(bot);
    }

    if (msg === "!stopdance") {
      dancers.delete(user.id);
      bot.message.send("🛑 You left the stage.");

      if (dancers.size === 0) stopStage();
    }

  });

  /* ============ AUTO CLEANUP ON LEAVE ============ */

  bot.on("playerLeave", (user) => {
    dancers.delete(user.id);
    if (dancers.size === 0) stopStage();
  });

};
