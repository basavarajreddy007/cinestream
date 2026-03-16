import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../store/authSlice';
import './Navbar.css';

export default function Navbar() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" stroke="#e50914" strokeWidth="2"/>
            <polygon points="22,16 22,44 46,30" fill="#e50914"/>
            <circle cx="30" cy="30" r="4" fill="#00f5ff"/>
          </svg>
          <span>Cine<strong>Stream</strong></span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/browse" className={location.pathname === '/browse' ? 'active' : ''}>Browse</Link></li>
          <li><Link to="/upcoming" className={location.pathname === '/upcoming' ? 'active' : ''}>Coming Soon</Link></li>
          <li><Link to="/creators" className={location.pathname === '/creators' ? 'active' : ''}>Creators</Link></li>
          {user && <li><Link to="/upload" className={location.pathname === '/upload' ? 'active' : ''}>Upload</Link></li>}
          {user && <li><Link to="/ai" className={location.pathname === '/ai' ? 'active' : ''}>AI Tools</Link></li>}
          {user?.role === 'admin' && <li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link></li>}
        </ul>

        <div className="nav-actions">
          <div className={`nav-search ${searchOpen ? 'open' : ''}`}>
            <form onSubmit={handleSearch}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search movies, shows..."
                autoFocus={searchOpen}
              />
            </form>
            <button className="icon-btn" onClick={() => setSearchOpen(v => !v)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>

          {user ? (
            <div className="nav-user">
              <Link to="/profile" className="avatar-btn">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} />
                  : <span>{(user.name || user.email)?.[0]?.toUpperCase()}</span>
                }
              </Link>
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user.name || 'User'}</p>
                  <p className="dropdown-email">{user.email}</p>
                </div>
                <Link to="/profile">Profile</Link>
                <Link to="/profile?tab=watchlist">Watchlist</Link>
                {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                <button onClick={handleLogout} className="logout-btn">Sign Out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>Sign In</Link>
          )}

          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/">Home</Link>
          <Link to="/browse">Browse</Link>
          <Link to="/upcoming">Coming Soon</Link>
          <Link to="/creators">Creators</Link>
          {user && <Link to="/upload">Upload</Link>}
          {user && <Link to="/ai">AI Tools</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user ? (
            <>
              <Link to="/profile">Profile</Link>
              <button onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
