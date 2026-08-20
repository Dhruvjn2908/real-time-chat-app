require('dotenv').config();
const http = require('http');
const app = require('./app');
const initSocket = require('./sockets');

const PORT = process.env.PORT || 4000;

// Socket.IO needs a raw http server to attach to — app.listen() alone
// only gives Express control, not the underlying server object.
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});