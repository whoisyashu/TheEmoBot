const { Highrise, Events } = require("highrise.sdk.dev");
require("dotenv").config();
const { TOKEN, ROOM } = require("./config");

const ready = require("./handlers/ready");
const joinLeave = require("./handlers/joinLeave");
const movement = require("./handlers/movement");

const music = require("./commands/music");
const dance = require("./commands/dance");
const emotes = require("./commands/emotes");
const teleport = require("./commands/teleport");

require("./radio/server");




const bot = new Highrise({
  Events: [
    Events.Joins,
    Events.Messages,
    Events.Leaves,
    Events.Movements
  ],
  AutoFetchMessages: true,
  Cache: true
});



ready(bot);
joinLeave(bot);
movement(bot);

music(bot);
dance(bot);
emotes(bot);
teleport(bot);

console.log("ENV TOKEN:", process.env.HIGHRISE_TOKEN);
console.log("TOKEN LENGTH:", process.env.HIGHRISE_TOKEN?.length);

bot.login(TOKEN, ROOM);
