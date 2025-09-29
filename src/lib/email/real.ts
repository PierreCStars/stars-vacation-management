import type { EmailAdapter, VacationEmail } from './types';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // Use your real transport: SMTP / Gmail / SendGrid etc.
  // For Gmail API, use a custom transport or gateway you already have.
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

function subjectFor(msg: VacationEmail) {
  if (msg.type === 'ADMIN_NOTIFY') return `New vacation request #${msg.requestId}`;
  if (msg.type === 'REQUEST_SUBMITTED') return `We received your vacation request #${msg.requestId}`;
  return `Your vacation request #${msg.requestId} was ${msg.decision.toLowerCase()}`;
}

function bodyFor(msg: VacationEmail) {
  switch (msg.type) {
    case 'ADMIN_NOTIFY':
      return `A new vacation request was submitted: ${msg.requestId}`;
    case 'REQUEST_SUBMITTED':
      return `Thanks! Your request (${msg.requestId}) is under review.`;
    case 'REQUEST_DECISION':
      return `Your request (${msg.requestId}) has been ${msg.decision.toLowerCase()}.`;
  }
}

export const RealEmailAdapter: EmailAdapter = {
  async send(msg) {
    const subject = subjectFor(msg);
    const text = bodyFor(msg);
    if (msg.type === 'ADMIN_NOTIFY') {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@stars.mc',
        to: msg.to.join(','),
        subject, text,
      });
      return;
    }
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@stars.mc',
      to: msg.to,
      ...(msg.type === 'REQUEST_SUBMITTED' && msg.cc ? { cc: msg.cc } : {}),
      subject, text,
    });
  },
};
