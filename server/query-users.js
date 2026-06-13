import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from './models/User.js';

// Load root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const check = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  await mongoose.connect(uri);
  const users = await User.find({});
  console.log('Users in DB:', users.map(u => ({ id: u._id, username: u.username, email: u.email })));
  await mongoose.disconnect();
};

check().catch(console.error);
