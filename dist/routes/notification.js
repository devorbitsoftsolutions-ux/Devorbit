import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { notificationSchema } from '../validators/index.js';
import { validate } from '../middleware/validate.js';
const router = Router();
router.get('/', async (req, res, next) => {
    try {
        const { read, type, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (read !== undefined)
            where.read = read === 'true';
        if (type)
            where.type = type;
        const [items, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { read: false } }),
        ]);
        res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take), unreadCount });
    }
    catch (error) {
        next(error);
    }
});
router.get('/unread-count', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const count = await prisma.notification.count({ where: { read: false } });
        res.json({ count });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', authenticate, authorize('ADMIN'), validate(notificationSchema), async (req, res, next) => {
    try {
        const item = await prisma.notification.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id/read', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const item = await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true },
        });
        res.json(item);
    }
    catch (error) {
        next(error);
    }
});
router.patch('/read-all', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
        res.json({ message: 'All marked as read' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.notification.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=notification.js.map