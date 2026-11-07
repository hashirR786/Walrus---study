import mongoose from 'mongoose';

// Awarded to the top scorer of a completed week, per track. Carries the week it
// was won so a profile can say "Week 3 of November 2026" years later without
// recomputing anything.
const WeeklyBadgeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  track: { type: String, enum: ['JEE', 'NEET'], required: true },

  // Monday-start week in IST, stored both as a label and as the raw dates so
  // the badge can be sorted and verified later.
  year: { type: Number, required: true },
  month: { type: Number, required: true },        // 1-12, the month the week STARTS in
  monthName: { type: String, required: true },
  weekOfMonth: { type: Number, required: true },  // 1-5
  weekStart: { type: String, required: true },    // YYYY-MM-DD, Monday
  weekEnd: { type: String, required: true },      // YYYY-MM-DD, Sunday
  label: { type: String, required: true },        // "Week 3 of November 2026"

  totalScore: { type: Number, required: true },
  quizzesTaken: { type: Number, required: true },
  awardedAt: { type: Date, default: Date.now },
});

// A week has exactly one winner per track, and awarding is idempotent.
WeeklyBadgeSchema.index({ track: 1, weekStart: 1 }, { unique: true });
WeeklyBadgeSchema.index({ userId: 1 });

export default mongoose.model('WeeklyBadge', WeeklyBadgeSchema);
