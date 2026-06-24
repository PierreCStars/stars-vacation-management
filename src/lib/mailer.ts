import nodemailer from "nodemailer";
import { safeTrim } from "@/lib/strings";
import { resolveRecipients } from "@/lib/email/recipients";

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
  // Règle Stars : tous les mails de l'outil affichent rh@stars.mc en expéditeur
  // (jamais le compte SMTP authentifié, ex. pierre@). Pour que ce From soit
  // honoré et non réécrit, le compte d'envoi (SMTP_USER) doit être rh@stars.mc
  // ou disposer de rh@stars.mc comme adresse « Envoyer en tant que » autorisée.
  const to = resolveRecipients(overrideTo ? [overrideTo] : adminRecipients());

  await transporter.sendMail({
    from: '"RH Stars" <rh@stars.mc>',
    sender: 'rh@stars.mc',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " "),
  });
}
