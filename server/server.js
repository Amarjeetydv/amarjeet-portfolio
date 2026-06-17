import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
  override: true,
});

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();
const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim();

console.log('--- Cloudinary Config ---');
console.log('Cloud Name:', cloudName || 'MISSING');
console.log('API Key:', apiKey ? 'Loaded' : 'MISSING');
console.log('API Secret:', apiSecret ? 'Loaded' : 'MISSING');
console.log('--- Telegram Config ---');
console.log('Bot Token:', telegramBotToken ? 'Loaded' : 'MISSING');
console.log('Chat ID:', telegramChatId ? 'Loaded' : 'MISSING');

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('sslmode=')) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    connectionString = url.toString();
  } catch {
    console.warn('Failed to parse DATABASE_URL, using original.');
  }
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
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
    await client.query(`
      ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
    `);
    await client.query(`
      ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        visitor_name VARCHAR(255) NOT NULL,
        visitor_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('visitor', 'admin')),
        message_text TEXT NOT NULL,
        attachment_name VARCHAR(255),
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS telegram_message_map (
        telegram_message_id BIGINT PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);

    console.log('Database tables ensured.');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err);
  } finally {
    if (client) client.release();
  }
}

initDb();

const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const uploadToCloudinary = (file) => uploadBufferToCloudinary(file.buffer, file.originalname);

const escapeHtml = (str) =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const storeTelegramMapping = async (telegramMessageId, conversationId) => {
  if (!telegramMessageId || !conversationId) return;
  let client;
  try {
    client = await pool.connect();
    await client.query(
      `INSERT INTO telegram_message_map (telegram_message_id, conversation_id)
       VALUES ($1, $2)
       ON CONFLICT (telegram_message_id) DO NOTHING`,
      [telegramMessageId, conversationId]
    );
  } catch (error) {
    console.error('Failed to store Telegram message mapping:', error);
  } finally {
    if (client) client.release();
  }
};

const sendTelegramMessage = async (text) => {
  if (!telegramBotToken || !telegramChatId) {
    console.warn('Telegram credentials missing, skipping notification.');
    return null;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();
    if (result.ok) {
      return result.result.message_id;
    }
    console.error('Telegram API Error:', result);
    return null;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return null;
  }
};

const notifyNewVisitorMessage = async ({
  conversationId,
  name,
  email,
  message,
  attachmentUrl,
  isFollowUp = false,
}) => {
  const header = isFollowUp
    ? `💬 <b>Follow-up message</b>`
    : `🚀 <b>New Contact Message</b>`;

  const text = `
${header}

🆔 <b>Chat ID:</b> <code>${conversationId}</code>
👤 <b>Name:</b> ${escapeHtml(name)}
📧 <b>Email:</b> ${escapeHtml(email)}
📝 <b>Message:</b>
<pre>${escapeHtml(message)}</pre>

${attachmentUrl ? `📎 <b>Attachment:</b> <a href="${attachmentUrl}">View File</a>` : ''}

<i>↩️ Reply to this message with text or an attachment (photo/document).</i>
  `.trim();

  const telegramMessageId = await sendTelegramMessage(text);
  if (telegramMessageId) {
    await storeTelegramMapping(telegramMessageId, conversationId);
  }
  return telegramMessageId;
};

const saveChatMessage = async (client, {
  conversationId,
  sender,
  messageText,
  attachmentName = null,
  attachmentUrl = null,
}) => {
  const result = await client.query(
    `INSERT INTO chat_messages (conversation_id, sender, message_text, attachment_name, attachment_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, conversation_id, sender, message_text, attachment_name, attachment_url, created_at`,
    [conversationId, sender, messageText, attachmentName, attachmentUrl]
  );
  return result.rows[0];
};

const getConversation = async (conversationId) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT id, visitor_name, visitor_email, created_at FROM conversations WHERE id = $1',
      [conversationId]
    );
    return result.rows[0] || null;
  } finally {
    if (client) client.release();
  }
};

const handleFileUpload = async (file) => {
  if (!file) return { attachmentName: null, attachmentUrl: null };
  const uploadResult = await uploadToCloudinary(file);
  return {
    attachmentName: file.originalname,
    attachmentUrl: uploadResult?.secure_url || uploadResult?.url || null,
  };
};

const extractTelegramMedia = (message) => {
  if (message.photo?.length) {
    const photo = message.photo[message.photo.length - 1];
    return {
      fileId: photo.file_id,
      fileName: 'photo.jpg',
      caption: message.caption?.trim() || '',
    };
  }

  if (message.document) {
    return {
      fileId: message.document.file_id,
      fileName: message.document.file_name || 'document',
      caption: message.caption?.trim() || '',
    };
  }

  return null;
};

const downloadTelegramFile = async (fileId) => {
  if (!telegramBotToken) {
    throw new Error('Telegram bot token is not configured');
  }

  const getFileRes = await fetch(
    `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  const getFileData = await getFileRes.json();

  if (!getFileData.ok) {
    throw new Error(getFileData.description || 'Failed to get file info from Telegram');
  }

  const filePath = getFileData.result.file_path;
  const fileRes = await fetch(`https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`);

  if (!fileRes.ok) {
    throw new Error('Failed to download file from Telegram');
  }

  const buffer = Buffer.from(await fileRes.arrayBuffer());
  return {
    buffer,
    fileName: path.basename(filePath),
  };
};

const uploadTelegramMedia = async (media) => {
  const { buffer, fileName } = await downloadTelegramFile(media.fileId);
  const uploadResult = await uploadBufferToCloudinary(buffer, media.fileName || fileName);
  return {
    attachmentName: media.fileName || fileName,
    attachmentUrl: uploadResult?.secure_url || uploadResult?.url || null,
  };
};

app.post('/api/contact', upload.single('attachment'), async (req, res) => {
  console.log('--- New Contact Form Submission ---');
  const { name, email, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  const conversationId = crypto.randomUUID();
  let client;

  try {
    const { attachmentName, attachmentUrl } = await handleFileUpload(req.file);

    client = await pool.connect();
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO conversations (id, visitor_name, visitor_email) VALUES ($1, $2, $3)',
      [conversationId, name.trim(), email.trim()]
    );

    const savedMessage = await saveChatMessage(client, {
      conversationId,
      sender: 'visitor',
      messageText: message.trim(),
      attachmentName,
      attachmentUrl,
    });

    await client.query(
      'INSERT INTO contact_messages (name, email, message, attachment_name, attachment_url) VALUES ($1, $2, $3, $4, $5)',
      [name.trim(), email.trim(), message.trim(), attachmentName, attachmentUrl]
    );

    await client.query('COMMIT');

    notifyNewVisitorMessage({
      conversationId,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      attachmentUrl,
    });

    res.status(200).json({
      message: 'Message received successfully',
      conversationId,
      chatMessage: savedMessage,
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
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

app.get('/api/chat/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;

  let client;
  try {
    client = await pool.connect();
    const conversation = await client.query(
      'SELECT id, visitor_name, created_at FROM conversations WHERE id = $1',
      [conversationId]
    );

    if (conversation.rowCount === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await client.query(
      `SELECT id, sender, message_text, attachment_name, attachment_url, created_at
       FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({
      conversationId,
      visitorName: conversation.rows[0].visitor_name,
      messages: messages.rows,
    });
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/chat/:conversationId/messages', upload.single('attachment'), async (req, res) => {
  const { conversationId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  let client;
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const { attachmentName, attachmentUrl } = await handleFileUpload(req.file);

    client = await pool.connect();
    const savedMessage = await saveChatMessage(client, {
      conversationId,
      sender: 'visitor',
      messageText: message.trim(),
      attachmentName,
      attachmentUrl,
    });

    notifyNewVisitorMessage({
      conversationId,
      name: conversation.visitor_name,
      email: conversation.visitor_email,
      message: message.trim(),
      attachmentUrl,
      isFollowUp: true,
    });

    res.status(200).json({ chatMessage: savedMessage });
  } catch (error) {
    if (error.http_code) {
      res.status(error.http_code || 500).json({ message: `Cloudinary error: ${error.message}` });
    } else {
      console.error('Failed to save follow-up message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  } finally {
    if (client) client.release();
  }
});

app.post('/api/telegram/webhook', async (req, res) => {
  if (telegramWebhookSecret) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== telegramWebhookSecret) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  const update = req.body;
  const message = update?.message;

  if (!message?.from) {
    return res.sendStatus(200);
  }

  const chatId = String(message.chat.id);
  if (telegramChatId && chatId !== String(telegramChatId)) {
    return res.sendStatus(200);
  }

  const replyToMessageId = message.reply_to_message?.message_id;
  if (!replyToMessageId) {
    return res.sendStatus(200);
  }

  const media = extractTelegramMedia(message);
  const messageText = message.text?.trim() || media?.caption || '';

  if (!messageText && !media) {
    return res.sendStatus(200);
  }

  let client;
  try {
    client = await pool.connect();
    const mapping = await client.query(
      'SELECT conversation_id FROM telegram_message_map WHERE telegram_message_id = $1',
      [replyToMessageId]
    );

    if (mapping.rowCount === 0) {
      console.warn(`No conversation found for Telegram message ${replyToMessageId}`);
      return res.sendStatus(200);
    }

    const conversationId = mapping.rows[0].conversation_id;

    let attachmentName = null;
    let attachmentUrl = null;

    if (media) {
      const uploaded = await uploadTelegramMedia(media);
      attachmentName = uploaded.attachmentName;
      attachmentUrl = uploaded.attachmentUrl;
    }

    await saveChatMessage(client, {
      conversationId,
      sender: 'admin',
      messageText: messageText || '(attachment)',
      attachmentName,
      attachmentUrl,
    });

    console.log(`Admin reply saved for conversation ${conversationId}${attachmentUrl ? ' (with attachment)' : ''}`);

    const confirmText = attachmentUrl
      ? `✅ Reply with attachment sent to visitor on the website.\n\n🆔 Chat ID: <code>${conversationId}</code>`
      : `✅ Reply sent to visitor on the website.\n\n🆔 Chat ID: <code>${conversationId}</code>`;

    await sendTelegramMessage(confirmText);

    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    await sendTelegramMessage(
      `❌ Failed to send reply to the website.\n\n<code>${escapeHtml(error.message)}</code>`
    );
    res.sendStatus(200);
  } finally {
    if (client) client.release();
  }
});

const CHANNEL_ID_RE = /^UC[\w-]{22}$/;
const YOUTUBE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const YOUTUBE_STATIC_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const YOUTUBE_CACHE_MAX_ENTRIES = 500;
const YOUTUBE_ENDPOINT_QUOTA_UNITS = {
  search: 100,
  videos: 1,
  channels: 1,
  playlists: 1,
  playlistItems: 1,
};

const youtubeResponseCache = new Map();
const youtubeInFlightRequests = new Map();
const youtubeRequestStats = {
  total: 0,
  byEndpoint: new Map(),
  recent: [],
};

const getYouTubeCacheKey = (endpoint, params) => {
  const normalized = new URLSearchParams(params);
  normalized.delete('key');
  normalized.sort();
  return `${endpoint}?${normalized.toString()}`;
};

const pruneYouTubeCache = () => {
  while (youtubeResponseCache.size > YOUTUBE_CACHE_MAX_ENTRIES) {
    const oldestKey = youtubeResponseCache.keys().next().value;
    youtubeResponseCache.delete(oldestKey);
  }
};

const recordYouTubeRequest = (endpoint, cacheStatus) => {
  const now = Date.now();
  youtubeRequestStats.recent = youtubeRequestStats.recent.filter((entry) => now - entry.timestamp < 60_000);

  if (cacheStatus === 'miss') {
    youtubeRequestStats.total += 1;
    youtubeRequestStats.byEndpoint.set(endpoint, (youtubeRequestStats.byEndpoint.get(endpoint) || 0) + 1);
    youtubeRequestStats.recent.push({ endpoint, timestamp: now });
  }

  const endpointCount = youtubeRequestStats.byEndpoint.get(endpoint) || 0;
  const recentCount = youtubeRequestStats.recent.filter((entry) => entry.endpoint === endpoint).length;
  const quotaUnits = YOUTUBE_ENDPOINT_QUOTA_UNITS[endpoint] || 1;

  console.info(
    `[youtube-api] endpoint=${endpoint}.list cache=${cacheStatus} totalExternal=${youtubeRequestStats.total} endpointExternal=${endpointCount} recentExternalPerMinute=${recentCount} estimatedQuotaUnits=${quotaUnits}`
  );
};

const fetchYouTubeApi = async (endpoint, params, { cacheTtlMs = YOUTUBE_CACHE_TTL_MS } = {}) => {
  if (!youtubeApiKey) {
    throw new Error('YouTube API key is not configured.');
  }

  const requestParams = new URLSearchParams(params);
  requestParams.set('key', youtubeApiKey);

  const cacheKey = getYouTubeCacheKey(endpoint, requestParams);
  const cached = youtubeResponseCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    recordYouTubeRequest(endpoint, 'hit');
    return cached.data;
  }

  if (youtubeInFlightRequests.has(cacheKey)) {
    recordYouTubeRequest(endpoint, 'shared');
    return youtubeInFlightRequests.get(cacheKey);
  }

  recordYouTubeRequest(endpoint, 'miss');

  const request = fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${requestParams}`)
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data?.error?.message || 'YouTube API request failed.');
        error.status = response.status;
        throw error;
      }

      youtubeResponseCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + cacheTtlMs,
      });
      pruneYouTubeCache();
      return data;
    })
    .finally(() => {
      youtubeInFlightRequests.delete(cacheKey);
    });

  youtubeInFlightRequests.set(cacheKey, request);
  return request;
};

const parseIsoDurationSeconds = (duration = '') => {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;

  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const mapYouTubeSearchItem = (item, details = {}) => ({
  id: item.id.videoId,
  title: item.snippet.title,
  channel: item.snippet.channelTitle,
  channelId: item.snippet.channelId,
  thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
  publishedAt: item.snippet.publishedAt,
  description: item.snippet.description,
  durationSeconds: details.durationSeconds ?? null,
  liveBroadcastContent: item.snippet.liveBroadcastContent || details.liveBroadcastContent || 'none',
});

const mapYouTubeChannel = (item) => ({
  channelId: item.id,
  title: item.snippet.title,
  thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
  description: item.snippet.description,
});

const mapYouTubePlaylist = (item) => ({
  id: item.id,
  title: item.snippet.title,
  channel: item.snippet.channelTitle,
  channelId: item.snippet.channelId,
  thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
  publishedAt: item.snippet.publishedAt,
  description: item.snippet.description,
  itemCount: item.contentDetails?.itemCount ?? null,
});

const mapYouTubePlaylistItem = (item, details = {}) => ({
  id: item.snippet.resourceId.videoId,
  title: item.snippet.title,
  channel: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
  channelId: item.snippet.videoOwnerChannelId || item.snippet.channelId,
  thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
  publishedAt: item.snippet.publishedAt,
  description: item.snippet.description,
  durationSeconds: details.durationSeconds ?? null,
  liveBroadcastContent: details.liveBroadcastContent || 'none',
  position: item.snippet.position,
});

const fetchYouTubeVideoDetailsMap = async (videoIds) => {
  const ids = [...new Set(videoIds)].filter(Boolean);
  if (ids.length === 0) return new Map();

  const data = await fetchYouTubeApi('videos', {
    part: 'contentDetails,snippet',
    id: ids.join(','),
  }, { cacheTtlMs: YOUTUBE_STATIC_CACHE_TTL_MS });

  return new Map(
    (data.items || []).map((item) => [
      item.id,
      {
        durationSeconds: parseIsoDurationSeconds(item.contentDetails?.duration),
        liveBroadcastContent: item.snippet?.liveBroadcastContent || 'none',
      },
    ])
  );
};

const parseChannelInput = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (CHANNEL_ID_RE.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed.slice(1) };
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const channelMatch = url.pathname.match(/^\/channel\/(UC[\w-]{22})/);
      if (channelMatch) return { type: 'id', value: channelMatch[1] };

      const handleMatch = url.pathname.match(/^\/@([\w.-]+)/);
      if (handleMatch) return { type: 'handle', value: handleMatch[1] };

      const userMatch = url.pathname.match(/^\/user\/([\w.-]+)/);
      if (userMatch) return { type: 'username', value: userMatch[1] };
    }
  } catch {
    return null;
  }

  return null;
};

