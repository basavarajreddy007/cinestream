import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Upload.css';

const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Documentary', 'Mystery', 'Fantasy', 'Crime'];

export default function Upload() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const thumbRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', type: 'movie', language: 'English',
    director: '', releaseYear: new Date().getFullYear(), duration: '',
    cast: '', tags: '', isFeatured: false, isTrending: false,
  });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [videoPreview, setVideoPreview]     = useState(null);
  const [thumbPreview, setThumbPreview]     = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [progress, setProgress]             = useState(0);

  const toggleGenre = (g) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleThumbChange = (e) => {
    const file = e.target.files[0];
    if (file) setThumbPreview(URL.createObjectURL(file));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setVideoPreview(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const videoFile = videoRef.current?.files[0];
    const thumbFile = thumbRef.current?.files[0];
    if (!videoFile || !thumbFile) return toast.error('Select both video and thumbnail');
    if (!form.title.trim()) return toast.error('Title is required');
    if (selectedGenres.length === 0) return toast.error('Select at least one genre');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('type', form.type);
    fd.append('language', form.language);
    fd.append('director', form.director);
    fd.append('releaseYear', form.releaseYear);
    fd.append('duration', form.duration);
    fd.append('isFeatured', form.isFeatured);
    fd.append('isTrending', form.isTrending);
    fd.append('genre', JSON.stringify(selectedGenres));
    fd.append('cast', JSON.stringify(form.cast.split(',').map(s => s.trim()).filter(Boolean)));
    fd.append('tags', JSON.stringify(form.tags.split(',').map(s => s.trim()).filter(Boolean)));
    fd.append('video', videoFile);
    fd.append('thumbnail', thumbFile);

    setUploading(true);
    setProgress(0);
    try {
      await api.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      toast.success('Video uploaded successfully!');
      navigate('/browse');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="upload-page page-enter">
      <Navbar />
      <div className="upload-inner container">
        <div className="upload-header">
          <h1>⬆️ Upload <span className="red-text">Video</span></h1>
          <p>Share your content with the CineStream community</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form-wrap">
          <div className="upload-grid">

            {/* Left — media */}
            <div className="upload-media">
              <div className="media-card glass-card">
                <h3>Thumbnail</h3>
                <div className="thumb-drop" onClick={() => thumbRef.current?.click()}>
                  {thumbPreview
                    ? <img src={thumbPreview} alt="thumbnail preview" className="thumb-preview" />
                    : <div className="drop-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <p>Click to upload thumbnail</p>
                        <span>JPG, PNG, WEBP · 16:9 recommended</span>
                      </div>
                  }
                </div>
                <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbChange} style={{ display: 'none' }} />
                {thumbPreview && <button type="button" className="change-btn" onClick={() => thumbRef.current?.click()}>Change Thumbnail</button>}
              </div>

              <div className="media-card glass-card">
                <h3>Video File</h3>
                <div className="video-drop" onClick={() => videoRef.current?.click()}>
                  {videoPreview
                    ? <div className="video-selected">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2">
                          <polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                        <p>{videoPreview}</p>
                        <span className="neon-text">File selected ✓</span>
                      </div>
                    : <div className="drop-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                        <p>Click to select video</p>
                        <span>MP4, MOV, AVI, MKV</span>
                      </div>
                  }
                </div>
                <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'none' }} />
              </div>

              {uploading && (
                <div className="upload-progress glass-card">
                  <div className="progress-header">
                    <span>Uploading to Cloudinary…</span>
                    <span className="red-text">{progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill-bar" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="progress-note">Please don't close this page</p>
                </div>
              )}
            </div>

            {/* Right — details */}
            <div className="upload-details">
              <div className="glass-card details-card">
                <h3>Video Details</h3>

                <div className="form-group">
                  <label>Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter video title" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe your video…" />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="movie">Movie</option>
                      <option value="show">Show</option>
                      <option value="episode">Episode</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Language</label>
                    <input value={form.language} onChange={e => set('language', e.target.value)} />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Release Year</label>
                    <input type="number" value={form.releaseYear} onChange={e => set('releaseYear', e.target.value)} min="1900" max="2030" />
                  </div>
                  <div className="form-group">
                    <label>Duration (seconds)</label>
                    <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 7200" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Director</label>
                  <input value={form.director} onChange={e => set('director', e.target.value)} placeholder="Director name" />
                </div>
                <div className="form-group">
                  <label>Cast <span className="hint">(comma separated)</span></label>
                  <input value={form.cast} onChange={e => set('cast', e.target.value)} placeholder="Actor 1, Actor 2, Actor 3" />
                </div>
                <div className="form-group">
                  <label>Tags <span className="hint">(comma separated)</span></label>
                  <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="action, hero, sequel" />
                </div>

                {/* Genre picker */}
                <div className="form-group">
                  <label>Genre * <span className="hint">({selectedGenres.length} selected)</span></label>
                  <div className="genre-picker">
                    {GENRES.map(g => (
                      <button key={g} type="button"
                        className={`genre-pill ${selectedGenres.includes(g) ? 'active' : ''}`}
                        onClick={() => toggleGenre(g)}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flags */}
                <div className="form-flags">
                  <label className="flag-label">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
                    <span>⭐ Featured</span>
                  </label>
                  <label className="flag-label">
                    <input type="checkbox" checked={form.isTrending} onChange={e => set('isTrending', e.target.checked)} />
                    <span>🔥 Trending</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary submit-btn" disabled={uploading}>
                  {uploading
                    ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Uploading {progress}%</>
                    : <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/>
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                        </svg>
                        Upload Video
                      </>
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
