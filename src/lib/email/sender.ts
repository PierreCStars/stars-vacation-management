/**
 * Single source of truth for the outbound sender identity of every email the
 * vacation tool sends.
 *
 * Stars rule: all employee + admin emails must display the same sender, and
 * Pierre's personal address must never appear. Current target: hr@stars.mc,
 * display-only (the mailbox does not receive), so NO Reply-To is set — replies
 * are not expected. Change MAIL_FROM / MAIL_SENDER here if the address evolves.
 *
 * NB: the From header is only honoured if the sending channel is authorised to
 * emit as this address — i.e. a domain-verified ESP (Resend with stars.mc
 * SPF/DKIM), a Google Workspace SMTP relay / domain delegation, or an SMTP
 * account that owns hr@stars.mc as an authorised "send mail as" address.
 * Plain Gmail SMTP authenticated as a different user (e.g. pierre@) will
 * rewrite From back to that user — which is the bug this is meant to fix.
 */
export const MAIL_FROM = '"RH Stars" <hr@stars.mc>';
export const MAIL_SENDER = 'hr@stars.mc';
// Display-only sender: no Reply-To so Pierre's address is never exposed.
// (undefined → the field is simply omitted by nodemailer / the Resend payload.)
export const MAIL_REPLY_TO: string | undefined = undefined;
