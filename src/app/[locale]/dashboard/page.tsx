import { redirect } from "next/navigation";

// Le dashboard interne de l'app congés est remplacé par le dashboard du
// portail RH (le portail est désormais l'écran d'accueil du groupe).
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://stars-hr-portal-preview.vercel.app';

export default function DashboardPage() {
  redirect(`${PORTAL_URL}/dashboard`);
}