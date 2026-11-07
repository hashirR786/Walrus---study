import express from 'express';
import DailyQuiz from '../models/DailyQuiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import WeeklyBadge from '../models/WeeklyBadge.js';
import { protect, identityOf } from '../middleware/authMiddleware.js';
import { callGroqAPI } from './ai.js';
import {
  istDateKey, istWeekStart, weekDateKeys, previousWeekStart, describeWeek,
} from '../lib/quizTime.js';

const router = express.Router();
router.use(protect);

const TRACKS = {
  JEE: { subjects: ['Physics', 'Chemistry', 'Mathematics'], label: 'JEE' },
  NEET: { subjects: ['Physics', 'Chemistry', 'Biology'], label: 'NEET' },
};

const QUESTION_COUNT = 15;
const MARKS_PER_CORRECT = 4;
const PENALTY_PER_WRONG = 1;
const DURATION_MINUTES = 20;

const isTrack = (t) => Object.prototype.hasOwnProperty.call(TRACKS, t);

// The paper the browser is allowed to see: same questions, no answer key.
const withoutAnswers = (quiz) => ({
  quizDate: quiz.quizDate,
  track: quiz.track,
  durationMinutes: quiz.durationMinutes,
  marksPerCorrect: quiz.marksPerCorrect,
  penaltyPerWrong: quiz.penaltyPerWrong,
  totalMarks: quiz.totalMarks,
  questions: quiz.questions.map((q) => ({
    id: q.id, subject: q.subject, question: q.question, options: q.options,
  })),
});

// ── Paper generation ─────────────────────────────────────────────────────────

const buildPrompt = (track) => {
  const { subjects } = TRACKS[track];
  return `You are an experienced ${track} question paper setter in India.
Generate EXACTLY ${QUESTION_COUNT} single-correct-answer multiple choice questions for a daily ${track} practice test.

Subjects: ${subjects.join(', ')} — spread the questions roughly evenly across them.

Rules:
- ${track} level and style, drawn from the NCERT Class 11 and 12 syllabus.
- Exactly 4 options per question, with exactly one correct.
- The "answer" must be the exact text of the correct option, copied character for character.
- No two questions on the same concept.
- Self-contained text only: no diagrams, images or "refer to the figure".
- Write mathematics as plain Unicode text. Do NOT use LaTeX, backslash commands
  or $ delimiters: a backslash cannot survive a JSON string and arrives mangled
  ("\\circ" came back as "circ", "\\text{m/s}" as a tab followed by "ext{m/s}").
  Use the characters directly instead:
    superscripts  x², x³, 10⁻¹¹, 10⁸
    subscripts    H₂O, v₀, Iₐ
    symbols       ° × ÷ ± ≈ ≤ ≥ → ∞ √ ∫ Σ Δ π θ λ μ Ω α β γ
    units         m/s, m/s², N·m²/kg², J/mol·K
  Write fractions inline as (a + b)/c.

Return ONLY a valid JSON object:
{
  "questions": [
    { "id": "Q1", "subject": "<one of ${subjects.join('|')}>", "question": "...", "options": ["...","...","...","..."], "answer": "<exact text of the correct option>" }
  ]
}`;
};

