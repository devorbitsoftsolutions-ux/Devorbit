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
export declare function sendEmail(options: SendOptions): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function renderAndSend(to: string, templateBody: string, subjectTemplate: string, data: PersonalizationData, meta?: {
    campaignId?: string;
    recipientId?: string;
    recipientType?: string;
    recipientName?: string;
    messageType?: string;
    reason?: string;
}): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function fetchSubscribers(filters?: {
    role?: string;
    subscribed?: boolean;
}): Promise<Array<{
    email: string;
    name?: string | null;
    [key: string]: any;
}>>;
export declare function fetchUsers(): Promise<Array<{
    email: string;
    name: string;
    [key: string]: any;
}>>;
export declare function fetchApplicants(): Promise<Array<{
    email: string;
    name: string | null;
    [key: string]: any;
}>>;
//# sourceMappingURL=email.service.d.ts.map