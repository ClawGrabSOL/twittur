const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prepare, plain } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'twittur-secret-lol';

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 2 || username.length > 20) return res.status(400).json({ error: 'Username must be 2-20 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Letters, numbers, underscores only' });
    const existing = plain(prepare('SELECT id FROM users WHERE username = ?').get(username));
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const password_hash = await bcrypt.hash(password, 10);
    const result = prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, password_hash);
    const token = jwt.sign({ userId: result.lastInsertRowid, username }, JWT_SECRET);
    res.json({ token, username, userId: result.lastInsertRowid });
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const user = plain(prepare('SELECT * FROM users WHERE username = ?').get(username));
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username, userId: user.id });
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
