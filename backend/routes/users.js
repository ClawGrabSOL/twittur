const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'twittur-secret-lol';

router.get('/:username', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentUserId = null;
    if (auth?.startsWith('Bearer ')) { try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {} }

    const user = await db.get('SELECT id, username, display_name, bio, pfp_url, created_at FROM users WHERE username = ?', [req.params.username]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const twuts = await db.query('SELECT * FROM twuts WHERE user_id = ? AND parent_id IS NULL ORDER BY created_at DESC', [user.id]);
    const formattedTwuts = await Promise.all(twuts.map(async t => {
      const likeCount = (await db.get('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?', [t.id])).c;
      const replyCount = (await db.get('SELECT COUNT(*) as c FROM twuts WHERE parent_id = ?', [t.id])).c;
      const retwutCount = (await db.get('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?', [t.id])).c;
      const liked = currentUserId ? !!(await db.get('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?', [currentUserId, t.id])) : false;
      const retwuted = currentUserId ? !!(await db.get('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?', [currentUserId, t.id])) : false;
      return { id: t.id, content: t.content, created_at: t.created_at, username: user.username, display_name: user.display_name, pfp_url: user.pfp_url, like_count: Number(likeCount), reply_count: Number(replyCount), retwut_count: Number(retwutCount), liked, retwuted };
    }));

    const twutCount = Number((await db.get('SELECT COUNT(*) as c FROM twuts WHERE user_id = ? AND parent_id IS NULL', [user.id])).c);
    const followerCount = Number((await db.get('SELECT COUNT(*) as c FROM follows WHERE following_id = ?', [user.id])).c);
    const followingCount = Number((await db.get('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?', [user.id])).c);
    const isFollowing = currentUserId ? !!(await db.get('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?', [currentUserId, user.id])) : false;

    res.json({ username: user.username, display_name: user.display_name, bio: user.bio, pfp_url: user.pfp_url,
      created_at: user.created_at, twut_count: twutCount, follower_count: followerCount,
      following_count: followingCount, is_following: isFollowing, twuts: formattedTwuts });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
