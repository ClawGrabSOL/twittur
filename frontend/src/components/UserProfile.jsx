import React, { useEffect, useState } from 'react';
import { getUserProfile, toggleFollow } from '../api';
import TwutCard from './TwutCard';
import Sidebar from './Sidebar';

export default function UserProfile({ username, currentUser, onBack, onNavigateProfile, onEditProfile }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    setError('');
    const data = await getUserProfile(username);
    if (data.error) setError(data.error);
    else {
      setProfile(data);
      setFollowing(data.is_following || false);
      setFollowerCount(data.follower_count || 0);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="layout-wrap">
      <Sidebar currentUser={currentUser} onNavigateProfile={onNavigateProfile} onEditProfile={onEditProfile} />
      <div className="main-col"><div className="feed-loading">Loeding profil...</div></div>
    </div>
  );

  if (error) return (
    <div className="layout-wrap">
      <Sidebar currentUser={currentUser} onNavigateProfile={onNavigateProfile} onEditProfile={onEditProfile} />
      <div className="main-col">
        <button className="back-btn" onClick={onBack}>← Back to feed</button>
        <div className="error-banner">Cud not find that user 😢</div>
      </div>
    </div>
  );

  const isOwn = currentUser && currentUser.username === profile.username;

  async function handleFollow() {
    if (!currentUser) return;
    const data = await toggleFollow(profile.username);
    setFollowing(data.following);
    setFollowerCount(data.follower_count);
  }

  return (
    <div className="layout-wrap">
      <Sidebar currentUser={currentUser} onNavigateProfile={onNavigateProfile} onEditProfile={onEditProfile} />

      <div className="main-col">
        <button className="back-btn" onClick={onBack}>← Back to feed</button>

        <div className="profile-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
            <div className="profile-avatar" style={{ overflow: 'hidden', background: profile.pfp_url ? 'transparent' : 'var(--blue)' }}>
              {profile.pfp_url ? (
                <img src={profile.pfp_url} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{profile.display_name || profile.username}</h2>
              <div style={{ color: 'var(--gray)', fontSize: 14 }}>@{profile.username}</div>
              <div style={{ color: 'var(--gray)', fontSize: 13, marginTop: 2 }}>
                <span><b style={{ color: 'var(--text)' }}>{followerCount}</b> folowerz · </span>
                <span><b style={{ color: 'var(--text)' }}>{profile.following_count}</b> folowing · </span>
                <span>{profile.twut_count} twuts</span>
              </div>
            </div>
            {isOwn ? (
              <button className="btn" onClick={onEditProfile}
                style={{ border: '2px solid var(--blue)', color: 'var(--blue)', background: 'none', flexShrink: 0 }}>
                Edit Profil
              </button>
            ) : currentUser && (
              <button className="btn" onClick={handleFollow}
                style={{ background: following ? 'white' : 'var(--blue)', color: following ? 'var(--blue)' : 'white', border: '2px solid var(--blue)', flexShrink: 0 }}>
                {following ? 'Unfollow' : 'Foloww'}
              </button>
            )}
          </div>
          {profile.bio && (
            <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{profile.bio}</p>
          )}
        </div>

        {profile.twuts.length === 0 ? (
          <div className="feed-empty">
            <img src="/logo.jpg" alt="" style={{ width: 60, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />
            <p>No twuts yet frum this persun</p>
          </div>
        ) : (
          profile.twuts.map(twut => (
            <TwutCard key={twut.id} twut={twut} currentUser={currentUser} onMentionClick={u => onNavigateProfile(u)} />
          ))
        )}
      </div>
    </div>
  );
}
