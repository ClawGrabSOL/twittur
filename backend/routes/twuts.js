const express = require('express');
const jwt = require('jsonwebtoken');
const { prepare, plain } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'twittur-secret-lol';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'z-admin-wipe-2024';

// Migrate: add image_url column if missing
try { prepare('ALTER TABLE twuts ADD COLUMN image_url TEXT DEFAULT NULL').run(); } catch(e) {}

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
  const bookmarked = currentUserId ? !!plain(prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND twut_id = ?').get(currentUserId, t.id)) : false;
  return {
    id: t.id, content: t.content, image_url: t.image_url || null,
    parent_id: t.parent_id, retwut_of_id: t.retwut_of_id || null,
    created_at: t.created_at, username: user?.username || 'unknown',
    display_name: user?.display_name || null, pfp_url: user?.pfp_url || null,
    like_count: likeCount, reply_count: replyCount, retwut_count: retwutCount,
    liked, retwuted, bookmarked,
  };
}

function addNotification(userId, actorId, type, twutId) {
  if (userId === actorId) return; // don't notify yourself
  try {
    prepare('INSERT INTO notifications (user_id, actor_id, type, twut_id) VALUES (?, ?, ?, ?)').run(userId, actorId, type, twutId || null);
  } catch(e) {}
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
    const { content, image_url } = req.body;
    if (!content?.trim() && !image_url) return res.status(400).json({ error: 'Content required' });
    if (content && content.length > 280) return res.status(400).json({ error: 'Too long!' });
    const result = prepare('INSERT INTO twuts (user_id, content, image_url) VALUES (?, ?, ?)').run(req.user.userId, (content || '').trim(), image_url || null);
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(result.lastInsertRowid));
    res.json(formatTwut(twut, req.user.userId));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Admin wipe all posts
router.delete('/admin/wipe', (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });
    prepare('DELETE FROM likes').run();
    prepare('DELETE FROM retwuts').run();
    prepare('DELETE FROM bookmarks').run();
    prepare('DELETE FROM notifications').run();
    prepare('DELETE FROM twuts').run();
    res.json({ success: true, message: 'All posts wiped' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(twutId));
    const existing = plain(prepare('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
    if (existing) prepare('DELETE FROM likes WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
    else {
      prepare('INSERT INTO likes (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
      if (twut) addNotification(twut.user_id, req.user.userId, 'like', twutId);
    }
    const likeCount = plain(prepare('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?').get(twutId)).c;
    res.json({ liked: !existing, like_count: likeCount });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/retwut', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(twutId));
    const existing = plain(prepare('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
    if (existing) prepare('DELETE FROM retwuts WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
    else {
      prepare('INSERT INTO retwuts (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
      if (twut) addNotification(twut.user_id, req.user.userId, 'repost', twutId);
    }
    const retwutCount = plain(prepare('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?').get(twutId)).c;
    res.json({ retwuted: !existing, retwut_count: retwutCount });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/bookmark', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const existing = plain(prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
    if (existing) prepare('DELETE FROM bookmarks WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
    else prepare('INSERT INTO bookmarks (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
    res.json({ bookmarked: !existing });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/bookmarks', authMiddleware, (req, res) => {
  try {
    const rows = prepare('SELECT twut_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(req.user.userId);
    const twuts = rows.map(r => {
      const t = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(r.twut_id));
      return t ? formatTwut(t, req.user.userId) : null;
    }).filter(Boolean);
    res.json(twuts);
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
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(twutId));
    const result = prepare('INSERT INTO twuts (user_id, content, parent_id) VALUES (?, ?, ?)').run(req.user.userId, content.trim(), twutId);
    if (twut) addNotification(twut.user_id, req.user.userId, 'reply', twutId);
    const newTwut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(result.lastInsertRowid));
    res.json(formatTwut(newTwut, req.user.userId));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const twut = plain(prepare('SELECT * FROM twuts WHERE id = ?').get(twutId));
    if (!twut) return res.status(404).json({ error: 'Post not found' });
    if (twut.user_id !== req.user.userId) return res.status(403).json({ error: 'Not your post' });
    prepare('DELETE FROM likes WHERE twut_id = ?').run(twutId);
    prepare('DELETE FROM retwuts WHERE twut_id = ?').run(twutId);
    prepare('DELETE FROM bookmarks WHERE twut_id = ?').run(twutId);
    prepare('DELETE FROM notifications WHERE twut_id = ?').run(twutId);
    prepare('DELETE FROM twuts WHERE id = ?').run(twutId);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
