import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import SharedNote from './models/SharedNote.js';

// Load root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const check = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  await mongoose.connect(uri);
  const notes = await SharedNote.find({});
  console.log('Notes in DB:', notes.map(n => ({ id: n._id, title: n.title, author: n.author })));
  await mongoose.disconnect();
};

check().catch(console.error);
