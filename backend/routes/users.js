const express = require('express');
const jwt = require('jsonwebtoken');
const { prepare, plain } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'twittur-secret-lol';

router.get('/:username', (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentUserId = null;
    if (auth?.startsWith('Bearer ')) { try { currentUserId = jwt.verify(auth.slice(7), JWT_SECRET).userId; } catch {} }
    const user = plain(prepare('SELECT id, username, display_name, bio, pfp_url, created_at FROM users WHERE username = ?').get(req.params.username));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const twuts = prepare('SELECT * FROM twuts WHERE user_id = ? AND parent_id IS NULL ORDER BY created_at DESC').all(user.id);
    const formattedTwuts = twuts.map(t => {
      const row = plain(t);
      const likeCount = plain(prepare('SELECT COUNT(*) as c FROM likes WHERE twut_id = ?').get(row.id)).c;
      const replyCount = plain(prepare('SELECT COUNT(*) as c FROM twuts WHERE parent_id = ?').get(row.id)).c;
      const retwutCount = plain(prepare('SELECT COUNT(*) as c FROM retwuts WHERE twut_id = ?').get(row.id)).c;
      const liked = currentUserId ? !!plain(prepare('SELECT 1 FROM likes WHERE user_id = ? AND twut_id = ?').get(currentUserId, row.id)) : false;
      const retwuted = currentUserId ? !!plain(prepare('SELECT 1 FROM retwuts WHERE user_id = ? AND twut_id = ?').get(currentUserId, row.id)) : false;
      return { id: row.id, content: row.content, created_at: row.created_at, username: user.username, display_name: user.display_name, pfp_url: user.pfp_url, like_count: likeCount, reply_count: replyCount, retwut_count: retwutCount, liked, retwuted };
    });
    const twutCount = plain(prepare('SELECT COUNT(*) as c FROM twuts WHERE user_id = ? AND parent_id IS NULL').get(user.id)).c;
    const followerCount = plain(prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id)).c;
    const followingCount = plain(prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id)).c;
    const isFollowing = currentUserId ? !!plain(prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, user.id)) : false;
    res.json({ username: user.username, display_name: user.display_name, bio: user.bio, pfp_url: user.pfp_url, created_at: user.created_at, twut_count: twutCount, follower_count: followerCount, following_count: followingCount, is_following: isFollowing, twuts: formattedTwuts });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
