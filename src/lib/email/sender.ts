/**
 * Single source of truth for the outbound sender identity of every email the
 * vacation tool sends.
 *
 * Stars rule: all employee + admin emails must display the same sender.
 * For now that is info@stars.mc (a real mailbox); switch MAIL_FROM/MAIL_SENDER
 * to rh@stars.mc once that mailbox/alias exists. Replies are always routed to
 * pierre@stars.mc.
 *
 * NB: the From header is only honoured if the authenticated SMTP account is
 * allowed to send as this address (same account, or an authorised
 * "send mail as" alias / domain-verified ESP). Otherwise the provider
 * (e.g. Gmail) rewrites From to the authenticated account.
 */
export const MAIL_FROM = '"Star Luxury Group" <info@stars.mc>';
export const MAIL_SENDER = 'info@stars.mc';
export const MAIL_REPLY_TO = 'pierre@stars.mc';