const fetchYouTubeChannel = async (parsed) => {
  if (!parsed) return null;

  if (parsed.type === 'id') {
    const data = await fetchYouTubeApi('channels', {
      part: 'snippet',
      id: parsed.value,
    }, { cacheTtlMs: YOUTUBE_STATIC_CACHE_TTL_MS });
    const item = data.items?.[0];
    return item ? mapYouTubeChannel(item) : null;
  }

  if (parsed.type === 'handle') {
    const data = await fetchYouTubeApi('channels', {
      part: 'snippet',
      forHandle: parsed.value,
    }, { cacheTtlMs: YOUTUBE_STATIC_CACHE_TTL_MS });
    const item = data.items?.[0];
    return item ? mapYouTubeChannel(item) : null;
  }

  if (parsed.type === 'username') {
    const data = await fetchYouTubeApi('channels', {
      part: 'snippet',
      forUsername: parsed.value,
    }, { cacheTtlMs: YOUTUBE_STATIC_CACHE_TTL_MS });
    const item = data.items?.[0];
    return item ? mapYouTubeChannel(item) : null;
  }

  return null;
};

const fetchYouTubeUploadsPlaylistId = async (channelId) => {
  const data = await fetchYouTubeApi('channels', {
    part: 'contentDetails',
    id: channelId,
  }, { cacheTtlMs: YOUTUBE_STATIC_CACHE_TTL_MS });

  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
};

