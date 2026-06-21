import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { portfolioSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function preparePortfolioData(body: any) {
  const data: any = { ...body };
  if (data.completionDate) {
    data.completionDate = new Date(data.completionDate);
  } else if (data.completionDate === '' || data.completionDate === null) {
    data.completionDate = null;
  } else {
    delete data.completionDate;
  }
  return data;
}

router.get('/', async (req, res, next) => {
  try {
    const { featured, category, all, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (featured !== undefined) where.featured = featured === 'true';
    if (category) where.category = category;
    if (all !== 'true') where.active = true;

    const [items, total] = await Promise.all([
      prisma.portfolio.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take,
      }),
      prisma.portfolio.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.portfolio.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError(404, 'Portfolio item not found');
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('ADMIN'), validate(portfolioSchema), async (req, res, next) => {
  try {
    const item = await prisma.portfolio.create({ data: preparePortfolioData(req.body) });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('ADMIN'), validate(portfolioSchema), async (req, res, next) => {
  try {
    const item = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: preparePortfolioData(req.body),
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/order', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { order } = req.body;
    const item = await prisma.portfolio.update({
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
    await prisma.portfolio.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;