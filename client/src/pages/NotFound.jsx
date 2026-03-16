import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ color: '#fff', textAlign: 'center', padding: '120px 40px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '8rem', fontWeight: 900, color: '#e50914', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.4rem', color: '#aaa', margin: '16px 0 32px' }}>This page got lost in the multiverse.</p>
      <Link to="/" style={{ color: '#00f5ff', textDecoration: 'none', fontSize: '1rem', border: '1px solid #00f5ff', padding: '10px 28px', borderRadius: '6px' }}>
        Go Home
      </Link>
    </div>
  );
}
