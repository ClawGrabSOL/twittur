import React, { useState } from 'react';
import { likeTwut, repostTwut, bookmarkTwut, deleteTwut, getReplies, postReply } from '../api';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

function Avatar({ pfp, name }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div className="post-avatar">
      {pfp ? <img src={pfp} alt="" /> : initial}
    </div>
  );
}

function renderContent(text) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((p, i) =>
    p.startsWith('@')
      ? <span key={i} className="mention">{p}</span>
      : p
  );
}

export default function PostCard({ post, currentUser, onNavigateProfile, onDeleted }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [reposted, setReposted] = useState(post.retwuted);
  const [repostCount, setRepostCount] = useState(post.retwut_count);
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);

  const isOwn = currentUser && (currentUser.username === post.username || currentUser.userId == post.user_id);

  async function handleLike(e) {
    e.stopPropagation();
    if (!currentUser) return;
    const res = await likeTwut(post.id);
    setLiked(res.liked);
    setLikeCount(res.like_count);
  }

  async function handleRepost(e) {
    e.stopPropagation();
    if (!currentUser) return;
    const res = await repostTwut(post.id);
    setReposted(res.retwuted);
    setRepostCount(res.retwut_count);
  }

  async function handleBookmark(e) {
    e.stopPropagation();
    if (!currentUser) return;
    const res = await bookmarkTwut(post.id);
    setBookmarked(res.bookmarked);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Delete this post?')) return;
    await deleteTwut(post.id);
    if (onDeleted) onDeleted(post.id);
  }

  async function toggleReplies(e) {
    e.stopPropagation();
    if (!showReplies) {
      setLoadingReplies(true);
      const r = await getReplies(post.id);
      setReplies(r);
      setLoadingReplies(false);
    }
    setShowReplies(!showReplies);
  }

  async function submitReply(e) {
    e.stopPropagation();
    if (!replyText.trim() || !currentUser) return;
    const r = await postReply(post.id, replyText.trim());
    if (!r.error) {
      setReplies(prev => [...prev, r]);
      setReplyText('');
    }
  }

  return (
    <div>
      <div className="post-card" onClick={toggleReplies}>
        <Avatar pfp={post.pfp_url} name={post.display_name || post.username} />
        <div className="post-body">
          <div className="post-header">
            <span className="post-name" onClick={e => { e.stopPropagation(); onNavigateProfile && onNavigateProfile(post.username); }}>
              {post.display_name || post.username}
            </span>
            <span className="post-handle">@{post.username}</span>
            <span className="post-time">{timeAgo(post.created_at)}</span>
          </div>
          <div className="post-content">{renderContent(post.content)}</div>
          <div className="post-actions">
            {/* Reply */}
            <button className="action" onClick={toggleReplies}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {post.reply_count > 0 && <span>{post.reply_count}</span>}
            </button>
            {/* Repost */}
            <button className={`action${reposted ? ' reposted' : ''}`} onClick={handleRepost}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              {repostCount > 0 && <span>{repostCount}</span>}
            </button>
            {/* Like */}
            <button className={`action${liked ? ' liked' : ''}`} onClick={handleLike}>
              <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {/* Bookmark */}
            <button className={`action${bookmarked ? ' bookmarked' : ''}`} onClick={handleBookmark}>
              <svg viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            </button>
            {/* Delete */}
            {isOwn && (
              <button className="action delete-btn" onClick={handleDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplies && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          {loadingReplies && <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 14 }}>Loading...</div>}
          {replies.map(r => (
            <div key={r.id} style={{ display: 'flex', gap: 12, padding: '10px 16px 10px 56px', borderTop: '1px solid var(--border)' }}>
              <Avatar pfp={r.pfp_url} name={r.display_name || r.username} />
              <div style={{ flex: 1 }}>
                <div className="post-header" style={{ marginBottom: 2 }}>
                  <span className="post-name">{r.display_name || r.username}</span>
                  <span className="post-handle">@{r.username}</span>
                  <span className="post-time">{timeAgo(r.created_at)}</span>
                </div>
                <div className="post-content" style={{ fontSize: 14 }}>{renderContent(r.content)}</div>
              </div>
            </div>
          ))}
          {currentUser && (
            <div className="reply-area" onClick={e => e.stopPropagation()}>
              <Avatar pfp={null} name={currentUser.username} />
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Post your reply"
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitReply(e); }}
              />
              <button className="btn-post" onClick={submitReply} disabled={!replyText.trim()} style={{ alignSelf: 'flex-end' }}>
                Reply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
