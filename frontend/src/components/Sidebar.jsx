import React, { useEffect, useState } from 'react';
import { getMyProfile } from '../api';

export default function Sidebar({ currentUser, onNavigateProfile, onEditProfile }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (currentUser) {
      getMyProfile().then(data => {
        if (!data.error) setProfile(data);
      }).catch(() => {});
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="sidebar">
        <div className="sidebar-profile" style={{ textAlign: 'center' }}>
          <img src="/logo.jpg" alt="Twittur" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: 'var(--gray)' }}>Log inn to post twuts!</div>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || currentUser.username;
  const bio = profile?.bio;
  const pfpUrl = profile?.pfp_url;

  return (
    <div className="sidebar">
      <div className="sidebar-profile">
        <div
          className="sidebar-avatar"
          onClick={() => onNavigateProfile && onNavigateProfile(currentUser.username)}
          style={{ cursor: 'pointer' }}
        >
          {pfpUrl ? (
            <img src={pfpUrl} alt="pfp"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            currentUser.username[0].toUpperCase()
          )}
        </div>

        <div
          className="sidebar-name"
          onClick={() => onNavigateProfile && onNavigateProfile(currentUser.username)}
          style={{ cursor: 'pointer' }}
        >
          {displayName}
        </div>
        <div className="sidebar-username">@{currentUser.username}</div>

        {bio && <div className="sidebar-bio">{bio}</div>}

        <button
          className="btn btn-primary"
          onClick={() => onEditProfile && onEditProfile()}
          style={{ width: '100%', marginTop: 12, fontSize: 13 }}
        >
          Edit Profil
        </button>
      </div>
    </div>
  );
}
