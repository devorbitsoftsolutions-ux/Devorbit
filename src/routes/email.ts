import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { subscriberSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { publicLimiter, subscribeLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';
import { fetchSubscribers, fetchUsers, fetchApplicants } from '../services/mail/email.service.js';
import { createCampaign, sendBatch, BatchRecipient } from '../services/mail/batch.service.js';
import { verifyTransport } from '../services/mail/transport.js';

const router = Router();

router.post('/send-direct', async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.EMAIL_API_KEY) {
      return res.status(401).json({ error: 'Invalid or missing API key' });
    }

    const { recipients, subject, bodyHtml } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients must be a non-empty array' });
    }
    if (!subject) return res.status(400).json({ error: 'subject is required' });
    if (!bodyHtml) return res.status(400).json({ error: 'bodyHtml is required' });

    const isConnected = await verifyTransport();
    if (!isConnected) throw new AppError(502, 'SMTP transport is not connected');

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        status: 'SENDING',
        totalRecipients: recipients.length,
        segment: { source: 'extern', count: recipients.length },
      },
    });

    const batchRecipients: BatchRecipient[] = recipients.map((r: any) => ({
      email: r.email,
      name: r.name || null,
      data: { name: r.name || '', email: r.email, applicantId: r.applicantId || '', ...r.data },
      recipientId: r.applicantId || r.data?.personId,
      recipientType: r.data?.recipientType || 'APPLICANT',
    }));

    res.json({
      message: `Sending to ${batchRecipients.length} recipients`,
      totalRecipients: batchRecipients.length,
      campaignId: campaign.id,
    });

    sendBatch({
      campaignId: campaign.id,
      subjectTemplate: subject,
      bodyTemplate: bodyHtml,
      recipients: batchRecipients,
    }).catch(err => {
      console.error('[Email Direct] Error:', err);
    });
  } catch (err) { next(err); }
});

router.get('/health', async (_req, res, next) => {
  try {
    const connected = await verifyTransport();
    const templateCount = await prisma.emailTemplate.count();
    const subscriberCount = await prisma.emailSubscriber.count();

    res.json({
      smtp: connected ? 'connected' : 'disconnected',
      templates: templateCount,
      subscribers: subscriberCount,
      mailFrom: process.env.MAIL_FROM || 'not configured',
    });
  } catch (err) { next(err); }
});

router.post('/subscribe', subscribeLimiter, validate(subscriberSchema), async (req, res, next) => {
  try {
    const { email, name, source } = req.body;
    const subscriber = await prisma.emailSubscriber.upsert({
      where: { email },
      update: { subscribed: true, name: name || null, source: source || 'WEBSITE' },
      create: { email, name: name || null, source: source || 'WEBSITE' },
    });
    res.status(201).json({ message: 'Successfully subscribed', email: subscriber.email });
  } catch (err) { next(err); }
});

router.post('/unsubscribe', publicLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError(400, 'Valid email is required');
    }
    const subscriber = await prisma.emailSubscriber.update({
      where: { email },
      data: { subscribed: false },
    });
    res.json({ message: 'Successfully unsubscribed', email: subscriber.email });
  } catch (err) {
    if ((err as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Email not found in subscribers' });
    }
    next(err);
  }
});

router.use(authenticate, authorize('ADMIN'));

router.get('/templates', async (_req, res, next) => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(templates);
  } catch (err) { next(err); }
});

router.post('/templates', async (req, res, next) => {
  try {
    const { name, subject, bodyHtml, variables } = req.body;
    if (!name || !subject || !bodyHtml) {
      throw new AppError(400, 'name, subject, and bodyHtml are required');
    }
    const template = await prisma.emailTemplate.create({
      data: { name, subject, bodyHtml, variables: variables || [] },
    });
    res.status(201).json(template);
  } catch (err) { next(err); }
});

router.put('/templates/:id', async (req, res, next) => {
  try {
    const { name, subject, bodyHtml, variables } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data: { name, subject, bodyHtml, variables },
    });
    res.json(template);
  } catch (err) { next(err); }
});

router.delete('/templates/:id', async (req, res, next) => {
  try {
    await prisma.emailTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/campaigns', async (req, res, next) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true, _count: { select: { logs: true } } },
    });
    res.json(campaigns);
  } catch (err) { next(err); }
});

router.get('/campaigns/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: req.params.id },
      include: { template: true, logs: { orderBy: { createdAt: 'desc' }, take: 100 } },
    });
    if (!campaign) throw new AppError(404, 'Campaign not found');
    res.json(campaign);
  } catch (err) { next(err); }
});

