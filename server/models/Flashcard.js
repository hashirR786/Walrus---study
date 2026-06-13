import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default-student'
  },
  subject: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  box: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
export default Flashcard;
