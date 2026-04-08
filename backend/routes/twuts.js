const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'twittur-secret-lol';

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

async function formatTwut(t, currentUserId) {
  const user = await db.get('SELECT username, display_name, pfp_url FROM users WHERE id = ?', [t.user_id]);
  const likeCount = (await db.get('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?', [t.id])).c;
  const replyCount = (await db.get('SELECT COUNT(*) as c FROM twuts WHERE parent_id = ?', [t.id])).c;
  const retwutCount = (await db.get('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?', [t.id])).c;
  const liked = currentUserId ? !!(await db.get('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?', [currentUserId, t.id])) : false;
  const retwuted = currentUserId ? !!(await db.get('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?', [currentUserId, t.id])) : false;

  let retwut_of = null;
  if (t.retwut_of_id) {
    const orig = await db.get('SELECT * FROM twuts WHERE id = ?', [t.retwut_of_id]);
    if (orig) {
      const origUser = await db.get('SELECT username, display_name, pfp_url FROM users WHERE id = ?', [orig.user_id]);
      retwut_of = { id: orig.id, content: orig.content, created_at: orig.created_at,
        username: origUser?.username, display_name: origUser?.display_name, pfp_url: origUser?.pfp_url };
    }
  }

  return {
    id: t.id, content: t.content, parent_id: t.parent_id,
    retwut_of_id: t.retwut_of_id || null, retwut_of,
    created_at: t.created_at,
    username: user?.username || 'unknown', display_name: user?.display_name || null, pfp_url: user?.pfp_url || null,
    like_count: Number(likeCount), reply_count: Number(replyCount), retwut_count: Number(retwutCount),
    liked, retwuted,
  };
}

router.get('/', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentUserId = null;
    if (auth?.startsWith('Bearer ')) { try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {} }
    const twuts = await db.query('SELECT * FROM twuts WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 100');
    res.json(await Promise.all(twuts.map(t => formatTwut(t, currentUserId))));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    if (content.length > 280) return res.status(400).json({ error: 'Too long!' });
    const result = await db.run('INSERT INTO twuts (user_id, content) VALUES (?, ?)', [req.user.userId, content.trim()]);
    const twut = await db.get('SELECT * FROM twuts WHERE id = ?', [result.lastInsertRowid]);
    res.json(await formatTwut(twut, req.user.userId));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const existing = await db.get('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?', [req.user.userId, twutId]);
    if (existing) {
      await db.run('DELETE FROM likes WHERE user_id = ? AND twut_id = ?', [req.user.userId, twutId]);
    } else {
      await db.run('INSERT INTO likes (user_id, twut_id) VALUES (?, ?)', [req.user.userId, twutId]);
    }
    const likeCount = (await db.get('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?', [twutId])).c;
    res.json({ liked: !existing, like_count: Number(likeCount) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/retwut', authMiddleware, async (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const existing = await db.get('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?', [req.user.userId, twutId]);
    if (existing) {
      await db.run('DELETE FROM retwuts WHERE user_id = ? AND twut_id = ?', [req.user.userId, twutId]);
    } else {
      await db.run('INSERT INTO retwuts (user_id, twut_id) VALUES (?, ?)', [req.user.userId, twutId]);
    }
    const retwutCount = (await db.get('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?', [twutId])).c;
    res.json({ retwuted: !existing, retwut_count: Number(retwutCount) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/replies', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentUserId = null;
    if (auth?.startsWith('Bearer ')) { try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {} }
    const twutId = parseInt(req.params.id);
    const replies = await db.query('SELECT * FROM twuts WHERE parent_id = ? ORDER BY created_at ASC', [twutId]);
    res.json(await Promise.all(replies.map(t => formatTwut(t, currentUserId))));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const twutId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = await db.run('INSERT INTO twuts (user_id, content, parent_id) VALUES (?, ?, ?)', [req.user.userId, content.trim(), twutId]);
    const twut = await db.get('SELECT * FROM twuts WHERE id = ?', [result.lastInsertRowid]);
    res.json(await formatTwut(twut, req.user.userId));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
