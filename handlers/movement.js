const state = require("../state");

module.exports = bot => {

  bot.on("playerJoin", user=>{
    state.players.push(user);
    bot.message.send(`Welcome ${user.username}`);
  });

  bot.on("playerLeave", user=>{
    state.players = state.players.filter(p=>p.id!==user.id);
  });

};
