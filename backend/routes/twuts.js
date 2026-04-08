const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = 'twittur-secret-lol';

function plain(obj) {
  if (!obj) return obj;
  return Object.assign({}, obj);
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function formatTwut(twut, currentUserId) {
  const t = plain(twut);
  const user = plain(db.prepare('SELECT username, display_name, pfp_url FROM users WHERE id = ?').get(t.user_id));
  const likeCount = plain(db.prepare('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?').get(t.id)).c;
  const replyCount = plain(db.prepare('SELECT COUNT(*) as c FROM twuts WHERE parent_id = ?').get(t.id)).c;
  const retwutCount = plain(db.prepare('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?').get(t.id)).c;
  const liked = currentUserId ? !!plain(db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?').get(currentUserId, t.id)) : false;
  const retwuted = currentUserId ? !!plain(db.prepare('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?').get(currentUserId, t.id)) : false;

  let retwut_of = null;
  if (t.retwut_of_id) {
    const orig = plain(db.prepare('SELECT * FROM twuts WHERE id = ?').get(t.retwut_of_id));
    if (orig) {
      const origUser = plain(db.prepare('SELECT username, display_name, pfp_url FROM users WHERE id = ?').get(orig.user_id));
      retwut_of = {
        id: orig.id, content: orig.content, created_at: orig.created_at,
        username: origUser ? origUser.username : 'unknown',
        display_name: origUser ? origUser.display_name : null,
        pfp_url: origUser ? origUser.pfp_url : null,
      };
    }
  }

  return {
    id: t.id, content: t.content, parent_id: t.parent_id,
    retwut_of_id: t.retwut_of_id || null, retwut_of,
    created_at: t.created_at,
    username: user ? user.username : 'unknown',
    display_name: user ? user.display_name : null,
    pfp_url: user ? user.pfp_url : null,
    like_count: likeCount, reply_count: replyCount, retwut_count: retwutCount,
    liked, retwuted,
  };
}

router.get('/', (req, res) => {
  const auth = req.headers.authorization;
  let currentUserId = null;
  if (auth && auth.startsWith('Bearer ')) {
    try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {}
  }
  const twuts = db.prepare('SELECT * FROM twuts WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 100').all();
  res.json(twuts.map(t => formatTwut(t, currentUserId)));
});

router.post('/', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Content required' });
  if (content.length > 280) return res.status(400).json({ error: 'Too long! Max 280 chars' });
  const result = db.prepare('INSERT INTO twuts (user_id, content) VALUES (?, ?)').run(req.user.userId, content.trim());
  const twut = plain(db.prepare('SELECT * FROM twuts WHERE id = ?').get(result.lastInsertRowid));
  res.json(formatTwut(twut, req.user.userId));
});

router.post('/:id/like', authMiddleware, (req, res) => {
  const twutId = parseInt(req.params.id);
  const twut = plain(db.prepare('SELECT id FROM twuts WHERE id = ?').get(twutId));
  if (!twut) return res.status(404).json({ error: 'Twut not found' });
  const existing = plain(db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
  } else {
    db.prepare('INSERT INTO likes (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
  }
  const likeCount = plain(db.prepare('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?').get(twutId)).c;
  res.json({ liked: !existing, like_count: likeCount });
});

router.post('/:id/retwut', authMiddleware, (req, res) => {
  const twutId = parseInt(req.params.id);
  const twut = plain(db.prepare('SELECT id FROM twuts WHERE id = ?').get(twutId));
  if (!twut) return res.status(404).json({ error: 'Twut not found' });
  const existing = plain(db.prepare('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?').get(req.user.userId, twutId));
  if (existing) {
    db.prepare('DELETE FROM retwuts WHERE user_id = ? AND twut_id = ?').run(req.user.userId, twutId);
  } else {
    db.prepare('INSERT INTO retwuts (user_id, twut_id) VALUES (?, ?)').run(req.user.userId, twutId);
  }
  const retwutCount = plain(db.prepare('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?').get(twutId)).c;
  res.json({ retwuted: !existing, retwut_count: retwutCount });
});

router.get('/:id/replies', (req, res) => {
  const auth = req.headers.authorization;
  let currentUserId = null;
  if (auth && auth.startsWith('Bearer ')) {
    try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {}
  }
  const twutId = parseInt(req.params.id);
  const replies = db.prepare('SELECT * FROM twuts WHERE parent_id = ? ORDER BY created_at ASC').all(twutId);
  res.json(replies.map(t => formatTwut(t, currentUserId)));
});

router.post('/:id/reply', authMiddleware, (req, res) => {
  const twutId = parseInt(req.params.id);
  const parent = plain(db.prepare('SELECT id FROM twuts WHERE id = ?').get(twutId));
  if (!parent) return res.status(404).json({ error: 'Twut not found' });
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Content required' });
  if (content.length > 280) return res.status(400).json({ error: 'Too long!' });
  const result = db.prepare('INSERT INTO twuts (user_id, content, parent_id) VALUES (?, ?, ?)').run(req.user.userId, content.trim(), twutId);
  const twut = plain(db.prepare('SELECT * FROM twuts WHERE id = ?').get(result.lastInsertRowid));
  res.json(formatTwut(twut, req.user.userId));
});

module.exports = router;
