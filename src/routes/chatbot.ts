import { Router } from 'express';
import { generateDynamicQA, writeDatabaseJson, generatePDFText } from '../services/chatbot-sync.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

let cachedQA: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 30_000;

router.get('/qa', async (_req, res, next) => {
  try {
    if (cachedQA && Date.now() - lastCacheTime < CACHE_TTL) {
      res.json(cachedQA);
      return;
    }
    const qa = await generateDynamicQA();
    cachedQA = qa;
    lastCacheTime = Date.now();
    res.json(qa);
  } catch (error) {
    next(error);
  }
});

router.get('/qa/refresh', async (_req, res, next) => {
  try {
    const qa = await generateDynamicQA();
    cachedQA = qa;
    lastCacheTime = Date.now();
    res.json({ count: qa.length, message: 'Q&A cache refreshed' });
  } catch (error) {
    next(error);
  }
});

router.post('/sync', authenticate, authorize('ADMIN'), async (_req, res, next) => {
  try {
    const qa = await writeDatabaseJson();

    const pdfDir = join(__dirname, '..', '..', '..', 'pdf-chatbot', 'pdfs');
    if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

    const pdfText = await generatePDFText();
    const textPath = join(pdfDir, 'devorbit-database.txt');
    writeFileSync(textPath, pdfText, 'utf-8');

    cachedQA = qa;
    lastCacheTime = Date.now();

    let docBotNotified = false;
    try {
      const docBotUrl = `http://localhost:${process.env.DOCBOT_PORT || 8000}`;
      await fetch(`${docBotUrl}/upload-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(2000),
      });
      docBotNotified = true;
    } catch {
      // docbot may not be running
    }

    res.json({
      count: qa.length,
      databaseJsonWritten: true,
      pdfTextGenerated: true,
      docBotNotified,
      message: 'Chatbot data synced successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (_req, res, next) => {
  try {
    const qa = await generateDynamicQA();
    res.json({
      totalQaPairs: qa.length,
      bySource: qa.reduce<Record<string, number>>((acc, q) => {
        acc[q.source] = (acc[q.source] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
