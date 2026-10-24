import mongoose from 'mongoose';

const DoubtForumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    default: 'General'
  },
  askedBy: {
    type: String,
    default: 'Student'
  },
  // Set from the authenticated user on create; used for delete authorization.
  // Empty on documents created before this field existed.
  ownerId: {
    type: String,
    default: ''
  },
  answers: [{
    answeredBy: { type: String, default: 'Peer' },
    content: { type: String, required: true },
    isAI: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('DoubtForum', DoubtForumSchema);
