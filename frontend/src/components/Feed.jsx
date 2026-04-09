import React, { useState, useEffect } from 'react';
import { getFeed, postTwut } from '../api';
import PostCard from './PostCard';

export default function Feed({ currentUser, onNavigateProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getFeed().then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  async function handlePost() {
    if (!content.trim() || !currentUser) return;
    setPosting(true);
    const res = await postTwut(content.trim());
    if (!res.error) { setPosts(prev => [res, ...prev]); setContent(''); }
    setPosting(false);
  }

  const pfp = null;
  const initial = currentUser?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div className="feed-header">Home</div>

      {currentUser && (
        <div className="compose-area">
          <div className="compose-avatar">{pfp ? <img src={pfp} alt="" /> : initial}</div>
          <div className="compose-right">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What is happening?!"
              rows={3}
              maxLength={300}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }}
            />
            <div className="compose-footer">
              <span className={`char-count${content.length > 260 ? ' warn' : ''}${content.length > 280 ? ' over' : ''}`}>
                {content.length}/280
              </span>
              <button className="btn-post" onClick={handlePost} disabled={!content.trim() || posting || content.length > 280}>
                {posting ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="feed-loading">Loading...</div>}

      {!loading && posts.length === 0 && (
        <div className="feed-empty">
          <div className="big">No posts yet</div>
          <p>Be the first to post something.</p>
        </div>
      )}

      {posts.map(p => (
        <PostCard
          key={p.id}
          post={p}
          currentUser={currentUser}
          onNavigateProfile={onNavigateProfile}
          onDeleted={id => setPosts(prev => prev.filter(x => x.id !== id))}
        />
      ))}
    </>
  );
}
