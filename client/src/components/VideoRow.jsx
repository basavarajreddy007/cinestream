import MovieCard from './MovieCard';
import './VideoRow.css';

export default function VideoRow({ title, videos = [], loading, size }) {
  if (!loading && videos.length === 0) return null;

  return (
    <section className="video-row">
      <h2 className="section-title">{title}</h2>
      <div className="scroll-row">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} size={size} />)
          : videos.map(v => <MovieCard key={v._id} video={v} size={size} />)
        }
      </div>
    </section>
  );
}

function SkeletonCard({ size = 'md' }) {
  const widths = { sm: 160, md: 220, lg: 280, xl: 340 };
  const heights = { sm: 90, md: 124, lg: 158, xl: 192 };
  const w = widths[size] || 220;
  const h = heights[size] || 124;
  return (
    <div className="skeleton-card" style={{ width: w }}>
      <div className="skeleton-thumb" style={{ height: h }} />
      <div className="skeleton-line" style={{ width: '70%', marginTop: 10 }} />
      <div className="skeleton-line" style={{ width: '45%', marginTop: 6 }} />
    </div>
  );
}
