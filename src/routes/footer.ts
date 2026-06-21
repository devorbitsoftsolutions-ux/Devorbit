import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { footerSectionSchema, footerLinkSchema, footerSocialSchema, footerSettingSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function reorderBody(data: { id: string; sortOrder: number }[]) {
  return data;
}

// ── Sections ──

router.get('/sections', async (req, res, next) => {
  try {
    const { active } = req.query;
    const where = active !== undefined ? { isActive: active === 'true' } : {};
    const items = await prisma.footerSection.findMany({
      where,
      include: { links: { orderBy: { sortOrder: 'asc' }, where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/sections/:id', async (req, res, next) => {
  try {
    const item = await prisma.footerSection.findUnique({
      where: { id: req.params.id },
      include: { links: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!item) throw new AppError(404, 'Footer section not found');
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/sections', authenticate, authorize('ADMIN'), validate(footerSectionSchema), async (req, res, next) => {
  try {
    const max = await prisma.footerSection.aggregate({ _max: { sortOrder: true } });
    const item = await prisma.footerSection.create({
      data: { ...req.body, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/sections/:id', authenticate, authorize('ADMIN'), validate(footerSectionSchema), async (req, res, next) => {
  try {
    const item = await prisma.footerSection.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch('/sections/reorder', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const orders = reorderBody(req.body);
    await Promise.all(orders.map(o => prisma.footerSection.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/sections/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.footerSection.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ── Links ──

router.get('/links', async (req, res, next) => {
  try {
    const { sectionId } = req.query;
    const where = sectionId ? { sectionId: String(sectionId) } : {};
    const items = await prisma.footerLink.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/links', authenticate, authorize('ADMIN'), validate(footerLinkSchema), async (req, res, next) => {
  try {
    const { sectionId } = req.body;
    const max = await prisma.footerLink.aggregate({ where: { sectionId }, _max: { sortOrder: true } });
    const item = await prisma.footerLink.create({
      data: { ...req.body, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/links/:id', authenticate, authorize('ADMIN'), validate(footerLinkSchema), async (req, res, next) => {
  try {
    const item = await prisma.footerLink.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch('/links/reorder', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const orders = reorderBody(req.body);
    await Promise.all(orders.map(o => prisma.footerLink.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/links/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.footerLink.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ── Socials ──

router.get('/socials', async (req, res, next) => {
  try {
    const items = await prisma.footerSocial.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/socials', authenticate, authorize('ADMIN'), validate(footerSocialSchema), async (req, res, next) => {
  try {
    const max = await prisma.footerSocial.aggregate({ _max: { sortOrder: true } });
    const item = await prisma.footerSocial.create({
      data: { ...req.body, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/socials/:id', authenticate, authorize('ADMIN'), validate(footerSocialSchema), async (req, res, next) => {
  try {
    const item = await prisma.footerSocial.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch('/socials/reorder', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const orders = reorderBody(req.body);
    await Promise.all(orders.map(o => prisma.footerSocial.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/socials/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.footerSocial.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ── Settings ──

router.get('/settings', async (req, res, next) => {
  try {
    let item = await prisma.footerSetting.findUnique({ where: { id: 'main' } });
    if (!item) {
      item = await prisma.footerSetting.create({ data: { id: 'main' } });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/settings', authenticate, authorize('ADMIN'), validate(footerSettingSchema), async (req, res, next) => {
  try {
    const item = await prisma.footerSetting.upsert({
      where: { id: 'main' },
      create: { id: 'main', ...req.body },
      update: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// ── Public (aggregated) ──

router.get('/public', async (req, res, next) => {
  try {
    const [sections, socials, settings] = await Promise.all([
      prisma.footerSection.findMany({
        where: { isActive: true },
        include: { links: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.footerSocial.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.footerSetting.findUnique({ where: { id: 'main' } }),
    ]);
    res.json({ sections, socials, settings });
  } catch (error) {
    next(error);
  }
});

export default router;
