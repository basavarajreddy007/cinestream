import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { fetchVideos, selectVideoList } from '../store/videosSlice';
import { useAIRecommendations } from '../hooks/useAIRecommendations';
import Navbar from '../components/Navbar';
import VideoRow from '../components/VideoRow';
import api from '../services/api';
import './Home.css';

const GENRES = [
  { name: 'Action', icon: '💥' }, { name: 'Drama', icon: '🎭' },
  { name: 'Comedy', icon: '😂' }, { name: 'Thriller', icon: '😱' },
  { name: 'Horror', icon: '👻' }, { name: 'Sci-Fi', icon: '🚀' },
  { name: 'Romance', icon: '❤️' }, { name: 'Animation', icon: '🎨' },
];

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const trending    = useSelector(selectVideoList('trending'));
  const newReleases = useSelector(selectVideoList('newReleases'));
  const topRated    = useSelector(selectVideoList('topRated'));
  const featured    = useSelector(selectVideoList('featured'));

  const { recommendations: aiPicks, loading: aiLoading, refreshRecommendations } = useAIRecommendations();

  const [heroList, setHeroList] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroTransition, setHeroTransition] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    dispatch(fetchVideos({ _key: 'trending', trending: 'true', limit: 12 }));
    dispatch(fetchVideos({ _key: 'newReleases', sort: '-createdAt', limit: 12 }));
    dispatch(fetchVideos({ _key: 'topRated', sort: '-rating', limit: 12 }));
    dispatch(fetchVideos({ _key: 'featured', featured: 'true', limit: 8 }));
  }, [dispatch]);

  useEffect(() => {
    api.get('/videos', { params: { featured: 'true', limit: 6 } })
      .then(r => setHeroList(r.data.videos || []))
      .catch(() => {});
  }, []);

  const startInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setHeroTransition(false);
      setTimeout(() => {
        setHeroIdx(i => (i + 1) % Math.max(heroList.length, 1));
        setHeroTransition(true);
      }, 300);
    }, 7000);
  };

  useEffect(() => {
    if (heroList.length > 1) startInterval();
    return () => clearInterval(intervalRef.current);
  }, [heroList]);

  const goToHero = (i) => {
    clearInterval(intervalRef.current);
    setHeroTransition(false);
    setTimeout(() => { setHeroIdx(i); setHeroTransition(true); }, 200);
    startInterval();
  };

  const hero = heroList[heroIdx] || null;

  return (
    <div className="home page-enter">
      <Navbar />

      <section className="hero-banner">
        <div className="hero-bg-wrap">
          {hero ? (
            <img
              key={heroIdx}
              src={hero.thumbnail}
              alt={hero.title}
              className={`hero-bg-img ${heroTransition ? 'visible' : ''}`}
            />
          ) : (
            <div className="hero-bg-fallback" />
          )}
          <div className="hero-vignette" />
          <div className="hero-bottom-fade" />
          <div className="hero-side-fade" />
        </div>

        <div className="hero-particles" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="hero-particle" style={{ '--pi': i }} />
          ))}
        </div>

        <div className={`hero-content container ${heroTransition ? 'visible' : ''}`}>
          {hero ? (
            <>
              <div className="hero-badges">
                {hero.isTrending && (
                  <span className="hero-badge trending">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.657 18.657A8 8 0 0 1 4 10.5c0-1.61.47-3.11 1.28-4.38L12 12l6.72-5.88A7.97 7.97 0 0 1 20 10.5a8 8 0 0 1-2.343 8.157z"/></svg>
                    Trending
                  </span>
                )}
                {hero.isFeatured && <span className="hero-badge featured">Featured</span>}
                {hero.genre?.[0] && <span className="hero-badge genre">{hero.genre[0]}</span>}
                {hero.type && hero.type !== 'movie' && <span className="hero-badge type">{hero.type}</span>}
              </div>

              <h1 className="hero-title">{hero.title}</h1>

              <div className="hero-stats">
                {hero.rating > 0 && (
                  <span className="hero-stat star">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffd700"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                    {hero.rating.toFixed(1)}
                  </span>
                )}
                {hero.releaseYear && <span className="hero-stat">{hero.releaseYear}</span>}
                {hero.language && <span className="hero-stat">{hero.language}</span>}
                {hero.duration > 0 && (
                  <span className="hero-stat">
                    {Math.floor(hero.duration / 3600) > 0
                      ? `${Math.floor(hero.duration / 3600)}h ${Math.floor((hero.duration % 3600) / 60)}m`
                      : `${Math.floor(hero.duration / 60)}m`}
                  </span>
                )}
              </div>

              <p className="hero-desc">
                {hero.description?.substring(0, 180)}{hero.description?.length > 180 ? '…' : ''}
              </p>

              <div className="hero-actions">
                <button className="hero-play-btn" onClick={() => navigate(`/watch/${hero._id}`)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  Play Now
                </button>
                <button className="hero-info-btn" onClick={() => navigate(`/watch/${hero._id}`)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  More Info
                </button>
                {user && (
                  <button className="hero-icon-btn" title="Add to Watchlist"
                    onClick={() => api.post(`/users/watchlist/${hero._id}`).catch(() => {})}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="hero-empty">
              <div className="hero-empty-logo">
                <svg width="64" height="64" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" stroke="#e50914" strokeWidth="2"/>
                  <polygon points="22,16 22,44 46,30" fill="#e50914"/>
                  <circle cx="30" cy="30" r="4" fill="#00f5ff"/>
                </svg>
              </div>
              <h1>Welcome to <span className="red-text">CineStream</span></h1>
              <p>Unlimited movies, shows, and more.</p>
              <div className="hero-actions">
                <button className="hero-play-btn" onClick={() => navigate('/browse')}>Browse Content</button>
                <button className="hero-info-btn" onClick={() => navigate('/upcoming')}>Coming Soon</button>
              </div>
            </div>
          )}
        </div>

        {heroList.length > 1 && (
          <div className="hero-indicators">
            {heroList.map((item, i) => (
              <button
                key={i}
                className={`hero-indicator ${i === heroIdx ? 'active' : ''}`}
                onClick={() => goToHero(i)}
                aria-label={`Slide ${i + 1}`}
              >
                <span className="indicator-thumb"><img src={item.thumbnail} alt="" /></span>
                <span className="indicator-title">{item.title}</span>
                {i === heroIdx && <span className="indicator-progress" />}
              </button>
            ))}
          </div>
        )}

        <div className="hero-scroll-hint"><span /></div>
      </section>

      {(aiLoading || aiPicks.length > 0) && (
        <section className="ai-picks-section">
          <div className="ai-picks-inner container">
            <div className="ai-picks-header">
              <div className="ai-picks-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
                AI
              </div>
              <h3 className="ai-picks-title">Picks For You</h3>
              <div className="ai-picks-actions">
                <p className="ai-picks-sub">Personalized recommendations powered by AI based on your taste</p>
                <button
                  className="ai-refresh-btn"
                  onClick={refreshRecommendations}
                  disabled={aiLoading}
                  title="Get new recommendations"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={aiLoading ? 'spinning' : ''}>
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            <div className="ai-picks-row">
              {aiLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="ai-pick-skeleton">
                      <div className="ai-skel-thumb" />
                      <div className="ai-skel-line" style={{ width: '75%' }} />
                      <div className="ai-skel-line short" style={{ width: '50%' }} />
                    </div>
                  ))
                : aiPicks.map(v => (
                    <div key={v._id} className="ai-pick-card" onClick={() => navigate(`/watch/${v._id}`)}>
                      <div className="ai-pick-thumb">
                        <img src={v.thumbnail} alt={v.title} loading="lazy" />
                        <div className="ai-pick-overlay">
                          <button className="ai-pick-play" aria-label="Play">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                          </button>
                        </div>
                        {v.rating > 0 && (
                          <span className="ai-pick-rating">★ {v.rating.toFixed(1)}</span>
                        )}
                      </div>
                      <p className="ai-pick-title">{v.title}</p>
                      {v.genre?.length > 0 && (
                        <div className="ai-pick-genres">
                          {v.genre.slice(0, 2).map(g => (
                            <span key={g} className="ai-genre-tag">{g}</span>
                          ))}
                        </div>
                      )}
                      {v.description && (
                        <p className="ai-pick-desc">{v.description.substring(0, 60)}{v.description.length > 60 ? '…' : ''}</p>
                      )}
                    </div>
                  ))
              }
            </div>
          </div>
        </section>
      )}

      <div className="home-content container">
        <VideoRow title="🔥 Trending Now"  videos={trending.items}    loading={trending.loading}    size="md" />
        <VideoRow title="✨ Featured"       videos={featured.items}    loading={featured.loading}    size="lg" />
        <VideoRow title="🆕 New Releases"  videos={newReleases.items} loading={newReleases.loading} size="md" />
        <VideoRow title="⭐ Top Rated"     videos={topRated.items}    loading={topRated.loading}    size="md" />

        <section className="genre-section">
          <h2 className="section-title">Browse by Genre</h2>
          <div className="genre-grid">
            {GENRES.map(g => (
              <button key={g.name} className="genre-chip" onClick={() => navigate(`/browse?genre=${g.name}`)}>
                <span className="genre-icon">{g.icon}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="upcoming-teaser">
          <div className="teaser-content">
            <div>
              <h2>🎬 Coming Soon</h2>
              <p>Don't miss what's dropping next on CineStream</p>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/upcoming')}>
              View All Upcoming →
            </button>
          </div>
        </section>
      </div>

      <footer className="home-footer">
        <p>© 2025 CineStream · All rights reserved</p>
      </footer>
    </div>
  );
}
