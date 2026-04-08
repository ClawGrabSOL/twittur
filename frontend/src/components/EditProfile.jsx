import React, { useState, useEffect, useRef } from 'react';
import { getMyProfile, updateProfile, uploadPfp } from '../api';

export default function EditProfile({ currentUser, onBack, onSaved }) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [pfpUrl, setPfpUrl] = useState('');
  const [pfpPreview, setPfpPreview] = useState('');
  const [pfpFile, setPfpFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    getMyProfile().then(data => {
      if (!data.error) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setPfpUrl(data.pfp_url || '');
        setPfpPreview(data.pfp_url || '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Resize to max 200x200 before uploading
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setPfpPreview(compressed);
        // Convert data URL back to File for upload
        fetch(compressed).then(r => r.blob()).then(blob => {
          setPfpFile(new File([blob], 'pfp.jpg', { type: 'image/jpeg' }));
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    let finalPfpUrl = pfpUrl;

    // Upload file if one was selected
    if (pfpFile) {
      const uploadResult = await uploadPfp(pfpFile);
      if (uploadResult.error) {
        setError('Cud not upload image: ' + uploadResult.error);
        setSaving(false);
        return;
      }
      finalPfpUrl = uploadResult.url;
    }

    const data = await updateProfile({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      pfp_url: finalPfpUrl || null,
    });

    if (data.error) {
      setError(data.error);
    } else {
      setSuccess(true);
      setPfpUrl(finalPfpUrl);
      setPfpFile(null);
      onSaved && onSaved(data);
      setTimeout(() => setSuccess(false), 2000);
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="layout-wrap">
      <div className="sidebar" />
      <div className="main-col"><div className="feed-loading">Loeding profil...</div></div>
    </div>
  );

  const avatarSrc = pfpPreview || pfpUrl;

  return (
    <div className="layout-wrap">
      <div className="sidebar">
        <div className="sidebar-profile">
          <div className="sidebar-avatar" style={{ cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
            {avatarSrc
              ? <img src={avatarSrc} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
              : currentUser.username[0].toUpperCase()
            }
          </div>
          <div className="sidebar-name">{displayName || currentUser.username}</div>
          <div className="sidebar-username">@{currentUser.username}</div>
          {bio && <div className="sidebar-bio">{bio}</div>}
        </div>
      </div>

      <div className="main-col">
        <button className="back-btn" onClick={onBack}>← Back</button>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Edit Profil</h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* PFP upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 8 }}>
                Profil Picktur
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  onClick={() => fileRef.current.click()}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: avatarSrc ? 'transparent' : 'var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', cursor: 'pointer', border: '3px dashed var(--border)',
                    flexShrink: 0, fontSize: 26, color: 'white', fontWeight: 700
                  }}
                >
                  {avatarSrc
                    ? <img src={avatarSrc} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                    : currentUser.username[0].toUpperCase()
                  }
                </div>
                <div>
                  <button type="button" className="btn btn-primary" onClick={() => fileRef.current.click()} style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>
                    📁 Uplode Foto
                  </button>
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>or paste URL below</div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <input
                type="text"
                placeholder="https://example.com/photo.jpg"
                value={pfpFile ? '' : pfpUrl}
                onChange={e => { setPfpUrl(e.target.value); setPfpPreview(e.target.value); setPfpFile(null); }}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', marginTop: 8 }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {pfpFile && <div style={{ fontSize: 12, color: '#17bf63', marginTop: 4 }}>✅ {pfpFile.name} reddy to uplode</div>}
            </div>

            {/* Display name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>
                Displayd Nayme <span style={{ fontWeight: 400 }}>(max 50)</span>
              </label>
              <input
                type="text"
                placeholder="Yur nayme here"
                value={displayName}
                maxLength={50}
                onChange={e => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>
                Bio <span style={{ fontWeight: 400 }}>(max 160)</span>
              </label>
              <textarea
                placeholder="Tell peeple about urself..."
                value={bio}
                maxLength={160}
                onChange={e => setBio(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 12, color: 'var(--gray)', textAlign: 'right', marginTop: 2 }}>{160 - bio.length} left</div>
            </div>

            {error && <div className="auth-error">⚠️ {error}</div>}
            {success && <div style={{ background: '#e6f9f0', border: '1px solid #b2e8d0', borderRadius: 8, padding: '10px 14px', color: '#1a7a4a', fontSize: 14 }}>✅ Profil savd!</div>}

            <button className="btn btn-primary" type="submit" disabled={saving} style={{ padding: '12px', fontSize: 15, borderRadius: 8 }}>
              {saving ? 'Savving...' : 'Sav Profil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
