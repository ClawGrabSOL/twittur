import React from 'react';

export default function Navbar({ user, onLogout, onNavigate, onLogin }) {
  return (
    <nav className="navbar">
      <a className="navbar-logo" href="#" onClick={e => { e.preventDefault(); onNavigate('feed'); }}>
        <img src="/logo.jpg" alt="Twittur bird" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span className="name">Twittur</span>
      </a>
      <div className="navbar-right">
        {user ? (
          <>
            <a
              className="navbar-user"
              href="#"
              onClick={e => { e.preventDefault(); onNavigate('profile', user.username); }}
            >
              @{user.username}
            </a>
            <button className="btn btn-outline" onClick={onLogout}>Log owt</button>
          </>
        ) : (
          <button className="btn btn-white" onClick={onLogin}>Log Inn / Sine Up</button>
        )}
      </div>
    </nav>
  );
}
