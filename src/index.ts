import express from 'express';
import cors from 'cors';
import { adviceRouter } from './routes/advice';

const app = express();

app.use(cors());
app.use(express.json());

// Health endpoints (Railway uptime checks)
app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/advice', adviceRouter);

const port = process.env.PORT || 4000;
app.listen(Number(port), () => {
  console.log(`Dating Advice API listening on ${port}`);
});
