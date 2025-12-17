import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import './db.js';
import authRoutes from '../routes/authRoutes.js';
import historyRoutes from '../routes/historyRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan ? morgan('dev') : (req, res, next) => next());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
