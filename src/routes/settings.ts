import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { settingsSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getSharedSettings(settings: any) {
  return {
    siteName: settings.siteName,
    tagline: settings.tagline,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroBadge: settings.heroBadge,
    docbotApiKey: settings.docbotApiKey,
    updatedAt: settings.updatedAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'main' } });
    }
    res.json(getSharedSettings(settings));
  } catch (error) {
    next(error);
  }
});

router.get('/docbot-config', async (req, res, next) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'main' } });
    }
    // Server-to-server endpoint for the Python DocBot backend
    res.json({
      docbotApiKey: settings.docbotApiKey,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chatbot-config/internal', async (req, res, next) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'main' } });
    }
    res.json({
      chatbotApiKey: settings.chatbotApiKey,
      chatbotBaseUrl: settings.chatbotBaseUrl,
      chatbotModel: settings.chatbotModel,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chatbot-config', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'main' } });
    }
    res.json({
      chatbotApiKey: settings.chatbotApiKey,
      chatbotBaseUrl: settings.chatbotBaseUrl,
      chatbotModel: settings.chatbotModel,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/chatbot-config', authenticate, authorize('ADMIN'), validate(settingsSchema), async (req, res, next) => {
  try {
    const { chatbotApiKey, chatbotBaseUrl, chatbotModel } = req.body;
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: { chatbotApiKey, chatbotBaseUrl, chatbotModel },
      create: { id: 'main', chatbotApiKey, chatbotBaseUrl, chatbotModel },
    });
    // Tell PG chatbot to refresh config immediately
    const pgPort = (req.app.locals as any).pgChatbotPort || 8010;
    fetch(`http://localhost:${pgPort}/refresh-config`, { method: 'POST' }).catch(() => {});
    res.json({
      chatbotApiKey: settings.chatbotApiKey,
      chatbotBaseUrl: settings.chatbotBaseUrl,
      chatbotModel: settings.chatbotModel,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticate, authorize('ADMIN'), validate(settingsSchema), async (req, res, next) => {
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: req.body,
      create: { id: 'main', ...req.body },
    });
    res.json(getSharedSettings(settings));
  } catch (error) {
    next(error);
  }
});

export default router;
