const prisma = require('../config/db');

// Cursor-based pagination: client passes the `id` of the oldest message it
// already has (as ?before=<id>), and we return the next page older than it.
// This stays correct even if new messages arrive between requests — unlike
// offset/limit, which shifts and can skip or duplicate rows.
async function getMessages(req, res) {
  const { roomId } = req.params;
  const { before, limit = 30 } = req.query;
  const take = Math.min(Number(limit) || 30, 100); // hard cap to prevent abuse

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return res.status(404).json({ error: 'room not found' });
  }

  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take,
    // cursor + skip:1 means "start strictly after this cursor row"
    ...(before && { cursor: { id: before }, skip: 1 }),
  });

  // Compute the cursor BEFORE reversing — reverse() mutates in place,
  // so if we reversed first, "oldest in this page" would point to the wrong row.
  const nextCursor = messages.length === take ? messages[messages.length - 1].id : null;

  res.json({
    messages: messages.reverse(), // oldest-first, easier to render top-to-bottom
    nextCursor,
  });
}

module.exports = { getMessages };