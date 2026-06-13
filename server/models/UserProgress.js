import mongoose from 'mongoose';

const UserProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: 'default-student' // Default fallback for local single-user mode
  },
  streak: {
    count: { type: Number, default: 0 },
    lastActive: { type: Date, default: null }
  },
  subjectProgress: [{
    subjectName: { type: String, required: true },
    chapters: [{
      chapterName: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['Todo', 'InProgress', 'Completed'], 
        default: 'Todo' 
      },
      masteryScore: { type: Number, default: 0 } // 0 to 100
    }]
  }],
  studyTime: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    minutes: { type: Number, default: 0 }
  }],
  dailyGoals: [{
    taskName: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export default mongoose.model('UserProgress', UserProgressSchema);
