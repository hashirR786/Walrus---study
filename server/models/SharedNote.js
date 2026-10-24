import mongoose from 'mongoose';

const SharedNoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  },
  image: {
    type: String, // base64 string
    default: ''
  },
  author: {
    type: String,
    required: true
  },
  // Set from the authenticated user on create; used for delete authorization.
  // Empty on documents created before this field existed.
  ownerId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SharedNote', SharedNoteSchema);
