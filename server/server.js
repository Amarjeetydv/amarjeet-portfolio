import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pg from 'pg';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary

dotenv.config({ path: './server/.env' });
dotenv.config(); // Loads .env from the current directory (server/)

// --- Cloudinary Config with Debugging & Trimming ---
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();

console.log('--- Cloudinary Config ---');
console.log('Cloud Name:', cloudName || 'MISSING');
console.log('API Key:', apiKey ? 'Loaded' : 'MISSING');
console.log('API Secret:', apiSecret ? 'Loaded' : 'MISSING');

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const app = express();
const port = 3001;
const port = process.env.PORT || 3001; // Use Render's port, fallback to 3001 for local dev

// Enable CORS to allow requests from your frontend
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit matching frontend
});

// Initialize Database
const { Pool } = pg;

// Fix for SSL warning: remove sslmode from connection string if present
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('sslmode=')) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    connectionString = url.toString();
  } catch (e) {
    console.warn('Failed to parse DATABASE_URL, using original.');
  }
}

const pool = new Pool({
  connectionString: connectionString,
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
    // Add attachment_url column
    await client.query(`
      ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
    `);
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err);
  } finally {
    if (client) client.release();
  }
}

initDb();

// Helper to upload buffer to cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        resource_type: "auto",
        use_filename: true, // Use the uploaded filename
        unique_filename: true, // Append random characters to avoid collisions
        filename_override: file.originalname // Ensure extension is preserved
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

// Helper to send Telegram notification
const sendTelegramNotification = async (name, email, message, attachmentUrl) => {
  if (!telegramBotToken || !telegramChatId) {
    console.warn('Telegram credentials missing, skipping notification.');
    return;
  }

  // Escape HTML characters to prevent broken formatting
  const escapeHtml = (str) => (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const text = `
🚀 <b>New Contact Form Submission</b>

👤 <b>Name:</b> ${escapeHtml(name)}
📧 <b>Email:</b> ${escapeHtml(email)}
📝 <b>Message:</b>
<pre>${escapeHtml(message)}</pre>

${attachmentUrl ? `📎 <b>Attachment:</b> <a href="${attachmentUrl}">View File</a>` : ''}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = await response.json();
    if (result.ok) {
      console.log('Telegram notification sent successfully.');
    } else {
      console.error('Telegram API Error:', result);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};

app.post('/api/contact', upload.single('attachment'), async (req, res) => {
  console.log('--- New Contact Form Submission ---');
  console.log('Name:', req.body.name);

  const { name, email, message } = req.body;
  let attachmentName = null;
  let attachmentUrl = null;

  let client;
  try {
    if (req.file) {
      console.log(`Uploading file: ${req.file.originalname}`);
      attachmentName = req.file.originalname;
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file);
      // Use secure_url if available, otherwise url, otherwise null
      attachmentUrl = uploadResult?.secure_url || uploadResult?.url || null;
      
      console.log(`Cloudinary Result:`, uploadResult); // Debug log
      console.log(`File uploaded to: ${attachmentUrl}`);
    }

    client = await pool.connect();
    const result = await client.query(
      'INSERT INTO contact_messages (name, email, message, attachment_name, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, message, attachmentName, attachmentUrl || null]
    );

    if (result.rowCount > 0) {
      console.log(`Message saved to database with ID: ${result.rows[0].id}`);
      
      // Send Telegram Notification (Non-blocking)
      sendTelegramNotification(name, email, message, attachmentUrl);
      
      res.status(200).json({ message: 'Message received and saved successfully' });
    } else {
      throw new Error('Insert operation did not affect any rows.');
    }
  } catch (error) {
    // Check if the error is from Cloudinary
    if (error.http_code) {
      console.error('Cloudinary Error:', error);
      res.status(error.http_code || 500).json({ message: `Cloudinary error: ${error.message}` });
    } else {
      console.error('Database/Server Error:', error);
      res.status(500).json({ message: 'Failed to save message' });
    }
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

// Basic health check route
app.get('/', (req, res) => {
  res.send('Portfolio backend running');
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Backend server running on port ${port}`);
});
