import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Notifications from './components/Notifications';
import Bookmarks from './components/Bookmarks';
import UserProfile from './components/UserProfile';
import EditProfile from './components/EditProfile';
import './style.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState('home');
  const [profileUsername, setProfileUsername] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('twittur_token');
    const username = localStorage.getItem('twittur_username');
    const userId = localStorage.getItem('twittur_userId');
    if (token && username) setUser({ token, username, userId });
    else setShowAuth(true);
  }, []);

  function handleAuth(userData) {
    localStorage.setItem('twittur_token', userData.token);
    localStorage.setItem('twittur_username', userData.username);
    localStorage.setItem('twittur_userId', userData.userId);
    setUser(userData);
    setShowAuth(false);
    setPage('home');
  }

  function handleLogout() {
    localStorage.clear();
    setUser(null);
    setShowAuth(true);
  }

  function navigate(p, param) {
    setPage(p);
    if (p === 'profile') setProfileUsername(param || user?.username);
  }

  if (showAuth && !user) return <AuthForm onAuth={handleAuth} />;

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        page={page}
        onNavigate={navigate}
        onLogout={handleLogout}
        onLogin={() => setShowAuth(true)}
      />
      <div className="main-col">
        {page === 'home' && <Feed currentUser={user} onNavigateProfile={u => navigate('profile', u)} />}
        {page === 'notifications' && <Notifications currentUser={user} />}
        {page === 'bookmarks' && <Bookmarks currentUser={user} onNavigateProfile={u => navigate('profile', u)} />}
        {page === 'profile' && (
          <UserProfile
            username={profileUsername || user?.username}
            currentUser={user}
            onBack={() => navigate('home')}
            onEditProfile={() => navigate('edit-profile')}
            onNavigateProfile={u => navigate('profile', u)}
          />
        )}
        {page === 'edit-profile' && (
          <EditProfile
            currentUser={user}
            onBack={() => navigate('profile', user?.username)}
            onSaved={(updated) => {
              if (updated?.username) {
                localStorage.setItem('twittur_username', updated.username);
                setUser(u => ({ ...u, username: updated.username }));
              }
              navigate('profile', updated?.username || user?.username);
            }}
          />
        )}
      </div>
    </div>
  );
}
