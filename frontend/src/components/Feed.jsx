import React, { useEffect, useState } from 'react';
import { getFeed } from '../api';
import TwutCard from './TwutCard';
import ComposeTwut from './ComposeTwut';
import Sidebar from './Sidebar';

export default function Feed({ currentUser, onNavigateProfile, onEditProfile }) {
  const [twuts, setTwuts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    const data = await getFeed();
    setTwuts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function handleNewTwut(twut) {
    setTwuts(prev => [twut, ...prev]);
  }

  return (
    <div className="layout-wrap">
      <Sidebar currentUser={currentUser} onNavigateProfile={onNavigateProfile} onEditProfile={onEditProfile} />

      <div className="main-col">
        <ComposeTwut currentUser={currentUser} onNewTwut={handleNewTwut} />

        {loading ? (
          <div className="feed-loading">Loeding twitts...</div>
        ) : twuts.length === 0 ? (
          <div className="feed-empty">
            <img src="/logo.jpg" alt="" style={{ width: 60, height: 60, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />
            <p>No twuts yet. Be the furst to twut sumthing!</p>
          </div>
        ) : (
          twuts.map(twut => (
            <TwutCard
              key={twut.id}
              twut={twut}
              currentUser={currentUser}
              onMentionClick={username => onNavigateProfile(username)}
            />
          ))
        )}
      </div>
    </div>
  );
}
