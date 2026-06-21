import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const [
      portfolioCount,
      serviceCount,
      jobCount,
      initiativeCount,
      consultingCount,
      contactCount,
      unreadContacts,
    ] = await Promise.all([
      prisma.portfolio.count(),
      prisma.service.count(),
      prisma.job.count(),
      prisma.initiative.count(),
      prisma.consulting.count(),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { read: false } }),
    ]);

    const recentContacts = await prisma.contactMessage.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, projectType: true, createdAt: true, read: true },
    });

    res.json({
      counts: {
        portfolio: portfolioCount,
        services: serviceCount,
        jobs: jobCount,
        initiatives: initiativeCount,
        consulting: consultingCount,
        contacts: contactCount,
      },
      unread: {
        contacts: unreadContacts,
      },
      recent: {
        contacts: recentContacts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Public stats endpoint (no auth) for the frontend counters
router.get('/public', async (_req, res, next) => {
  try {
    const [portfolioCount, jobCount, initiativeCount] = await Promise.all([
      prisma.portfolio.count(),
      prisma.job.count(),
      prisma.initiative.count(),
    ]);
    res.json({ portfolio: portfolioCount, jobs: jobCount, initiatives: initiativeCount });
  } catch (error) {
    next(error);
  }
});

export default router;