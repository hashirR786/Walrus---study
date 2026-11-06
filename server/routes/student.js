import express from 'express';
import UserProgress from '../models/UserProgress.js';
import MockTest from '../models/MockTest.js';
import DoubtForum from '../models/DoubtForum.js';
import SharedNote from '../models/SharedNote.js';
import StudyRoomMessage from '../models/StudyRoomMessage.js';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import Flashcard from '../models/Flashcard.js';
import { safeCache } from '../config/cache.js';
import { protect, identityOf } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every student route requires a valid token. Identity is read from the verified
// JWT via identityOf(req) -- userId/username in the body or query are ignored.
router.use(protect);

const DEFAULT_SYLLABUS = [
  {
    subjectName: 'Physics',
    chapters: [
      { chapterName: 'Electric Charges and Fields', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electrostatic Potential and Capacitance', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Current Electricity', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Moving Charges and Magnetism', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Magnetism and Matter', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electromagnetic Induction', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Alternating Current', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electromagnetic Waves', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Ray Optics and Optical Instruments', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Wave Optics', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Dual Nature of Radiation and Matter', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Atoms', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Nuclei', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Semiconductor Electronics: Materials, Devices & Simple Circuits', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Chemistry',
    chapters: [
      { chapterName: 'Solutions', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electrochemistry', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Chemical Kinetics', status: 'Todo', masteryScore: 0 },
      { chapterName: 'The d-and f-Block Elements', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Coordination Compounds', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Haloalkanes and Haloarenes', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Alcohols, Phenols and Ethers', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Aldehydes, Ketones and Carboxylic Acids', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Amines', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Biomolecules', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Mathematics',
    chapters: [
      { chapterName: 'Relations and Functions', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Inverse Trigonometric Functions', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Matrices', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Determinants', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Continuity and Differentiability', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Application of Derivatives', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Integrals', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Application of Integrals', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Differential Equations', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Vector Algebra', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Three Dimensional Geometry', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Linear Programming', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Probability', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Biology',
    chapters: [
      { chapterName: 'Sexual Reproduction in Flowering Plants', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Human Reproduction', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Reproductive Health', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Principles of Inheritance and Variation', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Molecular Basis of Inheritance', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Evolution', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Human Health and Disease', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Microbes in Human Welfare', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Biotechnology: Principles and Processes', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Biotechnology and its Applications', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Organisms and Populations', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Ecosystem', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Biodiversity and Conservation', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Economics',
    chapters: [
      { chapterName: 'Introduction to Macroeconomics & National Income Accounting', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Money and Banking', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Determination of Income and Employment', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Government Budget and the Economy', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Balance of Payments & Foreign Exchange Rate', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Development Experience (1947-90) & Economic Reforms since 1991', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Current Challenges facing Indian Economy', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Development Experience of India: A Comparison with Neighbours', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Computer Science',
    chapters: [
      { chapterName: 'Exception Handling', status: 'Todo', masteryScore: 0 },
      { chapterName: 'File Handling', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Stack', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Queue', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Searching', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Sorting', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Database Concepts', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Structured Query Language (SQL)', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Computer Networks', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Data Communication and Network Security', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Interface Python with SQL (MySQL Connectivity)', status: 'Todo', masteryScore: 0 }
    ]
  }
];

const DEFAULT_GOALS = [
  { taskName: 'Complete 1 Pomodoro study session', completed: false },
  { taskName: 'Ask the AI Doubt Solver a question', completed: false },
  { taskName: 'Update chapter completion checklist', completed: false }
];

// Helper to update streaks
const calculateStreak = (streak) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!streak.lastActive) {
    return { count: 1, lastActive: today };
  }

  const lastActiveDate = new Date(streak.lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today - lastActiveDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already active today, do nothing
    return streak;
  } else if (diffDays === 1) {
    // Consecutive day, increment
    return { count: streak.count + 1, lastActive: today };
  } else {
    // Streak broken, reset
    return { count: 1, lastActive: today };
  }
};

// ── Strict exam mode warning counter ────────────────────────────────────────
// safeCache swallows every error and returns null when Redis is unreachable, so
// `safeCache.incr` used to hand back null here. The route then answered 200 with
// warnings: null, which is not >= 3, so the exam never auto-submitted and the
// overlay rendered "Violation Count: null / 3". Redis is optional in this setup,
// which made that the default behaviour on a fresh deploy.
//
// The counter now falls back to process memory. That is per-instance and lost on
// restart, but it is strictly better than counting in the browser, where a page
// reload would clear the tally -- exactly the cheat strict mode exists to catch.
const localWarnings = new Map(); // warningKey -> { count, expiresAt }

const pruneLocalWarnings = () => {
  const now = Date.now();
  for (const [key, entry] of localWarnings) {
    if (entry.expiresAt <= now) localWarnings.delete(key);
  }
};

const incrementWarnings = async (key, ttlSeconds) => {
  const fromCache = await safeCache.incr(key);
  if (typeof fromCache === 'number') {
    // First warning of this exam: expire the key shortly after the exam ends.
    if (fromCache === 1) await safeCache.expire(key, ttlSeconds);
    return fromCache;
  }

  pruneLocalWarnings();
  const existing = localWarnings.get(key);
  const count = existing ? existing.count + 1 : 1;
  localWarnings.set(key, { count, expiresAt: Date.now() + ttlSeconds * 1000 });
  return count;
};

const clearWarnings = async (key) => {
  await safeCache.del(key);
  localWarnings.delete(key);
};

// One ownership rule for every community record. Documents created before
// ownerId existed fall back to the display name, which is the only record of who
// wrote them. `nameField` is whatever that document calls its author.
const ownsRecord = (doc, userId, username, nameField) =>
  doc.ownerId ? doc.ownerId === userId : doc[nameField] === username;

const ownsAnswer = (ans, userId, username) => ownsRecord(ans, userId, username, 'answeredBy');

// ── Study room presence ──────────────────────────────────────────────────────
// Mirrored in process memory. Presence was the one study room feature that died
// completely when no cache was reachable: heartbeats wrote nothing and the peer
// list came back empty, while chat carried on because it is MongoDB-backed --
// exactly the "0 online with a working chat" that showed up in production.
// On a single instance this map is sufficient by itself; where a cache is
// available the two are merged so separate instances still see each other.
const PRESENCE_TTL_SECONDS = 35;
const localPresence = new Map(); // username -> { payload, expiresAt }

const prunePresence = () => {
  const now = Date.now();
  for (const [name, entry] of localPresence) {
    if (entry.expiresAt <= now) localPresence.delete(name);
  }
};

const rememberPresence = (payload) => {
  localPresence.set(payload.username, {
    payload,
    expiresAt: Date.now() + PRESENCE_TTL_SECONDS * 1000
  });
};

const forgetPresence = (username) => localPresence.delete(username);

// Local first, then anything the cache knows from other instances; keyed by
// username so the same student is never counted twice.
const readPresence = async () => {
  prunePresence();
  const byName = new Map();
  for (const entry of localPresence.values()) {
    byName.set(entry.payload.username, entry.payload);
  }
  const keys = await safeCache.keys('presence:studyroom:*');
  for (const key of keys || []) {
    try {
      const raw = await safeCache.get(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username) byName.set(parsed.username, parsed);
    } catch { /* skip malformed */ }
  }
  return [...byName.values()];
};

// ── Shared study room Pomodoro ───────────────────────────────────────────────
// One clock for the whole room. The server stores a descriptor rather than a
// ticking counter, and every read computes the remaining seconds itself; clients
// tick locally between polls purely for smoothness. Handing back seconds instead
// of an absolute end time keeps a student whose device clock is wrong in step
// with everyone else.
const TIMER_KEY = 'studyroom:timer';
const DEFAULT_SESSION_SECONDS = 1500; // 25 minutes
const MAX_SESSION_SECONDS = 7200;

// Mirrored in process memory so the room still works on a single instance when
// the cache is unreachable -- safeCache silently returning null is exactly what
// left presence broken.
let localTimer = null;

const defaultTimer = () => ({
  running: false,
  duration: DEFAULT_SESSION_SECONDS,
  endsAt: null,
  remaining: DEFAULT_SESSION_SECONDS,
  updatedBy: '',
  updatedAt: Date.now()
});

const readTimer = async () => {
  const raw = await safeCache.get(TIMER_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* corrupt entry, fall through */ }
  }
  return localTimer || defaultTimer();
};

const writeTimer = async (state) => {
  localTimer = state;
  await safeCache.set(TIMER_KEY, JSON.stringify(state), { EX: 24 * 60 * 60 });
  return state;
};

// Collapses a stored descriptor into what is true right now.
const projectTimer = (state) => {
  if (!state.running || !state.endsAt) {
    return { ...state, remaining: Math.max(0, Math.round(state.remaining)) };
  }
  return { ...state, remaining: Math.max(0, Math.round((state.endsAt - Date.now()) / 1000)) };
};

// endsAt is server bookkeeping; clients only ever see seconds.
const publicTimer = (s) => ({
  running: s.running,
  remaining: s.remaining,
  duration: s.duration,
  updatedBy: s.updatedBy,
  updatedAt: s.updatedAt
});

// 1. Get/Initialize Student Profile
router.get('/progress', async (req, res) => {
  const { userId } = identityOf(req);
  try {
    let progress = await UserProgress.findOne({ userId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        subjectProgress: DEFAULT_SYLLABUS,
        dailyGoals: DEFAULT_GOALS,
        streak: { count: 0, lastActive: null }
      });
      await progress.save();
    } else {
      // Auto-patch missing subjects from DEFAULT_SYLLABUS
      let updated = false;
      const existingSubjectNames = progress.subjectProgress.map(s => s.subjectName);
      for (const defaultSub of DEFAULT_SYLLABUS) {
        if (!existingSubjectNames.includes(defaultSub.subjectName)) {
          progress.subjectProgress.push({
            subjectName: defaultSub.subjectName,
            chapters: defaultSub.chapters.map(ch => ({ ...ch }))
          });
          updated = true;
        }
      }
      if (updated) {
        await progress.save();
      }
    }
    
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Update Chapter checklist status
router.post('/progress/chapter', async (req, res) => {
  const { userId } = identityOf(req);
  const { subjectName, chapterName, status, masteryScore } = req.body;

  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({ userId, subjectProgress: DEFAULT_SYLLABUS, dailyGoals: DEFAULT_GOALS });
    }

    const sub = progress.subjectProgress.find(s => s.subjectName === subjectName);
    if (sub) {
      const ch = sub.chapters.find(c => c.chapterName === chapterName);
      if (ch) {
        if (status !== undefined) ch.status = status;
        if (masteryScore !== undefined) ch.masteryScore = masteryScore;
      } else {
        sub.chapters.push({ chapterName, status: status || 'Todo', masteryScore: masteryScore || 0 });
      }
    } else {
      progress.subjectProgress.push({
        subjectName,
        chapters: [{ chapterName, status: status || 'Todo', masteryScore: masteryScore || 0 }]
      });
    }

    // Trigger streak calculation
    progress.streak = calculateStreak(progress.streak);

    await progress.save();
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. Add daily study minutes
router.post('/progress/study-time', async (req, res) => {
  const { userId } = identityOf(req);
  const { minutes } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({ userId, subjectProgress: DEFAULT_SYLLABUS, dailyGoals: DEFAULT_GOALS });
    }

    const index = progress.studyTime.findIndex(s => s.date === todayStr);
    if (index !== -1) {
      progress.studyTime[index].minutes += minutes;
    } else {
      progress.studyTime.push({ date: todayStr, minutes });
    }

    progress.streak = calculateStreak(progress.streak);
    await progress.save();
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. Toggle Daily Goal completion
router.post('/progress/goal', async (req, res) => {
  const { userId } = identityOf(req);
  const { taskName, completed } = req.body;

  try {
    const progress = await UserProgress.findOne({ userId });
    if (!progress) return res.status(404).json({ error: 'Profile not found' });

    const goal = progress.dailyGoals.find(g => g.taskName === taskName);
    if (goal) {
      goal.completed = completed;
    }

    await progress.save();
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. Reset Daily Goals (used daily or when streak starts fresh)
router.post('/progress/reset-goals', async (req, res) => {
  const { userId } = identityOf(req);
  try {
    const progress = await UserProgress.findOne({ userId });
    if (!progress) return res.status(404).json({ error: 'Profile not found' });

    progress.dailyGoals = DEFAULT_GOALS.map(g => ({ ...g, completed: false }));
    await progress.save();
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 6. Get Mock Tests history
router.get('/tests', async (req, res) => {
  const { userId } = identityOf(req);
  try {
    const tests = await MockTest.find({ userId }).sort({ attemptedAt: -1 });
    return res.json(tests);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 7. Save completed Mock Test
router.post('/tests', async (req, res) => {
  const { userId } = identityOf(req);
  const { subject, testType, chapter, generatedPaper, answers, score, totalMarks, feedback } = req.body;

  try {
    const newTest = new MockTest({
      userId,
      subject,
      testType,
      chapter,
      generatedPaper,
      answers,
      score,
      totalMarks,
      feedback
    });
    await newTest.save();

    // If score is logged, dynamically update the masteryScore for that chapter!
    if (score !== null && totalMarks > 0) {
      // Clamp: the score comes back from the LLM examiner and has been seen to
      // exceed the paper total.
      const percentage = Math.max(0, Math.min(100, Math.round((score / totalMarks) * 100)));
      let progress = await UserProgress.findOne({ userId });
      if (progress) {
        const sub = progress.subjectProgress.find(s => s.subjectName === subject);
        if (sub) {
          const ch = sub.chapters.find(c => c.chapterName === chapter);
          if (ch) {
            // Resist drops, trust gains. Overwriting outright meant one rushed
            // 30-minute sprint dropped a 92% chapter to 40% and took its
            // Completed status with it. Smoothing both directions equally would
            // have been its own annoyance -- a student scoring 100% would see
            // 65% -- so an improvement counts in full and only a worse score is
            // damped.
            // Rows predating the attempts counter are recognised by a non-zero
            // mastery score, so their history is not thrown away either.
            const hasHistory = (ch.attempts || 0) > 0 || ch.masteryScore > 0;
            ch.masteryScore = !hasHistory || percentage >= ch.masteryScore
              ? percentage
              : Math.round(ch.masteryScore * 0.7 + percentage * 0.3);
            ch.attempts = (ch.attempts || 0) + 1;
            ch.status = ch.masteryScore >= 80 ? 'Completed' : 'InProgress';
          }
        }
        await progress.save();
      }
    }

    return res.json(newTest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 8. Get Forum Threads
router.get('/forum', async (req, res) => {
  try {
    const threads = await DoubtForum.find().sort({ createdAt: -1 });
    return res.json(threads);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 9. Create Forum Thread
router.post('/forum', async (req, res) => {
  const { userId, username } = identityOf(req);
  const { title, content, subject, chapter } = req.body;

  try {
    const thread = new DoubtForum({
      title,
      content,
      subject,
      chapter: chapter || 'General',
      askedBy: username,
      ownerId: userId
    });
    await thread.save();
    return res.json(thread);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 10. Post Answer to Forum thread
router.post('/forum/:id/answer', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);
  const { content, isAI } = req.body;

  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.answers.push({
      answeredBy: username,
      content,
      isAI: !!isAI,
      upvotes: 0,
      ownerId: userId
    });

    await thread.save();
    return res.json(thread);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 11. Upvote Answer in Forum thread
router.post('/forum/:id/answer/:answerId/upvote', async (req, res) => {
  const { id, answerId } = req.params;

  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const ans = thread.answers.id(answerId);
    if (ans) {
      ans.upvotes += 1;
    }

    await thread.save();
    return res.json(thread);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 11b. Edit your own answer
router.put('/forum/:id/answer/:answerId', async (req, res) => {
  const { id, answerId } = req.params;
  const { userId, username } = identityOf(req);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Answer content is required' });
  }

  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const ans = thread.answers.id(answerId);
    if (!ans) return res.status(404).json({ error: 'Answer not found' });
    if (!ownsAnswer(ans, userId, username)) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }
    // The AI wrote this text. Letting a student rewrite it and leave the AI Tutor
    // label attached would put words in its mouth for everyone else reading.
    if (ans.isAI) {
      return res.status(403).json({ error: 'AI answers cannot be edited' });
    }

    ans.content = content.trim();
    ans.editedAt = new Date();
    await thread.save();
    return res.json(thread);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 11c. Delete your own answer
router.delete('/forum/:id/answer/:answerId', async (req, res) => {
  const { id, answerId } = req.params;
  const { userId, username } = identityOf(req);

  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const ans = thread.answers.id(answerId);
    if (!ans) return res.status(404).json({ error: 'Answer not found' });
    if (!ownsAnswer(ans, userId, username)) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    thread.answers.pull(answerId);
    await thread.save();
    return res.json(thread);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 11d. Edit your own thread
router.put('/forum/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);
  const { title, content, subject } = req.body;

  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (!ownsRecord(thread, userId, username, 'askedBy')) {
      return res.status(403).json({ error: 'You can only edit your own questions' });
    }

    thread.title = title.trim();
    thread.content = content.trim();
    if (subject) thread.subject = subject;
    thread.editedAt = new Date();

    await thread.save();
    return res.json(thread);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 12. Delete Forum Thread
router.delete('/forum/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);
  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    if (!ownsRecord(thread, userId, username, 'askedBy')) {
      return res.status(403).json({ error: 'You can only delete your own threads' });
    }

    await thread.deleteOne();
    return res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 13. Get all shared notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await SharedNote.find().sort({ createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 14. Create shared note
router.post('/notes', async (req, res) => {
  const { userId, username } = identityOf(req);
  const { title, subject, description, link, image } = req.body;
  try {
    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and subject are required' });
    }
    const note = new SharedNote({
      title,
      subject,
      description: description || '',
      link: link || '',
      image: image || '',
      author: username,
      ownerId: userId
    });
    await note.save();
    return res.json(note);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 14b. Edit your own shared note
router.put('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);
  const { title, subject, description, link } = req.body;

  if (!title || !title.trim() || !subject) {
    return res.status(400).json({ error: 'Title and subject are required' });
  }

  try {
    const note = await SharedNote.findById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (!ownsRecord(note, userId, username, 'author')) {
      return res.status(403).json({ error: 'You can only edit your own notes' });
    }

    note.title = title.trim();
    note.subject = subject;
    note.description = description || '';
    note.link = link || '';
    // The image is left alone: replacing it is an upload, which goes through
    // the create form rather than this inline edit.
    note.editedAt = new Date();

    await note.save();
    return res.json(note);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 15. Delete shared note
router.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);
  try {
    const note = await SharedNote.findById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!ownsRecord(note, userId, username, 'author')) {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }

    await note.deleteOne();
    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 16. Get all study room messages
router.get('/studyroom/messages', async (req, res) => {
  try {
    const messages = await StudyRoomMessage.find().sort({ createdAt: -1 }).limit(100);
    return res.json(messages.reverse());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 17. Post a study room message
router.post('/studyroom/messages', async (req, res) => {
  const { userId, username } = identityOf(req);
  const { text } = req.body;
  try {
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const message = new StudyRoomMessage({ sender: username, text, ownerId: userId });
    await message.save();
    return res.json(message);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 17b. Edit your own study room message
router.put('/studyroom/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const message = await StudyRoomMessage.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (!ownsRecord(message, userId, username, 'sender')) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    message.text = text.trim();
    message.editedAt = new Date();
    await message.save();
    return res.json(message);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 17c. Delete your own study room message
router.delete('/studyroom/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = identityOf(req);

  try {
    const message = await StudyRoomMessage.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (!ownsRecord(message, userId, username, 'sender')) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await message.deleteOne();
    return res.json({ message: 'Message deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 18. Heartbeat — called every ~20s by the frontend to mark user as online in study room
router.post('/studyroom/heartbeat', async (req, res) => {
  const { username } = identityOf(req);
  const { status, focusSubject } = req.body;
  try {
    // Expires after 35s: miss one ping and you still show, miss two and you drop.
    const payload = {
      username,
      status: status || 'Studying',
      focusSubject: focusSubject || 'General',
      lastSeen: Date.now()
    };
    rememberPresence(payload);
    await safeCache.setEx(`presence:studyroom:${username}`, PRESENCE_TTL_SECONDS, JSON.stringify(payload));
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 18b. Leave — explicitly remove presence key when user leaves the study room
router.post('/studyroom/leave', async (req, res) => {
  const { username } = identityOf(req);
  try {
    forgetPresence(username);
    await safeCache.del(`presence:studyroom:${username}`);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 19. Who is concurrently in the study room
router.get('/studyroom/users', async (req, res) => {
  try {
    return res.json(await readPresence());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// 19b. Read the shared room timer
router.get('/studyroom/timer', async (req, res) => {
  try {
    let state = projectTimer(await readTimer());
    // The session ran out while nobody was looking: park it at a full session
    // so the next student starts cleanly.
    if (state.running && state.remaining === 0) {
      state = await writeTimer({
        ...state, running: false, endsAt: null, remaining: state.duration
      });
    }
    return res.json(publicTimer(state));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 19c. Start, pause or reset the shared room timer
router.post('/studyroom/timer', async (req, res) => {
  const { username } = identityOf(req);
  const { action, duration } = req.body;

  if (!['start', 'pause', 'reset'].includes(action)) {
    return res.status(400).json({ error: "action must be 'start', 'pause' or 'reset'" });
  }

  try {
    const current = projectTimer(await readTimer());
    let next;

    if (action === 'start') {
      // Resuming picks up where the room left off; a finished session restarts.
      const remaining = current.remaining > 0 ? current.remaining : current.duration;
      next = { ...current, running: true, endsAt: Date.now() + remaining * 1000, remaining };
    } else if (action === 'pause') {
      next = { ...current, running: false, endsAt: null, remaining: current.remaining };
    } else {
      const asked = Number(duration);
      const d = Number.isFinite(asked) && asked > 0
        ? Math.min(Math.round(asked), MAX_SESSION_SECONDS)
        : current.duration;
      next = { running: false, duration: d, endsAt: null, remaining: d };
    }

    next.updatedBy = username;
    next.updatedAt = Date.now();
    await writeTimer(next);

    return res.json(publicTimer(projectTimer(next)));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 19. Get all chat sessions for a student (most recent first)
router.get('/chat-sessions', async (req, res) => {
  const { username } = identityOf(req);
  try {
    const cacheKey = `student:chats:${username}`;
    const cachedData = await safeCache.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const sessions = await ChatSession.find({ username })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('_id subject chapter mode title createdAt updatedAt messages');
      
    try {
      await safeCache.set(cacheKey, JSON.stringify(sessions), { EX: 1800 });
    } catch (e) {
      console.warn('RedVER write error for chat sessions:', e.message);
    }
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 20. Save / create a chat session
router.post('/chat-sessions', async (req, res) => {
  const { username } = identityOf(req);
  const { subject, chapter, mode, messages, sessionId } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages are required' });
  try {
    // Auto-generate title from first user message (max 60 chars)
    const firstUserMsg = messages.find(m => m.role === 'user');
    const autoTitle = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : '')
      : `${subject || 'Session'} — ${new Date().toLocaleDateString()}`;

    let session;
    if (sessionId) {
      // Update an existing session, but only if the caller owns it.
      const existing = await ChatSession.findById(sessionId);
      if (!existing) return res.status(404).json({ error: 'Session not found' });
      if (existing.username !== username) {
        return res.status(403).json({ error: 'Not authorized to modify this session' });
      }
      existing.messages = messages;
      existing.updatedAt = new Date();
      existing.title = autoTitle;
      session = await existing.save();
    } else {
      // Create new session
      session = new ChatSession({
        username, subject, chapter, mode, title: autoTitle, messages
      });
      await session.save();
    }
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Invalidate the sessions list cache
    const cacheKey = `student:chats:${username}`;
    try {
      await safeCache.del(cacheKey);
      
      // Cache this specific active session state for fast retrieval/persistence on refresh
      const sessionCacheKey = `student:chats:active:${username}`;
      await safeCache.set(sessionCacheKey, JSON.stringify(session), { EX: 1800 });
    } catch (e) {
      console.warn('RedVER cache error in saving chat session:', e.message);
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 21. Delete a chat session
router.delete('/chat-sessions/:id', async (req, res) => {
  const { username } = identityOf(req);
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.username !== username) {
      return res.status(403).json({ error: 'You can only delete your own sessions' });
    }
    await session.deleteOne();

    // Invalidate the sessions list cache
    const cacheKey = `student:chats:${session.username}`;
    try {
      await safeCache.del(cacheKey);

      // If it was the active chat, clear the active chat cache as well
      const sessionCacheKey = `student:chats:active:${session.username}`;
      const cachedSessionStr = await safeCache.get(sessionCacheKey);
      if (cachedSessionStr) {
        const cachedSession = JSON.parse(cachedSessionStr);
        if (cachedSession._id === req.params.id) {
          await safeCache.del(sessionCacheKey);
        }
      }
    } catch (e) {
      console.warn('RedVER cache error in deleting chat session:', e.message);
    }

    return res.json({ message: 'Session deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 22. Get all flashcards for a user
router.get('/flashcards', async (req, res) => {
  const { userId } = identityOf(req);
  try {
    const flashcards = await Flashcard.find({ userId });
    return res.json(flashcards);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 23. Add a custom manual flashcard
router.post('/flashcards', async (req, res) => {
  const { userId } = identityOf(req);
  const { subject, chapter, question, answer } = req.body;
  if (!subject || !chapter || !question || !answer) {
    return res.status(400).json({ error: 'Subject, chapter, question, and answer are required.' });
  }
  try {
    const newCard = new Flashcard({ userId, subject, chapter, question, answer });
    await newCard.save();
    return res.json(newCard);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 24. Review a flashcard (Leitner system algorithm update)
router.post('/flashcards/review', async (req, res) => {
  const { userId } = identityOf(req);
  const { cardId, passed } = req.body;
  if (!cardId) {
    return res.status(400).json({ error: 'Card ID is required.' });
  }
  try {
    const card = await Flashcard.findById(cardId);
    if (!card) return res.status(404).json({ error: 'Flashcard not found.' });
    if (card.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to review this card' });
    }

    let nextBox = card.box;
    let daysToAdd = 1;

    if (passed) {
      nextBox = Math.min(card.box + 1, 3);
      daysToAdd = nextBox === 2 ? 3 : nextBox === 3 ? 7 : 1;
    } else {
      nextBox = 1;
      daysToAdd = 1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    card.box = nextBox;
    card.nextReviewDate = nextReview;
    await card.save();

    return res.json(card);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 25. Delete a flashcard
router.delete('/flashcards/:id', async (req, res) => {
  const { userId } = identityOf(req);
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Flashcard not found.' });
    if (card.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own cards' });
    }
    await card.deleteOne();
    return res.json({ message: 'Flashcard deleted.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 26. Track Strict Exam Mode Warnings (RedVER Cache)
router.post('/exam/warning', async (req, res) => {
  const { userId: studentId } = identityOf(req);
  const { examId, durationMinutes } = req.body;
  if (!examId) {
    return res.status(400).json({ error: 'examId is required.' });
  }
  const warningKey = `exam:warning:${studentId}:${examId}`;
  // Exam length plus a 10 minute buffer.
  const ttlSeconds = ((Number(durationMinutes) || 60) * 60) + 600;
  try {
    const currentWarnings = await incrementWarnings(warningKey, ttlSeconds);

    if (currentWarnings >= 3) {
      return res.json({ action: 'AUTO_SUBMIT', warnings: currentWarnings });
    }
    return res.json({ action: 'WARN', warnings: currentWarnings });
  } catch (error) {
    console.error('RedVER warning tracking error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 27. Reset/Clear warning count for a new exam session
router.post('/exam/warning/reset', async (req, res) => {
  const { userId: studentId } = identityOf(req);
  const { examId } = req.body;
  if (!examId) {
    return res.status(400).json({ error: 'examId is required.' });
  }
  const warningKey = `exam:warning:${studentId}:${examId}`;
  try {
    await clearWarnings(warningKey);
    return res.json({ success: true, warnings: 0 });
  } catch (error) {
    console.error('RedVER warning reset error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 28. Get active chat session cache (RedVER)
router.get('/chat-sessions/active', async (req, res) => {
  const { username } = identityOf(req);
  try {
    const sessionCacheKey = `student:chats:active:${username}`;
    const cachedSession = await safeCache.get(sessionCacheKey);
    if (cachedSession) {
      return res.json(JSON.parse(cachedSession));
    }
    return res.json(null);
  } catch (error) {
    console.error('RedVER get active session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 29. Set active chat session cache (RedVER)
router.post('/chat-sessions/active', async (req, res) => {
  const { username } = identityOf(req);
  const { session } = req.body;
  if (!session) return res.status(400).json({ error: 'session is required' });
  try {
    const sessionCacheKey = `student:chats:active:${username}`;
    await safeCache.set(sessionCacheKey, JSON.stringify(session), { EX: 1800 });
    return res.json({ success: true });
  } catch (error) {
    console.error('RedVER set active session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 30. Clear active chat session cache (RedVER)
router.post('/chat-sessions/active/clear', async (req, res) => {
  const { username } = identityOf(req);
  try {
    const sessionCacheKey = `student:chats:active:${username}`;
    await safeCache.del(sessionCacheKey);
    return res.json({ success: true });
  } catch (error) {
    console.error('RedVER clear active session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
