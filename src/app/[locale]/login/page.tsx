'use client';
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useParams } from "next/navigation";

export default function LoginPage() {
  const params = useParams();
  const locale = params.locale as string;
  
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow p-8 text-center">
        <div className="mx-auto mb-6 h-14 w-14 relative">
          {/* Using the existing stars logo */}
          <Image src="/stars-logo.png" alt="Stars" fill className="object-contain" priority />
        </div>
        <h1 className="text-xl font-semibold">Stars Vacation Management</h1>
        <p className="mt-2 text-sm text-gray-600">Connect with your @stars.mc account</p>
        <button
          onClick={() => signIn("google", { callbackUrl: `/${locale}/dashboard` })}
          className="mt-6 w-full rounded-xl border px-4 py-2 hover:bg-gray-100 transition-colors"
        >
          Continue with Google
        </button>
        <p className="mt-3 text-xs text-gray-500">Only members of stars.mc are allowed.</p>
      </div>
    </main>
  );
}
