export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';
import { safeStartsWith } from '@/lib/strings';
import { getValidatedVacationsForMonth, calculateTotals } from '@/lib/monthly-vacation-helper';
import { formatDuration } from '@/lib/duration-calculator';

// Google Sheet cible (fournie par Pierre). L'onglet créé y sera ajouté.
// Le compte de service vacation-db@holiday-461710.iam.gserviceaccount.com doit
// avoir un accès Éditeur sur ce document.
const SPREADSHEET_ID = '12MkNvwe10FjMlFwmWe0dIKMUYcTANqtGtkkbQBpISJo';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function loadGoogleCreds() {
  const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    const obj = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf-8'));
    obj.private_key = String(obj.private_key).replace(/\\n/g, '\n');
    return { client_email: obj.client_email, private_key: obj.private_key };
  }
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('No Google service account key found');
  if (safeStartsWith(raw, '{')) {
    const obj = JSON.parse(raw);
    obj.private_key = String(obj.private_key).replace(/\\n/g, '\n');
    return { client_email: obj.client_email, private_key: obj.private_key };
  }
  const pem = raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL!, private_key: pem };
}

/** Onglet « Vacation <début> → <fin> », suffixé si le titre existe déjà. */
function buildSheetTitle(start: string, end: string, existing: string[]): string {
  const base = `Vacation ${start} → ${end}`;
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i++;
  return `${base} (${i})`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { startDate?: string; endDate?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const startDate = body.startDate;
  const endDate = body.endDate;
  if (!startDate || !endDate || !ISO.test(startDate) || !ISO.test(endDate)) {
    return NextResponse.json({ error: 'startDate et endDate (YYYY-MM-DD) requis' }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: 'startDate doit être ≤ endDate' }, { status: 400 });
  }

  // Données : congés validés chevauchant la période (jours ouvrés).
  const rows = await getValidatedVacationsForMonth(startDate, endDate);
  const totals = calculateTotals(rows);

  let sheets;
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: loadGoogleCreds(),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheets = google.sheets({ version: 'v4', auth });
  } catch (e) {
    return NextResponse.json({ error: `Auth Google échouée : ${(e as Error).message}` }, { status: 500 });
  }

  try {
    // Titres d'onglets existants → éviter les collisions
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties' });
    const existing = (meta.data.sheets || []).map(s => s.properties?.title || '');
    const title = buildSheetTitle(startDate, endDate, existing);

    // 1) Créer le nouvel onglet
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] },
    });
    const newSheet = addRes.data.replies?.[0]?.addSheet?.properties;
    const sheetId = newSheet?.sheetId;

    // 2) Écrire les données
    const header = ['Employé', 'Société', 'Type', 'Début', 'Fin', 'Jours ouvrés'];
    const dataRows = rows.map(r => [
      r.employee || 'Inconnu',
      r.company || '—',
      r.type || 'Journée complète',
      r.startDate || '—',
      r.endDate || r.startDate || '—',
      formatDuration(Number(r.days || 0)),
    ]);
    const totalRow = ['TOTAL', '', '', '', `${rows.length} congé(s)`, totals.totalDays.toFixed(1)];
    const values = [header, ...dataRows, totalRow];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${title}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    // 3) Mise en forme (en-tête doré charte, total en gras, colonnes ajustées)
    if (sheetId != null) {
      const lastRowIndex = values.length - 1;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.847, green: 0.694, blue: 0.106 }, // #D8B11B
                    textFormat: { bold: true, foregroundColor: { red: 0.04, green: 0.04, blue: 0.04 } },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
            {
              repeatCell: {
                range: { sheetId, startRowIndex: lastRowIndex, endRowIndex: lastRowIndex + 1 },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: 'userEnteredFormat(textFormat)',
              },
            },
            { autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 6 } } },
          ],
        },
      });
    }

    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${sheetId ?? ''}`;
    return NextResponse.json({ ok: true, title, url, count: rows.length, totalDays: totals.totalDays });
  } catch (e: any) {
    const msg = e?.errors?.[0]?.message || e?.message || String(e);
    const status = e?.code === 403 ? 403 : 502;
    return NextResponse.json({
      error: status === 403
        ? `Accès refusé à la Google Sheet. Vérifie que ${'vacation-db@holiday-461710.iam.gserviceaccount.com'} a l'accès Éditeur.`
        : `Échec de l'export Sheet : ${msg}`,
    }, { status });
  }
}
