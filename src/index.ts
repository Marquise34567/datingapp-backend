import "dotenv/config";
import express from "express";
import cors from "cors";
import { adviceRouter } from './routes/advice.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Health endpoints (Railway uptime checks)
app.get('/', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/advice', adviceRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Listening on', PORT));
