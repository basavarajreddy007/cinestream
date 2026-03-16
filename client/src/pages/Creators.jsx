import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import api from '../services/api';
import './Creators.css';

export default function Creators() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creatorDetail, setCreatorDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/users/creators')
      .then(r => setCreators(r.data.creators || []))
      .finally(() => setLoading(false));
  }, []);

  const openCreator = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    try {
      const r = await api.get(`/users/creators/${id}`);
      setCreatorDetail(r.data.creator);
    } catch {
      setCreatorDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setCreatorDetail(null);
  };

  return (
    <div className="creators-page page-enter">
      <Navbar />

      <div className="creators-hero">
        <div className="creators-hero-bg" />
        <div className="creators-hero-content container">
          <div className="creators-hero-badge">🎬 Community</div>
          <h1>Our <span className="red-text">Creators</span></h1>
          <p>Meet the talented filmmakers and content creators on CineStream</p>
        </div>
      </div>

      <div className="creators-inner container">
        {loading ? (
          <div className="creators-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="creator-skeleton glass-card">
                <div className="skel-avatar" />
                <div className="skel-line" style={{ width: '60%' }} />
                <div className="skel-line short" style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="creators-empty">
            <div className="empty-icon">🎥</div>
            <h2>No creators yet</h2>
            <p>Creators will appear here once admins assign the creator role</p>
          </div>
        ) : (
          <div className="creators-grid">
            {creators.map(c => (
              <div
                key={c._id}
                className={`creator-card glass-card ${selected === c._id ? 'active' : ''}`}
                onClick={() => openCreator(c._id)}
              >
                <div className="creator-avatar">
                  {c.avatar
                    ? <img src={c.avatar} alt={c.name} />
                    : <span>{(c.name || c.email)?.[0]?.toUpperCase()}</span>
                  }
                  <div className="creator-badge-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="creator-name">{c.name || 'Creator'}</h3>
                <p className="creator-email">{c.email}</p>
                <div className="creator-stats">
                  <div className="creator-stat">
                    <span className="stat-num">{c.videoCount || 0}</span>
                    <span className="stat-lbl">Videos</span>
                  </div>
                  <div className="creator-stat">
                    <span className="stat-num">{(c.totalViews || 0).toLocaleString()}</span>
                    <span className="stat-lbl">Views</span>
                  </div>
                  <div className="creator-stat">
                    <span className="stat-num">★ {c.avgRating || 0}</span>
                    <span className="stat-lbl">Rating</span>
                  </div>
                </div>
                <button className="view-profile-btn">View Profile →</button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="creator-detail-overlay" onClick={(e) => e.target === e.currentTarget && closeDetail()}>
            <div className="creator-detail glass-card">
              <button className="detail-close" onClick={closeDetail}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {detailLoading ? (
                <div className="center-spinner"><div className="spinner" /></div>
              ) : creatorDetail ? (
                <>
                  <div className="detail-header">
                    <div className="detail-avatar">
                      {creatorDetail.avatar
                        ? <img src={creatorDetail.avatar} alt={creatorDetail.name} />
                        : <span>{(creatorDetail.name || creatorDetail.email)?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="detail-info">
                      <h2>{creatorDetail.name || 'Creator'}</h2>
                      <p>{creatorDetail.email}</p>
                      <div className="detail-meta">
                        <span>📹 {creatorDetail.videoCount} videos</span>
                        <span>👁 {(creatorDetail.totalViews || 0).toLocaleString()} views</span>
                        <span>★ {creatorDetail.avgRating} avg rating</span>
                        <span>📅 Joined {new Date(creatorDetail.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-videos">
                    <h3>Videos by {creatorDetail.name || 'this creator'}</h3>
                    {creatorDetail.videos?.length > 0 ? (
                      <div className="detail-videos-grid">
                        {creatorDetail.videos.map(v => (
                          <MovieCard key={v._id} video={v} size="md" />
                        ))}
                      </div>
                    ) : (
                      <p className="no-videos">No videos uploaded yet</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="detail-error">
                  <p>Could not load creator details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
