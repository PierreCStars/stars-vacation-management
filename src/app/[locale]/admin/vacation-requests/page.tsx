"use client";
import { useEffect, useMemo, useState } from "react";
import UnifiedVacationCalendar from "@/components/UnifiedVacationCalendar";
import ConflictDetailsDrawer from "@/components/ConflictDetailsDrawer";
type VR = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  company?: string;
  type?: string;
  startDate: string; 
  endDate: string;
  status: "pending"|"approved"|"rejected";
  reviewedAt?: string | null;
  reviewedBy?: { id?: string; name?: string; email?: string } | null;
  createdAt?: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayType?: string | null;
  durationDays?: number;
};

export default function AdminVacationRequestsPage() {
  // Simple translation fallback
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: 'Vacation Requests',
      pending: 'Pending',
      reviewed: 'Reviewed requests',
      approve: 'Approve',
      reject: 'Reject',
      employee: 'Employee',
      company: 'Company',
      type: 'Type of Vacation',
      dates: 'Dates',
      status: 'Status',
      conflict: 'Conflict',
      viewConflicts: 'View conflicts',
      scanAll: 'Scan all pending for conflicts'
    };
    return translations[key] || key;
  };
  
  const tCommon = (key: string) => {
    const translations: Record<string, string> = {
      save: 'Save',
      cancel: 'Cancel'
    };
    return translations[key] || key;
  };
  
  const tAdmin = (key: string) => {
    const translations: Record<string, string> = {
      title: 'Admin'
    };
    return translations[key] || key;
  };
  
  const [items, setItems] = useState<VR[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<"date"|"employee"|"company"|"type"|"status">("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [showReviewed, setShowReviewed] = useState(false);
  
  // Conflict detection state
  const [conflictsById, setConflictsById] = useState<Record<string, any>>({});
  const [scanLoading, setScanLoading] = useState(false);
  const [selectedConflictRequest, setSelectedConflictRequest] = useState<string | null>(null);

  async function loadVacationRequests() {
    try {
      setLoading(true);
      const res = await fetch("/api/vacation-requests", { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const arr = await res.json();
      setItems(Array.isArray(arr) ? arr : []);
      console.log(`📋 Loaded ${arr.length} vacation requests`);
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVacationRequests();
  }, []);

  const pending = useMemo(()=> Array.isArray(items) ? items.filter(i=>i.status==="pending") : [], [items]);
  const reviewed = useMemo(()=> Array.isArray(items) ? items.filter(i=>i.status!=="pending") : [], [items]);

  function sortReviewed(list: VR[]) {
    const copy = [...list];
    copy.sort((a,b)=>{
      switch (sortKey) {
        case "date": {
          // sort by startDate then endDate
          const as = a.startDate.localeCompare(b.startDate);
          if (as !== 0) return sortDir==="asc" ? as : -as;
          const ae = a.endDate.localeCompare(b.endDate);
          return sortDir==="asc" ? ae : -ae;
        }
        case "employee": {
          const cmp = (a.userName||"").localeCompare(b.userName||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
        case "company": {
          const cmp = (a.company||"").localeCompare(b.company||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
        case "type": {
          const cmp = (a.type||"").localeCompare(b.type||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
        case "status": {
          const cmp = (a.status||"").localeCompare(b.status||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
      }
    });
    return copy;
  }

  const reviewedSorted = useMemo(()=> sortReviewed(reviewed), [reviewed, sortKey, sortDir]);

  async function updateStatus(id: string, status: "approved"|"rejected") {
    // optimistic update
    setItems(prev => prev.map(it => it.id===id ? { ...it, status } : it));
    
    try {
      const reviewer = {}; // TODO: fill with current admin identity from session
      const res = await fetch(`/api/vacation-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewer })
      });
      
      if (!res.ok) {
        // revert if failed
        setItems(prev => prev.map(it => it.id===id ? { ...it, status:"pending" } : it));
        alert("Failed to update status");
      } else {
        console.log(`✅ Successfully ${status} vacation request ${id}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // revert if failed
      setItems(prev => prev.map(it => it.id===id ? { ...it, status:"pending" } : it));
      alert("Failed to update status");
    }
  }

  // Bulk conflict scan function
  async function bulkScanConflicts() {
    setScanLoading(true);
    const results: Record<string, any> = {};
    
    try {
      for (const request of pending) {
        const res = await fetch(`/api/conflicts/vacation?id=${request.id}&company=${encodeURIComponent(request.company || "")}&start=${request.startDate}&end=${request.endDate || request.startDate}`, { 
          cache: "no-store" 
        });
        
        if (res.ok) {
          const data = await res.json();
          results[request.id] = data;
        } else {
          console.error(`Failed to check conflicts for ${request.id}:`, res.statusText);
          results[request.id] = { hasConflicts: false, conflicts: [], summary: 'Error checking conflicts' };
        }
      }
      
      setConflictsById(results);
      console.log(`✅ Bulk conflict scan complete: ${Object.keys(results).length} requests checked`);
    } catch (error) {
      console.error('❌ Error during bulk conflict scan:', error);
      alert('Error during bulk conflict scan. Please try again.');
    } finally {
      setScanLoading(false);
    }
  }

  // Get conflict count
  const conflictCount = Object.values(conflictsById).filter((c: any) => c?.hasConflicts).length;

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{tCommon('loading')} {t('title').toLowerCase()}...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="text-sm text-gray-500 mb-2">
          <span>{tAdmin('breadcrumb')}</span> <span className="mx-1">/</span> <span className="text-gray-900 font-medium">{t('title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tAdmin('vacationRequestsTitle')}</h1>
            <p className="text-gray-600 mt-2">{tAdmin('vacationRequestsDescription')}</p>
          </div>
            <button
              onClick={loadVacationRequests}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? tCommon('loading') : tCommon('refresh')}
            </button>
        </div>
      </div>

      {/* Calendar View with Conflict Detection */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">📅 {t('conflictDetection')}</h2>
                              <p className="text-sm text-gray-600 mt-1">Visual overview of all vacation requests with conflict warnings</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {pending.length} {t('pending').toLowerCase()} • {reviewed.length} {t('reviewed').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <UnifiedVacationCalendar 
            vacationRequests={items as any} 
            currentRequestId={undefined}
            showLegend={true}
            compact={false}
          />
        </div>
      </section>

      {/* Pending table */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('pending')} {t('title')}</h2>
                              <p className="text-sm text-gray-600 mt-1">Requests awaiting your approval or rejection</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={bulkScanConflicts}
                disabled={scanLoading || pending.length === 0}
                className="inline-flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scanLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('scanning')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('scanAll')}
                  </>
                )}
              </button>
              {conflictCount > 0 && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  ⚠️ {conflictCount} {t('conflictsFound')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('employee')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('company')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dates')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('conflict')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.company || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.type || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.startDate}{r.endDate!==r.startDate ? ` to ${r.endDate}` : ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {conflictsById[r.id] ? (
                      <div className="flex items-center gap-2">
                        {conflictsById[r.id].hasConflicts ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              ⚠️ {t('conflict')}
                            </span>
                            <button
                              onClick={() => setSelectedConflictRequest(r.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              {t('viewDetails')}
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            ✅ {t('noConflicts')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">{t('notScanned')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={()=>updateStatus(r.id,"approved")} 
                      className="mr-2 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 transition-colors text-xs"
                    >
                      {t('approve')}
                    </button>
                    <button 
                      onClick={()=>updateStatus(r.id,"rejected")} 
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 transition-colors text-xs"
                    >
                      {t('reject')}
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length===0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    <div className="text-center">
                      <div className="text-gray-400 text-4xl mb-2">🎉</div>
                      <p className="text-lg font-medium text-gray-900">{t('noPendingRequests')}</p>
                      <p className="text-sm text-gray-500">{t('allVacationRequestsReviewed')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviewed accordion */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('reviewed')}</h2>
                              <p className="text-sm text-gray-600 mt-1">Requests that have been approved or rejected</p>
            </div>
            <button 
              onClick={()=>setShowReviewed(s=>!s)} 
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {showReviewed ? tCommon('hide') : tCommon('show')}
            </button>
          </div>
        </div>

        {showReviewed && (
          <div className="px-6 pb-6 space-y-4">
            {/* sort controls */}
            <div className="flex gap-3 items-center pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">{t('sortBy')}</label>
              <select 
                value={sortKey} 
                onChange={e=>setSortKey(e.target.value as "date"|"employee"|"company"|"type"|"status")} 
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">{t('dates')}</option>
                <option value="employee">{t('employee')}</option>
                <option value="company">{t('company')}</option>
                <option value="type">{t('type')}</option>
                <option value="status">{t('status')}</option>
              </select>
              <button 
                onClick={()=>setSortDir(d=> d==="asc" ? "desc" : "asc")} 
                className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
              >
                {sortDir==="asc" ? `↑ ${tCommon('ascending')}` : `↓ ${tCommon('descending')}`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('employee')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('company')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dates')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('reviewedAt')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviewedSorted.map(r=>(
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.company || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.type || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.startDate}{r.endDate!==r.startDate ? ` to ${r.endDate}` : ""}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {r.reviewedBy?.name || 'Admin'}
                      </td>
                    </tr>
                  ))}
                  {reviewedSorted.length===0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                        <div className="text-center">
                          <div className="text-gray-400 text-4xl mb-2">📋</div>
                          <p className="text-lg font-medium text-gray-900">{t('noReviewedRequests')}</p>
                          <p className="text-sm text-gray-500">Start reviewing pending requests above</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Conflict Details Drawer */}
      {selectedConflictRequest && (
        <ConflictDetailsDrawer
          isOpen={!!selectedConflictRequest}
          onClose={() => setSelectedConflictRequest(null)}
          conflicts={conflictsById[selectedConflictRequest]?.conflicts || []}
          requestId={selectedConflictRequest}
        />
      )}
    </div>
  );
}
