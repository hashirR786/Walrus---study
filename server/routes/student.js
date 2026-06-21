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

const router = express.Router();

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

// 1. Get/Initialize Student Profile
router.get('/progress', async (req, res) => {
  const userId = req.query.userId || 'default-student';
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
  const { userId = 'default-student', subjectName, chapterName, status, masteryScore } = req.body;

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
  const { userId = 'default-student', minutes } = req.body;
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
  const { userId = 'default-student', taskName, completed } = req.body;

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
  const { userId = 'default-student' } = req.body;
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
  const userId = req.query.userId || 'default-student';
  try {
    const tests = await MockTest.find({ userId }).sort({ attemptedAt: -1 });
    return res.json(tests);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 7. Save completed Mock Test
router.post('/tests', async (req, res) => {
  const { userId = 'default-student', subject, testType, chapter, generatedPaper, answers, score, totalMarks, feedback } = req.body;

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
      const percentage = Math.round((score / totalMarks) * 100);
      let progress = await UserProgress.findOne({ userId });
      if (progress) {
        const sub = progress.subjectProgress.find(s => s.subjectName === subject);
        if (sub) {
          const ch = sub.chapters.find(c => c.chapterName === chapter);
          if (ch) {
            ch.masteryScore = percentage;
            ch.status = percentage >= 80 ? 'Completed' : 'InProgress';
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
  const { title, content, subject, chapter, askedBy } = req.body;

  try {
    const thread = new DoubtForum({
      title,
      content,
      subject,
      chapter: chapter || 'General',
      askedBy: askedBy || 'Student'
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
  const { answeredBy, content, isAI } = req.body;

  try {
    const thread = await DoubtForum.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.answers.push({
      answeredBy: answeredBy || 'Peer',
      content,
      isAI: !!isAI,
      upvotes: 0
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

// 12. Delete Forum Thread
router.delete('/forum/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await DoubtForum.findByIdAndDelete(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
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
  const { title, subject, description, link, image, author } = req.body;
  try {
    if (!title || !subject || !author) {
      return res.status(400).json({ error: 'Title, subject, and author are required' });
    }
    const note = new SharedNote({
      title,
      subject,
      description: description || '',
      link: link || '',
      image: image || '',
      author
    });
    await note.save();
    return res.json(note);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 15. Delete shared note
router.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const note = await SharedNote.findByIdAndDelete(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
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
  const { sender, text } = req.body;
  try {
    if (!sender || !text) {
      return res.status(400).json({ error: 'Sender and text are required' });
    }
    const message = new StudyRoomMessage({ sender, text });
    await message.save();
    return res.json(message);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 18. Heartbeat — called every ~20s by the frontend to mark user as online in study room
router.post('/studyroom/heartbeat', async (req, res) => {
  const { username, status, focusSubject } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
  try {
    // Key expires after 35 seconds — if client misses 1 ping it will still appear, but 2 misses = offline
    const presenceKey = `presence:studyroom:${username}`;
    const payload = JSON.stringify({ username, status: status || 'Studying', focusSubject: focusSubject || 'General', lastSeen: Date.now() });
    await safeCache.setEx(presenceKey, 35, payload);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 18b. Leave — explicitly remove presence key when user leaves the study room
router.post('/studyroom/leave', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
  try {
    await safeCache.del(`presence:studyroom:${username}`);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 19. Get ONLY concurrently online study room users (via Redis presence keys)
router.get('/studyroom/users', async (req, res) => {
  try {
    const presenceKeys = await safeCache.keys('presence:studyroom:*');
    if (!presenceKeys || presenceKeys.length === 0) {
      return res.json([]);
    }
    // Parse each presence record stored in Redis
    const peers = [];
    for (const key of presenceKeys) {
      try {
        const raw = await safeCache.get(key);
        if (raw) peers.push(JSON.parse(raw));
      } catch { /* skip malformed */ }
    }
    return res.json(peers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// 19. Get all chat sessions for a student (most recent first)
router.get('/chat-sessions', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username query param required' });
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
  const { username, subject, chapter, mode, messages, sessionId } = req.body;
  if (!username || !messages) return res.status(400).json({ error: 'username and messages are required' });
  try {
    // Auto-generate title from first user message (max 60 chars)
    const firstUserMsg = messages.find(m => m.role === 'user');
    const autoTitle = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : '')
      : `${subject || 'Session'} — ${new Date().toLocaleDateString()}`;

    let session;
    if (sessionId) {
      // Update existing session
      session = await ChatSession.findByIdAndUpdate(
        sessionId,
        { messages, updatedAt: new Date(), title: autoTitle },
        { new: true }
      );
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
  try {
    const session = await ChatSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

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
  const userId = req.query.userId || 'default-student';
  try {
    const flashcards = await Flashcard.find({ userId });
    return res.json(flashcards);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 23. Add a custom manual flashcard
router.post('/flashcards', async (req, res) => {
  const { userId = 'default-student', subject, chapter, question, answer } = req.body;
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
  const { cardId, passed } = req.body;
  if (!cardId) {
    return res.status(400).json({ error: 'Card ID is required.' });
  }
  try {
    const card = await Flashcard.findById(cardId);
    if (!card) return res.status(404).json({ error: 'Flashcard not found.' });

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
  try {
    const deleted = await Flashcard.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Flashcard not found.' });
    return res.json({ message: 'Flashcard deleted.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 26. Track Strict Exam Mode Warnings (RedVER Cache)
router.post('/exam/warning', async (req, res) => {
  const { studentId, examId, durationMinutes } = req.body;
  if (!studentId || !examId) {
    return res.status(400).json({ error: 'studentId and examId are required.' });
  }
  const warningKey = `exam:warning:${studentId}:${examId}`;
  try {
    const currentWarnings = await safeCache.incr(warningKey);
    
    // On the first warning, set the key to expire when the exam ends (+10 mins buffer)
    if (currentWarnings === 1) {
      const expirySeconds = ((durationMinutes || 60) * 60) + 600;
      await safeCache.expire(warningKey, expirySeconds);
    }
    
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
  const { studentId, examId } = req.body;
  if (!studentId || !examId) {
    return res.status(400).json({ error: 'studentId and examId are required.' });
  }
  const warningKey = `exam:warning:${studentId}:${examId}`;
  try {
    await safeCache.del(warningKey);
    return res.json({ success: true, warnings: 0 });
  } catch (error) {
    console.error('RedVER warning reset error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 28. Get active chat session cache (RedVER)
router.get('/chat-sessions/active', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username query param required' });
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
  const { username, session } = req.body;
  if (!username || !session) return res.status(400).json({ error: 'username and session are required' });
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
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
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
