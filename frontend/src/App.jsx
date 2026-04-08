import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import Feed from './components/Feed';
import UserProfile from './components/UserProfile';
import EditProfile from './components/EditProfile';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('feed');
  const [profileUsername, setProfileUsername] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('twittur_token');
    const username = localStorage.getItem('twittur_username');
    const userId = localStorage.getItem('twittur_userId');
    if (token && username) {
      setUser({ token, username, userId });
    } else {
      setShowAuth(true);
    }
  }, []);

  function handleAuth(userData) {
    localStorage.setItem('twittur_token', userData.token);
    localStorage.setItem('twittur_username', userData.username);
    localStorage.setItem('twittur_userId', userData.userId);
    setUser(userData);
    setShowAuth(false);
    setPage('feed');
  }

  function handleLogout() {
    localStorage.removeItem('twittur_token');
    localStorage.removeItem('twittur_username');
    localStorage.removeItem('twittur_userId');
    setUser(null);
    setShowAuth(true);
  }

  function navigate(target, param) {
    if (target === 'feed') {
      setPage('feed');
      setProfileUsername(null);
    } else if (target === 'profile') {
      setProfileUsername(param);
      setPage('profile');
    } else if (target === 'edit-profile') {
      setPage('edit-profile');
    }
  }

  if (showAuth && !user) {
    return <AuthForm onAuth={handleAuth} onGuest={() => setShowAuth(false)} />;
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} onNavigate={navigate} onLogin={() => setShowAuth(true)} />

      {page === 'feed' && (
        <>
          {!user && (
            <div style={{ background: 'var(--blue)', color: 'white', textAlign: 'center', padding: '10px', fontSize: 14, cursor: 'pointer' }}
              onClick={() => setShowAuth(true)}>
              👆 Log inn or sine up to twut and liek stuff!
            </div>
          )}
          <Feed currentUser={user} onNavigateProfile={u => navigate('profile', u)} onEditProfile={() => navigate('edit-profile')} />
        </>
      )}

      {page === 'profile' && profileUsername && (
        <UserProfile
          username={profileUsername}
          currentUser={user}
          onBack={() => navigate('feed')}
          onNavigateProfile={u => navigate('profile', u)}
          onEditProfile={() => navigate('edit-profile')}
        />
      )}

      {page === 'edit-profile' && user && (
        <EditProfile
          currentUser={user}
          onBack={() => navigate('profile', user.username)}
          onSaved={() => { navigate('profile', user.username); }}
        />
      )}
    </>
  );
}
