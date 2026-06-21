import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import portfolioRoutes from './routes/portfolio.js';
import serviceRoutes from './routes/service.js';
import jobRoutes from './routes/job.js';
import initiativeRoutes from './routes/initiative.js';
import consultingRoutes from './routes/consulting.js';
import contactRoutes from './routes/contact.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';
import chatbotRoutes from './routes/chatbot.js';
import applicationRoutes from './routes/application.js';
import footerRoutes from './routes/footer.js';
import teamRoutes from './routes/team.js';
import heroRoutes from './routes/hero.js';
import uploadRoutes from './routes/upload.js';
import themeRoutes from './routes/theme.js';
import newsRoutes from './routes/news.js';
import callRequestRoutes from './routes/call-requests.js';
import emailRoutes from './routes/email.js';
import applyRoutes from './routes/apply.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Debounced auto-sync: when content data changes, sync chatbot databases after a quiet period
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_PATHS = ['/api/services', '/api/portfolio', '/api/jobs', '/api/initiatives', '/api/consulting', '/api/news', '/api/settings'];

async function triggerChatbotSync() {
  try {
    const { writeDatabaseJson } = await import('./services/chatbot-sync.js');
    await writeDatabaseJson();
    console.log('[ChatbotSync] database.json updated automatically');
  } catch (err) {
    console.error('[ChatbotSync] Local sync failed:', err);
  }
  try {
    const { syncAllToPgChatbot } = await import('./services/sync-pg-chatbot.js');
    const count = await syncAllToPgChatbot();
    console.log(`[SyncPG] Synced ${count} entries automatically`);
  } catch (err) {
    console.error('[SyncPG] Auto-sync failed:', err);
  }
}

function debounceSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(triggerChatbotSync, 5000);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      undefined,
    ];
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for write operations + auto-sync trigger
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET') {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      console.log(`[${req.method} ${req.path}] -> ${res.statusCode}`);

      const shouldSync = SYNC_PATHS.some(p => req.path.startsWith(p)) &&
        [200, 201, 204].includes(res.statusCode);
      if (shouldSync) debounceSync();

      return originalJson(body);
    };
  }
  next();
});

// Disable caching for all API responses
app.use('/api', (_, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  },
}));

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, user_id } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }
    const port = (app.locals as any).pgChatbotPort || process.env.PG_CHATBOT_PORT || '8010';
    const pgChatUrl = process.env.PG_CHAT_URL || `http://localhost:${port}`;
    const response = await fetch(`${pgChatUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_id || 'web-visitor',
        message: message.trim(),
      }),
    });
    if (!response.ok) {
      throw new Error(`PG Chat returned ${response.status}`);
    }
    const data: any = await response.json();
    res.json({ reply: data.reply || data.answer || 'I am not sure how to answer that.' });
  } catch (err) {
    console.error('[Chat Proxy] Error:', (err as Error).message);
    res.status(502).json({ error: 'Chat service unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/initiatives', initiativeRoutes);
app.use('/api/consulting', consultingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/call-requests', callRequestRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/apply', applyRoutes);

app.get('/api/chatbot/sync-pg', async (_req, res) => {
  try {
    const { syncAllToPgChatbot } = await import('./services/sync-pg-chatbot.js');
    const count = await syncAllToPgChatbot();
    res.json({ synced: count, status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    next();
  }
});

export { notFound, errorHandler };
export default app;