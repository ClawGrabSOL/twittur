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

router.get('/', authMiddleware, (req, res) => {
  try {
    const rows = prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.userId);
    const notifs = rows.map(n => {
      const actor = plain(prepare('SELECT username, display_name, pfp_url FROM users WHERE id = ?').get(n.actor_id));
      const twut = n.twut_id ? plain(prepare('SELECT content FROM twuts WHERE id = ?').get(n.twut_id)) : null;
      return {
        id: n.id, type: n.type, read: n.read, created_at: n.created_at,
        actor_username: actor?.username || 'unknown',
        actor_display_name: actor?.display_name || null,
        actor_pfp: actor?.pfp_url || null,
        twut_content: twut?.content || null,
        twut_id: n.twut_id,
      };
    });
    res.json(notifs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const count = plain(prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0').get(req.user.userId)).c;
    res.json({ count });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/read-all', authMiddleware, (req, res) => {
  try {
    prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.userId);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
