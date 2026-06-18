/**
 * Star Luxury Group — shared email theme.
 *
 * Renders a brand-consistent HTML shell (header with Stars logo + gold filet,
 * elegant typography, Monaco footer) around arbitrary body content. Used by all
 * vacation-management emails so admin notifications, confirmations and decision
 * notices share one visual language aligned with the app.
 *
 * Email-client notes:
 * - Table-based layout + inline styles (most robust across Gmail / Outlook / Apple Mail).
 * - Montserrat is requested via a web-font link AND a font stack; clients that
 *   ignore web fonts fall back to a clean system sans-serif.
 * - The logo uses an absolute https URL (email cannot resolve local assets).
 */

import { getEmailBaseUrl } from '@/lib/urls';

const LOGO_URL = `${getEmailBaseUrl()}/stars-logo.png`;

// SLG palette
const INK = '#0A0A0A';
const CREAM = '#F5F2EC';
const CREAM_PAPER = '#FBFAF7';
const SLATE = '#273341';
const GOLD = '#D8B11B';

const FONT_STACK =
  "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type EmailAccent = 'gold' | 'green' | 'red' | 'slate';

const ACCENT_HEX: Record<EmailAccent, string> = {
  gold: GOLD,
  green: '#1F6E3A',
  red: '#C92B12',
  slate: SLATE,
};

export type RenderEmailOptions = {
  /** Used in <title> + preheader (the grey preview line in the inbox). */
  title: string;
  /** Short uppercase eyebrow above the heading, e.g. "NEW REQUEST". */
  eyebrow?: string;
  /** Main heading shown in the body. */
  heading: string;
  /** Accent colour for the filet, heading underline and CTA. Default gold. */
  accent?: EmailAccent;
  /** Inner body HTML (paragraphs, the details table, etc.). */
  bodyHtml: string;
  /** Optional call-to-action button. */
  cta?: { label: string; url: string };
  /** Optional preheader override (defaults to title). */
  preheader?: string;
};

/**
 * Build an SLG-branded details table from label/value pairs.
 * Values are inserted as-is (callers escape if needed).
 */
export function detailsTable(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .filter(r => r.value !== undefined && r.value !== null && `${r.value}`.length > 0)
    .map(
      r => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid rgba(10,10,10,0.06);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${SLATE};font-family:${FONT_STACK};font-weight:400;vertical-align:top;width:42%;">${r.label}</td>
        <td style="padding:9px 0;border-bottom:1px solid rgba(10,10,10,0.06);font-size:13px;color:${INK};font-family:${FONT_STACK};font-weight:400;vertical-align:top;">${r.value}</td>
      </tr>`,
    )
    .join('');

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:8px 0 4px;">
    ${body}
  </table>`;
}

export function renderSlgEmail(opts: RenderEmailOptions): string {
  const accent = ACCENT_HEX[opts.accent ?? 'gold'];
  const preheader = opts.preheader ?? opts.title;

  const ctaHtml = opts.cta
    ? `
      <tr>
        <td style="padding:8px 0 4px;">
          <a href="${opts.cta.url}"
             style="display:inline-block;background:${GOLD};color:${INK};text-decoration:none;
                    font-family:${FONT_STACK};font-size:11px;font-weight:500;letter-spacing:0.1em;
                    text-transform:uppercase;padding:11px 22px;border-radius:6px;">
            ${opts.cta.label}
          </a>
        </td>
      </tr>`
    : '';

  const eyebrowHtml = opts.eyebrow
    ? `<p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${SLATE};">${opts.eyebrow}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${opts.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${CREAM};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid rgba(10,10,10,0.06);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 0;text-align:center;background:${CREAM_PAPER};">
              <img src="${LOGO_URL}" alt="Stars" width="44" height="44" style="display:inline-block;border:0;outline:none;text-decoration:none;height:44px;width:auto;">
              <p style="margin:10px 0 0;font-family:${FONT_STACK};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${SLATE};font-weight:500;">Star Luxury Group</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 36px 0;background:${CREAM_PAPER};" align="center">
              <div style="height:1px;width:48px;background:${GOLD};margin:0 auto;"></div>
            </td>
          </tr>
          <tr><td style="height:24px;background:${CREAM_PAPER};line-height:24px;font-size:0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:8px 36px 32px;">
              ${eyebrowHtml}
              <h1 style="margin:0 0 4px;font-family:${FONT_STACK};font-size:18px;font-weight:300;letter-spacing:-0.01em;color:${INK};line-height:1.3;">${opts.heading}</h1>
              <div style="height:2px;width:36px;background:${accent};margin:11px 0 18px;"></div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family:${FONT_STACK};color:${INK};font-size:13px;line-height:1.6;">
                ${opts.bodyHtml}
                ${ctaHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 36px;background:${CREAM_PAPER};border-top:1px solid rgba(10,10,10,0.06);text-align:center;">
              <p style="margin:0;font-family:${FONT_STACK};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${SLATE};font-weight:500;">Star Luxury Group</p>
              <p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:11px;color:rgba(39,51,65,0.7);">Stars Vacation Management · Monaco · 57 Rue Grimaldi</p>
            </td>
          </tr>

        </table>
        <p style="margin:16px 0 0;font-family:${FONT_STACK};font-size:10px;color:rgba(39,51,65,0.5);">This is an automated message from the Stars Vacation Management tool.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text fallback wrapper — strips to a clean signature. */
export function slgTextFooter(): string {
  return `\n\n—\nStar Luxury Group\nStars Vacation Management · Monaco · 57 Rue Grimaldi\nThis is an automated message.`;
}
