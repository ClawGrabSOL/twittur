import React, { useState } from 'react';
import { login, register } from '../api';

export default function AuthForm({ onAuth, onGuest }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = tab === 'login'
        ? await login(username, password)
        : await register(username, password);
      if (data.error) {
        setError(data.error);
      } else {
        localStorage.setItem('twittur_token', data.token);
        onAuth({ username: data.username, userId: data.userId, token: data.token });
      }
    } catch {
      setError('Sumthing went rong. Try again!');
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.jpg" alt="Twittur" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <h1>Twittur</h1>
          <p>Where peeple say stuff</p>
        </div>
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Log Inn
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Sine Up
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usernayem"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Passwerd"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />
          {error && <div className="auth-error">⚠️ {error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Loeding...' : tab === 'login' ? 'Log Inn 🐦' : 'Creat Acownt'}
          </button>
        </form>
        {onGuest && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={onGuest}
              style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Just browse (no acownt)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
