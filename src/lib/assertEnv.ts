// lib/assertEnv.ts
export function assertRequiredEnv() {
  const req = ["NEXTAUTH_URL","NEXTAUTH_SECRET","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"];
  const missing = req.filter(k => !process.env[k]);
  if (missing.length) {
    // Don't crash the render; log loudly so we catch this in logs
    console.error("ENV_MISSING", { missing });
  }
  // Warn if NEXTAUTH_URL host doesn't match runtime host
  try {
    const url = new URL(process.env.NEXTAUTH_URL || "");
    if (!url.host.includes("starsvacationmanagementv2.vercel.app")) {
      console.warn("WARN_NEXTAUTH_URL_HOST", { nextauth_url: process.env.NEXTAUTH_URL });
    }
  } catch {}
}



