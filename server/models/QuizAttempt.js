import mongoose from 'mongoose';

// One row per student per track per day, created the moment they start so the
// clock is the server's and the one-attempt rule cannot be restarted around.
// Scores are computed server-side from the stored paper; nothing the client
// sends is trusted beyond which option it picked.
const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true }, // denormalised so the board needs no join
  track: { type: String, enum: ['JEE', 'NEET'], required: true },
  quizDate: { type: String, required: true },  // YYYY-MM-DD, IST

  status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },

  // { questionId: 'chosen option text' }
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },

  score: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  unattempted: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },

  // Both server-stamped: a client-reported duration would be the easiest thing
  // in the world to fake, and it is the leaderboard tie-breaker.
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: null },
  timeTakenSeconds: { type: Number, default: 0 },

  // An attempt only counts towards the leaderboard if it ran under strict exam
  // mode and was not auto-submitted for violations.
  strictMode: { type: Boolean, default: false },
  violations: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  ranked: { type: Boolean, default: false },
}, { timestamps: true });

// The one-attempt-per-day rule, enforced by the database rather than by a check
// two concurrent requests could both pass.
QuizAttemptSchema.index({ userId: 1, track: 1, quizDate: 1 }, { unique: true });
// Leaderboard reads
QuizAttemptSchema.index({ track: 1, quizDate: 1, ranked: 1 });

export default mongoose.model('QuizAttempt', QuizAttemptSchema);
