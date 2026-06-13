import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'ai'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ChatSessionSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  chapter: { type: String, default: 'All Chapters' },
  mode: { type: String, default: 'Doubt Solver' },
  title: { type: String, default: '' }, // auto-generated from first user message
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
export default ChatSession;
