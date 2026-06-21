import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { publicLimiter } from '../middleware/rateLimiter.js';
const router = Router();
async function nextApplicantId() {
    const last = await prisma.application.findFirst({
        where: { applicantId: { not: null } },
        orderBy: { applicantId: 'desc' },
        select: { applicantId: true },
    });
    if (!last?.applicantId)
        return 'APR-000001';
    const num = parseInt(last.applicantId.replace('APR-', ''), 10);
    return `APR-${String(num + 1).padStart(6, '0')}`;
}
router.post('/', publicLimiter, async (req, res) => {
    try {
        const { fullName, fatherName, degree, institution, graduationDate, email, phoneCode, phone, role, skills, projects, portfolioLinks, hasExperience, experienceDetail, problemSolving, motivation, availability, startDate, githubUrl, linkedinUrl, workPreference, proficiency, extraInfo, } = req.body;
        if (!fullName || !email || !phone || !role) {
            return res.status(400).json({ error: 'Missing required fields: fullName, email, phone, role' });
        }
        if (typeof fullName !== 'string' || fullName.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        const fullPhone = `${phoneCode}${phone.replace(/[\s\-()]/g, '')}`;
        if (!/^\d{4,15}$/.test(phone.replace(/[\s\-()]/g, ''))) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }
        if (githubUrl && !/^https?:\/\/.+/.test(githubUrl)) {
            return res.status(400).json({ error: 'Invalid GitHub URL' });
        }
        if (linkedinUrl && !/^https?:\/\/.+/.test(linkedinUrl)) {
            return res.status(400).json({ error: 'Invalid LinkedIn URL' });
        }
        const applicantId = await nextApplicantId();
        const application = await prisma.application.create({
            data: {
                applicantId,
                candidateName: fullName,
                email,
                status: 'PENDING',
                submittedAt: new Date(),
                activityLogs: {
                    create: {
                        action: 'SUBMITTED',
                        description: 'Internship application submitted',
                    },
                },
            },
        });
        const answers = [
            { questionId: 'fatherName', answer: fatherName || '' },
            { questionId: 'degree', answer: degree || '' },
            { questionId: 'institution', answer: institution || '' },
            { questionId: 'graduationDate', answer: graduationDate || '' },
            { questionId: 'phone', answer: fullPhone },
            { questionId: 'role', answer: role },
            { questionId: 'skills', answer: skills || '' },
            { questionId: 'projects', answer: projects || '' },
            { questionId: 'portfolioLinks', answer: portfolioLinks || '' },
            { questionId: 'hasExperience', answer: hasExperience || 'no' },
            { questionId: 'experienceDetail', answer: experienceDetail || '' },
            { questionId: 'problemSolving', answer: problemSolving || '' },
            { questionId: 'motivation', answer: motivation || '' },
            { questionId: 'availability', answer: availability || '' },
            { questionId: 'startDate', answer: startDate || '' },
            { questionId: 'githubUrl', answer: githubUrl || '' },
            { questionId: 'linkedinUrl', answer: linkedinUrl || '' },
            { questionId: 'workPreference', answer: workPreference || '' },
            { questionId: 'proficiency', answer: String(proficiency || '') },
            { questionId: 'extraInfo', answer: extraInfo || '' },
        ];
        for (const a of answers) {
            await prisma.applicationAnswer.create({
                data: {
                    applicationId: application.id,
                    questionId: a.questionId,
                    answer: a.answer,
                },
            });
        }
        res.status(201).json({ success: true, applicantId });
    }
    catch (err) {
        console.error('[Apply] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=apply.js.map