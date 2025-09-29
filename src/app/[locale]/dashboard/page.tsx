import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect(`/${locale}/login`);
  
  // (Optional) enforce domain again, defensive:
  if (!session.user.email.endsWith("@"+(process.env.AUTH_ALLOWED_DOMAIN || "stars.mc"))) {
    redirect(`/${locale}/login`);
  }
  
  return <DashboardClient />;
}