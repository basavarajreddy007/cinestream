import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Upcoming.css';

export default function Upcoming() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [interested, setInterested] = useState({});

  useEffect(() => {
    api.get('/upcoming')
      .then(r => setItems(r.data.upcoming || []))
      .finally(() => setLoading(false));
  }, []);

  const handleInterested = async (id) => {
    if (!user) return navigate('/login');
    try {
      const r = await api.post(`/upcoming/${id}/interested`);
      setInterested(prev => ({ ...prev, [id]: r.data.interested }));
      setItems(prev => prev.map(x => x._id === id ? { ...x, interestedCount: r.data.count } : x));
      toast.success(r.data.interested ? "Added to your list!" : "Removed from list");
    } catch { toast.error('Failed'); }
  };

  const getDaysLeft = (date) => {
    const diff = new Date(date) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Out Now';
    if (days === 1) return 'Tomorrow';
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Group by month
  const grouped = items.reduce((acc, item) => {
    const key = new Date(item.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="upcoming-page page-enter">
      <Navbar />

      {/* Hero */}
      <div className="upcoming-hero">
        <div className="upcoming-hero-bg" />
        <div className="upcoming-hero-content container">
          <div className="upcoming-hero-badge">🎬 Coming Soon</div>
          <h1>What's <span className="red-text">Next</span></h1>
          <p>Stay ahead — discover what's dropping on CineStream</p>
        </div>
      </div>

      <div className="upcoming-inner container">
        {loading ? (
          <div className="upcoming-skeleton">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="upcoming-empty">
            <div className="empty-icon">🎬</div>
            <h2>Nothing announced yet</h2>
            <p>Check back soon for upcoming releases</p>
            {user?.role === 'admin' && (
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>Add Upcoming Title</button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([month, monthItems]) => (
            <div key={month} className="upcoming-month">
              <div className="month-header">
                <span className="month-line" />
                <h2 className="month-title">{month}</h2>
                <span className="month-line" />
              </div>
              <div className="upcoming-grid">
                {monthItems.map(item => (
                  <UpcomingCard
                    key={item._id}
                    item={item}
                    isInterested={interested[item._id] ?? item.interestedUsers?.includes(user?._id)}
                    onInterested={() => handleInterested(item._id)}
                    getDaysLeft={getDaysLeft}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UpcomingCard({ item, isInterested, onInterested, getDaysLeft, formatDate }) {
  const [imgErr, setImgErr] = useState(false);
  const daysLeft = getDaysLeft(item.releaseDate);
  const isNew = daysLeft === 'Out Now';

  return (
    <div className="upcoming-card glass-card">
      <div className="upcoming-thumb">
        {!imgErr && item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} onError={() => setImgErr(true)} loading="lazy" />
          : <div className="thumb-fallback">🎬</div>
        }
        <div className="upcoming-overlay">
          {item.trailerUrl && (
            <a href={item.trailerUrl} target="_blank" rel="noreferrer" className="trailer-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Watch Trailer
            </a>
          )}
        </div>
        <div className={`days-badge ${isNew ? 'out-now' : ''}`}>
          {isNew ? '🔴 Out Now' : `⏳ ${daysLeft}`}
        </div>
      </div>

      <div className="upcoming-info">
        <div className="upcoming-meta-top">
          {item.genre?.slice(0, 2).map(g => <span key={g} className="genre-tag">{g}</span>)}
          <span className="type-tag">{item.type}</span>
        </div>
        <h3 className="upcoming-title">{item.title}</h3>
        <p className="upcoming-date">📅 {formatDate(item.releaseDate)}</p>
        {item.description && (
          <p className="upcoming-desc">{item.description.substring(0, 120)}{item.description.length > 120 ? '…' : ''}</p>
        )}
        {item.director && <p className="upcoming-director">Dir. {item.director}</p>}
        <div className="upcoming-footer">
          <button className={`interested-btn ${isInterested ? 'active' : ''}`} onClick={onInterested}>
            {isInterested
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Interested</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Notify Me</>
            }
          </button>
          <span className="interested-count">{item.interestedCount || 0} interested</span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="upcoming-card glass-card">
      <div className="skeleton-thumb" style={{ height: 200 }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton-line" style={{ width: '40%', marginBottom: 10 }} />
        <div className="skeleton-line" style={{ width: '80%', marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
