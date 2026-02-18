import express from 'express';

const app = express();

app.get('/', (_req, res) => {
  res.send({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Dating Advice API running on port ${PORT}`);
});
