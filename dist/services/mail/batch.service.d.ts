import { PersonalizationData } from './email.service.js';
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
export declare function sendBatch(options: BatchOptions): Promise<{
    sent: number;
    failed: number;
}>;
export interface CampaignInput {
    subject: string;
    templateId?: string;
    subjectTemplate?: string;
    bodyHtml?: string;
    segment?: Record<string, any>;
    scheduledAt?: string;
}
export declare function createCampaign(input: CampaignInput): Promise<string>;
//# sourceMappingURL=batch.service.d.ts.map