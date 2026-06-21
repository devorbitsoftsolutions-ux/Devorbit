import nodemailer from 'nodemailer';
let transport = null;
export function getTransport() {
    if (transport)
        return transport;
    transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return transport;
}
export function getMailFrom() {
    return process.env.MAIL_FROM || 'noreply@devorbit.com';
}
export async function verifyTransport() {
    try {
        await getTransport().verify();
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=transport.js.map