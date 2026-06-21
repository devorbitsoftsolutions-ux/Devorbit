import { Router } from 'express';
import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { contactSchema, contactQuerySchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { publicLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendThankYou(name: string, email: string, message: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif}</style></head><body>
<div style="max-width:520px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 36px;text-align:center">
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">DevOrbit</h1>
    <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Innovation &amp; Excellence</p>
  </div>
  <div style="padding:32px 36px">
    <p style="color:#334155;font-size:15px;line-height:1.7">Dear <strong>${name.replace(/</g,'&lt;')}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">Thank you for reaching out to DevOrbit! We have received your message and will get back to you within 24 hours.</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">We appreciate your interest and look forward to connecting with you.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#64748b;font-size:13px;line-height:1.6">Best regards,<br><strong style="color:#0f172a">DevOrbit Team</strong></p>
  </div>
</div></body></html>`;

  await emailTransporter.sendMail({
    from: process.env.MAIL_FROM || 'DevOrbit <noreply@devorbit.com>',
    to: email,
    subject: 'Thank You for Contacting DevOrbit',
    html,
  });
}

router.post('/', publicLimiter, validate(contactSchema), async (req, res, next) => {
  try {
    const { name, email, projectType, message } = req.body;
    const sanitizedMessage = sanitizeHtml(message, {
      allowedTags: [],
      allowedAttributes: {},
    });
    const item = await prisma.contactMessage.create({
      data: { name, email, projectType: projectType || 'General', message: sanitizedMessage },
    });

    sendThankYou(name, email, sanitizedMessage).catch(err =>
      console.error('[Contact] Thank-you email failed:', err.message)
    );

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, authorize('ADMIN'), validate(contactQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, read } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (read !== undefined) where.read = read === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { read: false } }),
    ]);

    res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take), unreadCount });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const item = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;