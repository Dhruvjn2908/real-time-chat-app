const express = require('express');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const requireAuth = require('./middleware/auth');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Example protected route to sanity-check the middleware — remove later
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = app;