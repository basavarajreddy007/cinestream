import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const TABS = ['Analytics', 'Upload Video', 'Manage Videos', 'Users', 'Scripts'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Analytics');
  const [analytics, setAnalytics] = useState(null);
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', genre: '', type: 'movie',
    duration: '', director: '', releaseYear: '', language: 'English',
    cast: '', isFeatured: false, isTrending: false, tags: '',
  });
  const videoFileRef = useRef(null);
  const thumbFileRef = useRef(null);

  useEffect(() => {
    if (tab === 'Analytics' && !analytics) {
      api.get('/admin/analytics').then(r => setAnalytics(r.data.analytics)).catch(() => {});
    }
    if (tab === 'Manage Videos' && videos.length === 0) {
      api.get('/videos', { params: { limit: 50 } }).then(r => setVideos(r.data.videos || [])).catch(() => {});
    }
    if (tab === 'Users' && users.length === 0) {
      api.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {});
    }
    if (tab === 'Scripts' && scripts.length === 0) {
      api.get('/admin/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    }
  }, [tab]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const videoFile = videoFileRef.current?.files[0];
    const thumbFile = thumbFileRef.current?.files[0];
    if (!videoFile || !thumbFile) return toast.error('Select both video and thumbnail');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('genre', JSON.stringify(form.genre.split(',').map(s => s.trim()).filter(Boolean)));
    fd.append('cast', JSON.stringify(form.cast.split(',').map(s => s.trim()).filter(Boolean)));
    fd.append('tags', JSON.stringify(form.tags.split(',').map(s => s.trim()).filter(Boolean)));
    fd.append('video', videoFile);
    fd.append('thumbnail', thumbFile);

    setUploading(true);
    try {
      await api.post('/videos/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Video uploaded successfully!');
      setForm({ title: '', description: '', genre: '', type: 'movie', duration: '', director: '', releaseYear: '', language: 'English', cast: '', isFeatured: false, isTrending: false, tags: '' });
      videoFileRef.current.value = '';
      thumbFileRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.delete(`/videos/${id}`);
      setVideos(v => v.filter(x => x._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(u => u.map(x => x._id === userId ? { ...x, role } : x));
      toast.success('Role updated');
    } catch { toast.error('Failed'); }
  };

  const StatCard = ({ label, value, color }) => (
    <div className="stat-card glass-card">
      <span className="stat-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );

  return (
    <div className="admin-page page-enter">
      <Navbar />
      <div className="admin-inner container">
        <div className="admin-header">
          <h1>⚙️ Admin <span className="red-text">Dashboard</span></h1>
        </div>

        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* ANALYTICS */}
        {tab === 'Analytics' && (
          <div className="analytics-section">
            {!analytics ? (
              <div className="center-spinner"><div className="spinner" /></div>
            ) : (
              <>
                <div className="stats-row">
                  <StatCard label="Total Users" value={analytics.totalUsers} color="var(--accent)" />
                  <StatCard label="Total Videos" value={analytics.totalVideos} color="var(--primary)" />
                  <StatCard label="Total Views" value={analytics.totalViews} color="#ffd700" />
                  <StatCard label="Script Submissions" value={analytics.scriptSubmissions} color="#a78bfa" />
                </div>

                <div className="analytics-grid">
                  <div className="glass-card analytics-card">
                    <h3>Recent Users</h3>
                    <div className="user-list">
                      {analytics.recentUsers?.map(u => (
                        <div key={u._id} className="user-row">
                          <div className="user-avatar-sm">{u.name?.[0] || u.email?.[0]}</div>
                          <div>
                            <p className="user-name">{u.name || 'No name'}</p>
                            <p className="user-email">{u.email}</p>
                          </div>
                          <span className={`role-pill ${u.role}`}>{u.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card analytics-card">
                    <h3>Top Videos</h3>
                    <div className="video-list">
                      {analytics.topVideos?.map(v => (
                        <div key={v._id} className="video-row">
                          <img src={v.thumbnail} alt={v.title} className="video-thumb-sm" onError={e => e.target.style.display='none'} />
                          <div>
                            <p className="video-title-sm">{v.title}</p>
                            <p className="video-stats-sm">{v.views?.toLocaleString()} views · ★ {v.rating?.toFixed(1)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* UPLOAD */}
        {tab === 'Upload Video' && (
          <div className="upload-section glass-card">
            <h3>Upload New Video</h3>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Video title" />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="movie">Movie</option>
                    <option value="show">Show</option>
                    <option value="episode">Episode</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Video description" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Genre (comma separated)</label>
                  <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} placeholder="Action, Drama, Thriller" />
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Director</label>
                  <input value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} placeholder="Director name" />
                </div>
                <div className="form-group">
                  <label>Release Year</label>
                  <input type="number" value={form.releaseYear} onChange={e => setForm(f => ({ ...f, releaseYear: e.target.value }))} placeholder="2024" />
                </div>
                <div className="form-group">
                  <label>Duration (seconds)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="7200" />
                </div>
              </div>

              <div className="form-group">
                <label>Cast (comma separated)</label>
                <input value={form.cast} onChange={e => setForm(f => ({ ...f, cast: e.target.value }))} placeholder="Actor 1, Actor 2" />
              </div>

              <div className="form-row checkboxes">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                  Featured
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isTrending} onChange={e => setForm(f => ({ ...f, isTrending: e.target.checked }))} />
                  Trending
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Video File *</label>
                  <input type="file" ref={videoFileRef} accept="video/*" className="file-input" />
                </div>
                <div className="form-group">
                  <label>Thumbnail *</label>
                  <input type="file" ref={thumbFileRef} accept="image/*" className="file-input" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary upload-btn" disabled={uploading}>
                {uploading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Uploading…</> : '⬆️ Upload Video'}
              </button>
            </form>
          </div>
        )}

        {/* MANAGE VIDEOS */}
        {tab === 'Manage Videos' && (
          <div className="manage-section">
            <div className="manage-grid">
              {videos.map(v => (
                <div key={v._id} className="manage-card glass-card">
                  <img src={v.thumbnail} alt={v.title} className="manage-thumb" onError={e => e.target.style.display='none'} />
                  <div className="manage-info">
                    <p className="manage-title">{v.title}</p>
                    <p className="manage-meta">{v.views?.toLocaleString()} views · {v.type}</p>
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(v._id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'Users' && (
          <div className="users-section glass-card">
            <table className="users-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="table-user">
                        <div className="user-avatar-sm">{u.name?.[0] || u.email?.[0]}</div>
                        {u.name || '—'}
                      </div>
                    </td>
                    <td className="muted">{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)} className="role-select">
                        <option value="user">user</option>
                        <option value="creator">creator</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SCRIPTS */}
        {tab === 'Scripts' && (
          <div className="scripts-section">
            {scripts.map(s => (
              <div key={s._id} className="script-card glass-card">
                <div className="script-card-header">
                  <span className={`script-type ${s.type}`}>{s.type}</span>
                  <span className="script-date">{new Date(s.createdAt).toLocaleDateString()}</span>
                  <span className="script-user">{s.user?.name || s.user?.email || 'Anonymous'}</span>
                </div>
                <p className="script-preview">{s.scriptText?.substring(0, 200)}…</p>
                {s.analysis?.overallScore && (
                  <span className="script-score">Score: {s.analysis.overallScore}/10</span>
                )}
              </div>
            ))}
            {scripts.length === 0 && <div className="empty-tab"><p>No script submissions yet.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
