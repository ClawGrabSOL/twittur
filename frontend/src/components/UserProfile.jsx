import React, { useEffect, useState } from 'react';
import { getUserProfile, toggleFollow, getFollowStatus } from '../api';
import PostCard from './PostCard';

function timeAgo(dateStr) {
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function UserProfile({ username, currentUser, onBack, onEditProfile, onNavigateProfile }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    getUserProfile(username).then(data => {
      setProfile(data.user || null);
      setPosts(Array.isArray(data.twuts) ? data.twuts : []);
      setLoading(false);
    });
    if (currentUser && !isOwn) {
      getFollowStatus(username).then(d => setFollowing(d.following));
    }
  }, [username]);

  async function handleFollow() {
    const res = await toggleFollow(username);
    setFollowing(res.following);
  }

  if (loading) return <><div className="feed-header">{username}</div><div className="feed-loading">Loading...</div></>;
  if (!profile) return <><div className="feed-header">Profile</div><div className="feed-empty"><p>User not found.</p></div></>;

  const displayName = profile.display_name || profile.username;
  const initial = displayName[0].toUpperCase();

  return (
    <>
      <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px 8px', borderRadius: '50%', fontSize: 18 }}>←</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{displayName}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>{posts.length} posts</div>
        </div>
      </div>

      <div className="profile-banner" />

      <div className="profile-info-section">
        <div className="profile-avatar-row">
          <div className="profile-avatar-big">
            {profile.pfp_url ? <img src={profile.pfp_url} alt="" /> : initial}
          </div>
          <div style={{ marginTop: 8 }}>
            {isOwn ? (
              <button className="btn-outline-white" onClick={onEditProfile}>Edit profile</button>
            ) : currentUser ? (
              <button
                className="btn-outline-white"
                onClick={handleFollow}
                style={following ? {} : { background: 'var(--white)', color: 'var(--bg)' }}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
        </div>
        <div className="profile-name">{displayName}</div>
        <div className="profile-handle">@{profile.username}</div>
        {profile.bio && <div className="profile-bio">{profile.bio}</div>}
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 10 }}>
          📅 Joined {timeAgo(profile.created_at)}
        </div>
        <div className="profile-stats">
          <span className="stat-item"><strong>{profile.following_count || 0}</strong> Following</span>
          <span className="stat-item"><strong>{profile.followers_count || 0}</strong> Followers</span>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="feed-empty">
          <div className="big">No posts yet</div>
          {isOwn && <p>When you post, it'll show up here.</p>}
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
