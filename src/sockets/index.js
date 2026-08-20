const { Server } = require('socket.io');
const socketAuth = require('./socketAuth');
const registerSocketHandlers = require('./handlers');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' }, // tighten this to your frontend URL in production
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });

  return io;
}

module.exports = initSocket;