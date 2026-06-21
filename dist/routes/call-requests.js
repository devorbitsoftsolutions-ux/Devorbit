import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { callRequestSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
import { publicLimiter } from '../middleware/rateLimiter.js';
const router = Router();
router.post('/', publicLimiter, validate(callRequestSchema), async (req, res, next) => {
    try {
        const { name, purpose, whatsapp, datetime } = req.body;
        const entry = await prisma.callRequest.create({
            data: {
                name,
                purpose,
                whatsapp,
                datetime: new Date(datetime),
            },
        });
        res.status(201).json(entry);
    }
    catch (error) {
        next(error);
    }
});
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [items, total] = await Promise.all([
            prisma.callRequest.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.callRequest.count(),
        ]);
        res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.callRequest.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=call-requests.js.map