const jwt = require('jsonwebtoken');

// Runs once per socket connection attempt, before 'connection' fires.
// Client must send token as: io(url, { auth: { token: "<jwt>" } })
function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('missing token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload; // { userId, username }
    next();
  } catch (err) {
    next(new Error('invalid or expired token'));
  }
}

module.exports = socketAuth;