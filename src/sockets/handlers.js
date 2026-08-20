const prisma = require('../config/db');
const { markOnline, markOffline } = require('./presence');

// Called once per connected socket. Registers all event listeners for it.
async function registerSocketHandlers(io, socket) {
  console.log(`socket connected: ${socket.user.username} (${socket.id})`);

  // Only broadcast "online" if this is the user's first active connection
  // (they might have another tab/device already open).
  const justCameOnline = await markOnline(socket.user.userId);
  if (justCameOnline) {
    io.emit('presence:online', { userId: socket.user.userId, username: socket.user.username });
  }

  // Client asks to join a room. We use Socket.IO "rooms" (a built-in
  // pub-sub grouping) — joining lets us later do io.to(roomId).emit(...)
  // to broadcast only to sockets in that room, not everyone.
  socket.on('room:join', async ({ roomId }) => {
    if (!roomId) return;

    socket.join(roomId);

    // Ensure membership exists in DB (idempotent — ignore if already a member)
    await prisma.roomMember.upsert({
      where: { userId_roomId: { userId: socket.user.userId, roomId } },
      update: {},
      create: { userId: socket.user.userId, roomId },
    });

    socket.to(roomId).emit('room:userJoined', {
      userId: socket.user.userId,
      username: socket.user.username,
    });
  });

  socket.on('room:leave', ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    socket.to(roomId).emit('room:userLeft', {
      userId: socket.user.userId,
      username: socket.user.username,
    });
  });

  // Core chat event: persist message, then broadcast to everyone in the room
  // (including sender, so their own UI updates from the same source of truth).
  socket.on('message:send', async ({ roomId, content }) => {
    if (!roomId || !content?.trim()) return;

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        userId: socket.user.userId,
        roomId,
      },
    });

    io.to(roomId).emit('message:new', {
      id: message.id,
      content: message.content,
      roomId,
      userId: socket.user.userId,
      username: socket.user.username,
      createdAt: message.createdAt,
    });
  });

  // Typing indicators are pure ephemeral broadcasts — no DB write, no Redis.
  // We use socket.to() (not io.to()) so the sender doesn't get their own event back.
  socket.on('typing:start', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('typing:start', {
      userId: socket.user.userId,
      username: socket.user.username,
      roomId,
    });
  });

  socket.on('typing:stop', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('typing:stop', {
      userId: socket.user.userId,
      username: socket.user.username,
      roomId,
    });
  });

  socket.on('disconnect', async () => {
    console.log(`socket disconnected: ${socket.user.username} (${socket.id})`);

    // Only broadcast "offline" if this was the user's LAST active connection.
    const wentOffline = await markOffline(socket.user.userId);
    if (wentOffline) {
      io.emit('presence:offline', { userId: socket.user.userId, username: socket.user.username });
    }
  });
}

module.exports = registerSocketHandlers;