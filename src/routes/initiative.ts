import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { initiativeSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    const where = active !== undefined ? { active: active === 'true' } : {};
    const items = await prisma.initiative.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.initiative.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError(404, 'Initiative not found');
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('ADMIN'), validate(initiativeSchema), async (req, res, next) => {
  try {
    const item = await prisma.initiative.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('ADMIN'), validate(initiativeSchema), async (req, res, next) => {
  try {
    const item = await prisma.initiative.update({
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
    const item = await prisma.initiative.update({
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
    await prisma.initiative.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;