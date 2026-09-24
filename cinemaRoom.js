
const rooms = new Map();

function createCinemaRoom(url, creator) {
  const id =
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8);

  rooms.set(id, {
    id,
    url,
    creator: creator.tag,
    playing: false,
    currentTime: 0,
    updatedAt: Date.now()
  });

  return rooms.get(id);
}

function getRoom(id) {
  return rooms.get(id);
}

function updateRoom(id, data) {
  const room = rooms.get(id);

  if (!room) return null;

  if (typeof data.playing === "boolean") {
    room.playing = data.playing;
  }

  if (typeof data.currentTime === "number") {
    room.currentTime = Math.max(0, data.currentTime);
  }

  room.updatedAt = Date.now();

  return room;
}

module.exports = {
  createCinemaRoom,
  getRoom,
  updateRoom
};
