import 'dotenv/config';
import { spawn } from 'child_process';
import { createServer } from 'net';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import app, { notFound, errorHandler } from './app.js';
import { prisma } from './lib/prisma.js';
import { writeDatabaseJson } from './services/chatbot-sync.js';
import { syncAllToPgChatbot } from './services/sync-pg-chatbot.js';

const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

let docBotPort = 8000;
let docBotProcess: ReturnType<typeof spawn> | null = null;

let pgChatbotPort = 8010;
let pgChatbotProcess: ReturnType<typeof spawn> | null = null;

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function tryKillPort(port: number): Promise<void> {
  try {
    const { execSync } = await import('child_process');
    execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // fuser not available or failed
  }
}

async function findFreePort(startPort: number, label: string): Promise<number> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const port = startPort + attempt;
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500));

    const free = await isPortFree(port);
    if (!free) {
      if (attempt === 0) {
        console.log(`[${label}] Port ${port} in use, trying to free it...`);
        await tryKillPort(port);
        if (await isPortFree(port)) {
          console.log(`[${label}] Freed port ${port}`);
          return port;
        }
        console.log(`[${label}] Could not free port ${port}, trying ${port + 1}...`);
        continue;
      }
      console.log(`[${label}] Port ${port} in use, trying ${port + 1}...`);
      continue;
    }
    return port;
  }
  console.error(`[${label}] No free port found in range ${startPort}-${startPort + 9}`);
  return -1;
}

async function startDocBot() {
  const docBotDir = join(__dirname, '..', '..', 'pdf-chatbot');
  const venvUvicorn = join(docBotDir, 'venv', 'bin', 'uvicorn');
  const cmd = existsSync(venvUvicorn) ? venvUvicorn : 'uvicorn';

  const port = await findFreePort(8000, 'DocBot');
  if (port < 0) return null;
  docBotPort = port;

  const proc = spawn(cmd, ['backend:app', '--host', '0.0.0.0', '--port', String(port), '--workers', '2'], {
    cwd: docBotDir,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(port) },
  });

  proc.stdout.on('data', (data) => console.log(`[DocBot] ${data.toString().trim()}`));
  proc.stderr.on('data', (data) => console.log(`[DocBot] ${data.toString().trim()}`));
  proc.on('error', (err) => console.warn(`[DocBot] Error: ${err.message}`));
  proc.on('exit', (code) => {
    if (code !== 0) console.warn(`[DocBot] Exited with code ${code}`);
    if (pgChatbotProcess === proc) pgChatbotProcess = null;
  });

  docBotProcess = proc;
  console.log(`[DocBot] Started on port ${port}`);
  return proc;
}

async function startPgChatbot() {
  const pgDir = join(__dirname, '..', 'chatbot-pg');
  const venvUvicorn = join(pgDir, 'venv', 'bin', 'uvicorn');
  const cmd = existsSync(venvUvicorn) ? venvUvicorn : 'uvicorn';

  const port = await findFreePort(8010, 'PGChatbot');
  if (port < 0) return null;
  pgChatbotPort = port;

  const proc = spawn(cmd, ['main:app', '--host', '0.0.0.0', '--port', String(port)], {
    cwd: pgDir,
    stdio: 'pipe',
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/chatbot',
      EXPRESS_URL: `http://localhost:${PORT}`,
      OPENAI_API_KEY: 'placeholder',
    },
  });

  proc.stdout.on('data', (data) => console.log(`[PGChatbot] ${data.toString().trim()}`));
  proc.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (!msg.includes('INFO') && !msg.includes('Uvicorn')) {
      console.log(`[PGChatbot] ${msg}`);
    }
  });
  proc.on('error', (err) => console.warn(`[PGChatbot] Error: ${err.message}`));
  proc.on('exit', (code) => {
    if (code !== 0) console.warn(`[PGChatbot] Exited with code ${code}`);
    if (pgChatbotProcess === proc) pgChatbotProcess = null;
  });

  pgChatbotProcess = proc;
  app.locals.pgChatbotPort = port;
  console.log(`[PGChatbot] Started on port ${port}`);
  return proc;
}

async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    // Build chatbot Q&A database from live data on startup
    try {
      const qa = await writeDatabaseJson();
      console.log(`[Chatbot] Built ${qa.length} Q&A pairs from database`);
    } catch (err) {
      console.warn('[Chatbot] Initial Q&A build skipped:', (err as Error).message);
    }

    // Start background processes
    const [docBot, pgChatbot] = await Promise.allSettled([
      startDocBot(),
      startPgChatbot(),
    ]);

    // Sync website data to PG chatbot knowledge_base once it's ready
    if (pgChatbot.status === 'fulfilled' && pgChatbot.value) {
      // Wait a moment for the server to fully boot
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const count = await syncAllToPgChatbot();
        console.log(`[SyncPG] Synced ${count} knowledge entries to PG chatbot`);
      } catch (err) {
        console.warn('[SyncPG] Initial sync failed:', (err as Error).message);
      }
    }

    // Admin endpoints
    app.get('/api/chatbot/pg-status', (_req, res) => {
      res.json({
        running: pgChatbotProcess !== null && pgChatbotProcess.exitCode === null,
        port: pgChatbotPort,
        docbot: {
          running: docBotProcess !== null && docBotProcess.exitCode === null,
          port: docBotPort,
        },
      });
    });

    app.post('/api/chatbot/pg-restart', async (_req, res) => {
      try {
        if (pgChatbotProcess) {
          pgChatbotProcess.kill();
          pgChatbotProcess = null;
        }
        await tryKillPort(pgChatbotPort);
        await new Promise((r) => setTimeout(r, 1000));
        const proc = await startPgChatbot();
        if (proc) {
          setTimeout(async () => {
            try { await syncAllToPgChatbot(); } catch { /* ignore */ }
          }, 3000);
          res.json({ status: 'restarted', port: pgChatbotPort });
        } else {
          res.status(500).json({ error: 'Failed to restart' });
        }
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    app.use(notFound);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`DocBot (PDF chatbot) running on http://localhost:${docBotPort}`);
      console.log(`PGChatbot running on http://localhost:${pgChatbotPort}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\nShutting down...');
      if (docBotProcess) docBotProcess.kill();
      if (pgChatbotProcess) pgChatbotProcess.kill();
      prisma.$disconnect();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
