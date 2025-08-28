// src/hooks/useVacationRequests.ts
"use client";
import { useEffect, useState } from "react";
import { fetchVacationRequestsClient } from "@/lib/fetch-vacations-client";
import type { VacationRequest } from "@/lib/vacations";

export function useVacationRequests() {
  const [data, setData] = useState<VacationRequest[]>([]);     // <-- default []
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchVacationRequestsClient()
      .then(arr => { if (mounted) { setData(arr); setLoading(false); } })
      .catch(e => { if (mounted) { setError(String(e?.message || e)); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}
