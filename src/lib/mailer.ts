import nodemailer from "nodemailer";
import { safeTrim } from "@/lib/strings";

export function adminRecipients(): string[] {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => safeTrim(s, ''))
    .filter(Boolean);
  if (list.length === 0) {
    // Fallback: ensure at least pierre gets the alert
    return ["pierre@stars.mc"];
  }
  return list;
}

export function mailer() {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  if (!host || !user || !pass) throw new Error("SMTP env vars missing");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendAdminNotification({
  subject,
  html,
  text,
}: {
  subject: string;
  html: string;
  text?: string;
}) {
  const transporter = mailer();
  const from = process.env.SMTP_USER!;
  const to = adminRecipients();

  await transporter.sendMail({
    from: `"Stars Vacation" <${from}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " "),
  });
}
