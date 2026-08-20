const prisma = require('../config/db');

async function createRoom(req, res) {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'name required' });
  }

  const room = await prisma.room.create({ data: { name: name.trim() } });
  res.status(201).json(room);
}

async function listRooms(req, res) {
  const rooms = await prisma.room.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rooms);
}

module.exports = { createRoom, listRooms };