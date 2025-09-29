import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    redirect("/en/dashboard");
  }
  redirect("/en/login");
}
