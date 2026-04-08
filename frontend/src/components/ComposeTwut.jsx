import React, { useState } from 'react';
import { postTwut } from '../api';

export default function ComposeTwut({ currentUser, onNewTwut }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const remaining = 280 - content.length;
  const charClass = remaining < 0 ? 'over' : remaining < 30 ? 'warn' : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || remaining < 0) return;
    setLoading(true);
    setError('');
    const data = await postTwut(content);
    if (data.error) {
      setError(data.error);
    } else {
      setContent('');
      onNewTwut && onNewTwut(data);
    }
    setLoading(false);
  }

  if (!currentUser) return null;

  return (
    <div className="compose-box">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Whats haipening?? 🐦"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={300}
        />
        {error && <div className="error-banner">{error}</div>}
        <div className="compose-footer">
          <span className={`char-count ${charClass}`}>{remaining}</span>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !content.trim() || remaining < 0}
          >
            {loading ? 'Possting...' : 'Twut it 🐦'}
          </button>
        </div>
      </form>
    </div>
  );
}
