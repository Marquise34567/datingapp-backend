import express from 'express';

const app = express();

// Health endpoints for Railway
app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Dating Advice API running on port ${PORT}`);
});
