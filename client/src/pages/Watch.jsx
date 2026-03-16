import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { fetchVideo, selectCurrentVideo, selectCurrentVideoLoading, clearCurrent } from '../store/videosSlice';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Watch.css';

export default function Watch() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const video   = useSelector(selectCurrentVideo);
  const loading = useSelector(selectCurrentVideoLoading);
  const user    = useSelector(selectUser);

  const videoRef    = useRef(null);
  const progressRef = useRef(null);
  const controlsTimer = useRef(null);

  const [playing, setPlaying]           = useState(false);
  const [muted, setMuted]               = useState(false);
  const [volume, setVolume]             = useState(1);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [fullscreen, setFullscreen]     = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed]               = useState(1);
  const [comment, setComment]           = useState('');
  const [comments, setComments]         = useState([]);
  const [liked, setLiked]               = useState(false);
  const [inWatchlist, setInWatchlist]   = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // ─── Fetch video via Redux ───
  useEffect(() => {
    dispatch(fetchVideo(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  // ─── Init local state from video ───
  useEffect(() => {
    if (!video) return;
    setComments(video.comments || []);
    if (user) {
      setLiked(video.likes?.includes(user._id));
      const history = user.watchHistory?.find(h => h.video?._id === id || h.video === id);
      if (history?.progress && videoRef.current) {
        videoRef.current.currentTime = history.progress;
      }
    }
  }, [video, user, id]);

  // ─── Player helpers ───
  const resetControlsTimer = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (user && Math.floor(videoRef.current.currentTime) % 10 === 0) {
      api.post(`/videos/${id}/progress`, { progress: Math.floor(videoRef.current.currentTime) }).catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * duration;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const toggleFullscreen = () => {
    const el = document.querySelector('.player-wrap');
    if (!document.fullscreenElement) { el.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  const handleSpeed = (s) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  };

  const handleSkip = (secs) => {
    if (videoRef.current) videoRef.current.currentTime += secs;
  };

  const handleLike = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/videos/${id}/like`);
      setLiked(res.data.liked);
      toast.success(res.data.liked ? 'Added to liked' : 'Removed from liked');
    } catch { toast.error('Failed'); }
  };

  const handleWatchlist = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/users/watchlist/${id}`);
      setInWatchlist(res.data.inWatchlist);
      toast.success(res.data.inWatchlist ? 'Added to watchlist' : 'Removed from watchlist');
    } catch { toast.error('Failed'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/videos/${id}/comment`, { text: comment });
      setComments(c => [res.data.comment, ...c]);
      setComment('');
    } catch { toast.error('Failed to post comment'); }
  };

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ─── Loading / Error states ───
  if (loading) return (
    <div className="watch-page"><Navbar /><div className="center-spinner"><div className="spinner" /></div></div>
  );

  if (!video) return (
    <div className="watch-page">
      <Navbar />
      <div className="watch-error">
        <h2>Video not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/browse')}>Browse Content</button>
      </div>
    </div>
  );

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="watch-page page-enter">
      <Navbar />
      <div className="watch-layout container">

        {/* Player */}
        <div className="player-wrap" onMouseMove={resetControlsTimer} onMouseLeave={() => playing && setShowControls(false)}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onEnded={() => setPlaying(false)}
            onClick={togglePlay}
            className="player-video"
          />

          {/* Controls overlay */}
          <div className={`player-controls ${showControls || !playing ? 'visible' : ''}`}>
            <div className="progress-bar" ref={progressRef} onClick={handleSeek}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              <div className="progress-thumb" style={{ left: `${progress}%` }} />
            </div>

            <div className="controls-row">
              <div className="controls-left">
                <button className="ctrl-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                  {playing
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  }
                </button>
                <button className="ctrl-btn" onClick={() => handleSkip(-10)} title="Back 10s">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                </button>
                <button className="ctrl-btn" onClick={() => handleSkip(10)} title="Forward 10s">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.5"/></svg>
                </button>
                <div className="volume-wrap">
                  <button className="ctrl-btn" onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}>
                    {muted || volume === 0
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    }
                  </button>
                  <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                    onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; } setMuted(v === 0); }}
                    className="volume-slider"
                  />
                </div>
                <span className="time-display">{fmt(currentTime)} / {fmt(duration)}</span>
              </div>
              <div className="controls-right">
                <div className="speed-wrap">
                  <button className="ctrl-btn speed-btn" onClick={() => setShowSpeedMenu(v => !v)}>{speed}x</button>
                  {showSpeedMenu && (
                    <div className="speed-menu">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                        <button key={s} className={speed === s ? 'active' : ''} onClick={() => handleSpeed(s)}>{s}x</button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="ctrl-btn" onClick={toggleFullscreen}>
                  {fullscreen
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {!playing && (
            <div className="player-center-play" onClick={togglePlay}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="watch-info">
          <div className="watch-info-main">
            <h1 className="watch-title">{video.title}</h1>
            <div className="watch-meta">
              {video.rating > 0 && <span className="meta-rating">★ {video.rating.toFixed(1)}</span>}
              {video.releaseYear && <span>{video.releaseYear}</span>}
              {video.language && <span>{video.language}</span>}
              {video.views > 0 && <span>{video.views.toLocaleString()} views</span>}
              {video.genre?.map(g => <span key={g} className="meta-genre">{g}</span>)}
            </div>
            <p className="watch-desc">{video.description}</p>
            {video.director && <p className="watch-credit"><span>Director:</span> {video.director}</p>}
            {video.cast?.length > 0 && <p className="watch-credit"><span>Cast:</span> {video.cast.join(', ')}</p>}
          </div>

          <div className="watch-actions">
            <button className={`action-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {liked ? 'Liked' : 'Like'}
            </button>
            <button className={`action-btn ${inWatchlist ? 'active' : ''}`} onClick={handleWatchlist}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={inWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {inWatchlist ? 'Saved' : 'Watchlist'}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="watch-comments">
          <h3 className="section-title">Comments</h3>
          {user && (
            <form onSubmit={handleComment} className="comment-form">
              <img src={user.avatar || ''} alt="" className="comment-avatar" onError={e => e.target.style.display='none'} />
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="comment-input" />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Post</button>
            </form>
          )}
          <div className="comments-list">
            {comments.length === 0 && <p className="no-comments">No comments yet. Be the first!</p>}
            {comments.map((c, i) => (
              <div key={i} className="comment-item">
                <div className="comment-avatar-wrap">
                  {c.user?.avatar
                    ? <img src={c.user.avatar} alt={c.user.name} />
                    : <span>{c.user?.name?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <div>
                  <p className="comment-author">{c.user?.name || 'User'}</p>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
