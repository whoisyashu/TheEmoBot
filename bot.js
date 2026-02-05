const { Highrise, Events, Facing, Emotes } = require("highrise.sdk.dev");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const triggerDownload = require("./songdownload.js");
const streamToIcecast = require("./player.js");
const Names = require("./emotes.json");

/* ================= CONFIG ================= */

const TOKEN = "291e84c606bc23271e7655503b77373a449fa908c8c569f7fc4c47f71001c45f";
const ROOM = "698326711d571f91cbf3d1e9";

const bot  = new Highrise({
  Events :[
    Events.Joins,
    Events.Messages,
    Events.Leaves,
    Events.Reactions,
    Events.Emotes,
    Events.DirectMessages,
    Events.Movements
  ],
  AutoFetchMessages: true,
  Cache: true
});

const players =[];
const songQueue = [];
let isPlaying = false;
let currentSong = null;
let currentProcess = null;
const downloadCache = new Map(); // songName → filePath
let isPrefetching = false;
let emoteLoop = null;
let loopingUser = null;
let dancingUser = null;
const dancingUsers = new Set();
const FALLBACK_DIR = "./fallback";
let fallbackMode = false;


const DANCE_ZONE = {
  minX: 1.5,
  maxX: 9.5,
  minZ: 20.5,
  maxZ: 28.5
};


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
  "dance-hipshake"
];
const DANCE_STYLE_EMOTES = [
  "emote-disco",
  "emote-gangnam",
  "emote-harlemshake",
  "emote-nightfever",
  "emote-tapdance",
  "emote-gordonshuffle",   // moonwalk
  "emote-hyped",
  "emote-looping",
  "emote-superpose"
];

const ALL_DANCE_EMOTES = [
  ...DANCE_EMOTES,
  ...DANCE_STYLE_EMOTES
];
function getRandomDance() {
  return ALL_DANCE_EMOTES[
    Math.floor(Math.random() * ALL_DANCE_EMOTES.length)
  ];
}
let danceLoop = null;

function isInsideDanceZone(pos) {
  return (
    pos.x >= DANCE_ZONE.minX &&
    pos.x <= DANCE_ZONE.maxX &&
    pos.z >= DANCE_ZONE.minZ &&
    pos.z <= DANCE_ZONE.maxZ
  );
}


function startRandomDance(userId) {
  if (danceLoop) return;

  dancingUser = userId;

  danceLoop = setInterval(() => {
    const emote = getRandomDance();
    bot.player.emote(dancingUser, emote).catch(e => {
      console.log("❌ Failed emote:", emote);
      console.error(e.message);
    });

  }, 9000);
}


function stopRandomDance() {
  if (!danceLoop) return;

  clearInterval(danceLoop);
  danceLoop = null;
  dancingUser = null;
}

function getFallbackSong() {
  const files = fs.readdirSync(FALLBACK_DIR).filter(f => f.endsWith(".mp3"));
  if (!files.length) return null;

  return path.join(FALLBACK_DIR, files[Math.floor(Math.random() * files.length)]);
}


function storePlayerPosition(user, position) {
  const index = players.findIndex(p => p.id === user.id);

  const playerData = {
    id: user.id,
    username: user.username,
    position: position
  };

  if (index !== -1) {
    // Update existing player
    players[index] = playerData;
  } else {
    // Add new player
    players.push(playerData);
  }
}

bot.on('ready', async(session)=>{
  console.log(`Bot is now online in ${session.room_info.room_name}.`.green);
  bot.player.teleport(bot.info.user.id, 9.5, 9.75, 2.5, Facing.FrontRight).catch(e => console.error(e));
  // bot.message.send(`TheEmoBot is live now`);
  startRandomDance(bot.info.user.id);
});

bot.on('playerJoin', (user) => {
  players.push(user.username);
  bot.message.send(`Welcome to the room ${user.username}.`);
  console.log(`[PLAYER JOINED] : Welcome to the room ${user.username}.`.green);
});

