import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → hold → exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('exit'), 2200);
    const doneTimer = setTimeout(() => onFinish(), 3000);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash ${phase}`}>
      {/* Ambient particles */}
      <div className="splash-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="particle" style={{ '--i': i }} />
        ))}
      </div>

      {/* Film strip top */}
      <div className="film-strip top">
        {Array.from({ length: 12 }).map((_, i) => <span key={i} className="film-hole" />)}
      </div>

      {/* Center logo */}
      <div className="splash-center">
        <div className="logo-ring">
          <div className="ring r1" />
          <div className="ring r2" />
          <div className="ring r3" />
        </div>

        <div className="logo-wrap">
          <div className="logo-icon">
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" stroke="#e50914" strokeWidth="2" />
              <polygon points="22,16 22,44 46,30" fill="#e50914" />
              <circle cx="30" cy="30" r="4" fill="#00f5ff" />
            </svg>
          </div>
          <h1 className="logo-text">
            <span className="logo-cine">Cine</span>
            <span className="logo-stream">Stream</span>
          </h1>
          <p className="logo-tagline">Unlimited Entertainment</p>
        </div>

        <div className="loading-bar-wrap">
          <div className="loading-bar" />
        </div>
      </div>

      {/* Film strip bottom */}
      <div className="film-strip bottom">
        {Array.from({ length: 12 }).map((_, i) => <span key={i} className="film-hole" />)}
      </div>
    </div>
  );
}
