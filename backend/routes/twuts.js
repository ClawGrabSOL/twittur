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

function formatTwut(t, currentUserId) {
  const user = plain(prepare('SELECT username, display_name, pfp_url FROM users WHERE id = ?').get(t.user_id));
  const likeCount = plain(prepare('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?').get(t.id)).c;
  const replyCount = plain(prepare('SELECT COUNT(*) as c FROM twuts WHERE parent_id = ?').get(t.id)).c;
  const retwutCount = plain(prepare('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?').get(t.id)).c;
  const liked = currentUserId ? !!plain(prepare('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?').get(currentUserId, t.id)) : false;
  const retwuted = currentUserId ? !!plain(prepare('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?').get(currentUserId, t.id)) : false;
  return {
    id: t.id, content: t.content, parent_id: t.parent_id, retwut_of_id: t.retwut_of_id || null,
    created_at: t.created_at, username: user?.username || 'unknown',
    display_name: user?.display_name || null, pfp_url: user?.pfp_url || null,
    like_count: likeCount, reply_count: replyCount, retwut_count: retwutCount, liked, retwuted,
  };
}

router.get('/', (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentUserId = null;
    if (auth?.startsWith('Bearer ')) { try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {} }
    const twuts = prepare('SELECT * FROM twuts WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 100').all();
    res.json(twuts.map(t => formatTwut(plain(t), currentUserId)));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    if (content.length > 280) return res.status(400).json({ error: 'Too long!' });
    const result = prepare('INSERT INTO twuts (user_id, content) VALUES (?, ?)').run(req.user.userId, content.trim());
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(result.lastInsertRowid));
    res.json(formatTwut(twut, req.user.userId));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const existing = plain(prepare('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
    if (existing) prepare('DELETE FROM likes WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
    else prepare('INSERT INTO likes (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
    const likeCount = plain(prepare('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?').get(twutId)).c;
    res.json({ liked: !existing, like_count: likeCount });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/retwut', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const existing = plain(prepare('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
    if (existing) prepare('DELETE FROM retwuts WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
    else prepare('INSERT INTO retwuts (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
    const retwutCount = plain(prepare('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?').get(twutId)).c;
    res.json({ retwuted: !existing, retwut_count: retwutCount });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/replies', (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentUserId = null;
    if (auth?.startsWith('Bearer ')) { try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {} }
    const replies = prepare('SELECT * FROM twuts WHERE parent_id = ? ORDER BY created_at ASC').all(parseInt(req.params.id));
    res.json(replies.map(t => formatTwut(plain(t), currentUserId)));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/reply', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = prepare('INSERT INTO twuts (user_id, content, parent_id) VALUES (?, ?, ?)').run(req.user.userId, content.trim(), twutId);
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(result.lastInsertRowid));
    res.json(formatTwut(twut, req.user.userId));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
