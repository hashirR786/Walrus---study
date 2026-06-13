import mongoose from 'mongoose';
import SharedNote from './models/SharedNote.js';

const check = async () => {
  await mongoose.connect('mongodb+srv://hashirrajeef_db_user:DQQyhqVlxtaocKVC@cluster0.iphcx2h.mongodb.net/?appName=Cluster0');
  const notes = await SharedNote.find({});
  console.log('Notes in DB:', notes.map(n => ({ id: n._id, title: n.title, author: n.author })));
  await mongoose.disconnect();
};

check().catch(console.error);
