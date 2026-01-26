import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const app = express();
const port = 3001;

// Enable CORS to allow requests from your frontend
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Database
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


async function initDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        message TEXT,
        attachment_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('`contact_messages` table ensured.');

    // Add attachment_name column if it doesn't exist (PostgreSQL 9.6+)
    await client.query(`
      ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
    `);
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err);
  } finally {
    if (client) client.release();
  }
}

initDb();

app.post('/api/contact', upload.single('attachment'), async (req, res) => {
  console.log('--- New Contact Form Submission ---');
  console.log('Name:', req.body.name);
  console.log('Email:', req.body.email);
  console.log('Message:', req.body.message);

  const { name, email, message } = req.body;
  const attachmentName = req.file ? req.file.originalname : null;

  if (req.file) {
    console.log(`Attachment: ${req.file.originalname} (${req.file.size} bytes)`);
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'INSERT INTO contact_messages (name, email, message, attachment_name) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, message, attachmentName]
    );

    if (result.rowCount > 0) {
      console.log(`Message saved to database with ID: ${result.rows[0].id}`);
      res.status(200).json({ message: 'Message received and saved successfully' });
    } else {
      throw new Error('Insert operation did not affect any rows.');
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ message: 'Failed to save message' });
  } finally {
    if (client) client.release();
  }
});

// New endpoint to verify database content
app.get('/api/messages', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM contact_messages ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
