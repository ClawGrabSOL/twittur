const express = require('express');
const jwt = require('jsonwebtoken');
const { prepare, plain } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'twittur-secret-lol';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = plain(prepare('SELECT id, username, display_name, bio, pfp_url, created_at FROM users WHERE id = ?').get(req.user.userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/', authMiddleware, (req, res) => {
  try {
    const { display_name, bio, pfp_url } = req.body;
    if (display_name && display_name.length > 50) return res.status(400).json({ error: 'Display name too long' });
    if (bio && bio.length > 160) return res.status(400).json({ error: 'Bio too long' });
    prepare('UPDATE users SET display_name = ?, bio = ?, pfp_url = ? WHERE id = ?').run(display_name || null, bio || null, pfp_url || null, req.user.userId);
    const updated = plain(prepare('SELECT id, username, display_name, bio, pfp_url, created_at FROM users WHERE id = ?').get(req.user.userId));
    res.json(updated);
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
