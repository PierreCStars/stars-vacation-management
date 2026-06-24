"use client";
import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { VacationRequestWithConflicts } from '@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts';
import { absoluteUrl } from '@/lib/urls';
import { isPendingStatus, isReviewedStatus, normalizeVacationStatus } from '@/types/vacation-status';
import { VacationRequest } from '@/types/vacation';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';
import { calculateVacationDuration } from '@/lib/duration-calculator';
import { countUniqueConflicts } from '@/lib/conflict-utils';
import { canValidateCompany } from '@/config/admins';
import { isTestRequest } from '@/lib/test-requests';

/**
 * Human-readable delay between submission and review (e.g. "3h", "2d 4h", "<1h").
 * Returns "—" when either timestamp is missing.
 */
function formatReviewDelay(createdAt?: string | null, reviewedAt?: string | null): string {
  if (!createdAt || !reviewedAt) return '—';
  const ms = new Date(reviewedAt).getTime() - new Date(createdAt).getTime();
  if (isNaN(ms) || ms < 0) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return minutes <= 1 ? '<1h' : `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}

/** Short day/month/year format, stable across locales (dd/mm/yyyy). */
function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Localised short label for a leave-type code (keeps the Type column narrow). */
function typeLabel(t: any, code?: string | null): string {
  switch (code) {
    case 'PAID_LEAVE': return t('requests.typePaid');
    case 'UNPAID_LEAVE': return t('requests.typeUnpaid');
    case 'FAMILY_EVENT_LEAVE': return t('requests.typeFamily');
    case 'OVERTIME_COMPENSATION': return t('requests.typeOvertime');
    default: return code || '—';
  }
}

/** Localised label for a vacation status (falls back to the raw value). */
function statusLabel(tv: any, status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'approved': return tv('approved');
    case 'denied': return tv('denied');
    case 'pending': return tv('pending');
    case 'cancelled': return tv('cancelled');
    default: return status || '—';
  }
}

export default function AdminPendingRequestsV2() {
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<VacationRequestWithConflicts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showReviewed, setShowReviewed] = useState(false);
  const [sortKey, setSortKey] = useState<'userName' | 'company' | 'startDate' | 'reviewedAt'>('startDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // Export Google Sheet (popup de période)
  const [showExportModal, setShowExportModal] = useState(false);
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [exportStart, setExportStart] = useState(monthStart);
  const [exportEnd, setExportEnd] = useState(todayISO);
  const [exportResult, setExportResult] = useState<{ ok: boolean; msg: string; url?: string } | null>(null);


  const { data: session } = useSession();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tVacations = useTranslations('vacations');

  useEffect(() => {
    setMounted(true);

    // Fetch vacation requests
    fetchVacationRequests();
  }, []);

  const fetchVacationRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vacation-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('[V2] Failed to fetch vacation requests:', response.status);
      }
    } catch (error) {
      console.error('[V2] Error fetching vacation requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "denied" | "cancelled") => {
    setProcessingRequests(prev => new Set(prev).add(id));
    setActionMessage(null); // Clear previous messages

    try {
      const requestPayload = {
        status,
        reviewerName: session?.user?.name || 'Admin',
        reviewerEmail: session?.user?.email || 'admin@stars.mc',
        adminComment:
          status === 'approved'
            ? 'Approved via admin panel'
            : status === 'denied'
              ? 'Rejected via admin panel'
              : 'Cancelled via admin panel'
      };

      const response = await fetch(`/api/vacation-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        // Update the request status locally
        setRequests(prev => {
          const updated = prev.map(req =>
            req.id === id
              ? {
                  ...req,
                  status: status, // Keep lowercase to match API
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: session?.user?.name || 'Admin',
                }
              : req
          );
          return updated;
        });

        setActionMessage({ type: 'success', message: t('requests.statusUpdated') });

        // Auto-hide message after 3 seconds
        setTimeout(() => setActionMessage(null), 3000);

        // Refetch data to ensure consistency with server
        setTimeout(() => {
          fetchVacationRequests();
        }, 1000);
      } else {
        const errorText = await response.text();
        setActionMessage({
          type: 'error',
          message: t('requests.actionError', { detail: `${response.status} ${errorText}` }),
        });
        console.error('[V2] Failed to %s request:', status, response.status);
      }
    } catch (error) {
      setActionMessage({
        type: 'error',
        message: t('requests.actionError', { detail: error instanceof Error ? error.message : 'Unknown error' }),
      });
      console.error('[V2] Error %s request:', status, error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const toggleRequestSelection = (id: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Export d'une période vers un nouvel onglet Google Sheet.
  const handleSheetExport = async () => {
    if (isExporting) return;
    if (!exportStart || !exportEnd || exportStart > exportEnd) {
      setExportResult({ ok: false, msg: t('requests.invalidPeriod') });
      return;
    }
    setIsExporting(true);
    setExportResult(null);
    try {
      const res = await fetch('/api/admin/export-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: exportStart, endDate: exportEnd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setExportResult({ ok: true, msg: `${data.title} (${data.count})`, url: data.url });
    } catch (e) {
      setExportResult({ ok: false, msg: (e as Error).message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncToCalendar = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setActionMessage(null);

    try {
      const response = await fetch('/api/sync/approved-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        let message = t('requests.syncDone', { synced: data.synced || 0, skipped: data.skipped || 0 });
        if (data.failed > 0) message += ' ' + t('requests.syncFailedCount', { failed: data.failed });
        setActionMessage({ type: 'success', message });

        // Refresh the requests list after sync
        setTimeout(() => {
          fetchVacationRequests();
        }, 1000);
      } else {
        throw new Error(data.error || 'sync failed');
      }

      setTimeout(() => setActionMessage(null), 5000);

    } catch (error) {
      console.error('Calendar sync error:', error);
      setActionMessage({
        type: 'error',
        message: t('requests.syncFailed', { detail: error instanceof Error ? error.message : 'Unknown error' }),
      });
    } finally {
      setIsSyncing(false);
    }
  };


  const isProcessing = (id: string) => processingRequests.has(id);

  const handleCancelApprovedRequest = async (id: string) => {
    if (!confirm(t('requests.confirmCancel'))) {
      return;
    }
    await handleStatusUpdate(id, 'cancelled');
  };

  // Hard-delete a single pending request (admin only, pending only — enforced server-side)
  const deleteRequest = async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/vacation-requests/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || err?.error || `HTTP ${response.status}`);
    }
    return true;
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm(t('requests.confirmDelete'))) return;
    setProcessingRequests(prev => new Set(prev).add(id));
    setActionMessage(null);
    try {
      await deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      setSelectedRequests(prev => { const s = new Set(prev); s.delete(id); return s; });
      setActionMessage({ type: 'success', message: t('requests.deleted') });
    } catch (e) {
      setActionMessage({ type: 'error', message: t('requests.deleteFailed', { detail: e instanceof Error ? e.message : 'Unknown error' }) });
    } finally {
      setProcessingRequests(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleDeleteSelected = async () => {
    // Only pending requests are deletable
    const pendingIds = requests
      .filter(r => isPendingStatus(r.status) && selectedRequests.has(r.id))
      .map(r => r.id);
    if (pendingIds.length === 0) {
      setActionMessage({ type: 'error', message: t('requests.selectAtLeastOne') });
      return;
    }
    if (!confirm(t('requests.confirmDeleteSelection', { count: pendingIds.length }))) {
      return;
    }
    setActionMessage(null);
    let ok = 0;
    const failures: string[] = [];
    for (const id of pendingIds) {
      try {
        await deleteRequest(id);
        ok++;
      } catch (e) {
        failures.push(id);
      }
    }
    setRequests(prev => prev.filter(r => !(pendingIds.includes(r.id) && !failures.includes(r.id))));
    setSelectedRequests(new Set());
    setActionMessage(
      failures.length === 0
        ? { type: 'success', message: t('requests.deletedCount', { count: ok }) }
        : { type: 'error', message: t('requests.deletedPartial', { ok, failed: failures.length }) },
    );
  };

  // Number of currently-selected requests that are pending (deletable)
  const selectedPendingCount = requests.filter(
    r => isPendingStatus(r.status) && selectedRequests.has(r.id),
  ).length;

  // Filter requests by status. Test-user requests stay visible while PENDING
  // (so they can be validated/rejected during QA) but are kept OUT of the
  // reviewed list / archives (and thus out of the CSV export derived from it).
  const pendingRequests = requests.filter(req => isPendingStatus(req.status));
  const reviewedRequests = requests.filter(req => isReviewedStatus(req.status) && !isTestRequest(req));


  // Sorting function
  const sortRequests = (list: VacationRequestWithConflicts[]) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'userName' || sortKey === 'company') {
        const aVal = a[sortKey] || '';
        const bVal = b[sortKey] || '';
        return aVal.localeCompare(bVal) * dir;
      }

      if (sortKey === 'startDate') {
        const aDate = new Date(a.startDate);
        const bDate = new Date(b.startDate);
        return (aDate.getTime() - bDate.getTime()) * dir;
      }

      if (sortKey === 'reviewedAt') {
        const aDate = a.reviewedAt ? new Date(a.reviewedAt) : new Date(0);
        const bDate = b.reviewedAt ? new Date(b.reviewedAt) : new Date(0);
        return (aDate.getTime() - bDate.getTime()) * dir;
      }

      return 0;
    });
    return sorted;
  };

  const pendingSorted = useMemo(() => sortRequests(pendingRequests), [pendingRequests, sortKey, sortDir]);
  const reviewedSorted = useMemo(() => sortRequests(reviewedRequests), [reviewedRequests, sortKey, sortDir]);

  if (!mounted) {
    return (
      <div data-test="pending-list-v2">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-test="pending-list-v2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-ink mb-2">
          {t('vacationRequestsTitle')}
        </h1>
        <p className="text-slate-ardoise">
          {t('vacationRequestsDescription')}
        </p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 p-4 border ${
            actionMessage.type === 'success'
              ? 'border-ui-success/40 text-ui-success bg-ui-success/5'
              : 'border-ui-danger/40 text-ui-danger bg-ui-danger/5'
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {actionMessage.type === 'success' ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{actionMessage.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">{t('requests.statsPending')}</div>
          <div className="text-2xl font-semibold text-ui-warning">{pendingRequests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">{t('requests.statsTotal')}</div>
          <div className="text-2xl font-light text-ink">{requests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">{t('requests.statsSelected')}</div>
          <div className="text-2xl font-light text-gold">{selectedRequests.size}</div>
        </div>
      </div>

      {/* Pending Requests Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('requests.pendingHeading', { count: pendingRequests.length })}
            </h2>
            {pendingRequests.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {t('requests.pendingSubtitle')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedPendingCount > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-4 py-2 border border-ui-danger rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-ui-danger transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ui-danger"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('requests.deleteSelection', { count: selectedPendingCount })}
              </button>
            )}
            <button
              onClick={handleSyncToCalendar}
              disabled={isSyncing}
              className="inline-flex items-center px-4 py-2 border border-gold rounded-md text-xs font-semibold uppercase tracking-wider text-ink bg-gold hover:bg-[#C49E15] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {t('setup.syncCalendar.syncing')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('setup.syncCalendar.button')}
                </>
              )}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-black/15 rounded-md text-xs font-semibold uppercase tracking-wider text-ink bg-white hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('requests.exportSheet')}
            </button>
          </div>
        </div>
      </div>

      {/* Pending Requests Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full mb-4"></div>
          <p className="text-gray-600">{t('requests.loadingRequests')}</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noPendingRequests')}</h3>
          <p className="text-gray-600">{t('allVacationRequestsReviewed')}</p>
        </div>
      ) : (
        <>
        {(() => {
          const conflictCount = countUniqueConflicts(pendingRequests);
          return (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                conflictCount > 0
                  ? 'border-ui-danger/30 bg-ui-danger/10 text-ui-danger'
                  : 'border-ui-success/30 bg-ui-success/10 text-ui-success'
              }`}
            >
              {conflictCount > 0 ? (
                <>
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </svg>
                  {t('conflictsDetected', { count: conflictCount })}
                </>
              ) : (
                t('noConflictsDetected')
              )}
            </div>
          );
        })()}
        <RequestsTable
          requests={pendingSorted}
          selectedRequests={selectedRequests}
          onToggleSelection={toggleRequestSelection}
          onStatusUpdate={handleStatusUpdate}
          isProcessing={isProcessing}
          showActions={true}
          canValidate={(company) => canValidateCompany(session?.user?.email, company)}
          t={t}
          tCommon={tCommon}
          tVacations={tVacations}
        />
        </>
      )}

      {/* Calendar View with Conflict Detection */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('requests.calendarTitle')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('requests.calendarSubtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin mx-auto h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full mb-4"></div>
              <p className="text-gray-600">{t('requests.loadingCalendar')}</p>
            </div>
          ) : (
            <>
              {(() => {
                const filteredAndMapped = requests
                  .filter(r => {
                    const status = normalizeVacationStatus(r.status);
                    return status === 'pending' || status === 'approved';
                  })
                  .map((r): VacationRequest => ({
                    id: r.id,
                    userId: r.userId,
                    userEmail: r.userEmail,
                    userName: r.userName,
                    startDate: r.startDate,
                    endDate: r.endDate,
                    reason: r.reason,
                    company: r.company || 'Unknown',
                    type: r.type || 'VACATION',
                    status: normalizeVacationStatus(r.status),
                    createdAt: r.createdAt || new Date().toISOString(),
                     reviewedBy: r.reviewedBy,
                    reviewerEmail: undefined,
                    reviewedAt: r.reviewedAt || undefined,
                    adminComment: undefined,
                    included: true,
                    openDays: undefined,
                    isHalfDay: r.isHalfDay,
                    halfDayType: (r.halfDayType as 'morning' | 'afternoon' | null) || null,
                    durationDays: r.durationDays,
                    googleEventId: undefined
                  }));

                if (process.env.NEXT_PUBLIC_DEBUG_CALENDAR === '1') {
                  console.log('[CALENDAR DEBUG] Final data passed to UnifiedVacationCalendar:', {
                    count: filteredAndMapped.length,
                    sample: filteredAndMapped[0]
                  });
                }

                return (
                  <UnifiedVacationCalendar
                    vacationRequests={filteredAndMapped}
                    className="w-full"
                    showLegend={true}
                    compact={false}
                    data-testid="admin-calendar"
                  />
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Reviewed Requests - Foldable Section */}
      {reviewedRequests.length > 0 && (
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setShowReviewed(!showReviewed)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('requests.reviewedHeading')}
                </h2>
                <span className="badge badge-approved">
                  {reviewedRequests.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {showReviewed ? t('requests.hideReviewed') : t('requests.showReviewed')}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showReviewed ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showReviewed && (
              <div className="border-t border-gray-200">
                <ReviewedRequestsTable
                  requests={reviewedSorted}
                  onCancelRequest={handleCancelApprovedRequest}
                  isProcessing={isProcessing}
                  canCancelApproved={(session?.user?.email || '').toLowerCase() === 'johnny@stars.mc'}
                  t={t}
                  tVacations={tVacations}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Google Sheet — popup de période */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white w-full max-w-md p-6 shadow-card border border-black/5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-light tracking-tight text-ink mb-1">{t('requests.exportSheet')}</h2>
            <p className="text-sm text-slate-ardoise mb-4">{t('requests.exportModalHint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-gray-700">{tVacations('startDate')}
                <input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </label>
              <label className="block text-sm text-gray-700">{tVacations('endDate')}
                <input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </label>
            </div>
            {exportResult && (
              <div className={`mt-4 text-sm ${exportResult.ok ? 'text-ui-success' : 'text-ui-danger'}`}>
                {exportResult.msg}
                {exportResult.ok && exportResult.url && (
                  <a href={exportResult.url} target="_blank" rel="noopener noreferrer" className="block mt-1 text-ink underline">
                    {t('requests.openSheet')}
                  </a>
                )}
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" className="btn-secondary text-sm" onClick={() => { setShowExportModal(false); setExportResult(null); }}>
                {tCommon('close')}
              </button>
              <button type="button" className="btn-primary text-sm" disabled={isExporting} onClick={handleSheetExport}>
                {isExporting ? t('requests.exporting') : tCommon('export')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pending Requests Table Component
function RequestsTable({
  requests,
  selectedRequests,
  onToggleSelection,
  onStatusUpdate,
  isProcessing,
  showActions,
  canValidate,
  t,
  tCommon,
  tVacations
}: {
  requests: VacationRequestWithConflicts[];
  selectedRequests: Set<string>;
  onToggleSelection: (id: string) => void;
  onStatusUpdate: (id: string, status: "approved" | "denied") => void;
  isProcessing: (id: string) => boolean;
  showActions: boolean;
  canValidate: (company?: string | null) => boolean;
  t: any;
  tCommon: any;
  tVacations: any;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-sm [&_th]:px-2.5 [&_td]:px-2.5">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRequests.size === requests.length && requests.length > 0}
                  onChange={() => requests.forEach(req => onToggleSelection(req.id))}
                  className="h-4 w-4 accent-gold focus:ring-gold border-black/20 rounded"
                  aria-label={t('requests.statsSelected')}
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('employee')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('type')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('dates')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('conflict')}
              </th>
              {showActions && (
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 align-top">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(request.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelection(request.id);
                    }}
                    className="mt-1 h-4 w-4 accent-gold focus:ring-gold border-black/20 rounded"
                    aria-label={request.userName}
                  />
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <div className="font-medium">{request.userName}</div>
                  <div className="text-xs text-gray-500">{request.company}</div>
                  <a
                    href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                    className="mt-1 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-ink underline decoration-gold/60 underline-offset-2 hover:decoration-gold"
                    data-test="more-info-link"
                  >
                    {t('requests.moreInfo')}
                  </a>
                </td>
                <td className="px-3 py-3 text-gray-900">
                  {typeLabel(t, request.type)}
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <div>{t('requests.from')} {fmtDate(request.startDate)}</div>
                  <div className="text-gray-500">{t('requests.to')} {fmtDate(request.endDate)}</div>
                  <div className="text-xs text-gray-400">{calculateVacationDuration(request)} {tVacations('days')}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {request.conflicts && request.conflicts.length > 0 ? (
                    <span className="badge badge-rejected">
                      {t('inConflict')}
                    </span>
                  ) : (
                    <span className="badge badge-approved">{t('noConflictShort')}</span>
                  )}
                </td>
                {showActions && (
                  <td className="px-3 py-3 text-right">
                    {canValidate(request.company) ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(request.id, 'approved');
                        }}
                        disabled={isProcessing(request.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white bg-ui-success hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        data-test="approve-btn"
                      >
                        {isProcessing(request.id) ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          tVacations('approve')
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(request.id, 'denied');
                        }}
                        disabled={isProcessing(request.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white bg-ui-danger hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        data-test="reject-btn"
                      >
                        {isProcessing(request.id) ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          tVacations('reject')
                        )}
                      </button>
                    </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic" title={t('outOfScope')}>
                        {t('outOfScope')}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {requests.map((request) => (
          <div key={request.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedRequests.has(request.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelection(request.id);
                  }}
                  className="h-4 w-4 accent-gold focus:ring-gold border-black/20 rounded mt-1"
                  aria-label={request.userName}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-medium text-gray-900 truncate">
                    {request.userName}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {request.company || "—"} • {typeLabel(t, request.type)}
                  </p>
                  <a
                    href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                    className="mt-2 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-ink underline decoration-gold/60 underline-offset-2 hover:decoration-gold"
                    data-test="more-info-link"
                  >
                    {t('requests.moreInfo')}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm font-medium text-gray-500">{tVacations('startDate')}</div>
                <div className="text-sm text-gray-900">{fmtDate(request.startDate)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">{tVacations('endDate')}</div>
                <div className="text-sm text-gray-900">{fmtDate(request.endDate)}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">{tVacations('duration')}</div>
              <div className="text-sm text-gray-900">{calculateVacationDuration(request)} {tVacations('days')}</div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">{tVacations('conflicts')}</div>
              {request.conflicts && request.conflicts.length > 0 ? (
                <span className="badge badge-rejected">
                  {t('inConflict')}
                </span>
              ) : (
                <span className="badge badge-approved">{t('noConflictShort')}</span>
              )}
            </div>

            {showActions && (
              canValidate(request.company) ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(request.id, 'approved');
                  }}
                  disabled={isProcessing(request.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-semibold uppercase tracking-widest text-white bg-ui-success hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  data-test="approve-btn"
                >
                  {isProcessing(request.id) ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    tVacations('approve')
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                     onStatusUpdate(request.id, 'denied');
                  }}
                  disabled={isProcessing(request.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-semibold uppercase tracking-widest text-white bg-ui-danger hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  data-test="reject-btn"
                >
                  {isProcessing(request.id) ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    tVacations('reject')
                  )}
                </button>
              </div>
              ) : (
                <div className="text-xs text-gray-400 italic">{t('outOfScope')}</div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Reviewed Requests Table Component
function ReviewedRequestsTable({
  requests,
  onCancelRequest,
  isProcessing,
  canCancelApproved,
  t,
  tVacations
}: {
  requests: VacationRequestWithConflicts[];
  onCancelRequest: (id: string) => Promise<void>;
  isProcessing: (id: string) => boolean;
  canCancelApproved: boolean;
  t: any;
  tVacations: any;
}) {
  // Sorting state — default: by submission date (createdAt), most recent first.
  type ReviewedSortCol = 'userName' | 'startDate' | 'createdAt' | 'reviewedAt';
  const [sortColumn, setSortColumn] = useState<ReviewedSortCol>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle column header click for sorting
  const handleSort = (column: ReviewedSortCol) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'createdAt' || column === 'reviewedAt' ? 'desc' : 'asc');
    }
  };

  // Sort requests based on current sort state
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === 'userName') {
        comparison = (a.userName || '').toLowerCase().localeCompare((b.userName || '').toLowerCase());
      } else if (sortColumn === 'startDate') {
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortColumn === 'createdAt') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortColumn === 'reviewedAt') {
        comparison = new Date(a.reviewedAt || 0).getTime() - new Date(b.reviewedAt || 0).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [requests, sortColumn, sortDirection]);

  // CSV export function
  const exportToCSV = () => {
    // CSV header row
    const headers = [
      'Employee Name',
      'Company',
      'Type',
      'Start Date',
      'End Date',
      'Duration (days)',
      'Status',
      'Approved By',
      'Reviewer Email',
      'Reviewed At'
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Format datetime for CSV
    const formatDateTime = (dateString: string | null | undefined): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })} ${date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      } catch {
        return '';
      }
    };

    // Build CSV rows
    const rows = sortedRequests.map(request => [
      escapeCSV(request.userName || ''),
      escapeCSV(request.company || ''),
      escapeCSV(request.type || ''),
      escapeCSV(fmtDate(request.startDate)),
      escapeCSV(fmtDate(request.endDate)),
      escapeCSV(calculateVacationDuration(request)),
      escapeCSV(request.status || ''),
      escapeCSV(request.reviewedBy || 'Admin'),
      escapeCSV(request.reviewerEmail || ''),
      escapeCSV(formatDateTime(request.reviewedAt))
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and trigger download
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reviewed-vacations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: ReviewedSortCol }) => {
    if (sortColumn !== column) {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    return (
      <span className="ml-1 text-gold">
        {sortDirection === 'asc' ? (
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-b-lg overflow-hidden">
      {/* Export CSV Button */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-gold text-xs font-semibold uppercase tracking-wider rounded-md text-ink bg-gold hover:bg-[#C49E15] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('requests.exportCsv')}
        </button>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-sm [&_th]:px-2.5 [&_td]:px-2.5">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('userName')}
              >
                <div className="flex items-center">
                  {tVacations('employee')}
                  <SortIndicator column="userName" />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('type')}
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center">
                  {t('requests.vacationDates')}
                  <SortIndicator column="startDate" />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('status')}
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  {t('requests.submitted')}
                  <SortIndicator column="createdAt" />
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('reviewedAt')}
              >
                <div className="flex items-center">
                  {t('requests.reviewedCol')}
                  <SortIndicator column="reviewedAt" />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('requests.delay')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('requests.reviewedBy')}
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 align-top">
                <td className="px-3 py-3 text-gray-900">
                  <div className="font-medium">{request.userName}</div>
                  <div className="text-xs text-gray-500">{request.company}</div>
                  <a
                    href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                    className="mt-1 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-ink underline decoration-gold/60 underline-offset-2 hover:decoration-gold"
                    data-test="more-info-link"
                  >
                    {t('requests.moreInfo')}
                  </a>
                </td>
                <td className="px-3 py-3 text-gray-900">
                  {typeLabel(t, request.type)}
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <div>{t('requests.from')} {fmtDate(request.startDate)}</div>
                  <div className="text-gray-500">{t('requests.to')} {fmtDate(request.endDate)}</div>
                  <div className="text-xs text-gray-400">{calculateVacationDuration(request)} {tVacations('days')}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`badge badge-${(request.status || '').toLowerCase()}`}>
                    {statusLabel(tVacations, request.status)}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <div className="font-medium">
                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.createdAt ? new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <div className="font-medium">
                    {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.reviewedAt ? new Date(request.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap font-medium text-ink">
                  {formatReviewDelay(request.createdAt, request.reviewedAt)}
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <div className="font-medium">
                    {request.reviewedBy || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.reviewerEmail || ''}
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  {request.status === 'approved' && canCancelApproved ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void onCancelRequest(request.id);
                      }}
                      disabled={isProcessing(request.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-ui-warning/50 text-xs font-semibold uppercase tracking-widest text-ui-warning bg-ui-warning/5 hover:bg-ui-warning/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing(request.id) ? t('requests.cancelling') : t('requests.cancelVacation')}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {sortedRequests.map((request) => (
          <div key={request.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-lg font-medium text-gray-900 truncate">
                  {request.userName}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {request.company || "—"} • {typeLabel(t, request.type)}
                </p>
                <a
                  href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                  className="mt-2 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-ink underline decoration-gold/60 underline-offset-2 hover:decoration-gold"
                  data-test="more-info-link"
                >
                  {t('requests.moreInfo')}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm font-medium text-gray-500">{tVacations('startDate')}</div>
                <div className="text-sm text-gray-900">{fmtDate(request.startDate)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">{tVacations('endDate')}</div>
                <div className="text-sm text-gray-900">{fmtDate(request.endDate)}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">{tVacations('status')}</div>
              <span className={`badge badge-${(request.status || '').toLowerCase()}`}>
                {statusLabel(tVacations, request.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm font-medium text-gray-500">{t('requests.submitted')}</div>
                <div className="text-sm text-gray-900">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">{t('requests.reviewedCol')}</div>
                <div className="text-sm text-gray-900">
                  {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm font-medium text-gray-500">{t('requests.delay')}</div>
                <div className="text-sm font-medium text-ink">
                  {formatReviewDelay(request.createdAt, request.reviewedAt)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">{t('requests.reviewedBy')}</div>
                <div className="text-sm text-gray-900">{request.reviewedBy || 'Admin'}</div>
                <div className="text-xs text-gray-500">{request.reviewerEmail || ''}</div>
              </div>
            </div>

            {request.status === 'approved' && canCancelApproved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void onCancelRequest(request.id);
                }}
                disabled={isProcessing(request.id)}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-ui-warning/50 text-sm font-semibold uppercase tracking-widest text-ui-warning bg-ui-warning/5 hover:bg-ui-warning/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing(request.id) ? t('requests.cancelling') : t('requests.cancelVacation')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
