export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSyncState } from "@/lib/db/calendar-sync.store";

export async function GET() {
  try {
    const state = await getSyncState();
    return NextResponse.json(state || { id: "google_calendar_b" });
  } catch (error: any) {
    console.error("Error getting sync state:", error);
    return NextResponse.json(
      { error: "Failed to get sync state" }, 
      { status: 500 }
    );
  }
}
