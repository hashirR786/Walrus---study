import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import aiRouter from './routes/ai.js';
import studentRouter from './routes/student.js';
import authRoutes from './routes/authRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Request logger middleware (must be first to log all requests including OPTIONS)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL, // e.g. https://walrus-frontend.onrender.com
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    // Fallback: allow any Render subdomain for walrus-frontend to prevent bricking the deployed app
    if (normalizedOrigin.startsWith('https://walrus-frontend') && normalizedOrigin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    
    // In development, allow everything
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    
    console.error(`CORS Blocked: Origin ${origin} not in allowedOrigins:`, allowedOrigins);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/student', studentRouter);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start Server and Database Connection
const startServer = async () => {
  // If MONGODB_URI is missing, we log a warning but still run the server on localhost
  if (!process.env.MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI environment variable is missing.');
    console.warn('The application will still start, but database operations will fail until connected.');
    // We can try to connect to a default local mongo database
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/cbse-super-app';
  }

  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB, starting server in offline mode:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
  });
};

startServer();
