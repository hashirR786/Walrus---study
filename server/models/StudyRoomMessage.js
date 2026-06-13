import mongoose from 'mongoose';

const StudyRoomMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('StudyRoomMessage', StudyRoomMessageSchema);