// Anything the model gets wrong structurally is dropped rather than patched, so
// a malformed question can never reach a ranked paper.
// Signatures of LaTeX that did not survive the JSON round-trip. A backslash
// written into a JSON string is either interpreted (\\t became a tab, leaving
// "ext{m/s}") or stripped by the provider's JSON repair (\\circ arrived as
// "circ", \\mathrm as "mathrm"), so the maths reaches the student in pieces.
//   - backslash / control characters: the raw escape survived
//   - $...$: a delimiter pair that should never appear in Unicode maths
//   - ^{ or _{: LaTeX grouping braces, which catches a stripped "^{circ}" even
//     when the backslash and the dollars are both gone
// Deliberately not matching bare words like "times" or "text", which are
// ordinary English and would throw away good questions.
const MANGLED_LATEX = /[\\\t\r]|\$[^$]*\$|\^\{|_\{/;
const looksMangled = (s) => MANGLED_LATEX.test(s);

// True when any part of a stored paper shows those signatures.
const paperIsMangled = (quiz) => quiz.questions.some(
  (q) => looksMangled(q.question) || q.options.some((o) => looksMangled(o))
);

const sanitise = (raw, track) => {
  const { subjects } = TRACKS[track];
  const out = [];
  for (const q of raw) {
    if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) continue;
    if (looksMangled(q.question) || q.options.some((o) => looksMangled(String(o)))) continue;
    const options = q.options.map((o) => String(o).trim()).filter(Boolean);
    if (options.length !== 4) continue;
    const answer = String(q.answer || '').trim();
    if (!options.includes(answer)) continue; // answer must be one of the options
    if (new Set(options).size !== 4) continue; // no duplicate options
    out.push({
      id: `Q${out.length + 1}`,
      subject: subjects.includes(q.subject) ? q.subject : subjects[0],
      question: q.question.trim(),
      options,
      answer,
    });
    if (out.length === QUESTION_COUNT) break;
  }
  return out;
};

const generatePaper = async (track) => {
  const text = await callGroqAPI([
    { role: 'system', content: `Return only a valid JSON object with key "questions" holding exactly ${QUESTION_COUNT} items. No markdown.` },
    { role: 'user', content: buildPrompt(track) },
  ], 0.4, { type: 'json_object' }, 4000);

  const parsed = JSON.parse(text);
  const raw = parsed.questions || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]) || [];
  return sanitise(raw, track);
};

// Find today's paper, or make it. The unique index on (quizDate, track) is what
// keeps two simultaneous first-requests from creating two different papers:
// the loser of the race re-reads the winner's paper instead of using its own.
const ensureTodaysQuiz = async (track, quizDate) => {
  const existing = await DailyQuiz.findOne({ quizDate, track });
  if (existing && !paperIsMangled(existing)) return existing;

  if (existing) {
    // The paper predates the Unicode rule, or slipped through it. Replace it
    // rather than serving broken maths -- but never once somebody has already
    // been scored on it, because their result would stop matching the paper.
    const submitted = await QuizAttempt.countDocuments({ quizDate, track, status: 'submitted' });
    if (submitted > 0) {
      console.warn(
        `Daily ${track} paper for ${quizDate} contains mangled maths but ${submitted} ` +
        'attempt(s) have already been scored on it, so it is being left alone.'
      );
      return existing;
    }
    console.warn(`Replacing the mangled ${track} paper for ${quizDate}.`);
  }

  let questions = [];
  for (let attempt = 0; attempt < 2 && questions.length < QUESTION_COUNT; attempt++) {
    try {
      questions = await generatePaper(track);
    } catch (err) {
      console.warn(`Daily ${track} quiz generation attempt ${attempt + 1} failed:`, err.message);
    }
  }
  if (questions.length < QUESTION_COUNT) return null;

  const fields = {
    questions,
    marksPerCorrect: MARKS_PER_CORRECT,
    penaltyPerWrong: PENALTY_PER_WRONG,
    durationMinutes: DURATION_MINUTES,
    totalMarks: questions.length * MARKS_PER_CORRECT,
  };

  if (existing) {
    Object.assign(existing, fields);
    return existing.save();
  }

  try {
    return await DailyQuiz.create({ quizDate, track, ...fields });
  } catch (err) {
    if (err.code === 11000) return DailyQuiz.findOne({ quizDate, track }); // lost the race
    throw err;
  }
};

// ── Routes ───────────────────────────────────────────────────────────────────