bot.on("playerLeave", (user) => {

  let index = players.indexOf(user.username);
  if (index > -1) players.splice(index, 1);

  // 🛑 stop dancing if dancer left
  if (user.id === dancingUser) {
    stopRandomDance();
    console.log("Dance stopped because user left.");
  }

  bot.message.send(`Bye, have a nice day ${user.username}.`);
  console.log(`[PLAYER LEFT] : Bye, have a nice day ${user.username}.`.red);
});


// Listen for playerMove events
bot.on("playerMove", (user, position) => {
  
  // Store position
  storePlayerPosition(user, position);

});

bot.on("playerMove", async (user, position) => {

  const inside = isInsideDanceZone(position);

  // ENTER zone
  if (inside && !dancingUsers.has(user.id)) {
    dancingUsers.add(user.id);

    bot.message.send(`${user.username} entered dance floor 💃`);

    startRandomDance(user.id);
  }

  // EXIT zone
  if (!inside && dancingUsers.has(user.id)) {
    dancingUsers.delete(user.id);

    stopRandomDance();

    bot.message.send(`${user.username} left dance floor 🛑`);
  }
});


bot.on("chatCreate", async (user, message) => {

  if (!message.startsWith("!teleport")) return;

  const args = message.split(" ");
  const targetName = args[1];

  if (!targetName) {
    bot.message.send("❌ Usage: !teleport username");
    return;
  }

  const target = players.find(p =>
    p.username.toLowerCase() === targetName.toLowerCase()
  );

  if (!target) {
    bot.message.send(`❌ Player ${targetName} not found or no position saved.`);
    return;
  }

  const { x, y, z, facing } = target.position;

  try {
    await bot.player.teleport(user.id, x, y, z, facing);

    // 🔥 FORCE UPDATE teleported user's stored position
    storePlayerPosition(user, {
      x,
      y,
      z,
      facing
    });

    bot.message.send(`✅ Teleported ${user.username} to ${target.username}`);

  } catch (e) {
    console.error(e);
    bot.message.send("❌ Teleport failed.");
  }

});


bot.on('chatCreate', (user, message)=>{
  if(user.id != bot.info.owner.id) return;
  if(!message.startsWith("!say ")) return;
  const command = message.split(" ")[1].toLowerCase();
  if(command === null){
    bot.message.send("Test Command Keyword required");
    return;
  }
  if(command === "teleport"){
    bot.message.send("!teleport AnonTech");
  }
});


function playFallback() {
  if (isPlaying || currentProcess) return;

  const file = getFallbackSong();
  if (!file) return;

  fallbackMode = true;
  isPlaying = true;

  // extract filename for display
  const song = path.basename(file, ".mp3");

  // set current song
  currentSong = { songName: song, filePath: file };

  // announce
  bot.message.send(`📻 Now playing: ${song}`);

  currentProcess = streamToIcecast(file);

  currentProcess.on("close", () => {
    isPlaying = false;
    currentProcess = null;

    if (songQueue.length === 0) {
      playFallback(); // keep fallback looping
    } else {
      playNextSong();
    }
  });
}



async function prefetchSongs() {
  if (isPrefetching) return;

  isPrefetching = true;

  for (const item of songQueue) {
    if (downloadCache.has(item.songName)) continue;

    try {
      const flag = { done: false };
      const filePath = await triggerDownload(item.songName, flag);

      if (flag.done && filePath) {
        if (fallbackMode && currentProcess) {
          currentProcess.kill("SIGINT");
          fallbackMode = false;
        }


        downloadCache.set(item.songName, filePath);
        console.log("Prefetched:", item.songName);

        playNextSong()
      }
    } catch {
      console.log("Prefetch failed:", item.songName);
    }
  }

  isPrefetching = false;
}

