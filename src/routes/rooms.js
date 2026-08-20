const express = require('express');
const { createRoom, listRooms } = require('../controllers/roomController');
const { getMessages } = require('../controllers/messageController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createRoom);
router.get('/', requireAuth, listRooms);
router.get('/:roomId/messages', requireAuth, getMessages);

module.exports = router;