require('dotenv').config();
const express = require('express');
const cors = require('cors');
const garmentsRouter = require('./routes/garments');

const app = express();

// Allows your React frontend (running on a different port/domain) to call this API.
// For the MVP this is wide open; you can restrict it to your actual frontend
// domain later with { origin: 'https://clothes.yourdomain.com' }.
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Closet Claim API is running.' });
});

app.use('/api/garments', garmentsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
