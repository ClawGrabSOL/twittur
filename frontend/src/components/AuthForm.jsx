import React, { useState } from 'react';
import { login, register } from '../api';

export default function AuthForm({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fn = tab === 'login' ? login : register;
    const res = await fn(username, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onAuth(res);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.jpg" alt="Z" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', margin: '0 auto', display: 'block' }} />
          <p>See what's happening in your world.</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Log in</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Sign up</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="username" required />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} required />
          <button className="btn-post" type="submit" disabled={loading} style={{ padding: '12px', fontSize: 16 }}>
            {loading ? '...' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
