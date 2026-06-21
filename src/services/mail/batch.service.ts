import { prisma } from '../../lib/prisma.js';
import { renderAndSend, PersonalizationData } from './email.service.js';

const BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE) || 50;
const RATE_LIMIT_MS = Number(process.env.EMAIL_RATE_LIMIT_MS) || 1000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface BatchRecipient {
  email: string;
  name?: string | null;
  data?: PersonalizationData;
  recipientId?: string;
  recipientType?: string;
}

export interface BatchOptions {
  campaignId: string;
  subjectTemplate: string;
  bodyTemplate: string;
  recipients: BatchRecipient[];
  batchSize?: number;
  rateLimitMs?: number;
  onProgress?: (sent: number, failed: number, total: number) => void;
}

export async function sendBatch(options: BatchOptions): Promise<{ sent: number; failed: number }> {
  const {
    campaignId,
    subjectTemplate,
    bodyTemplate,
    recipients,
    onProgress,
  } = options;

  const batchSize = options.batchSize || BATCH_SIZE;
  const rateLimitMs = options.rateLimitMs || RATE_LIMIT_MS;

  let sent = 0;
  let failed = 0;
  const total = recipients.length;

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING', totalRecipients: total },
  });

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(recipient =>
        renderAndSend(
          recipient.email,
          bodyTemplate,
          subjectTemplate,
          { name: recipient.data?.name || recipient.name || '', email: recipient.email, ...recipient.data },
          {
            campaignId,
            recipientId: recipient.recipientId,
            recipientType: recipient.recipientType,
            messageType: recipient.data?.messageType as string | undefined,
            reason: recipient.data?.reason as string | undefined,
          }
        )
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
      } else {
        failed++;
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { sentCount: sent, failedCount: failed },
    });

    onProgress?.(sent, failed, total);

    if (i + batchSize < recipients.length) {
      await delay(rateLimitMs);
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: failed > 0 && sent === 0 ? 'FAILED' : 'COMPLETED',
      completedAt: new Date(),
      sentAt: new Date(),
    },
  });

  return { sent, failed };
}

export interface CampaignInput {
  subject: string;
  templateId?: string;
  subjectTemplate?: string;
  bodyHtml?: string;
  segment?: Record<string, any>;
  scheduledAt?: string;
}

export async function createCampaign(input: CampaignInput): Promise<string> {
  let subjectTemplate = input.subjectTemplate || input.subject;
  let bodyHtml = input.bodyHtml;
  let variables: string[] = [];

  if (input.templateId) {
    const template = await prisma.emailTemplate.findUnique({ where: { id: input.templateId } });
    if (template) {
      subjectTemplate = template.subject;
      bodyHtml = template.bodyHtml;
      variables = template.variables;
    }
  }

  if (!bodyHtml) {
    throw new Error('bodyHtml or templateId is required');
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      subject: input.subject,
      templateId: input.templateId || null,
      status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      segment: (input.segment ?? null) as any,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    },
  });

  return campaign.id;
}
