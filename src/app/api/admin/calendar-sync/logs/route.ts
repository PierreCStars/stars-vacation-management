export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getRecentSyncLogs } from "@/src/lib/db/calendar-sync.store";

export async function GET() {
  try {
    const logs = await getRecentSyncLogs(20); // Get last 20 logs
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error getting sync logs:", error);
    return NextResponse.json(
      { error: "Failed to get sync logs" }, 
      { status: 500 }
    );
  }
}