async function playNextSong() {
  if (isPlaying || currentProcess) return;

  const item = songQueue[0]; // 👈 peek only
  if (!item) {
    currentSong = null;
    playFallback();
    return;
  }



  let filePath;

  try {
    // ONLY use ready files
    if (downloadCache.has(item.songName)) {
      filePath = downloadCache.get(item.songName);
    } else {
      return; // wait for prefetch
    }

    // NOW remove from queue
    songQueue.shift();
    downloadCache.delete(item.songName);

    isPlaying = true;
    currentSong = item;
    currentSong.filePath = filePath;

    const song = path.basename(filePath, ".mp3");
    bot.message.send(`🎵 Now playing: ${song}`);

    prefetchSongs();

    currentProcess = streamToIcecast(filePath);

    currentProcess.on("close", () => {
      if (currentSong?.filePath === filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      isPlaying = false;
      currentProcess = null;

      playNextSong();
    });

  } catch (err) {
    console.error(err);
    isPlaying = false;
    playNextSong();
  }
}


bot.on("chatCreate", (user, message) => {
  if (!message.startsWith("!play ")) return;

  const songName = message.slice(6);

  songQueue.push({ user, songName });

  bot.message.send(`✅ Added to queue: ${songName}`);

  prefetchSongs();   // only prefetch
});



bot.on("chatCreate", (user, message) => {

  if (message !== "!queue") return;

  if (songQueue.length === 0) {
    bot.message.send("📭 Queue is empty.");
    return;
  }

  const list = songQueue
    .slice(0, 5)
    .map((s, i) => `${i + 1}. ${s.songName}`)
    .join("\n");

  bot.message.send(`🎶 Upcoming songs:\n${list}`);
});

bot.on("chatCreate", (user, message) => {

  if (message !== "!nowplaying") return;

  if (!currentSong) {
    bot.message.send("Nothing playing right now.");
    return;
  }

  bot.message.send(`🎵 Now playing: ${currentSong.songName}`);
});

bot.on("chatCreate", (user, message) => {

  if (message !== "!skip") return;
  if (user.id !== bot.info.owner.id) return;

  if (currentProcess) {
    currentProcess.kill("SIGINT");
    bot.message.send("⏭ Song skipped.");
  }
});

bot.on("chatCreate", async (user, message) => {
  if (!message.startsWith("emote ")) return;

  const key = message.slice(6).toLowerCase();

  if (!Names[key]) {
    bot.message.send(`${user.username}, unknown emote.`);
    return;
  }

  const [emoteName] = Names[key];

  await bot.player.emote(user.id, emoteName).catch(console.error);
});

bot.on("chatCreate", async (user, message) => {
  if (!message.startsWith("emote loop ")) return;

  const key = message.slice(11).toLowerCase();

  if (!Names[key]) {
    bot.message.send("Unknown emote.");
    return;
  }

  if (emoteLoop) {
    bot.message.send("An emote loop is already running.");
    return;
  }

  const [emoteName, duration] = Names[key];

  loopingUser = user.id;

  bot.message.send(`🔁 Looping ${key}`);

  emoteLoop = setInterval(() => {
    bot.player.emote(loopingUser, emoteName).catch(console.error);
  }, (duration + 0.3) * 1000); // slight buffer
});

bot.on("chatCreate", (user, message) => {
  if (message !== "emote stop") return;

  if (!emoteLoop) {
    bot.whisper.send("No emote loop running.", user);
    return;
  }

  clearInterval(emoteLoop);
  emoteLoop = null;
  loopingUser = null;

  bot.whisper.send("⏹ Emote loop stopped.", user);
});

bot.on("chatCreate", (user, message) => {

  if (message === "!dance") {
    startRandomDance(user.id);
    bot.message.send("🕺 Random dance started!");
  }

  if (message === "!stopdance") {
    stopRandomDance();
    bot.message.send("🛑 Dance stopped.");
  }

});

bot.on('ready', async(session)=>{
  await playFallback();
})

process.on('unhandledRejection', async (err, promise) => {
  console.error(`[ANTI-CRASH] Unhandled Rejection: ${err}`.red);
  console.error(promise);
});

/* LOGIN */

bot.login(TOKEN, ROOM);