router.post('/campaigns', async (req, res, next) => {
  try {
    const { subject, templateId, bodyHtml, subjectTemplate, segment, scheduledAt } = req.body;
    if (!subject) throw new AppError(400, 'subject is required');

    const campaignId = await createCampaign({
      subject,
      templateId,
      bodyHtml,
      subjectTemplate,
      segment,
      scheduledAt,
    });

    res.status(201).json({ id: campaignId });
  } catch (err) { next(err); }
});

router.post('/campaigns/:id/send', async (req, res, next) => {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: req.params.id },
      include: { template: true },
    });
    if (!campaign) throw new AppError(404, 'Campaign not found');
    if (campaign.status === 'SENDING') throw new AppError(400, 'Campaign is already sending');

    const isConnected = await verifyTransport();
    if (!isConnected) throw new AppError(502, 'SMTP transport is not connected');

    let recipients: BatchRecipient[] = [];
    let subjectTemplate: string;
    let bodyTemplate: string;

    if (campaign.template) {
      subjectTemplate = campaign.template.subject;
      bodyTemplate = campaign.template.bodyHtml;
    } else {
      subjectTemplate = campaign.subject;
      const template = await prisma.emailTemplate.findFirst({ where: { name: 'default' } });
      if (!template) throw new AppError(400, 'No template found and campaign has no bodyHtml');
      bodyTemplate = template.bodyHtml;
    }

    const segment = (campaign.segment as Record<string, any>) || {};

    if (segment.source === 'users') {
      recipients = (await fetchUsers()).map(u => ({
        email: u.email,
        name: u.name,
        recipientId: u.userId,
        recipientType: 'USER',
        data: { ...u },
      }));
    } else if (segment.source === 'applicants') {
      recipients = (await fetchApplicants()).map(a => ({
        email: a.email,
        name: a.name,
        recipientId: a.applicantId,
        recipientType: 'APPLICANT',
        data: { ...a },
      }));
    } else if (segment.source === 'subscribers') {
      const subs = await fetchSubscribers(segment.filters);
      recipients = subs.map(s => ({
        email: s.email,
        name: s.name,
        recipientType: 'SUBSCRIBER',
        data: { ...s },
      }));
    } else {
      throw new AppError(400, 'segment.source must be "users", "applicants", or "subscribers"');
    }

    if (recipients.length === 0) {
      throw new AppError(400, 'No recipients found for the given segment');
    }

    res.json({
      message: `Campaign sending started for ${recipients.length} recipients`,
      totalRecipients: recipients.length,
      campaignId: campaign.id,
    });

    sendBatch({
      campaignId: campaign.id,
      subjectTemplate,
      bodyTemplate,
      recipients,
    }).catch(err => {
      console.error('[Email Batch] Error:', err);
    });
  } catch (err) { next(err); }
});

router.get('/subscribers', async (_req, res, next) => {
  try {
    const subscribers = await prisma.emailSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(subscribers);
  } catch (err) { next(err); }
});

router.post('/subscribers', async (req, res, next) => {
  try {
    const { email, name, role, source, metadata } = req.body;
    if (!email) throw new AppError(400, 'email is required');

    const subscriber = await prisma.emailSubscriber.upsert({
      where: { email },
      update: { name, role, source, metadata: metadata || {} },
      create: { email, name, role, source, metadata: metadata || {} },
    });
    res.status(201).json(subscriber);
  } catch (err) { next(err); }
});

router.get('/recipients', async (req, res, next) => {
  try {
    const [users, applicants, subscribers] = await Promise.all([
      fetchUsers(),
      fetchApplicants(),
      fetchSubscribers(),
    ]);

    res.json({
      users: users.map(u => ({ id: u.userId, email: u.email, name: u.name, type: 'USER' })),
      applicants: applicants.map(a => ({ id: a.applicantId, email: a.email, name: a.name, type: 'APPLICANT' })),
      subscribers: subscribers.map(s => ({ email: s.email, name: s.name, type: 'SUBSCRIBER' })),
    });
  } catch (err) { next(err); }
});

router.get('/logs', async (req, res, next) => {
  try {
    const { campaignId, status, limit } = req.query;
    const where: any = {};
    if (campaignId) where.campaignId = campaignId as string;
    if (status) where.status = status as string;

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 100,
    });
    res.json(logs);
  } catch (err) { next(err); }
});

export default router;
