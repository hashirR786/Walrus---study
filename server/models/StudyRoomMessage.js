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
  // Set from the authenticated user on create; used to authorise edit/delete.
  // Empty on messages sent before this field existed.
  ownerId: {
    type: String,
    default: ''
  },
  editedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('StudyRoomMessage', StudyRoomMessageSchema);
