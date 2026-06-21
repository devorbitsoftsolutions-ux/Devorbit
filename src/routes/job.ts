import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { jobSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { department, type, active, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (department) where.department = department;
    if (type) where.type = type;
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({ where, orderBy: { order: 'asc' }, skip, take }),
      prisma.job.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError(404, 'Job not found');
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('ADMIN'), validate(jobSchema), async (req, res, next) => {
  try {
    const item = await prisma.job.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('ADMIN'), validate(jobSchema), async (req, res, next) => {
  try {
    const item = await prisma.job.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/order', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { order } = req.body;
    const item = await prisma.job.update({
      where: { id: req.params.id },
      data: { order: Number(order) },
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;