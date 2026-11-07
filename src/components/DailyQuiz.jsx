import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Timer, ShieldAlert, Monitor, Medal, CheckCircle2, XCircle,
  MinusCircle, RefreshCw, Crown, CalendarDays,
} from 'lucide-react';
import { apiFetch, apiJson } from '../api';
import { LatexText } from './MarkdownRenderer';

const TRACKS = ['JEE', 'NEET'];
const VIOLATION_LIMIT = 3;

// Strict exam mode needs fullscreen and tab-switch detection, neither of which
// is meaningful on a phone, and the ranking depends on both. The quiz is
// therefore desktop-only rather than quietly unranked on mobile.
const MIN_DESKTOP_WIDTH = 1024;

const trackForStream = (stream) => {
  if (stream === 'pcb') return 'NEET';
  if (stream === 'pcmc' || stream === 'commerce') return 'JEE';
  return 'JEE'; // pcmb / general can take either; JEE is just the default tab
};

const fmtClock = (secs) => {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
};

export default function DailyQuiz({ user, onExamLockChange }) {
  const [track, setTrack] = useState(() => trackForStream(user?.stream));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [view, setView] = useState('home'); // home | exam | result
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState(null);

  const [violations, setViolations] = useState(0);
  const [violationNotice, setViolationNotice] = useState(null);
  const [terminated, setTerminated] = useState(false);

  const [board, setBoard] = useState(null);
  const [boardPeriod, setBoardPeriod] = useState('week');
  const [badges, setBadges] = useState([]);

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= MIN_DESKTOP_WIDTH
  );

  // Refs so the violation listeners never close over stale state.
  const submitRef = useRef(null);
  const violationRef = useRef(null);
  const noticeOpenRef = useRef(false);
  const graceUntilRef = useRef(0);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= MIN_DESKTOP_WIDTH);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock the app shell while the quiz is live, same contract the Practice
  // Engine uses: in-app navigation fires no blur or visibility event, so
  // without this a student could just open the AI tutor in another tab.
  useEffect(() => {
    const locked = view === 'exam';
    if (onExamLockChange) onExamLockChange(locked);
    return () => { if (onExamLockChange) onExamLockChange(false); };
  }, [view, onExamLockChange]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async (t) => {
    setLoading(true);
    setError('');
    try {
      setSummary(await apiJson(`/quiz/today?track=${t}`));
    } catch (e) {
      setSummary(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBoard = useCallback(async (t, period) => {
    try {
      setBoard(await apiJson(`/quiz/leaderboard?track=${t}&period=${period}`));
    } catch { /* leave the previous board up */ }
  }, []);

  const loadBadges = useCallback(async () => {
    try {
      setBadges(await apiJson('/quiz/badges'));
    } catch { /* badges are decoration; never block on them */ }
  }, []);

  useEffect(() => {
    loadSummary(track);
    loadBoard(track, boardPeriod);
  }, [track, boardPeriod, loadSummary, loadBoard]);

  useEffect(() => {
    loadBadges();
    // Settles last week's badge if nobody has yet. Idempotent server-side, so
    // opening this page is a good enough trigger and no cron job is needed.
    apiFetch('/quiz/award-weekly', { method: 'POST' }).catch(() => {});
  }, [loadBadges]);

  // ── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'exam') return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (submitRef.current) submitRef.current(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitQuiz = useCallback(async (autoSubmitted) => {
    if (view !== 'exam') return;
    setView('result');
    setLoading(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      const data = await apiJson('/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ track, answers, violations, autoSubmitted: !!autoSubmitted }),
      });
      setResult(data);
      loadSummary(track);
      loadBoard(track, boardPeriod);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [view, track, answers, violations, boardPeriod, loadSummary, loadBoard]);

  // ── Strict mode ────────────────────────────────────────────────────────────
  const triggerViolation = useCallback(async (reason) => {
    if (noticeOpenRef.current) return;
    let next = violations + 1;
    try {
      const res = await apiFetch('/student/exam/warning', {
        method: 'POST',
        body: JSON.stringify({ examId: `quiz:${track}:${summary?.quizDate}`, durationMinutes: 20 }),
      });
      const data = await res.json();
      if (Number.isFinite(Number(data.warnings))) next = Number(data.warnings);
    } catch { /* the local tally below still applies */ }

    setViolations(next);
    if (next >= VIOLATION_LIMIT) {
      setTerminated(true);
      noticeOpenRef.current = false;
      setViolationNotice(null);
      if (submitRef.current) submitRef.current(true);
    } else {
      noticeOpenRef.current = true;
      setViolationNotice({ count: next, reason });
    }
  }, [violations, track, summary]);

  // Published through refs after render, not during it, so the strict-mode
  // listeners below always call the current versions without re-subscribing.
  useEffect(() => {
    submitRef.current = submitQuiz;
    violationRef.current = triggerViolation;
  });

  useEffect(() => {
    if (view !== 'exam') return;

    const inGrace = () => Date.now() < graceUntilRef.current;
    const onFullscreen = () => {
      if (inGrace() || noticeOpenRef.current) return;
      if (!document.fullscreenElement) violationRef.current('You left fullscreen.');
    };
    const onVisibility = () => {
      if (inGrace() || noticeOpenRef.current) return;
      if (document.hidden) violationRef.current('You switched tabs or minimised the window.');
    };
    const onBlur = () => {
      if (inGrace() || noticeOpenRef.current) return;
      violationRef.current('You clicked outside the quiz window.');
    };

    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [view]);

  const startQuiz = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiJson('/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ track, strictMode: true }),
      });
      setPaper(data);
      setAnswers({});
      setViolations(0);
      setTerminated(false);
      setViolationNotice(null);
      noticeOpenRef.current = false;
      setSecondsLeft(data.secondsRemaining);
      // Ignore the events the fullscreen switch itself throws off.
      graceUntilRef.current = Date.now() + 2000;
      await document.documentElement.requestFullscreen?.().catch(() => {});
      setView('exam');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotice = () => {
    noticeOpenRef.current = false;
    setViolationNotice(null);
    graceUntilRef.current = Date.now() + 2000;
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // ── Views ──────────────────────────────────────────────────────────────────

  if (!isDesktop) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '520px', margin: '2rem auto' }}>
        <Monitor size={44} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Daily Quiz needs a desktop</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          The quiz runs in strict exam mode, which locks the screen in fullscreen and
          watches for tab switches. Phones cannot do either, and the leaderboard would
          not be fair if some scores were unsupervised. Open Walrus on a laptop or
          desktop to take today&rsquo;s paper.
        </p>
      </div>
    );
  }

  if (view === 'exam' && paper) {
    const answered = Object.keys(answers).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'sticky', top: 0, zIndex: 20 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--warning)' }} /> {track} Daily Quiz &mdash; Strict Mode
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {answered} of {paper.questions.length} answered &middot; +{paper.marksPerCorrect} correct, &minus;{paper.penaltyPerWrong} wrong
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: violations ? 'var(--danger)' : 'var(--text-muted)' }}>
              Warnings {violations}/{VIOLATION_LIMIT}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '1.3rem',
              color: secondsLeft < 60 ? 'var(--danger)' : 'var(--text-primary)',
            }}>
              <Timer size={20} /> {fmtClock(secondsLeft)}
            </div>
            <button className="btn-primary" onClick={() => submitQuiz(false)} disabled={loading}>
              Submit
            </button>
          </div>
        </div>

        {paper.questions.map((q, i) => (
          <div key={q.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>Q{i + 1}</strong>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{q.subject}</span>
            </div>
            <p style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
              <LatexText text={q.question} />
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {q.options.map((opt) => (
                <label key={opt} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer',
                  padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem',
                  border: `1px solid ${answers[q.id] === opt ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: answers[q.id] === opt ? 'var(--primary-light)' : 'transparent',
                }}>
                  <input
                    type="radio" name={q.id} value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    style={{ marginTop: '0.15rem' }}
                  />
                  <span><LatexText text={opt} /></span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button className="btn-primary" style={{ padding: '0.8rem' }} onClick={() => submitQuiz(false)} disabled={loading}>
          Submit today&rsquo;s {track} quiz
        </button>

        {violationNotice && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
          }}>
            <div className="card" style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem' }}>
              <ShieldAlert size={38} style={{ color: 'var(--danger)', marginBottom: '0.75rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Strict mode warning</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{violationNotice.reason}</p>
              <p style={{ fontWeight: 700, color: 'var(--danger)', margin: '0.75rem 0' }}>
                Warning {violationNotice.count} of {VIOLATION_LIMIT}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                At {VIOLATION_LIMIT} warnings the quiz is submitted automatically and will not count
                towards the leaderboard.
              </p>
              <button className="btn-primary" onClick={dismissNotice}>Return to the quiz</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          {loading && <RefreshCw className="animate-spin" size={26} style={{ color: 'var(--primary)' }} />}
          {!loading && result && (
            <>
              <h2 style={{ marginBottom: '0.25rem' }}>{result.score} / {result.totalMarks}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {track} Daily Quiz &middot; {fmtClock(result.timeTakenSeconds)} taken
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)' }}>
                  <CheckCircle2 size={16} /> {result.correct} correct
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)' }}>
                  <XCircle size={16} /> {result.wrong} wrong
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                  <MinusCircle size={16} /> {result.unattempted} skipped
                </span>
              </div>
              {terminated || result.autoSubmitted ? (
                <div className="badge badge-danger" style={{ padding: '0.5rem 0.9rem' }}>
                  Auto-submitted after {VIOLATION_LIMIT} strict-mode warnings &mdash; this attempt does not count towards the leaderboard.
                </div>
              ) : (
                <div className="badge badge-success" style={{ padding: '0.5rem 0.9rem' }}>Counted towards this week&rsquo;s leaderboard</div>
              )}
            </>
          )}
          {!loading && error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>

        {result?.review && (
          <div className="card">
            <h3 style={{ marginBottom: '0.85rem' }}>Answer review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.review.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.84rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: r.correct ? 'rgba(34,197,94,0.08)' : r.chosen ? 'rgba(239,68,68,0.07)' : 'var(--bg-app)',
                }}>
                  <strong style={{ minWidth: '2.2rem' }}>Q{i + 1}</strong>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      You: {r.chosen ? <LatexText text={r.chosen} /> : <em>skipped</em>}
                    </div>
                    {!r.correct && (
                      <div style={{ color: 'var(--success)' }}>Correct: <LatexText text={r.answer} /></div>
                    )}
                  </div>
                  <span className="badge" style={{ fontSize: '0.66rem' }}>{r.subject}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn-secondary" onClick={() => { setView('home'); setResult(null); }}>
          Back to Daily Quiz
        </button>
      </div>
    );
  }

  // ── Home ───────────────────────────────────────────────────────────────────
  const attempt = summary?.attempt;
  const alreadyDone = attempt?.status === 'submitted';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Trophy size={26} /> Daily Quiz
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {TRACKS.map((t) => (
            <button key={t} className="btn-secondary" onClick={() => setTrack(t)}
              style={{
                borderColor: track === t ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: track === t ? 'var(--primary-light)' : 'var(--bg-card)',
                color: track === t ? 'var(--primary)' : 'var(--text-primary)',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="community-threads-grid" style={{ alignItems: 'start' }}>
        {/* Today's paper */}
        <div className="card">
          {loading && !summary && <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--primary)' }} />}
          {error && !summary && <p style={{ color: 'var(--danger)', fontSize: '0.88rem', margin: 0 }}>{error}</p>}
          {summary && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CalendarDays size={16} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.92rem' }}>{summary.quizDate}</strong>
                <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{track}</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 0 }}>
                {summary.questionCount} MCQs &middot; {summary.durationMinutes} minutes &middot; {summary.totalMarks} marks<br />
                +{summary.marksPerCorrect} for a correct answer, &minus;{summary.penaltyPerWrong} for a wrong one.<br />
                {summary.subjects.join(' · ')}
              </p>

              {alreadyDone ? (
                <div style={{ marginTop: '1rem' }}>
                  <div className="badge badge-success" style={{ padding: '0.5rem 0.9rem', marginBottom: '0.75rem' }}>
                    Done today &mdash; {attempt.score} / {summary.totalMarks}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    {attempt.correct} correct, {attempt.wrong} wrong, {attempt.unattempted} skipped.
                    {attempt.ranked ? ' Counted towards this week.' : ' Not counted — the attempt was auto-submitted.'}
                    <br />One attempt per day; the next paper arrives tomorrow.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    marginTop: '1rem', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--warning)', backgroundColor: 'rgba(217,159,89,0.1)',
                    fontSize: '0.8rem', color: 'var(--text-secondary)',
                  }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', marginBottom: '0.3rem' }}>
                      <ShieldAlert size={14} /> Strict exam mode
                    </strong>
                    The quiz opens in fullscreen. Leaving fullscreen, switching tabs or clicking
                    away counts as a warning; at {VIOLATION_LIMIT} it is submitted automatically and
                    will not count. You get one attempt today.
                  </div>
                  <button className="btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.7rem' }}
                    onClick={startQuiz} disabled={loading}>
                    {loading ? <><RefreshCw className="animate-spin" size={15} /> Preparing&hellip;</> : `Start today's ${track} quiz`}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Medal size={18} /> {track} Leaderboard
            </h3>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['today', 'week'].map((p) => (
                <button key={p} className="btn-secondary" onClick={() => setBoardPeriod(p)}
                  style={{
                    fontSize: '0.74rem', padding: '0.3rem 0.65rem',
                    borderColor: boardPeriod === p ? 'var(--primary)' : 'var(--border-color)',
                    color: boardPeriod === p ? 'var(--primary)' : 'var(--text-secondary)',
                  }}>
                  {p === 'today' ? 'Today' : 'This week'}
                </button>
              ))}
            </div>
          </div>

          {!board || board.board.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>
              No ranked scores yet. Be the first.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '360px', overflowY: 'auto' }}>
              {board.board.map((row) => (
                <div key={row.userId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.86rem',
                  border: `1px solid ${row.isMe ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: row.isMe ? 'var(--primary-light)' : 'var(--bg-app)',
                }}>
                  <strong style={{ minWidth: '1.8rem', color: row.rank === 1 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {row.rank === 1 ? <Crown size={15} /> : `#${row.rank}`}
                  </strong>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.username}{row.isMe && ' (you)'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{row.quizzesTaken}q</span>
                  <strong>{row.totalScore}</strong>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.85rem', marginBottom: 0 }}>
            Weeks run Monday to Sunday (IST). The top scorer of each finished week earns a badge on their profile.
          </p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={18} style={{ color: 'var(--warning)' }} /> Your weekly badges
          </h3>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {badges.map((b) => (
              <div key={b._id} style={{
                padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--warning)', backgroundColor: 'rgba(217,159,89,0.12)',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Crown size={14} style={{ color: 'var(--warning)' }} /> {b.track} Topper
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{b.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.totalScore} marks over {b.quizzesTaken} quizzes</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
