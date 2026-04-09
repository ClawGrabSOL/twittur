import React, { useEffect, useState } from 'react';
import { getMyProfile, updateProfile, uploadPfp } from '../api';

export default function EditProfile({ currentUser, onBack, onSaved }) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [pfpPreview, setPfpPreview] = useState(null);
  const [pfpFile, setPfpFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile().then(data => {
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setPfpPreview(data.pfp_url || null);
    });
  }, []);

  function handlePfpChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPfpFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPfpPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      let pfp_url = undefined;
      if (pfpFile) {
        const up = await uploadPfp(pfpFile);
        if (up.error) { setError(up.error); setSaving(false); return; }
        pfp_url = up.url;
      }
      const payload = { display_name: displayName, bio };
      if (pfp_url) payload.pfp_url = pfp_url;
      const res = await updateProfile(payload);
      if (res.error) { setError(res.error); setSaving(false); return; }
      onSaved({ username: currentUser.username });
    } catch(e) { setError('Something went wrong'); }
    setSaving(false);
  }

  const initial = currentUser?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px 8px', borderRadius: '50%', fontSize: 18 }}>←</button>
        <span style={{ flex: 1, fontSize: 20, fontWeight: 700 }}>Edit profile</span>
        <button className="btn-post" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="edit-profile-form">
        {error && <div style={{ color: 'var(--red)', fontSize: 13, padding: '8px', background: 'rgba(244,33,46,0.08)', borderRadius: 6 }}>{error}</div>}

        <div className="pfp-upload-row">
          <div className="pfp-preview">
            {pfpPreview ? <img src={pfpPreview} alt="" /> : initial}
          </div>
          <label className="btn-outline-white" style={{ cursor: 'pointer' }}>
            Change photo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePfpChange} />
          </label>
        </div>

        <div className="edit-field">
          <label>Display name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" maxLength={50} />
        </div>

        <div className="edit-field">
          <label>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" maxLength={160} rows={3} />
        </div>
      </div>
    </>
  );
}
