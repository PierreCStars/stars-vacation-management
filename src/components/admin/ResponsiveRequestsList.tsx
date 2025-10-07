"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { VacationRequestWithConflicts } from "@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts";
import { validateRequestAction } from "@/app/[locale]/admin/vacation-requests/actions";
import { absoluteUrl } from "@/lib/urls";

interface ResponsiveRequestsListProps {
  requests: VacationRequestWithConflicts[];
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onViewConflicts: (id: string) => void;
  onReviewRequest: (id: string) => void;
  onToggleSelection: (id: string) => void;
  selectedRequests: Set<string>;
  t: (key: string) => string;
  tVacations: (key: string) => string;
  showActions?: boolean;
}

export default function ResponsiveRequestsList({
  requests,
  onUpdateStatus,
  onViewConflicts,
  onReviewRequest,
  onToggleSelection,
  selectedRequests,
  t,
  tVacations,
  showActions = true
}: ResponsiveRequestsListProps) {
  console.log('[LAYOUT] ResponsiveRequestsList mounted with', requests.length, 'requests, showActions:', showActions);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setProcessingRequests(prev => new Set(prev).add(id));
    try {
      await onUpdateStatus(id, status);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const isProcessing = (id: string) => processingRequests.has(id);

  return (
    <div className="space-y-4" data-test="pending-list-v2">
      {/* Critical debug banner */}
      <div 
        className="fixed top-20 left-4 z-[9999] px-4 py-2 rounded bg-green-600 text-white text-sm font-bold border-2 border-yellow-400"
        style={{ position: 'fixed', top: '80px', left: '16px', zIndex: 9999 }}
      >
        🟢 ResponsiveRequestsList RENDERED: {requests.length} requests, showActions: {showActions.toString()}
      </div>
      
      {/* Debug banner */}
      {(process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true') && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded text-sm mb-4">
          🔧 DEBUG: ResponsiveRequestsList rendered with {requests.length} requests, showActions: {showActions.toString()}
        </div>
      )}
      
      {/* Desktop Table View (lg and up) */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tVacations('employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tVacations('company')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tVacations('type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dates')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('conflict')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                {showActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map(request => (
                <RequestTableRow
                  key={request.id}
                  request={request}
                  onUpdateStatus={handleStatusUpdate}
                  onViewConflicts={onViewConflicts}
                  onReviewRequest={onReviewRequest}
                  onToggleSelection={onToggleSelection}
                  selectedRequests={selectedRequests}
                  isProcessing={isProcessing(request.id)}
                  t={t}
                  tVacations={tVacations}
                  showActions={showActions}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (below lg) */}
      <div className="lg:hidden space-y-3">
        {requests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            onUpdateStatus={handleStatusUpdate}
            onViewConflicts={onViewConflicts}
            onReviewRequest={onReviewRequest}
            onToggleSelection={onToggleSelection}
            selectedRequests={selectedRequests}
            isProcessing={isProcessing(request.id)}
            t={t}
            tVacations={tVacations}
            showActions={showActions}
          />
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎉</div>
          <p className="text-lg font-medium text-gray-900">{t('noPendingRequests')}</p>
          <p className="text-sm text-gray-500">{t('allVacationRequestsReviewed')}</p>
        </div>
      )}
    </div>
  );
}

interface RequestRowProps {
  request: VacationRequestWithConflicts;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onViewConflicts: (id: string) => void;
  onReviewRequest: (id: string) => void;
  onToggleSelection: (id: string) => void;
  selectedRequests: Set<string>;
  isProcessing: boolean;
  t: (key: string) => string;
  tVacations: (key: string) => string;
  showActions?: boolean;
}

function RequestTableRow({
  request,
  onUpdateStatus,
  onViewConflicts,
  onReviewRequest,
  onToggleSelection,
  selectedRequests,
  isProcessing,
  t,
  tVacations,
  showActions = true
}: RequestRowProps) {
  const locale = useLocale();
  const isSelected = selectedRequests.has(request.id);
  
  console.log('[LAYOUT] RequestTableRow rendering for', request.userName, 'showActions:', showActions);

  const handleRowClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on non-interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
      return; // Don't navigate if clicking on interactive elements
    }
    onReviewRequest(request.id);
  };

  const moreInfoUrl = absoluteUrl(`/${locale}/admin/vacation-requests/${request.id}`);

  return (
    <tr 
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(request.id);
          }}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
        <div className="flex items-center gap-2">
          <span className="font-medium">{request.userName}</span>
          <a
            href={moreInfoUrl}
            onClick={(e) => e.stopPropagation()}
            className="text-sm underline text-slate-600 hover:text-slate-900 transition-colors"
            aria-label={`More information about ${request.userName}'s request`}
            data-test="more-info-link"
          >
            More information
          </a>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
        {request.company || "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
        {request.type || "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
        {request.startDate}{request.endDate !== request.startDate ? ` to ${request.endDate}` : ""}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-middle">
        <ConflictBadge
          conflicts={request.conflicts}
          onViewConflicts={() => onViewConflicts(request.id)}
          t={t}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-middle">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReviewRequest(request.id);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          Review Request
        </button>
      </td>
      {showActions && (
        <td className="w-[1%] whitespace-nowrap px-6 py-4 align-middle">
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <ActionButtons
              requestId={request.id}
              userName={request.userName}
              onUpdateStatus={onUpdateStatus}
              isProcessing={isProcessing}
              t={t}
              tVacations={tVacations}
            />
          </div>
        </td>
      )}
    </tr>
  );
}

