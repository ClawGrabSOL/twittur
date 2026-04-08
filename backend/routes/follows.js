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

router.post('/:username', authMiddleware, (req, res) => {
  try {
    const target = plain(prepare('SELECT id FROM users WHERE username = ?').get(req.params.username));
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.userId) return res.status(400).json({ error: 'Cannot follow yourself' });
    const existing = plain(prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.userId, target.id));
    if (existing) prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.userId, target.id);
    else prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.userId, target.id);
    const followerCount = plain(prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(target.id)).c;
    res.json({ following: !existing, follower_count: followerCount });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:username/status', authMiddleware, (req, res) => {
  try {
    const target = plain(prepare('SELECT id FROM users WHERE username = ?').get(req.params.username));
    if (!target) return res.status(404).json({ error: 'User not found' });
    const following = !!plain(prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.userId, target.id));
    const followerCount = plain(prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(target.id)).c;
    const followingCount = plain(prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(target.id)).c;
    res.json({ following, follower_count: followerCount, following_count: followingCount });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
