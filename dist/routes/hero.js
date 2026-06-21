import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { heroCardSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', async (req, res, next) => {
    try {
        const { all } = req.query;
        const where = {};
        if (all !== 'true')
            where.isActive = true;
        const items = await prisma.heroCard.findMany({
            where,
            orderBy: { order: 'asc' },
        });
        res.json({ items });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const item = await prisma.heroCard.findUnique({ where: { id: req.params.id } });
        if (!item)
            throw new AppError(404, 'Hero card not found');
        res.json(item);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', authenticate, authorize('ADMIN'), validate(heroCardSchema), async (req, res, next) => {
    try {
        const item = await prisma.heroCard.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', authenticate, authorize('ADMIN'), validate(heroCardSchema), async (req, res, next) => {
    try {
        const item = await prisma.heroCard.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(item);
    }
    catch (error) {
        next(error);
    }
});
router.patch('/reorder', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items))
            throw new AppError(400, 'items array required');
        await Promise.all(items.map(({ id, order }) => prisma.heroCard.update({ where: { id }, data: { order } })));
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.heroCard.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=hero.js.map