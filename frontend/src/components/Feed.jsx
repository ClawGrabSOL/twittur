import React, { useState, useEffect } from 'react';
import { getFeed, postTwut, uploadPfp } from '../api';
import PostCard from './PostCard';

export default function Feed({ currentUser, onNavigateProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getFeed().then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function handlePost() {
    if (!content.trim() && !imageFile) return;
    if (!currentUser) return;
    setPosting(true);
    let image_url = null;
    if (imageFile) {
      const up = await uploadPfp(imageFile); // reuse upload endpoint
      if (up.url) image_url = up.url;
    }
    const res = await postTwut(content.trim(), image_url);
    if (!res.error) {
      setPosts(prev => [res, ...prev]);
      setContent('');
      setImageFile(null);
      setImagePreview(null);
    }
    setPosting(false);
  }

  const initial = currentUser?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div className="feed-header">Home</div>

      {currentUser && (
        <div className="compose-area">
          <div className="compose-avatar">{initial}</div>
          <div className="compose-right">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What is happening?!"
              rows={3}
              maxLength={300}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }}
            />

            {imagePreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                <img src={imagePreview} alt="" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 12, border: '1px solid var(--border)', display: 'block' }} />
                <button onClick={removeImage} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}

            <div className="compose-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }} title="Add image">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                </label>
                <span className={`char-count${content.length > 260 ? ' warn' : ''}${content.length > 280 ? ' over' : ''}`}>
                  {content.length}/280
                </span>
              </div>
              <button className="btn-post" onClick={handlePost} disabled={(!content.trim() && !imageFile) || posting || content.length > 280}>
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
