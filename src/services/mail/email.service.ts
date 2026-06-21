import { prisma } from '../../lib/prisma.js';
import { getTransport, getMailFrom } from './transport.js';

export interface PersonalizationData {
  [key: string]: string | number | boolean | undefined | null;
}

export interface SendOptions {
  to: string;
  subject: string;
  html: string;
  campaignId?: string;
  recipientId?: string;
  recipientType?: string;
  recipientName?: string;
  messageType?: string;
  reason?: string;
}

function renderTemplate(template: string, data: PersonalizationData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `{{${key}}}`;
  });
}

export async function sendEmail(options: SendOptions): Promise<{ success: boolean; error?: string }> {
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
  } catch (err) {
    const message = (err as Error).message;

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

export async function renderAndSend(
  to: string,
  templateBody: string,
  subjectTemplate: string,
  data: PersonalizationData,
  meta?: { campaignId?: string; recipientId?: string; recipientType?: string; recipientName?: string; messageType?: string; reason?: string }
): Promise<{ success: boolean; error?: string }> {
  const html = renderTemplate(templateBody, data);
  const subject = renderTemplate(subjectTemplate, data);

  return sendEmail({
    to,
    subject,
    html,
    ...meta,
  });
}

export async function fetchSubscribers(filters?: { role?: string; subscribed?: boolean }): Promise<Array<{ email: string; name?: string | null; [key: string]: any }>> {
  const where: any = {};

  if (filters?.subscribed !== undefined) {
    where.subscribed = filters.subscribed;
  }

  const subscribers = await prisma.emailSubscriber.findMany({ where });
  return subscribers.map(s => ({ email: s.email, name: s.name, ...(s.metadata as any || {}) }));
}

export async function fetchUsers(): Promise<Array<{ email: string; name: string; [key: string]: any }>> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  return users.map(u => ({ ...u, userId: u.id }));
}

export async function fetchApplicants(): Promise<Array<{ email: string; name: string | null; [key: string]: any }>> {
  const apps = await prisma.application.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, candidateName: true, status: true },
  });
  return apps.map(a => ({ email: a.email!, name: a.candidateName, applicantId: a.id, status: a.status }));
}
