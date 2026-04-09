import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationsRead } from '../api';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = (new Date() - d) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

const ICONS = {
  like:   { icon: '❤️', label: 'liked your post' },
  reply:  { icon: '💬', label: 'replied to your post' },
  repost: { icon: '🔁', label: 'reposted your post' },
  follow: { icon: '👤', label: 'followed you' },
};

export default function Notifications({ currentUser }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getNotifications().then(data => {
      setNotifs(Array.isArray(data) ? data : []);
      setLoading(false);
      markNotificationsRead();
    });
  }, [currentUser]);

  if (!currentUser) return (
    <>
      <div className="feed-header">Notifications</div>
      <div className="feed-empty"><p>Log in to see notifications.</p></div>
    </>
  );

  return (
    <>
      <div className="feed-header">Notifications</div>
      {loading && <div className="feed-loading">Loading...</div>}
      {!loading && notifs.length === 0 && (
        <div className="feed-empty">
          <div className="big">Nothing yet</div>
          <p>When someone likes, replies, or reposts you'll see it here.</p>
        </div>
      )}
      {notifs.map(n => {
        const { icon, label } = ICONS[n.type] || { icon: '🔔', label: n.type };
        const name = n.actor_display_name || n.actor_username;
        const pfp = n.actor_pfp;
        const initial = name?.[0]?.toUpperCase() || '?';
        return (
          <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
            <div className="notif-icon">{icon}</div>
            <div className="notif-body">
              <div className="notif-avatar">{pfp ? <img src={pfp} alt="" /> : initial}</div>
              <div className="notif-text">
                <strong>{name}</strong> {label}
              </div>
              {n.twut_content && (
                <div className="notif-quote">"{n.twut_content.slice(0, 80)}{n.twut_content.length > 80 ? '...' : ''}"</div>
              )}
              <div className="notif-time">{timeAgo(n.created_at)}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
