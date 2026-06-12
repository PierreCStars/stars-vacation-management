export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateText } from 'ai';
import { authOptions } from '@/lib/auth';
import { isFullAdmin } from '@/config/admins';

type Lang = 'fr' | 'en' | 'it';
const LANG_NAME: Record<Lang, string> = { fr: 'French', en: 'English', it: 'Italian' };
const MODEL = 'openai/gpt-4o-mini'; // via Vercel AI Gateway (provider/model)

/**
 * POST /api/admin/translate
 * Body: { text: string, source: Lang, targets: Lang[] }
 * Returns: { translations: Partial<Record<Lang, string>> }
 * Admin-only. Uses Vercel AI Gateway.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isFullAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { text?: string; source?: Lang; targets?: Lang[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = (body.text ?? '').trim();
  const source = body.source;
  const targets = (body.targets ?? []).filter((l): l is Lang => l === 'fr' || l === 'en' || l === 'it');
  if (!text || !source || targets.length === 0) {
    return NextResponse.json({ error: 'text, source and targets are required' }, { status: 400 });
  }

  const translations: Partial<Record<Lang, string>> = {};
  try {
    await Promise.all(
      targets.map(async (target) => {
        if (target === source) return;
        const { text: out } = await generateText({
          model: MODEL,
          system:
            `You are a professional translator for a luxury vacation-management app. ` +
            `Translate from ${LANG_NAME[source]} to ${LANG_NAME[target]}. ` +
            `Return ONLY the translation, no quotes, no explanation. Keep tone and meaning.`,
          prompt: text,
        });
        translations[target] = out.trim();
      }),
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'translation failed' },
      { status: 502 },
    );
  }

  return NextResponse.json({ translations });
}
