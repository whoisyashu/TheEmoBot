const express = require("express");

const app = express();
let listeners = [];

app.post("/live", (req, res) => {
  console.log("🎧 FFmpeg connected");

  req.on("data", chunk => {
    listeners.forEach(r => r.write(chunk));
  });

  req.on("end", () => {
    console.log("FFmpeg disconnected");
  });

  res.sendStatus(200);
});

app.get("/live", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  listeners.push(res);

  req.on("close", () => {
    listeners = listeners.filter(l => l !== res);
  });
});

app.listen(3000, () => {
  console.log("📻 Radio server running on :3000/live");
});