function RequestCard({
  request,
  onUpdateStatus,
  onViewConflicts,
  onReviewRequest,
  onToggleSelection,
  selectedRequests,
  isProcessing,
  t,
  tVacations,
  showActions = true
}: RequestRowProps) {
  const locale = useLocale();
  const isSelected = selectedRequests.has(request.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on non-interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
      return; // Don't navigate if clicking on interactive elements
    }
    onReviewRequest(request.id);
  };

  const moreInfoUrl = absoluteUrl(`/${locale}/admin/vacation-requests/${request.id}`);

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header with checkbox, employee name and company */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(request.id);
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-medium text-gray-900 truncate">
              {request.userName}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {request.company || "—"} • {request.type || "—"}
            </p>
            <a
              href={moreInfoUrl}
              onClick={(e) => e.stopPropagation()}
              className="text-xs underline text-slate-600 hover:text-slate-900 transition-colors"
              aria-label={`More information about ${request.userName}'s request`}
              data-test="more-info-link"
            >
              More information
            </a>
          </div>
        </div>
        <ConflictBadge
          conflicts={request.conflicts}
          onViewConflicts={() => onViewConflicts(request.id)}
          t={t}
          compact
        />
      </div>

      {/* Dates */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Dates:</span> {request.startDate}
          {request.endDate !== request.startDate ? ` to ${request.endDate}` : ""}
        </p>
      </div>

      {/* Review button and action buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReviewRequest(request.id);
          }}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          Review Request
        </button>
        {showActions && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <ActionButtons
              requestId={request.id}
              userName={request.userName}
              onUpdateStatus={onUpdateStatus}
              isProcessing={isProcessing}
              t={t}
              tVacations={tVacations}
              fullWidth
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ConflictBadgeProps {
  conflicts: any[];
  onViewConflicts: () => void;
  t: (key: string) => string;
  compact?: boolean;
}

function ConflictBadge({ conflicts, onViewConflicts, t, compact = false }: ConflictBadgeProps) {
  if (conflicts.length === 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full ${compact ? 'self-start' : ''}`}>
        ✅ No conflicts
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? 'flex-col items-end' : ''}`}>
      <span className={`inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full ${compact ? 'self-start' : ''}`}>
        ⚠️ {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
      </span>
      <button
        onClick={onViewConflicts}
        className="text-blue-600 hover:text-blue-800 text-xs underline"
      >
        {t('viewDetails')}
      </button>
    </div>
  );
}

interface ActionButtonsProps {
  requestId: string;
  userName: string;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  isProcessing: boolean;
  t: (key: string) => string;
  tVacations: (key: string) => string;
  fullWidth?: boolean;
}

function ActionButtons({
  requestId,
  userName,
  onUpdateStatus,
  isProcessing,
  t,
  tVacations,
  fullWidth = false
}: ActionButtonsProps) {
  const buttonClass = fullWidth
    ? "flex-1 rounded px-3 py-2 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    : "rounded px-3 py-1 text-white hover:opacity-90 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed";

  return (
        <>
          <form action={validateRequestAction}>
            <input type="hidden" name="id" value={requestId} />
            <input type="hidden" name="action" value="approve" />
            <button 
              type="submit" 
              disabled={isProcessing}
              aria-label={`Approve request for ${userName}`}
              className={`${buttonClass} bg-green-600 hover:bg-green-700 ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-test="approve-btn"
            >
              {isProcessing ? '...' : tVacations('approve')}
            </button>
          </form>
          <form action={validateRequestAction}>
            <input type="hidden" name="id" value={requestId} />
            <input type="hidden" name="action" value="deny" />
            <button 
              type="submit" 
              disabled={isProcessing}
              aria-label={`Deny request for ${userName}`}
              className={`${buttonClass} bg-red-600 hover:bg-red-700 ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-test="deny-btn"
            >
              {isProcessing ? '...' : tVacations('reject')}
            </button>
          </form>
        </>
  );
}
