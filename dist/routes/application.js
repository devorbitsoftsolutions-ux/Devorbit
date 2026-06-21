import { Router } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sectionSchema, questionSchema, applicationSchema, applicationStatusSchema, adminNoteSchema, sendMessageSchema, } from '../validators/index.js';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const MESSAGE_TEMPLATES = {
    selection: {
        subject: "You've Been Selected!",
        body: (name) => `Dear ${name},

Congratulations! We are pleased to inform you that you have been selected for the next stage of our recruitment process.

We were impressed by your qualifications and experience, and we believe you would be a great fit for our team.

Our team will reach out to you shortly with further details about the next steps.

Welcome aboard, and we look forward to working with you!

Best regards,
DevOrbit Team`,
    },
    approved: {
        subject: 'Application Approved',
        body: (name) => `Dear ${name},

We are happy to inform you that your application has been approved.

Thank you for your patience throughout the review process. Your skills and experience align perfectly with what we are looking for.

We will contact you soon with more information.

Best regards,
DevOrbit Team`,
    },
    rejection: {
        subject: 'Application Update',
        body: (name) => `Dear ${name},

Thank you for taking the time to apply and for your interest in joining DevOrbit.

After careful review, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match the requirements of the position.

We appreciate your effort and wish you the very best in your future endeavors.

Best regards,
DevOrbit Team`,
    },
    custom: {
        subject: 'Message from DevOrbit',
        body: (name) => `Dear ${name},
`,
    },
};
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
// ========================
// INTERNSHIP ROLES (public + admin CRUD)
// ========================
router.get('/internship-roles', async (_req, res) => {
    try {
        const roles = await prisma.internshipRole.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
        res.json(roles.map(r => r.title));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/roles', authenticate, authorize('ADMIN', 'EDITOR'), async (_req, res) => {
    try {
        const roles = await prisma.internshipRole.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        res.json(roles);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/roles', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || !title.trim()) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }
        const last = await prisma.internshipRole.findFirst({
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true },
        });
        const role = await prisma.internshipRole.create({
            data: { title: title.trim(), displayOrder: (last?.displayOrder ?? -1) + 1 },
        });
        res.status(201).json(role);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/roles/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        const { title, isActive } = req.body;
        const role = await prisma.internshipRole.update({
            where: { id: req.params.id },
            data: { ...(title !== undefined && { title: title.trim() }), ...(isActive !== undefined && { isActive }) },
        });
        res.json(role);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/roles/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        await prisma.internshipRole.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.patch('/roles/reorder', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            res.status(400).json({ error: 'ids array is required' });
            return;
        }
        await Promise.all(ids.map((id, idx) => prisma.internshipRole.update({ where: { id }, data: { displayOrder: idx } })));
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ========================
// SECTIONS (admin only CRUD)
// ========================
router.get('/sections', async (_req, res) => {
    try {
        const sections = await prisma.formSection.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                questions: { orderBy: { displayOrder: 'asc' } },
            },
        });
        res.json(sections);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/sections/active', async (_req, res) => {
    try {
        const sections = await prisma.formSection.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
                questions: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        res.json(sections);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/sections/:id', async (req, res) => {
    try {
        const section = await prisma.formSection.findUnique({
            where: { id: req.params.id },
            include: {
                questions: { orderBy: { displayOrder: 'asc' } },
            },
        });
        if (!section)
            return res.status(404).json({ error: 'Section not found' });
        res.json(section);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/sections', authenticate, authorize('ADMIN', 'EDITOR'), validate(sectionSchema), async (req, res) => {
    try {
        const section = await prisma.formSection.create({ data: req.body });
        res.status(201).json(section);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/sections/:id', authenticate, authorize('ADMIN', 'EDITOR'), validate(sectionSchema), async (req, res) => {
    try {
        const section = await prisma.formSection.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(section);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/sections/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        await prisma.formSection.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ========================
// QUESTIONS (admin only CRUD)
// ========================
router.get('/questions', async (req, res) => {
    try {
        const { sectionId } = req.query;
        const where = sectionId ? { sectionId: sectionId } : {};
        const questions = await prisma.formQuestion.findMany({
            where,
            orderBy: [{ sectionId: 'asc' }, { displayOrder: 'asc' }],
        });
        res.json(questions);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/questions/:id', async (req, res) => {
    try {
        const question = await prisma.formQuestion.findUnique({
            where: { id: req.params.id },
        });
        if (!question)
            return res.status(404).json({ error: 'Question not found' });
        res.json(question);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/questions', authenticate, authorize('ADMIN', 'EDITOR'), validate(questionSchema), async (req, res) => {
    try {
        const { options, validationRules, ...rest } = req.body;
        const question = await prisma.formQuestion.create({
            data: {
                ...rest,
                options: options || undefined,
                validationRules: validationRules || undefined,
            },
        });
        res.status(201).json(question);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/questions/:id', authenticate, authorize('ADMIN', 'EDITOR'), validate(questionSchema), async (req, res) => {
    try {
        const { options, validationRules, ...rest } = req.body;
        const question = await prisma.formQuestion.update({
            where: { id: req.params.id },
            data: {
                ...rest,
                options: options || undefined,
                validationRules: validationRules || undefined,
            },
        });
        res.json(question);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/questions/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        await prisma.formQuestion.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ========================
// APPLICATIONS (public submit + admin read)
// ========================
async function sendApplicationThankYou(name, email, applicantId) {
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif}</style></head><body>
<div style="max-width:520px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 36px;text-align:center">
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">DevOrbit</h1>
    <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Innovation &amp; Excellence</p>
  </div>
  <div style="padding:32px 36px">
    <p style="color:#334155;font-size:15px;line-height:1.7">Dear <strong>${name.replace(/</g, '&lt;')}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">Thank you for applying to DevOrbit! We have received your application and our team will review it shortly.</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">Your application ID is <strong style="background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:4px;font-size:15px">${applicantId}</strong>. Please keep this for future reference.</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">If your profile matches our requirements, we will reach out to you for the next steps.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#64748b;font-size:13px;line-height:1.6">Best regards,<br><strong style="color:#0f172a">DevOrbit Team</strong></p>
  </div>
</div></body></html>`;
    await transporter.sendMail({
        from: process.env.MAIL_FROM || 'DevOrbit <noreply@devorbit.com>',
        to: email,
        subject: `Application Received - ${applicantId}`,
        html,
    });
}
router.post('/', validate(applicationSchema), async (req, res) => {
    try {
        const { candidateName, email, answers } = req.body;
        const applicantId = await nextApplicantId();
        const application = await prisma.application.create({
            data: {
                applicantId,
                candidateName: candidateName || null,
                email: email || null,
                status: 'PENDING',
                submittedAt: new Date(),
                answers: {
                    create: answers.filter((a) => a.questionId).map((a) => ({
                        questionId: a.questionId,
                        answer: a.answer || '',
                    })),
                },
                activityLogs: {
                    create: {
                        action: 'SUBMITTED',
                        description: 'Application submitted by candidate',
                    },
                },
            },
            include: {
                answers: { include: { question: true } },
                activityLogs: true,
            },
        });
        sendApplicationThankYou(candidateName || 'Applicant', email || '', applicantId).catch(err => console.error('[Application] Thank-you email failed:', err.message));
        res.status(201).json(application);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { candidateName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                include: {
                    _count: { select: { answers: true, adminNotes: true } },
                },
            }),
            prisma.application.count({ where: where }),
        ]);
        res.json({ data: applications, total, page: pageNum, limit: limitNum });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/next-id', authenticate, authorize('ADMIN', 'EDITOR'), async (_req, res) => {
    try {
        const nextId = await nextApplicantId();
        res.json({ nextApplicantId: nextId });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        const application = await prisma.application.findUnique({
            where: { id: req.params.id },
            include: {
                answers: {
                    include: { question: { include: { section: true } } },
                    orderBy: { question: { displayOrder: 'asc' } },
                },
                adminNotes: { orderBy: { createdAt: 'desc' } },
                activityLogs: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!application)
            return res.status(404).json({ error: 'Application not found' });
        res.json(application);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/:id/status', authenticate, authorize('ADMIN', 'EDITOR'), validate(applicationStatusSchema), async (req, res) => {
    try {
        const application = await prisma.application.update({
            where: { id: req.params.id },
            data: { status: req.body.status },
        });
        await prisma.activityLog.create({
            data: {
                applicationId: req.params.id,
                action: `STATUS_CHANGED`,
                description: `Status changed to ${req.body.status}`,
                performedBy: req.user?.email || null,
            },
        });
        res.json(application);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ========================
// ADMIN NOTES
// ========================
router.get('/:id/notes', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        const notes = await prisma.adminNote.findMany({
            where: { applicationId: req.params.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notes);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/:id/notes', authenticate, authorize('ADMIN', 'EDITOR'), validate(adminNoteSchema), async (req, res) => {
    try {
        const note = await prisma.adminNote.create({
            data: {
                applicationId: req.params.id,
                content: req.body.content,
                createdBy: req.user?.email || null,
            },
        });
        res.status(201).json(note);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/notes/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res) => {
    try {
        await prisma.adminNote.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ========================
// SEND MESSAGE (bulk email)
// ========================
function buildProfessionalEmailHtml({ name, id, messageType: msgType, reason: msgReason, customText: msgCustomText, customSubject }) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const msgTemplates = {
        selection: {
            subject: 'Selection Update – Shortlisted',
            body: 'Congratulations. We are pleased to inform you that you have been shortlisted for the next stage of our evaluation process. Further instructions will be communicated shortly.',
        },
        approved: {
            subject: 'Congratulations – Application Approved',
            body: 'Congratulations. Your application/process has been successfully approved. We appreciate your efforts and look forward to your continued association with the organization.',
        },
        rejection: {
            subject: 'Application Update – Status',
            body: 'Thank you for your interest and participation. After careful review, we regret to inform you that your application was not selected at this time. We encourage you to apply again in the future.',
        },
    };
    const tpl = msgTemplates[msgType] || { subject: customSubject || 'Message from DevOrbit', body: msgCustomText || '' };
    const subject = msgType === 'custom' && customSubject ? customSubject : tpl.subject;
    const mainContent = msgType === 'custom' ? (msgCustomText || '') : tpl.body;
    const msgTypeLabel = { selection: 'Selection Update', approved: 'Approved', rejection: 'Rejection', custom: 'Custom Message' };
    const label = msgTypeLabel[msgType] || msgType;
    const escHtml = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif}table{border-collapse:collapse}</style></head>
<body>
<div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:35px 40px;text-align:center">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700">DevOrbit</h1>
    <p style="color:#bfdbfe;margin:4px 0 0;font-size:14px">Innovation &amp; Excellence</p>
  </div>
  <div style="padding:40px">
    <p style="color:#94a3b8;font-size:13px;margin:0 0 20px">${dateStr} at ${timeStr}</p>
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 20px;padding-bottom:12px;border-bottom:2px solid #e2e8f0">${escHtml(subject)}</h2>
    <p style="color:#334155;font-size:15px;line-height:1.6">Dear <strong>${escHtml(name)}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.6">This message is regarding your application/employment record.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:8px;overflow:hidden">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600;width:120px">Name</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px">${escHtml(name)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600">Applicant ID</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px">${escHtml(id)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600">Message Type</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px">${escHtml(label)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600">Reason</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px">${msgReason ? escHtml(msgReason) : 'N/A'}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;font-weight:600">Date</td>
          <td style="padding:12px 16px;color:#0f172a;font-size:14px">${dateStr}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#334155;font-size:15px;line-height:1.7">${escHtml(mainContent)}</p>
  </div>
  <div style="background:#f8fafc;padding:30px 40px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#0f172a;font-weight:600;margin:0 0 4px;font-size:15px">HR Department</p>
    <p style="color:#64748b;font-size:13px;margin:2px 0">DevOrbit</p>
    <p style="color:#3b82f6;font-size:13px;margin:2px 0">contact@devorbit.com</p>
    <p style="color:#94a3b8;font-size:11px;margin:12px 0 0">This is an automated message from the DevOrbit administration system.</p>
  </div>
</div>
</body>
</html>`;
    return { subject, html };
}
router.post('/send-message', authenticate, authorize('ADMIN'), validate(sendMessageSchema), async (req, res) => {
    try {
        const { applicantIds, messageType, customText, customSubject, reason, recipientType } = req.body;
        const applications = await prisma.application.findMany({
            where: { id: { in: applicantIds } },
        });
        if (applications.length === 0) {
            return res.status(404).json({ error: 'No applications found' });
        }
        const missing = applicantIds.filter((id) => !applications.some(a => a.id === id));
        if (missing.length > 0) {
            return res.status(404).json({ error: `${missing.length} application(s) not found` });
        }
        const fromAddr = process.env.MAIL_FROM || 'DevOrbit <noreply@devorbit.com>';
        let sent = 0;
        const errors = [];
        for (const app of applications) {
            if (!app.email) {
                errors.push({ id: app.id, name: app.candidateName || 'Unknown', error: 'No email address' });
                continue;
            }
            const { subject, html } = buildProfessionalEmailHtml({
                name: app.candidateName || 'Applicant',
                id: app.applicantId || app.id,
                messageType,
                reason,
                customText,
                customSubject,
            });
            const textBody = messageType === 'custom'
                ? `Dear ${app.candidateName || 'Applicant'},\n\n${customText}`
                : `Dear ${app.candidateName || 'Applicant'},\n\n${html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim()}`;
            try {
                await transporter.sendMail({
                    from: fromAddr,
                    to: app.email,
                    subject,
                    text: textBody,
                    html,
                });
                await prisma.activityLog.create({
                    data: {
                        applicationId: app.id,
                        action: 'MESSAGE_SENT',
                        description: `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} message sent to ${app.email}${reason ? ` (Reason: ${reason})` : ''}`,
                        performedBy: req.user?.email || null,
                    },
                });
                sent++;
            }
            catch (mailErr) {
                errors.push({ id: app.id, name: app.candidateName || 'Unknown', error: mailErr.message });
            }
        }
        res.json({ sent, failed: errors.length, errors: errors.length > 0 ? errors : undefined });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default router;
//# sourceMappingURL=application.js.map