import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const connectionString = process.env.DATABASE_URL;
const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const API_BASE_URL = 'http://localhost:5000';

async function runTest() {
  console.log('Starting verification test...');
  let client;
  const conversationId = crypto.randomUUID();

  try {
    client = await pool.connect();
    console.log('1. Database connection established.');

    // 2. Insert test conversation
    await client.query(
      `INSERT INTO conversations (id, visitor_name, visitor_email) 
       VALUES ($1, $2, $3)`,
      [conversationId, 'Test Visitor', 'visitor@test.com']
    );
    console.log(`2. Test conversation created: ${conversationId}`);

    // 3. Insert admin message with read_at = NULL (unread)
    await client.query(
      `INSERT INTO chat_messages (conversation_id, sender, message_text, read_at) 
       VALUES ($1, $2, $3, NULL)`,
      [conversationId, 'admin', 'Hello from admin! This is an unread message.']
    );
    console.log('3. Unread admin message inserted.');

    // 4. Query unread count API
    console.log('4. Querying unread count API...');
    const countRes = await fetch(`${API_BASE_URL}/api/chat/${conversationId}/unread-count`);
    const countData = await countRes.json();
    console.log('Unread Count Response:', countData);
    if (countData.unreadCount !== 1) {
      throw new Error(`Expected unread count to be 1, got ${countData.unreadCount}`);
    }
    console.log('Assert unreadCount === 1: SUCCESS');

    // 5. Query message list API
    console.log('5. Querying message list API...');
    const listRes = await fetch(`${API_BASE_URL}/api/chat/${conversationId}/messages`);
    const listData = await listRes.json();
    const adminMsg = listData.messages.find(m => m.sender === 'admin');
    console.log('Admin Message read_at status:', adminMsg.read_at);
    if (adminMsg.read_at !== null) {
      throw new Error(`Expected read_at to be null for admin message, got ${adminMsg.read_at}`);
    }
    console.log('Assert read_at === null: SUCCESS');

    // 6. Post mark-as-read request
    console.log('6. Sending mark-as-read POST request...');
    const readRes = await fetch(`${API_BASE_URL}/api/chat/${conversationId}/read`, {
      method: 'POST',
    });
    const readData = await readRes.json();
    console.log('Mark-as-read Response:', readData);
    if (readData.markedReadCount !== 1) {
      throw new Error(`Expected markedReadCount to be 1, got ${readData.markedReadCount}`);
    }
    console.log('Assert markedReadCount === 1: SUCCESS');

    // 7. Verify unread count is now 0
    console.log('7. Re-querying unread count API...');
    const countRes2 = await fetch(`${API_BASE_URL}/api/chat/${conversationId}/unread-count`);
    const countData2 = await countRes2.json();
    console.log('Unread Count Response (after read):', countData2);
    if (countData2.unreadCount !== 0) {
      throw new Error(`Expected unread count to be 0, got ${countData2.unreadCount}`);
    }
    console.log('Assert unreadCount === 0: SUCCESS');

    // 8. Verify read_at is set in messages list
    console.log('8. Re-querying message list API...');
    const listRes2 = await fetch(`${API_BASE_URL}/api/chat/${conversationId}/messages`);
    const listData2 = await listRes2.json();
    const adminMsg2 = listData2.messages.find(m => m.sender === 'admin');
    console.log('Admin Message read_at status (after read):', adminMsg2.read_at);
    if (adminMsg2.read_at === null) {
      throw new Error('Expected read_at to be set, but it is still null');
    }
    console.log('Assert read_at is set: SUCCESS');

    // 9. Verify invalid conversation ID security checks
    console.log('9. Verifying invalid conversation ID security checks...');
    const randomUuid = crypto.randomUUID();
    
    const invalidCountRes = await fetch(`${API_BASE_URL}/api/chat/${randomUuid}/unread-count`);
    if (invalidCountRes.status !== 404) {
      throw new Error(`Expected 404 status for invalid conversation unread-count, got ${invalidCountRes.status}`);
    }
    console.log('Assert unread-count 404 for random UUID: SUCCESS');

    const invalidReadRes = await fetch(`${API_BASE_URL}/api/chat/${randomUuid}/read`, {
      method: 'POST',
    });
    if (invalidReadRes.status !== 404) {
      throw new Error(`Expected 404 status for invalid conversation read, got ${invalidReadRes.status}`);
    }
    console.log('Assert read 404 for random UUID: SUCCESS');

    console.log('All tests passed successfully!');

  } catch (error) {
    console.error('Test Failed:', error.message);
  } finally {
    // Cleanup
    if (client) {
      console.log('Cleaning up test data...');
      await client.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
      client.release();
    }
    await pool.end();
    console.log('Done.');
  }
}

runTest();
