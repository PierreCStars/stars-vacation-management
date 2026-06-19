import { redirect } from 'next/navigation';

// L'app congés est désormais un MODULE du portail RH. Toute arrivée sur la
// racine renvoie au dashboard du portail (pour que chacun voie que le portail
// est en cours). Les routes fonctionnelles (/vacation-request, /admin) restent
// accessibles en direct (la tuile « Congés » du portail pointe sur /vacation-request).
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://stars-hr-portal-preview.vercel.app';

export default function LocaleHome() {
  redirect(`${PORTAL_URL}/dashboard`);
}