// Today's paper in summary, plus where this student stands with it. Deliberately
// returns no questions: those only come from /start.
router.get('/today', async (req, res) => {
  const { userId } = identityOf(req);
  const track = String(req.query.track || '').toUpperCase();
  if (!isTrack(track)) return res.status(400).json({ error: 'track must be JEE or NEET' });

  const quizDate = istDateKey();
  try {
    const quiz = await ensureTodaysQuiz(track, quizDate);
    if (!quiz) {
      return res.status(503).json({
        error: `Today's ${track} quiz could not be prepared. Please try again in a few minutes.`,
      });
    }

    const attempt = await QuizAttempt.findOne({ userId, track, quizDate });
    return res.json({
      quizDate,
      track,
      questionCount: quiz.questions.length,
      durationMinutes: quiz.durationMinutes,
      marksPerCorrect: quiz.marksPerCorrect,
      penaltyPerWrong: quiz.penaltyPerWrong,
      totalMarks: quiz.totalMarks,
      subjects: TRACKS[track].subjects,
      attempt: attempt ? {
        status: attempt.status,
        score: attempt.score,
        correct: attempt.correct,
        wrong: attempt.wrong,
        unattempted: attempt.unattempted,
        ranked: attempt.ranked,
        autoSubmitted: attempt.autoSubmitted,
        timeTakenSeconds: attempt.timeTakenSeconds,
        submittedAt: attempt.submittedAt,
      } : null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Begin the attempt. Creating the row here is what starts the server's clock and
// spends the student's one go for the day.
router.post('/start', async (req, res) => {
  const { userId, username } = identityOf(req);
  const track = String(req.body.track || '').toUpperCase();
  if (!isTrack(track)) return res.status(400).json({ error: 'track must be JEE or NEET' });

  // Strict exam mode is the whole point of a ranked daily quiz, so the server
  // refuses to start one without it rather than trusting the UI to have asked.
  if (req.body.strictMode !== true) {
    return res.status(400).json({ error: 'The daily quiz can only be taken in strict exam mode.' });
  }

  const quizDate = istDateKey();
  try {
    const quiz = await ensureTodaysQuiz(track, quizDate);
    if (!quiz) {
      return res.status(503).json({
        error: `Today's ${track} quiz could not be prepared. Please try again in a few minutes.`,
      });
    }

    const existing = await QuizAttempt.findOne({ userId, track, quizDate });
    if (existing && existing.status === 'submitted') {
      return res.status(409).json({ error: `You have already taken today's ${track} quiz.` });
    }
    if (existing) {
      // Reconnecting to an attempt already in progress: same paper, same clock.
      return res.json({
        ...withoutAnswers(quiz),
        startedAt: existing.startedAt,
        secondsRemaining: Math.max(
          0,
          quiz.durationMinutes * 60 - Math.floor((Date.now() - existing.startedAt.getTime()) / 1000)
        ),
      });
    }

    const attempt = await QuizAttempt.create({
      userId, username, track, quizDate,
      totalMarks: quiz.totalMarks,
      strictMode: true,
      startedAt: new Date(),
    });

    return res.json({
      ...withoutAnswers(quiz),
      startedAt: attempt.startedAt,
      secondsRemaining: quiz.durationMinutes * 60,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: `You have already taken today's ${track} quiz.` });
    }
    return res.status(500).json({ error: error.message });
  }
});

// Grade it. The answer key never left the server, so this is the only place a
// score can be produced.
router.post('/submit', async (req, res) => {
  const { userId } = identityOf(req);
  const track = String(req.body.track || '').toUpperCase();
  const { answers = {}, violations = 0, autoSubmitted = false } = req.body;
  if (!isTrack(track)) return res.status(400).json({ error: 'track must be JEE or NEET' });

  const quizDate = istDateKey();
  try {
    const attempt = await QuizAttempt.findOne({ userId, track, quizDate });
    if (!attempt) return res.status(404).json({ error: 'Start the quiz before submitting it.' });
    if (attempt.status === 'submitted') {
      return res.status(409).json({ error: `You have already taken today's ${track} quiz.` });
    }

    const quiz = await DailyQuiz.findOne({ quizDate, track });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let correct = 0, wrong = 0, unattempted = 0;
    const review = quiz.questions.map((q) => {
      const chosen = answers[q.id];
      const attempted = typeof chosen === 'string' && chosen.trim() !== '';
      const isCorrect = attempted && chosen === q.answer;
      if (!attempted) unattempted++;
      else if (isCorrect) correct++;
      else wrong++;
      // Safe to reveal now that the attempt is closed.
      return { id: q.id, subject: q.subject, chosen: attempted ? chosen : null, answer: q.answer, correct: isCorrect };
    });

    const score = correct * quiz.marksPerCorrect - wrong * quiz.penaltyPerWrong;
    const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    attempt.answers = answers;
    attempt.status = 'submitted';
    attempt.score = score;
    attempt.correct = correct;
    attempt.wrong = wrong;
    attempt.unattempted = unattempted;
    attempt.totalMarks = quiz.totalMarks;
    attempt.submittedAt = new Date();
    attempt.timeTakenSeconds = Math.min(Math.max(elapsed, 0), quiz.durationMinutes * 60);
    attempt.violations = Number(violations) || 0;
    attempt.autoSubmitted = !!autoSubmitted;
    // Thrown out of the ranking if strict mode was abandoned part-way.
    attempt.ranked = attempt.strictMode && !autoSubmitted;
    await attempt.save();

    return res.json({
      score, correct, wrong, unattempted,
      totalMarks: quiz.totalMarks,
      timeTakenSeconds: attempt.timeTakenSeconds,
      ranked: attempt.ranked,
      autoSubmitted: attempt.autoSubmitted,
      review,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Leaderboard ──────────────────────────────────────────────────────────────

router.get('/leaderboard', async (req, res) => {
  const { userId } = identityOf(req);
  const track = String(req.query.track || '').toUpperCase();
  const period = req.query.period === 'today' ? 'today' : 'week';
  if (!isTrack(track)) return res.status(400).json({ error: 'track must be JEE or NEET' });

  try {
    const dates = period === 'today' ? [istDateKey()] : weekDateKeys(istWeekStart());

    const rows = await QuizAttempt.aggregate([
      { $match: { track, quizDate: { $in: dates }, status: 'submitted', ranked: true } },
      {
        $group: {
          _id: '$userId',
          username: { $last: '$username' },
          totalScore: { $sum: '$score' },
          quizzesTaken: { $sum: 1 },
          totalTime: { $sum: '$timeTakenSeconds' },
        },
      },
      // Faster wins a tie, which is the usual entrance-exam convention.
      { $sort: { totalScore: -1, totalTime: 1, username: 1 } },
      { $limit: 50 },
    ]);

    const board = rows.map((r, i) => ({
      rank: i + 1,
      userId: r._id,
      username: r.username,
      totalScore: r.totalScore,
      quizzesTaken: r.quizzesTaken,
      totalTimeSeconds: r.totalTime,
      isMe: r._id === userId,
    }));

    return res.json({
      track,
      period,
      weekStart: period === 'week' ? istWeekStart() : undefined,
      quizDate: period === 'today' ? istDateKey() : undefined,
      you: board.find((r) => r.isMe) || null,
      board,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Weekly badges ────────────────────────────────────────────────────────────

// Awards the badge for the most recently completed week, for both tracks.
// Idempotent: the unique index on (track, weekStart) means running it twice,
// or two instances running it at once, cannot produce two winners.
export const awardLastWeeksBadges = async () => {
  const lastWeek = previousWeekStart(istWeekStart());
  const dates = weekDateKeys(lastWeek);
  const week = describeWeek(lastWeek);
  const awarded = [];

  for (const track of Object.keys(TRACKS)) {
    if (await WeeklyBadge.findOne({ track, weekStart: lastWeek })) continue;

    const [top] = await QuizAttempt.aggregate([
      { $match: { track, quizDate: { $in: dates }, status: 'submitted', ranked: true } },
      {
        $group: {
          _id: '$userId',
          username: { $last: '$username' },
          totalScore: { $sum: '$score' },
          quizzesTaken: { $sum: 1 },
          totalTime: { $sum: '$timeTakenSeconds' },
        },
      },
      { $sort: { totalScore: -1, totalTime: 1, username: 1 } },
      { $limit: 1 },
    ]);
    if (!top) continue; // nobody played that week

    try {
      awarded.push(await WeeklyBadge.create({
        userId: top._id,
        username: top.username,
        track,
        ...week,
        totalScore: top.totalScore,
        quizzesTaken: top.quizzesTaken,
      }));
    } catch (err) {
      if (err.code !== 11000) throw err; // another instance got there first
    }
  }
  return awarded;
};

// Badges for a student's profile. Defaults to the caller.
router.get('/badges', async (req, res) => {
  const { userId } = identityOf(req);
  const target = req.query.userId || userId;
  try {
    const badges = await WeeklyBadge.find({ userId: target }).sort({ weekStart: -1 }).limit(50);
    return res.json(badges);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Settles last week if it has not been settled yet. Safe to call from anywhere;
// the UI pings it when the leaderboard is opened so no cron job is required.
router.post('/award-weekly', async (req, res) => {
  try {
    return res.json({ awarded: await awardLastWeeksBadges() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
