import React, { useEffect, useState } from 'react';
import { getBookmarks } from '../api';
import PostCard from './PostCard';

export default function Bookmarks({ currentUser, onNavigateProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getBookmarks().then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); });
  }, [currentUser]);

  if (!currentUser) return (
    <>
      <div className="feed-header">Bookmarks</div>
      <div className="feed-empty"><p>Log in to see bookmarks.</p></div>
    </>
  );

  return (
    <>
      <div className="feed-header">Bookmarks</div>
      {loading && <div className="feed-loading">Loading...</div>}
      {!loading && posts.length === 0 && (
        <div className="feed-empty">
          <div className="big">No bookmarks yet</div>
          <p>Save posts to read them later.</p>
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
