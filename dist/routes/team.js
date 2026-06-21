import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { teamPageSettingSchema, leadershipMemberSchema, teamMemberSchema, teamDepartmentSchema, orgNodeSchema, founderSchema, advisorSchema, teamStatisticSchema, awardSchema, testimonialSchema, officeLocationSchema, customSectionSchema, mediaItemSchema, } from '../validators/index.js';
const router = Router();
// ── Team Page Settings ──
router.get('/settings', async (req, res, next) => {
    try {
        let settings = await prisma.teamPageSetting.findUnique({ where: { id: 'main' } });
        if (!settings) {
            settings = await prisma.teamPageSetting.create({ data: { id: 'main' } });
        }
        res.json(settings);
    }
    catch (e) {
        next(e);
    }
});
router.put('/settings', authenticate, authorize('ADMIN'), validate(teamPageSettingSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamPageSetting.upsert({
            where: { id: 'main' },
            create: { id: 'main', ...req.body },
            update: req.body,
        });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
// ── Leadership ──
router.get('/leadership', async (req, res, next) => {
    try {
        const items = await prisma.leadershipMember.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/leadership', authenticate, authorize('ADMIN'), validate(leadershipMemberSchema), async (req, res, next) => {
    try {
        const item = await prisma.leadershipMember.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/leadership/:id', authenticate, authorize('ADMIN'), validate(leadershipMemberSchema), async (req, res, next) => {
    try {
        const item = await prisma.leadershipMember.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/leadership/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.leadershipMember.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Departments ──
router.get('/departments', async (req, res, next) => {
    try {
        const items = await prisma.teamDepartment.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/departments', authenticate, authorize('ADMIN'), validate(teamDepartmentSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamDepartment.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/departments/:id', authenticate, authorize('ADMIN'), validate(teamDepartmentSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamDepartment.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/departments/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.teamDepartment.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Team Members ──
router.get('/members', async (req, res, next) => {
    try {
        const items = await prisma.teamMember.findMany({
            include: { department: true, reportsTo: { select: { id: true, fullName: true, jobTitle: true } } },
            orderBy: { displayOrder: 'asc' },
        });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.get('/members/:id', async (req, res, next) => {
    try {
        const item = await prisma.teamMember.findUnique({
            where: { id: req.params.id },
            include: { department: true, reportsTo: { select: { id: true, fullName: true, jobTitle: true } } },
        });
        if (!item)
            throw new AppError(404, 'Team member not found');
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.post('/members', authenticate, authorize('ADMIN'), validate(teamMemberSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamMember.create({
            data: req.body,
            include: { department: true },
        });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/members/:id', authenticate, authorize('ADMIN'), validate(teamMemberSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamMember.update({
            where: { id: req.params.id },
            data: req.body,
            include: { department: true },
        });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/members/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.teamMember.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Org Nodes ──
router.get('/org-nodes', async (req, res, next) => {
    try {
        const items = await prisma.orgNode.findMany({
            orderBy: { level: 'asc' },
        });
        const buildTree = (parentId = null) => items.filter(n => n.parentId === parentId).sort((a, b) => a.displayOrder - b.displayOrder).map(n => ({
            ...n,
            children: buildTree(n.id),
        }));
        res.json(buildTree());
    }
    catch (e) {
        next(e);
    }
});
router.get('/org-nodes/flat', async (req, res, next) => {
    try {
        const items = await prisma.orgNode.findMany({ orderBy: { level: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/org-nodes', authenticate, authorize('ADMIN'), validate(orgNodeSchema), async (req, res, next) => {
    try {
        const item = await prisma.orgNode.create({
            data: { ...req.body, level: req.body.level ?? (req.body.parentId ? (await prisma.orgNode.findUnique({ where: { id: req.body.parentId } }))?.level ?? 0 + 1 : 0) },
        });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/org-nodes/:id', authenticate, authorize('ADMIN'), validate(orgNodeSchema), async (req, res, next) => {
    try {
        const item = await prisma.orgNode.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/org-nodes/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.orgNode.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Founders ──
router.get('/founders', async (req, res, next) => {
    try {
        const items = await prisma.founder.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/founders', authenticate, authorize('ADMIN'), validate(founderSchema), async (req, res, next) => {
    try {
        const item = await prisma.founder.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/founders/:id', authenticate, authorize('ADMIN'), validate(founderSchema), async (req, res, next) => {
    try {
        const item = await prisma.founder.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/founders/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.founder.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Advisors ──
router.get('/advisors', async (req, res, next) => {
    try {
        const items = await prisma.advisor.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/advisors', authenticate, authorize('ADMIN'), validate(advisorSchema), async (req, res, next) => {
    try {
        const item = await prisma.advisor.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/advisors/:id', authenticate, authorize('ADMIN'), validate(advisorSchema), async (req, res, next) => {
    try {
        const item = await prisma.advisor.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/advisors/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.advisor.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Statistics ──
router.get('/statistics', async (req, res, next) => {
    try {
        const items = await prisma.teamStatistic.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/statistics', authenticate, authorize('ADMIN'), validate(teamStatisticSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamStatistic.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/statistics/:id', authenticate, authorize('ADMIN'), validate(teamStatisticSchema), async (req, res, next) => {
    try {
        const item = await prisma.teamStatistic.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/statistics/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.teamStatistic.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Awards ──
router.get('/awards', async (req, res, next) => {
    try {
        const items = await prisma.award.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/awards', authenticate, authorize('ADMIN'), validate(awardSchema), async (req, res, next) => {
    try {
        const item = await prisma.award.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/awards/:id', authenticate, authorize('ADMIN'), validate(awardSchema), async (req, res, next) => {
    try {
        const item = await prisma.award.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/awards/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.award.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Testimonials ──
router.get('/testimonials', async (req, res, next) => {
    try {
        const items = await prisma.testimonial.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/testimonials', authenticate, authorize('ADMIN'), validate(testimonialSchema), async (req, res, next) => {
    try {
        const item = await prisma.testimonial.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/testimonials/:id', authenticate, authorize('ADMIN'), validate(testimonialSchema), async (req, res, next) => {
    try {
        const item = await prisma.testimonial.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/testimonials/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.testimonial.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Office Locations ──
router.get('/locations', async (req, res, next) => {
    try {
        const items = await prisma.officeLocation.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/locations', authenticate, authorize('ADMIN'), validate(officeLocationSchema), async (req, res, next) => {
    try {
        const item = await prisma.officeLocation.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/locations/:id', authenticate, authorize('ADMIN'), validate(officeLocationSchema), async (req, res, next) => {
    try {
        const item = await prisma.officeLocation.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/locations/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.officeLocation.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Custom Sections ──
router.get('/custom-sections', async (req, res, next) => {
    try {
        const items = await prisma.customSection.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/custom-sections', authenticate, authorize('ADMIN'), validate(customSectionSchema), async (req, res, next) => {
    try {
        const item = await prisma.customSection.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.put('/custom-sections/:id', authenticate, authorize('ADMIN'), validate(customSectionSchema), async (req, res, next) => {
    try {
        const item = await prisma.customSection.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/custom-sections/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.customSection.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Media Items ──
router.get('/media', async (req, res, next) => {
    try {
        const items = await prisma.mediaItem.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
router.post('/media', authenticate, authorize('ADMIN'), validate(mediaItemSchema), async (req, res, next) => {
    try {
        const item = await prisma.mediaItem.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (e) {
        next(e);
    }
});
router.delete('/media/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.mediaItem.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// ── Public aggregate endpoint ──
router.get('/public', async (req, res, next) => {
    try {
        const [settings, leadership, departments, members, orgNodes, founders, advisors, statistics, awards, testimonials, locations, customSections] = await Promise.all([
            prisma.teamPageSetting.findUnique({ where: { id: 'main' } }),
            prisma.leadershipMember.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            prisma.teamDepartment.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            prisma.teamMember.findMany({
                where: { isActive: true },
                include: { department: true, reportsTo: { select: { id: true, fullName: true, jobTitle: true } } },
                orderBy: { displayOrder: 'asc' },
            }),
            prisma.orgNode.findMany({ orderBy: { level: 'asc' } }),
            prisma.founder.findMany({ orderBy: { displayOrder: 'asc' } }),
            prisma.advisor.findMany({ orderBy: { displayOrder: 'asc' } }),
            prisma.teamStatistic.findMany({ orderBy: { displayOrder: 'asc' } }),
            prisma.award.findMany({ orderBy: { displayOrder: 'asc' } }),
            prisma.testimonial.findMany({ orderBy: { displayOrder: 'asc' } }),
            prisma.officeLocation.findMany({ orderBy: { displayOrder: 'asc' } }),
            prisma.customSection.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        ]);
        res.json({
            settings,
            leadership,
            departments,
            members,
            orgNodes,
            founders,
            advisors,
            statistics,
            awards,
            testimonials,
            locations,
            customSections,
        });
    }
    catch (e) {
        next(e);
    }
});
// ── Generic Reorder — accepts { items: [{ id, displayOrder }] } ──
const REORDER_MODELS = ['leadership', 'departments', 'members', 'org-nodes', 'founders', 'advisors', 'statistics', 'awards', 'testimonials', 'locations', 'custom-sections'];
const prismaModelMap = {
    leadership: 'leadershipMember',
    departments: 'teamDepartment',
    members: 'teamMember',
    'org-nodes': 'orgNode',
    founders: 'founder',
    advisors: 'advisor',
    statistics: 'teamStatistic',
    awards: 'award',
    testimonials: 'testimonial',
    locations: 'officeLocation',
    'custom-sections': 'customSection',
    media: 'mediaItem',
};
router.patch('/:resource/reorder', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const { resource } = req.params;
        const modelName = prismaModelMap[resource];
        if (!modelName)
            throw new AppError(400, `Invalid resource: ${resource}`);
        if (!REORDER_MODELS.includes(resource))
            throw new AppError(400, `Reorder not supported for ${resource}`);
        const { items } = req.body;
        if (!Array.isArray(items))
            throw new AppError(400, 'items must be an array');
        const model = prisma;
        await prisma.$transaction(items.map((item) => model[modelName].update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } })));
        res.json({ success: true });
    }
    catch (e) {
        next(e);
    }
});
// ── Generic Toggle — accepts { isActive: boolean } ──
const TOGGLE_MODELS = ['leadership', 'departments', 'members', 'custom-sections'];
router.patch('/:resource/:id/toggle', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const { resource, id } = req.params;
        const modelName = prismaModelMap[resource];
        if (!modelName)
            throw new AppError(400, `Invalid resource: ${resource}`);
        if (!TOGGLE_MODELS.includes(resource))
            throw new AppError(400, `Toggle not supported for ${resource}`);
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean')
            throw new AppError(400, 'isActive must be a boolean');
        const model = prisma[modelName];
        const item = await model.update({ where: { id }, data: { isActive } });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
// ── Generic Bulk Delete — accepts { ids: string[] } ──
const BULK_DELETE_MODELS = ['leadership', 'departments', 'members', 'org-nodes', 'founders', 'advisors', 'statistics', 'awards', 'testimonials', 'locations', 'custom-sections', 'media'];
router.post('/:resource/bulk-delete', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const { resource } = req.params;
        const modelName = prismaModelMap[resource];
        if (!modelName)
            throw new AppError(400, `Invalid resource: ${resource}`);
        if (!BULK_DELETE_MODELS.includes(resource))
            throw new AppError(400, `Bulk delete not supported for ${resource}`);
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0)
            throw new AppError(400, 'ids must be a non-empty array');
        const model = prisma[modelName];
        await model.deleteMany({ where: { id: { in: ids } } });
        res.json({ success: true });
    }
    catch (e) {
        next(e);
    }
});
export default router;
//# sourceMappingURL=team.js.map