const fetchYouTubeUploadsPlaylistItems = async (channelId, pageToken = null) => {
  const uploadsPlaylistId = await fetchYouTubeUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) {
    return { items: [], nextPageToken: null };
  }

  const params = {
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: '25',
  };

  if (pageToken) {
    params.pageToken = pageToken;
  }

  const data = await fetchYouTubeApi('playlistItems', params);
  const playlistItems = (data.items || []).filter(
    (item) => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video'
  );
  const detailsMap = await fetchYouTubeVideoDetailsMap(
    playlistItems.map((item) => item.snippet.resourceId.videoId)
  );

  return {
    items: playlistItems.map((item) =>
      mapYouTubePlaylistItem(item, detailsMap.get(item.snippet.resourceId.videoId))
    ),
    nextPageToken: data.nextPageToken || null,
  };
};

app.get('/api/youtube/video/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ message: 'Invalid video ID.' });
  }

  if (!youtubeApiKey) {
    return res.status(503).json({
      message: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.',
    });
  }

  try {
    const data = await fetchYouTubeApi('videos', {
      part: 'snippet',
      id: videoId,
    }, { cacheTtlMs: YOUTUBE_STATIC_CACHE_TTL_MS });

    const item = data.items?.[0];
    if (!item) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    res.json({
      id: videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('YouTube video lookup error:', error);
    res.status(500).json({ message: 'Failed to load video details.' });
  }
});

