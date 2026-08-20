const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const SALT_ROUNDS = 10;

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: 'username already taken' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { username, passwordHash },
  });

  const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.status(201).json({ token, user: { id: user.id, username: user.username } });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token, user: { id: user.id, username: user.username } });
}

module.exports = { register, login };