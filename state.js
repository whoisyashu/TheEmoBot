module.exports = {
  players: [],
  downloadCache: new Map(),

  isPlaying: false,
  currentSong: null,
  currentProcess: null,

  dancingUsers: new Set(),
  danceLoop: null,
  dancingUser: null,

  emoteLoop: null,
  loopingUser: null
};

const LinkedListQueue = require("./music/LinkedListQueue");

module.exports = {
  songQueue: new LinkedListQueue(),

  currentSong: null,
  currentProcess: null,

  isPlaying: false,
  isFallbackPlaying: false,
  isDownloading: false,

  downloadCache: new Map()
};
