import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import api from '../services/api';
import './Browse.css';

const GENRES = ['All', 'Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Documentary'];
const TYPES  = ['All', 'movie', 'show', 'episode'];
const SORTS  = [
  { label: 'Newest', value: '-createdAt' },
  { label: 'Most Viewed', value: '-views' },
  { label: 'Top Rated', value: '-rating' },
  { label: 'Oldest', value: 'createdAt' },
];

/* ── Reusable Custom Dropdown ── */
function FilterDropdown({ label, options, value, onChange, id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [close]);

  const displayValue = typeof value === 'object' ? value.label : (value === 'All' ? `All ${label}s` : value.charAt(0).toUpperCase() + value.slice(1));

  return (
    <div className={`filter-dropdown ${open ? 'open' : ''}`} ref={ref} id={id}>
      <button className="dropdown-trigger" onClick={() => setOpen(o => !o)} type="button">
        <span className="dropdown-label">{label}</span>
        <span className="dropdown-value">{displayValue}</span>
        <svg className="dropdown-arrow" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <ul className="dropdown-menu">
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : (opt === 'All' ? `All ${label}s` : opt.charAt(0).toUpperCase() + opt.slice(1));
          const currentVal = typeof value === 'object' ? value.value : value;
          const isActive = currentVal === optValue;
          return (
            <li key={optValue}>
              <button
                className={`dropdown-option ${isActive ? 'active' : ''}`}
                onClick={() => { onChange(optValue); setOpen(false); }}
                type="button"
              >
                {isActive && <span className="option-check">✓</span>}
                {optLabel}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const genre  = searchParams.get('genre') || 'All';
  const type   = searchParams.get('type') || 'All';
  const sort   = searchParams.get('sort') || '-createdAt';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const params = { page: 1, limit: 24, sort };
    if (genre !== 'All') params.genre = genre;
    if (type !== 'All') params.type = type;
    if (search) params.search = search;

    api.get('/videos', { params })
      .then(r => {
        setVideos(r.data.videos || []);
        setTotalPages(r.data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [genre, type, sort, search]);

  const loadMore = () => {
    const next = page + 1;
    const params = { page: next, limit: 24, sort };
    if (genre !== 'All') params.genre = genre;
    if (type !== 'All') params.type = type;
    if (search) params.search = search;

    api.get('/videos', { params }).then(r => {
      setVideos(v => [...v, ...(r.data.videos || [])]);
      setPage(next);
    });
  };

  const set = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val === 'All' || !val) p.delete(key); else p.set(key, val);
    setSearchParams(p);
  };

  const currentSortObj = SORTS.find(s => s.value === sort) || SORTS[0];

  return (
    <div className="browse-page page-enter">
      <Navbar />
      <div className="browse-inner container">
        <div className="browse-header">
          <h1>{search ? `Results for "${search}"` : 'Browse'}</h1>
        </div>

        {/* Filters */}
        <div className="browse-filters">
          <FilterDropdown
            id="filter-genre"
            label="Genre"
            options={GENRES}
            value={genre}
            onChange={(val) => set('genre', val)}
          />
          <FilterDropdown
            id="filter-type"
            label="Type"
            options={TYPES}
            value={type}
            onChange={(val) => set('type', val)}
          />
          <FilterDropdown
            id="filter-sort"
            label="Sort"
            options={SORTS}
            value={currentSortObj}
            onChange={(val) => set('sort', val)}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="browse-grid">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="browse-empty">
            <p>🎬 No content found. Try different filters.</p>
          </div>
        ) : (
          <>
            <div className="browse-grid">
              {videos.map(v => <MovieCard key={v._id} video={v} size="md" />)}
            </div>
            {page < totalPages && (
              <div className="browse-more">
                <button className="btn btn-outline" onClick={loadMore}>Load More</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumb" style={{ height: 124 }} />
      <div className="skeleton-line" style={{ width: '70%', marginTop: 10 }} />
      <div className="skeleton-line" style={{ width: '45%', marginTop: 6 }} />
    </div>
  );
}
