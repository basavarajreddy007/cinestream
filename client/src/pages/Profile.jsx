import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateProfile, logoutUser } from '../store/authSlice';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

const TABS = ['Overview', 'Watchlist', 'History', 'Liked'];

export default function Profile() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';

  const [name, setName]         = useState(user?.name || '');
  const [saving, setSaving]     = useState(false);
  const [watchlist, setWatchlist] = useState(null);
  const [history, setHistory]   = useState(null);
  const fileRef = useRef(null);

  // ─── Load tab data ───
  const loadTab = async (tab) => {
    setSearchParams({ tab });
    if (tab === 'Watchlist' && !watchlist) {
      const r = await api.get('/users/watchlist');
      setWatchlist(r.data.watchlist || []);
    }
    if (tab === 'History' && !history) {
      const r = await api.get('/users/history');
      setHistory(r.data.watchHistory || []);
    }
  };

  // ─── Save profile ───
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      const r = await api.put('/users/profile', fd);
      dispatch(updateProfile(r.data.user));
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  // ─── Upload avatar ───
  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    fd.append('name', name);
    try {
      const r = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(updateProfile(r.data.user));
      toast.success('Avatar updated');
    } catch { toast.error('Avatar upload failed'); }
  };

  // ─── Logout ───
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="profile-page page-enter">
      <Navbar />
      <div className="profile-inner container">

        {/* Header */}
        <div className="profile-header glass-card">
          <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
            {user.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <span>{(user.name || user.email)?.[0]?.toUpperCase()}</span>
            }
            <div className="avatar-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
          </div>
          <div className="profile-info">
            <h1>{user.name || 'User'}</h1>
            <p>{user.email}</p>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>
          <button className="btn btn-outline logout-btn-profile" onClick={handleLogout}>Sign Out</button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => loadTab(t)}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="profile-content">
          {activeTab === 'Overview' && (
            <div className="profile-overview">
              <div className="glass-card overview-card">
                <h3>Edit Profile</h3>
                <form onSubmit={handleSave} className="edit-form">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input value={user.email} disabled className="disabled" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>

              <div className="glass-card overview-card">
                <h3>Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-num">{user.watchHistory?.length || 0}</span>
                    <span className="stat-label">Watched</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-num">{user.watchlist?.length || 0}</span>
                    <span className="stat-label">Watchlist</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-num">{user.likedVideos?.length || 0}</span>
                    <span className="stat-label">Liked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Watchlist' && (
            <div>
              {!watchlist ? (
                <div className="center-spinner"><div className="spinner" /></div>
              ) : watchlist.length === 0 ? (
                <div className="empty-tab">
                  <p>Your watchlist is empty.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/browse')}>Browse Content</button>
                </div>
              ) : (
                <div className="profile-grid">
                  {watchlist.map(v => <MovieCard key={v._id} video={v} size="md" />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'History' && (
            <div>
              {!history ? (
                <div className="center-spinner"><div className="spinner" /></div>
              ) : history.length === 0 ? (
                <div className="empty-tab"><p>No watch history yet.</p></div>
              ) : (
                <div className="profile-grid">
                  {history.map((h, i) => h.video && <MovieCard key={i} video={h.video} size="md" />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Liked' && (
            <div className="empty-tab"><p>Liked videos will appear here.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
