const redis = require('../config/redis');

// A user can have multiple sockets open (multiple tabs/devices). We track
// a connection COUNT per user, not just a boolean — otherwise closing one
// tab would incorrectly mark the user offline while another tab is open.
const key = (userId) => `presence:user:${userId}`;

// Returns true if this is the user's FIRST active connection (i.e. they
// just came online and we should broadcast it).
async function markOnline(userId) {
  const count = await redis.incr(key(userId));
  return count === 1;
}

// Returns true if this was the user's LAST active connection (i.e. they
// just went offline and we should broadcast it).
async function markOffline(userId) {
  const count = await redis.decr(key(userId));
  if (count <= 0) {
    await redis.del(key(userId)); // cleanup, avoid negative counts lingering
    return true;
  }
  return false;
}

async function isOnline(userId) {
  const count = await redis.get(key(userId));
  return Number(count) > 0;
}

module.exports = { markOnline, markOffline, isOnline };