import { prisma } from '../../lib/prisma.js';
import { getTransport, getMailFrom } from './transport.js';
function renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = data[key];
        return value != null ? String(value) : `{{${key}}}`;
    });
}
export async function sendEmail(options) {
    try {
        const transport = getTransport();
        const mailFrom = getMailFrom();
        await transport.sendMail({
            from: mailFrom,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        if (options.campaignId) {
            await prisma.emailLog.create({
                data: {
                    campaignId: options.campaignId,
                    email: options.to,
                    recipientId: options.recipientId,
                    recipientType: options.recipientType || 'USER',
                    recipientName: options.recipientName,
                    messageType: options.messageType,
                    reason: options.reason,
                    status: 'SENT',
                    subject: options.subject,
                    sentAt: new Date(),
                },
            });
        }
        return { success: true };
    }
    catch (err) {
        const message = err.message;
        if (options.campaignId) {
            await prisma.emailLog.create({
                data: {
                    campaignId: options.campaignId,
                    email: options.to,
                    recipientId: options.recipientId,
                    recipientType: options.recipientType || 'USER',
                    recipientName: options.recipientName,
                    messageType: options.messageType,
                    reason: options.reason,
                    status: 'FAILED',
                    subject: options.subject,
                    error: message,
                },
            });
        }
        return { success: false, error: message };
    }
}
export async function renderAndSend(to, templateBody, subjectTemplate, data, meta) {
    const html = renderTemplate(templateBody, data);
    const subject = renderTemplate(subjectTemplate, data);
    return sendEmail({
        to,
        subject,
        html,
        ...meta,
    });
}
export async function fetchSubscribers(filters) {
    const where = {};
    if (filters?.subscribed !== undefined) {
        where.subscribed = filters.subscribed;
    }
    const subscribers = await prisma.emailSubscriber.findMany({ where });
    return subscribers.map(s => ({ email: s.email, name: s.name, ...(s.metadata || {}) }));
}
export async function fetchUsers() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true },
    });
    return users.map(u => ({ ...u, userId: u.id }));
}
export async function fetchApplicants() {
    const apps = await prisma.application.findMany({
        where: { email: { not: null } },
        select: { id: true, email: true, candidateName: true, status: true },
    });
    return apps.map(a => ({ email: a.email, name: a.candidateName, applicantId: a.id, status: a.status }));
}
//# sourceMappingURL=email.service.js.map