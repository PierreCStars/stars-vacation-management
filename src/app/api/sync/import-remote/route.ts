export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { importCalendarBIncremental } from "@/lib/import-calendar-b";

// TODO: add your auth/role check (admin only)
export async function GET() {
  try {
    const result = await importCalendarBIncremental();
    return NextResponse.json(result, { status: result.status === "error" ? 500 : 200 });
  } catch (error: any) {
    console.error("Import error:", error?.message || error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Import failed" }, 
      { status: 500 }
    );
  }
}
