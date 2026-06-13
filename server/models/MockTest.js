import mongoose from 'mongoose';

const MockTestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'default-student'
  },
  subject: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    enum: ['Mock', 'PYQ', 'TopicPractice'],
    default: 'Mock'
  },
  chapter: {
    type: String,
    default: 'All Chapters'
  },
  generatedPaper: {
    type: mongoose.Schema.Types.Mixed, // Stores Sections A, B, C, D, E
    required: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed, // Stores student responses per question ID
    default: {}
  },
  score: {
    type: Number,
    default: null // Null until graded
  },
  totalMarks: {
    type: Number,
    default: null
  },
  feedback: {
    type: String, // Step-by-step CBSE marking scheme feedback
    default: ''
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('MockTest', MockTestSchema);