app.get('/api/youtube/search', async (req, res) => {
  const q = req.query.q?.trim();
  const pageToken = req.query.pageToken?.trim();

  if (!q) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  if (!youtubeApiKey) {
    return res.status(503).json({
      message: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.',
    });
  }

  try {
    const params = {
      part: 'snippet',
      type: 'video',
      q,
      maxResults: '10',
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await fetchYouTubeApi('search', params);

    const items = (data.items || [])
      .filter((item) => item.id?.videoId)
      .map(mapYouTubeSearchItem);

    res.json({
      items,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('YouTube search error:', error);
    res.status(500).json({ message: 'Failed to search YouTube.' });
  }
});

app.get('/api/youtube/channel/resolve', async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    return res.status(400).json({ message: 'Channel query is required.' });
  }

  if (!youtubeApiKey) {
    return res.status(503).json({
      message: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.',
    });
  }

  try {
    const parsed = parseChannelInput(q);
    let channel = await fetchYouTubeChannel(parsed);

    if (!channel) {
      const data = await fetchYouTubeApi('search', {
        part: 'snippet',
        type: 'channel',
        q,
        maxResults: '1',
      });

      const item = data.items?.[0];
      if (item?.id?.channelId) {
        channel = {
          channelId: item.id.channelId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          description: item.snippet.description,
        };
      }
    }

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found.' });
    }

    res.json(channel);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('YouTube channel resolve error:', error);
    res.status(500).json({ message: error.message || 'Failed to resolve channel.' });
  }
});

