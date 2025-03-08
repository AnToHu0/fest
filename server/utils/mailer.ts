import nodemailer from 'nodemailer';
import { useRuntimeConfig } from '#imports';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  verificationUrl?: string;
}

export async function sendEmail({ to, subject, html, verificationUrl }: EmailOptions): Promise<void> {
  const config = useRuntimeConfig();

  if (process.env.NODE_ENV === 'development') {
    console.log('=================== EMAIL LOG ===================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);

    if (verificationUrl) {
      console.log(`\nВЕРИФИКАЦИОННАЯ ССЫЛКА: ${verificationUrl}\n`);
    }

    console.log(`HTML Content (начало): ${html.substring(0, 200)}...`);
    console.log('=================================================');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.emailHost,
    port: Number(config.emailPort),
    secure: config.emailSecure === 'true',
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
  });

  await transporter.sendMail({
    from: `"${config.emailFromName}" <${config.emailFromAddress}>`,
    to,
    subject,
    html,
  });
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36);
} 