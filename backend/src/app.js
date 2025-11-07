import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectToDatabase } from './config/db.js';
import { initFirebaseAdmin } from './config/firebase.js';
import authRoutes from './routes/auth.js';
import familyRoutes from './routes/families.js';
import memberRoutes from './routes/members.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(helmet());

// CORS setup (comma-separated list in ALLOWED_ORIGINS)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Logging
app.use(morgan('dev'));

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'apna-family-tree-backend' });
});

// Placeholder: routes will be mounted here (auth, families, members, payments)
app.use('/auth', authRoutes);
app.use('/families', familyRoutes);
app.use('/members', memberRoutes);
app.use('/payments', paymentRoutes);

// Startup
const port = process.env.PORT || 4000;
async function start() {
  try {
    initFirebaseAdmin();
    await connectToDatabase(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}
app.get('/families', (_req, res) => {
  res.json({ ok: true, service: 'apna-family-tree-backend' });
});

// add this to avoid 404 on GET /
app.get('/', (_req, res) => {
  res.send('API is running');
});


start();


