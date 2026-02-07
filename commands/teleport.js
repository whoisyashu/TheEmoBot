const { Facing } = require("highrise.sdk.dev");

// FLOOR PRESETS
const FLOORS = {
  floor1: { x: 1.5, y: 0.5, z: 17.5 },
  floor2: { x: 14.5, y: 9.75, z: 8.5 },

  // keep same as floor1 for now (you said you'll update later)
  modarea: { x: 1.5, y: 0.5, z: 17.5 }
};

module.exports = bot => {

  bot.on("chatCreate", async (user, msg) => {

    if (!msg.startsWith("!goto ")) return;

    const arg = msg.slice(6).trim().toLowerCase();

    /* ============ FLOOR TELEPORT ============ */

    if (FLOORS[arg]) {

      const p = FLOORS[arg];

      try {
        await bot.player.teleport(user.id, p.x, p.y, p.z, Facing.FrontRight);
        bot.message.send(`✅ Teleported to ${arg}`);
      } catch (e) {
        console.error("Floor goto error:", e.message);
        bot.message.send("❌ Teleport failed.");
      }

      return;
    }

    /* ============ PLAYER TELEPORT ============ */

    // Expect: !goto @username
    if (!arg.startsWith("@")) {
      return bot.message.send("Usage:\n!goto @username\n!goto floor1\n!goto floor2\n!goto modArea");
    }

    const targetName = arg.slice(1);

    try {
      const players = await bot.room.players.get();

      // Prevent teleporting to bot
      if (targetName.toLowerCase() === bot.info.user.username.toLowerCase()) {
        return bot.message.send("❌ You cannot teleport to the bot.");
      }

      const target = players.find(([info]) =>
        info.username.toLowerCase() === targetName.toLowerCase()
      );

      if (!target) {
        return bot.message.send(`❌ Player ${targetName} not found.`);
      }

      const [, pos] = target;

      await bot.player.teleport(
        user.id,
        pos.x,
        pos.y,
        pos.z,
        pos.facing
      );

      bot.message.send(`✅ Teleported to @${targetName}`);

    } catch (e) {
      console.error("Goto error:", e.message);
      bot.message.send("❌ Teleport failed.");
    }

  });

};
