import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import DoubtForum from './models/DoubtForum.js';

// Load root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const check = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  await mongoose.connect(uri);
  const threads = await DoubtForum.find({});
  console.log('Threads in DB:', threads.map(t => ({ id: t._id, title: t.title, askedBy: t.askedBy })));
  await mongoose.disconnect();
};

check().catch(console.error);
