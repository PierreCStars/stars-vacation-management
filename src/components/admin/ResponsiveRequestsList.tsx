"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { VacationRequestWithConflicts } from "@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts";
import { absoluteUrl } from "@/lib/urls";

// Helper function to calculate days between dates
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  return diffDays;
}

interface ResponsiveRequestsListProps {
  requests: VacationRequestWithConflicts[];
  onUpdateStatus: (id: string, status: "approved" | "denied") => void;
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
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleStatusUpdate = async (id: string, status: "approved" | "denied") => {
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
  onUpdateStatus: (id: string, status: "approved" | "denied") => void;
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
  

  const moreInfoUrl = absoluteUrl(`/${locale}/admin/vacation-requests/${request.id}`);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
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
        <div className="flex items-center gap-3">
          <span className="font-medium">{request.userName}</span>
          <a
            href={moreInfoUrl}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:text-white transition-colors shadow-sm"
            aria-label={`More information about ${request.userName}'s request`}
            data-test="more-info-link"
          >
            More Information
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
        From {new Date(request.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}{request.endDate !== request.startDate ? ` to ${new Date(request.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ""}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-middle">
        <ConflictBadge
          conflicts={request.conflicts}
          onViewConflicts={() => onViewConflicts(request.id)}
          t={t}
        />
      </td>
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

  const moreInfoUrl = absoluteUrl(`/${locale}/admin/vacation-requests/${request.id}`);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:text-white transition-colors shadow-sm mt-2"
              aria-label={`More information about ${request.userName}'s request`}
              data-test="more-info-link"
            >
              More Information
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
          <span className="font-medium">Dates:</span> From {new Date(request.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          {request.endDate !== request.startDate ? ` to ${new Date(request.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ""}
          <span className="text-xs text-gray-400 ml-2">({request.durationDays || calculateDays(request.startDate, request.endDate)} days)</span>
        </p>
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
  onUpdateStatus: (id: string, status: "approved" | "denied") => void;
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

  const handleApprove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateStatus(requestId, 'approved');
  };

  const handleReject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateStatus(requestId, 'denied');
  };

  return (
        <>
          <button 
            onClick={handleApprove}
            disabled={isProcessing}
            aria-label={`Approve request for ${userName}`}
            className={`${buttonClass} bg-green-600 hover:bg-green-700 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            data-test="approve-btn"
          >
            {isProcessing ? '...' : tVacations('approve')}
          </button>
          <button 
            onClick={handleReject}
            disabled={isProcessing}
            aria-label={`Deny request for ${userName}`}
            className={`${buttonClass} bg-red-600 hover:bg-red-700 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            data-test="deny-btn"
          >
            {isProcessing ? '...' : tVacations('reject')}
          </button>
        </>
  );
}
// Force deployment Tue Oct  7 18:08:54 CEST 2025
