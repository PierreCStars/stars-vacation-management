import nodemailer from "nodemailer";
import { safeTrim } from "@/lib/strings";
import { resolveRecipients } from "@/lib/email/recipients";
import { MAIL_FROM, MAIL_SENDER, MAIL_REPLY_TO } from "@/lib/email/sender";

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
  overrideTo,
}: {
  subject: string;
  html: string;
  text?: string;
  overrideTo?: string;
}) {
  const transporter = mailer();
  // Expéditeur centralisé (info@stars.mc pour l'instant) — voir @/lib/email/sender.
  // Le compte SMTP authentifié doit être autorisé à envoyer comme cette adresse,
  // sinon Gmail réécrit le From vers le compte authentifié.
  const to = resolveRecipients(overrideTo ? [overrideTo] : adminRecipients());

  await transporter.sendMail({
    from: MAIL_FROM,
    sender: MAIL_SENDER,
    replyTo: MAIL_REPLY_TO,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " "),
  });
}
