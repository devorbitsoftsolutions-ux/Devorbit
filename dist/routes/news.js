import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { newsSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', async (req, res, next) => {
    try {
        const { active } = req.query;
        const where = active !== undefined ? { active: active === 'true' } : {};
        const items = await prisma.news.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        res.json(items);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const item = await prisma.news.findUnique({ where: { id: req.params.id } });
        if (!item)
            throw new AppError(404, 'News not found');
        res.json(item);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', authenticate, authorize('ADMIN'), validate(newsSchema), async (req, res, next) => {
    try {
        const item = await prisma.news.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', authenticate, authorize('ADMIN'), validate(newsSchema), async (req, res, next) => {
    try {
        const item = await prisma.news.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(item);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.news.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=news.js.map