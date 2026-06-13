import mongoose from 'mongoose';
import User from './models/User.js';

const check = async () => {
  await mongoose.connect('mongodb+srv://hashirrajeef_db_user:DQQyhqVlxtaocKVC@cluster0.iphcx2h.mongodb.net/?appName=Cluster0');
  const users = await User.find({});
  console.log('Users in DB:', users.map(u => ({ id: u._id, username: u.username, email: u.email })));
  await mongoose.disconnect();
};

check().catch(console.error);
