import React, { useEffect, useState } from 'react';
import { getUnreadCount, getMyProfile } from '../api';

export default function Sidebar({ user, page, onNavigate, onLogout }) {
  const [unread, setUnread] = useState(0);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    getUnreadCount().then(d => setUnread(d.count || 0));
    getMyProfile().then(d => setProfile(d));
    const iv = setInterval(() => {
      getUnreadCount().then(d => setUnread(d.count || 0));
    }, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const displayName = profile?.display_name || user?.username || '';
  const handle = user?.username || '';
  const pfp = profile?.pfp_url;
  const initial = displayName?.[0]?.toUpperCase() || '?';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.jpg" alt="Z" onClick={() => onNavigate('home')} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', padding: 4 }} />
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item${page === 'home' ? ' active' : ''}`} onClick={() => onNavigate('home')}>
          <span className="nav-icon">
            {page === 'home'
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h4a1 1 0 001-1v-6h3v6a1 1 0 001 1h4c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"/></svg>
            }
          </span>
          <span className="nav-label">Home</span>
        </button>

        <button className={`nav-item${page === 'notifications' ? ' active' : ''}`} onClick={() => onNavigate('notifications')}>
          <span className="nav-icon" style={{ position: 'relative' }}>
            {page === 'notifications'
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M19.993 9.042C19.48 5.017 16.054 2 11.999 2c-4.055 0-7.48 3.017-7.992 7.042L2.868 16H7v1c0 2.21 1.79 4 4 4h2c2.21 0 4-1.79 4-1v-1h4.132l-1.139-6.958z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            }
            {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
          </span>
          <span className="nav-label">Notifications</span>
        </button>

        <button className={`nav-item${page === 'bookmarks' ? ' active' : ''}`} onClick={() => onNavigate('bookmarks')}>
          <span className="nav-icon">
            {page === 'bookmarks'
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            }
          </span>
          <span className="nav-label">Bookmarks</span>
        </button>

        <button className="nav-item" onClick={() => onNavigate('communities')} style={{ opacity: 0.5 }}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </span>
          <span className="nav-label">Communities</span>
        </button>

        <button className={`nav-item${page === 'profile' ? ' active' : ''}`} onClick={() => onNavigate('profile', handle)}>
          <span className="nav-icon">
            {page === 'profile'
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            }
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>

      {user && (
        <button className="post-btn" onClick={() => onNavigate('home')}>Post</button>
      )}

      {user ? (
        <div className="sidebar-user-card" onClick={onLogout} title="Log out">
          <div className="sidebar-user-avatar">
            {pfp ? <img src={pfp} alt="" /> : initial}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-handle">@{handle}</div>
          </div>
          <div className="sidebar-user-more">···</div>
        </div>
      ) : (
        <div style={{ padding: '12px', marginBottom: 16 }}>
          <div className="sidebar-user-avatar" style={{ margin: '0 auto 8px', width: 40, height: 40 }}>?</div>
        </div>
      )}
    </div>
  );
}
