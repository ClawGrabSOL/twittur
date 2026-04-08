import React, { useState } from 'react';
import { likeTwut, getReplies, postReply, retwutTwut } from '../api';

function formatTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minit${mins !== 1 ? 's' : ''} ago`;
  if (hrs < 24) return `${hrs} our${hrs !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function renderContent(content, onMentionClick) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      const username = part.slice(1);
      return <span key={i} className="mention" onClick={() => onMentionClick && onMentionClick(username)}>{part}</span>;
    }
    return part;
  });
}

function Avatar({ pfpUrl, username, size = 44, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%', background: pfpUrl ? 'transparent' : 'var(--blue)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, color: 'white', fontWeight: 700, flexShrink: 0,
      overflow: 'hidden', cursor: onClick ? 'pointer' : 'default'
    }}>
      {pfpUrl
        ? <img src={pfpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
        : (username ? username[0].toUpperCase() : '?')
      }
    </div>
  );
}

export default function TwutCard({ twut, currentUser, onMentionClick }) {
  const [liked, setLiked] = useState(twut.liked);
  const [likeCount, setLikeCount] = useState(twut.like_count);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [retwuted, setRetwuted] = useState(twut.retwuted);
  const [retwutCount, setRetwutCount] = useState(twut.retwut_count);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(twut.reply_count);

  async function handleLike() {
    if (!currentUser) return;
    setLikeAnimating(true);
    const data = await likeTwut(twut.id);
    setLiked(data.liked);
    setLikeCount(data.like_count);
    setTimeout(() => setLikeAnimating(false), 350);
  }

  async function handleRetwut() {
    if (!currentUser) return;
    const data = await retwutTwut(twut.id);
    setRetwuted(data.retwuted);
    setRetwutCount(data.retwut_count);
  }

  async function handleToggleReplies() {
    if (!showReplies) {
      setLoadingReplies(true);
      const data = await getReplies(twut.id);
      setReplies(Array.isArray(data) ? data : []);
      setLoadingReplies(false);
    }
    setShowReplies(!showReplies);
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    const data = await postReply(twut.id, replyText);
    if (!data.error) {
      setReplies(prev => [...prev, data]);
      setReplyText('');
      setReplyCount(c => c + 1);
    }
  }

  const displayName = twut.display_name || twut.username;

  return (
    <div className="twut-card">
      {/* Retwut label */}
      {twut.retwuted && currentUser && twut.username !== currentUser.username && (
        <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 6, marginLeft: 54 }}>🔁 You retwutted</div>
      )}

      <div className="twut-header">
        <Avatar pfpUrl={twut.pfp_url} username={twut.username} onClick={() => onMentionClick && onMentionClick(twut.username)} />
        <div className="twut-meta">
          <strong onClick={() => onMentionClick && onMentionClick(twut.username)}>{displayName}</strong>
          {twut.display_name && <span style={{ color: 'var(--gray)', fontWeight: 400 }}> @{twut.username}</span>}
          <span> · {formatTime(twut.created_at)}</span>
        </div>
      </div>

      {/* If retwut, show original */}
      {twut.retwut_of ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', margin: '8px 0', background: 'var(--gray-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Avatar pfpUrl={twut.retwut_of.pfp_url} username={twut.retwut_of.username} size={28} onClick={() => onMentionClick && onMentionClick(twut.retwut_of.username)} />
            <strong style={{ fontSize: 13, cursor: 'pointer' }} onClick={() => onMentionClick && onMentionClick(twut.retwut_of.username)}>
              {twut.retwut_of.display_name || twut.retwut_of.username}
            </strong>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>@{twut.retwut_of.username} · {formatTime(twut.retwut_of.created_at)}</span>
          </div>
          <div className="twut-content" style={{ marginBottom: 0 }}>
            {renderContent(twut.retwut_of.content, onMentionClick)}
          </div>
        </div>
      ) : (
        <div className="twut-content">
          {renderContent(twut.content, onMentionClick)}
        </div>
      )}

      <div className="twut-actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} disabled={!currentUser} title={currentUser ? '' : 'Log inn to liek'}>
          <span className={`heart-icon ${likeAnimating ? 'pop' : ''}`}>{liked ? '❤️' : '🤍'}</span>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button className={`action-btn ${retwuted ? 'retwuted' : ''}`} onClick={handleRetwut} disabled={!currentUser} title={currentUser ? '' : 'Log inn to retwut'}>
          <span>🔁</span>
          {retwutCount > 0 && <span>{retwutCount}</span>}
          <span>{retwuted ? 'Retwuttd' : 'Retwut'}</span>
        </button>

        <button className="action-btn" onClick={handleToggleReplies}>
          <span>💬</span>
          {replyCount > 0 && <span>{replyCount}</span>}
          <span>{showReplies ? 'Hied' : 'Replie'}</span>
        </button>
      </div>

      {showReplies && (
        <div className="replies-section">
          {loadingReplies && <div style={{ color: 'var(--gray)', fontSize: 13 }}>Loeding repliez...</div>}
          {replies.map(reply => (
            <div className="reply-card" key={reply.id}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <Avatar pfpUrl={reply.pfp_url} username={reply.username} size={28} onClick={() => onMentionClick && onMentionClick(reply.username)} />
                <div className="twut-meta">
                  <strong onClick={() => onMentionClick && onMentionClick(reply.username)}>{reply.display_name || reply.username}</strong>
                  <span> · {formatTime(reply.created_at)}</span>
                </div>
              </div>
              <div className="twut-content" style={{ marginBottom: 0, paddingLeft: 36 }}>
                {renderContent(reply.content, onMentionClick)}
              </div>
            </div>
          ))}
          {replies.length === 0 && !loadingReplies && (
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>No repliez yet. Be the furst!</div>
          )}
          {currentUser && (
            <form className="reply-compose" onSubmit={handleReply}>
              <input type="text" placeholder="Rite a replie..." value={replyText} onChange={e => setReplyText(e.target.value)} maxLength={280} />
              <button className="btn btn-primary" type="submit">Replie</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
