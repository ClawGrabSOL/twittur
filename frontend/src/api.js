const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('twittur_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(username, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getFeed() {
  const res = await fetch(`${BASE}/twuts`, {
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function postTwut(content) {
  const res = await fetch(`${BASE}/twuts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function likeTwut(id) {
  const res = await fetch(`${BASE}/twuts/${id}/like`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function getReplies(id) {
  const res = await fetch(`${BASE}/twuts/${id}/replies`, {
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function postReply(id, content) {
  const res = await fetch(`${BASE}/twuts/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function getUserProfile(username) {
  const res = await fetch(`${BASE}/users/${username}`, {
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function getMyProfile() {
  const res = await fetch(`${BASE}/profile/me`, {
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function uploadPfp(file) {
  const formData = new FormData();
  formData.append('pfp', file);
  const res = await fetch('/api/upload/pfp', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  return res.json();
}

export async function updateProfile(data) {
  const res = await fetch(`${BASE}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function retwutTwut(id) {
  const res = await fetch(`${BASE}/twuts/${id}/retwut`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function toggleFollow(username) {
  const res = await fetch(`${BASE}/follows/${username}`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function getFollowStatus(username) {
  const res = await fetch(`${BASE}/follows/${username}/status`, {
    headers: { ...authHeaders() },
  });
  return res.json();
}