app.get('/api/youtube/channel/:channelId/videos', async (req, res) => {
  const { channelId } = req.params;
  const pageToken = req.query.pageToken?.trim();
  const section = req.query.section?.trim() || 'home';

  if (!CHANNEL_ID_RE.test(channelId)) {
    return res.status(400).json({ message: 'Invalid channel ID.' });
  }

  if (!['home', 'videos', 'shorts', 'live'].includes(section)) {
    return res.status(400).json({ message: 'Invalid channel section.' });
  }

  if (!youtubeApiKey) {
    return res.status(503).json({
      message: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.',
    });
  }

  try {
    if (section !== 'live') {
      const { items: uploadItems, nextPageToken } = await fetchYouTubeUploadsPlaylistItems(channelId, pageToken);
      let items = uploadItems;

      if (section === 'videos') {
        items = items.filter((item) => item.durationSeconds === null || item.durationSeconds > 60);
      }

      if (section === 'shorts') {
        items = items.filter((item) => item.durationSeconds !== null && item.durationSeconds <= 60);
      }

      return res.json({
        items,
        nextPageToken,
      });
    }

    const params = {
      part: 'snippet',
      channelId,
      type: 'video',
      order: 'date',
      eventType: 'live',
      maxResults: '10',
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await fetchYouTubeApi('search', params);
    const searchItems = (data.items || []).filter((item) => item.id?.videoId);
    const detailsMap = await fetchYouTubeVideoDetailsMap(searchItems.map((item) => item.id.videoId));
    const items = searchItems.map((item) => mapYouTubeSearchItem(item, detailsMap.get(item.id.videoId)));

    res.json({
      items,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('YouTube channel videos error:', error);
    res.status(500).json({ message: 'Failed to load channel videos.' });
  }
});

app.get('/api/youtube/channel/:channelId/playlists', async (req, res) => {
  const { channelId } = req.params;
  const pageToken = req.query.pageToken?.trim();

  if (!CHANNEL_ID_RE.test(channelId)) {
    return res.status(400).json({ message: 'Invalid channel ID.' });
  }

  if (!youtubeApiKey) {
    return res.status(503).json({
      message: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.',
    });
  }

  try {
    const params = {
      part: 'snippet,contentDetails',
      channelId,
      maxResults: '20',
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await fetchYouTubeApi('playlists', params);

    res.json({
      items: (data.items || []).map(mapYouTubePlaylist),
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('YouTube channel playlists error:', error);
    res.status(500).json({ message: 'Failed to load channel playlists.' });
  }
});

app.get('/api/youtube/playlist/:playlistId/videos', async (req, res) => {
  const { playlistId } = req.params;
  const pageToken = req.query.pageToken?.trim();

  if (!/^[\w-]{10,80}$/.test(playlistId)) {
    return res.status(400).json({ message: 'Invalid playlist ID.' });
  }

  if (!youtubeApiKey) {
    return res.status(503).json({
      message: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.',
    });
  }

  try {
    const params = {
      part: 'snippet',
      playlistId,
      maxResults: '50',
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await fetchYouTubeApi('playlistItems', params);

    const playlistItems = (data.items || []).filter(
      (item) => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video'
    );
    const detailsMap = await fetchYouTubeVideoDetailsMap(
      playlistItems.map((item) => item.snippet.resourceId.videoId)
    );

    res.json({
      items: playlistItems.map((item) =>
        mapYouTubePlaylistItem(item, detailsMap.get(item.snippet.resourceId.videoId))
      ),
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('YouTube playlist videos error:', error);
    res.status(500).json({ message: 'Failed to load playlist videos.' });
  }
});

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

app.get('/', (req, res) => {
  res.send('Portfolio backend running');
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  if (telegramBotToken) {
    console.log('Telegram webhook endpoint: POST /api/telegram/webhook');
  }
});
