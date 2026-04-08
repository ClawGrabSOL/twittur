const express = require('express');
const cors = require('cors');
const path = require('path');
const { init } = require('./db');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/twuts', require('./routes/twuts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/follows', require('./routes/follows'));
app.use('/api/upload', require('./routes/upload'));

const PORT = process.env.PORT || 3001;
init().then(() => {
  app.listen(PORT, () => {
    console.log(`🐦 Twittur backend running on http://localhost:${PORT}`);
  });
}).catch(e => {
  console.error('Failed to init DB:', e);
  process.exit(1);
});
