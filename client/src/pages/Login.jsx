import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, loginSuccess } from '../store/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code, name });
      dispatch(loginSuccess({ token: res.data.token, user: res.data.user }));
      toast.success('Welcome to CineStream!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-glow glow1" />
        <div className="login-bg-glow glow2" />
      </div>

      <div className="login-card glass-card">
        <a href="/" className="login-logo">
          <svg width="32" height="32" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" stroke="#e50914" strokeWidth="2"/>
            <polygon points="22,16 22,44 46,30" fill="#e50914"/>
            <circle cx="30" cy="30" r="4" fill="#00f5ff"/>
          </svg>
          <span>Cine<strong>Stream</strong></span>
        </a>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="login-form">
            <h2>Sign In</h2>
            <p className="login-sub">Enter your email to receive a one-time password</p>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required autoFocus
              />
            </div>

            <div className="form-group">
              <label>Name <span className="optional">(optional, for new accounts)</span></label>
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <h2>Enter OTP</h2>
            <p className="login-sub">We sent a 6-digit code to <strong>{email}</strong></p>

            <div className="otp-inputs">
              {otp.map((digit, i) => (
                <input
                  key={i} id={`otp-${i}`}
                  type="text" inputMode="numeric"
                  maxLength={1} value={digit}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleOtpKeyDown(e, i)}
                  autoFocus={i === 0}
                  className={digit ? 'filled' : ''}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Verify & Sign In'}
            </button>

            <button type="button" className="resend-btn" onClick={() => { setStep('email'); setOtp(['','','','','','']); }}>
              ← Change email or resend
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
