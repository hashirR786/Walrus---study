import mongoose from 'mongoose';

// One paper per track per day, shared by every student so the leaderboard
// compares like with like. `answer` lives here and is stripped before the paper
// is sent to a browser -- see the /quiz routes.
const QuizQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  subject: { type: String, required: true },
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: [(v) => v.length === 4, 'an MCQ needs exactly 4 options']
  },
  answer: { type: String, required: true }, // never leaves the server before submission
}, { _id: false });

const DailyQuizSchema = new mongoose.Schema({
  // YYYY-MM-DD in IST, so "today" means the same thing for every student
  quizDate: { type: String, required: true },
  track: { type: String, enum: ['JEE', 'NEET'], required: true },
  questions: { type: [QuizQuestionSchema], required: true },
  marksPerCorrect: { type: Number, default: 4 },
  penaltyPerWrong: { type: Number, default: 1 },
  durationMinutes: { type: Number, default: 20 },
  totalMarks: { type: Number, required: true },
  // true when the AI generator failed and the seeded fallback paper was used
  fallback: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// One paper per track per day. The unique index is also what stops two
// simultaneous first-requests from each generating their own paper.
DailyQuizSchema.index({ quizDate: 1, track: 1 }, { unique: true });

export default mongoose.model('DailyQuiz', DailyQuizSchema);
