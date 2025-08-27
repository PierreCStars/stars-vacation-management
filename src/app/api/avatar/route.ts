export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["lh3.googleusercontent.com", "yt3.ggpht.com", "googleusercontent.com"];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return NextResponse.json({ error: "host not allowed" }, { status: 400 });
    }

    // Respect size hints like =s96-c to avoid huge images.
    const upstream = await fetch(url, {
      headers: {
        // Some CDNs throttle unknown agents; set a reasonable UA.
        "User-Agent": "StarsVacation/1.0 (+https://stars.mc)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      // Avoid revalidation storms
      cache: "no-store",
      // 5s timeoutish via AbortController pattern is optional
    });

    // If Google returns 429, cache that result briefly to avoid hammering.
    const status = upstream.status;
    const body = await upstream.arrayBuffer();

    const res = new NextResponse(body, {
      status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
        // Cache good responses longer; throttle errors briefly.
        "Cache-Control":
          status === 200
            ? "public, s-maxage=86400, stale-while-revalidate=604800"
            : "public, s-maxage=60",
      },
    });

    return res;
  } catch (_e) {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
