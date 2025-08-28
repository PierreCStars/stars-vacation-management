// src/lib/fetch-vacations-client.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // your existing client SDK
import { normalizeRequest, type VacationRequest } from "@/lib/vacations";

/** Returns a plain array of VacationRequest */
export async function fetchVacationRequestsClient(): Promise<VacationRequest[]> {
  try {
    const snap = await getDocs(collection(db, "vacationRequests"));
    const arr = snap.docs.map(doc => normalizeRequest(doc.data(), doc.id));
    return arr;
  } catch (error) {
    console.error('Error fetching vacation requests:', error);
    return []; // Always return array, even on error
  }
}
