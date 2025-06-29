// Basic Express server setup for portfolio backend
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432, // default Postgres port
  ssl: { rejectUnauthorized: false }, // required for Neon
});

db.connect((err, client, release) => {
  if (err) {
    console.error('PostgreSQL connection error:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Example route
app.get('/', (req, res) => {
  res.send('Portfolio backend running');
});

// Contact form API endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const sql = 'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)';
  try {
    await db.query(sql, [name, email, message]);
    res.status(201).json({ message: 'Message sent!' });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
