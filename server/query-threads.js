import mongoose from 'mongoose';
import DoubtForum from './models/DoubtForum.js';

const check = async () => {
  await mongoose.connect('mongodb+srv://hashirrajeef_db_user:DQQyhqVlxtaocKVC@cluster0.iphcx2h.mongodb.net/?appName=Cluster0');
  const threads = await DoubtForum.find({});
  console.log('Threads in DB:', threads.map(t => ({ id: t._id, title: t.title, askedBy: t.askedBy })));
  await mongoose.disconnect();
};

check().catch(console.error);
