import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MovieCard.css';

export default function MovieCard({ video, size = 'md' }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!video) return null;

  const formatDuration = (s) => {
    if (!s) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className={`movie-card size-${size}`} onClick={() => navigate(`/watch/${video._id}`)}>
      <div className="card-thumb">
        {!imgError && video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} onError={() => setImgError(true)} loading="lazy" />
          : <div className="card-thumb-fallback">
              <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                <polygon points="18,12 18,48 50,30" fill="#e50914" opacity="0.6"/>
              </svg>
            </div>
        }

        <div className="card-overlay">
          <button className="play-btn" aria-label="Play">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
          <div className="card-meta">
            {video.duration > 0 && <span>{formatDuration(video.duration)}</span>}
            {video.rating > 0 && (
              <span className="card-rating">
                ★ {video.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {video.isTrending && <span className="badge badge-trending">Trending</span>}
        {video.type && video.type !== 'movie' && <span className="badge badge-type">{video.type}</span>}
      </div>

      <div className="card-info">
        <p className="card-title">{video.title}</p>
        {video.genre?.length > 0 && (
          <p className="card-genre">{video.genre.slice(0, 2).join(' · ')}</p>
        )}
      </div>
    </div>
  );
}
