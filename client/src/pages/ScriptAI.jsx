import { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import './ScriptAI.css';

const TABS = ['Analyzer', 'Writer'];
const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Mystery', 'Fantasy'];
const TONES  = ['Dark', 'Light-hearted', 'Suspenseful', 'Romantic', 'Epic', 'Comedic', 'Gritty', 'Inspirational'];
const LENGTHS = ['Short (30 min)', 'Medium (90 min)', 'Feature (2 hours)', 'Epic (3+ hours)'];

export default function ScriptAI() {
  const [tab, setTab] = useState('Analyzer');

  // Analyzer state
  const [script, setScript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Writer state
  const [form, setForm] = useState({ genre: 'Action', theme: '', characters: '', setting: '', storyLength: 'Feature (2 hours)', tone: 'Dark' });
  const [generated, setGenerated] = useState(null);
  const [writing, setWriting] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (script.length < 100) return toast.error('Script must be at least 100 characters');
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const r = await api.post('/ai/script-analyze', { scriptText: script });
      setAnalysis(r.data.analysis);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally { setAnalyzing(false); }
  };

  const handleWrite = async (e) => {
    e.preventDefault();
    if (!form.theme.trim()) return toast.error('Enter a theme');
    setWriting(true);
    setGenerated(null);
    try {
      const r = await api.post('/ai/script-writer', form);
      setGenerated(r.data.script);
      toast.success('Script generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally { setWriting(false); }
  };

  const ScoreBar = ({ label, value }) => (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <span className="score-val">{value}/10</span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${value * 10}%`, background: value >= 7 ? '#00f5ff' : value >= 5 ? '#ffd700' : '#e50914' }} />
      </div>
    </div>
  );

  return (
    <div className="ai-page page-enter">
      <Navbar />
      <div className="ai-inner container">
        <div className="ai-header">
          <h1>🤖 AI Script <span className="red-text">Tools</span></h1>
          <p>Analyze your script or generate a new one using AI</p>
        </div>

        <div className="ai-tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* ANALYZER */}
        {tab === 'Analyzer' && (
          <div className="ai-layout">
            <div className="ai-panel glass-card">
              <h3>Paste Your Script</h3>
              <form onSubmit={handleAnalyze}>
                <textarea
                  value={script}
                  onChange={e => setScript(e.target.value)}
                  placeholder="Paste your movie script here... (minimum 100 characters)"
                  className="script-textarea"
                  rows={16}
                />
                <div className="textarea-meta">
                  <span>{script.length} characters</span>
                  <button type="submit" className="btn btn-primary" disabled={analyzing}>
                    {analyzing ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing…</> : '🔍 Analyze Script'}
                  </button>
                </div>
              </form>
            </div>

            {analysis && (
              <div className="ai-results glass-card">
                <h3>Analysis Results</h3>

                <div className="analysis-summary">
                  <div className="overall-score">
                    <span className="overall-num">{analysis.overallScore}</span>
                    <span className="overall-label">Overall Score</span>
                  </div>
                  <div>
                    <p className="analysis-text">{analysis.summary}</p>
                    {analysis.genre?.length > 0 && (
                      <div className="genre-tags">
                        {analysis.genre.map(g => <span key={g} className="genre-tag">{g}</span>)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="scores-grid">
                  <ScoreBar label="Story Quality" value={analysis.storyQualityScore} />
                  <ScoreBar label="Dialogue Quality" value={analysis.dialogueQualityScore} />
                  <ScoreBar label="Character Depth" value={analysis.characterDepthScore} />
                  <ScoreBar label="Plot Consistency" value={analysis.plotConsistency} />
                  <ScoreBar label="Audience Interest" value={analysis.estimatedAudienceInterest} />
                </div>

                {analysis.strengths?.length > 0 && (
                  <div className="feedback-section">
                    <h4>✅ Strengths</h4>
                    <ul>{analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {analysis.improvements?.length > 0 && (
                  <div className="feedback-section">
                    <h4>💡 Improvements</h4>
                    <ul>{analysis.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* WRITER */}
        {tab === 'Writer' && (
          <div className="ai-layout">
            <div className="ai-panel glass-card">
              <h3>Script Parameters</h3>
              <form onSubmit={handleWrite} className="writer-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Genre</label>
                    <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
                      {GENRES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tone</label>
                    <select value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                      {TONES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Theme *</label>
                  <input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="e.g. Redemption, Love vs Duty, Survival" required />
                </div>
                <div className="form-group">
                  <label>Main Characters</label>
                  <input value={form.characters} onChange={e => setForm(f => ({ ...f, characters: e.target.value }))} placeholder="e.g. A retired detective, a mysterious stranger" />
                </div>
                <div className="form-group">
                  <label>Setting</label>
                  <input value={form.setting} onChange={e => setForm(f => ({ ...f, setting: e.target.value }))} placeholder="e.g. Near-future Tokyo, 1920s Paris" />
                </div>
                <div className="form-group">
                  <label>Story Length</label>
                  <select value={form.storyLength} onChange={e => setForm(f => ({ ...f, storyLength: e.target.value }))}>
                    {LENGTHS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={writing} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                  {writing ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</> : '✍️ Generate Script'}
                </button>
              </form>
            </div>

            {generated && (
              <div className="ai-results glass-card">
                <div className="script-header">
                  <h2>{generated.title}</h2>
                  <p className="logline">"{generated.logline}"</p>
                </div>

                <div className="script-outline">
                  <h4>Story Outline</h4>
                  <p>{generated.storyOutline}</p>
                </div>

                {[generated.act1, generated.act2, generated.act3].map((act, i) => act && (
                  <div key={i} className="act-section">
                    <h4>{act.title}</h4>
                    <ul className="scene-list">{act.scenes?.map((s, j) => <li key={j}>{s}</li>)}</ul>
                    {act.keyDialogues?.length > 0 && (
                      <div className="dialogues">
                        {act.keyDialogues.map((d, j) => <p key={j} className="dialogue-line">"{d}"</p>)}
                      </div>
                    )}
                  </div>
                ))}

                {generated.plotTwists?.length > 0 && (
                  <div className="act-section">
                    <h4>🌀 Plot Twists</h4>
                    <ul className="scene-list">{generated.plotTwists.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}

                {generated.ending && (
                  <div className="act-section">
                    <h4>🎬 Ending</h4>
                    <p>{generated.ending}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
