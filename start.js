import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ override: true });

const BACKEND_PORT = process.env.PORT || 3001;
const FRONTEND_PORT = 5170;

// Helper to check if a port is in use
const checkPort = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') resolve(true);
    else resolve(false);
  });
  server.once('listening', () => {
    server.close();
    resolve(false);
  });
  server.listen(port);
});

(async () => {
  // 1. Check if Backend is running
  const isBackendRunning = await checkPort(BACKEND_PORT);

  if (!isBackendRunning) {
    console.log(`Port ${BACKEND_PORT} is free. Starting backend server...`);
    // Correcting the path to point to the 'server' directory.
    const backend = spawn('node', [path.join('server', 'server.js')], { stdio: 'inherit' });
    backend.on('error', (err) => console.error('Failed to start backend:', err));
  } else {
    console.log(`Backend server is already running on port ${BACKEND_PORT}.`);
  }

  // 2. Start Frontend on port 5170
  console.log(`Starting Frontend on port ${FRONTEND_PORT}...`);
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontend = spawn(`${npmCmd} run dev -- --port ${FRONTEND_PORT}`, { stdio: 'inherit', shell: true });
  
  frontend.on('error', (err) => console.error('Failed to start frontend:', err));
})();
