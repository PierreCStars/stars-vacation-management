"use client";

import { useState } from "react";
import Link from "next/link";
import { VacationRequestWithConflicts } from "@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts";

interface ResponsiveRequestsListProps {
  requests: VacationRequestWithConflicts[];
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onViewConflicts: (id: string) => void;
  t: (key: string) => string;
  tVacations: (key: string) => string;
}

export default function ResponsiveRequestsList({
  requests,
  onUpdateStatus,
  onViewConflicts,
  t,
  tVacations
}: ResponsiveRequestsListProps) {
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
    <div className="space-y-4">
      {/* Desktop Table View (lg and up) */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
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
                  {t('actions')}
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
                  isProcessing={isProcessing(request.id)}
                  t={t}
                  tVacations={tVacations}
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
            isProcessing={isProcessing(request.id)}
            t={t}
            tVacations={tVacations}
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
  isProcessing: boolean;
  t: (key: string) => string;
  tVacations: (key: string) => string;
}

function RequestTableRow({
  request,
  onUpdateStatus,
  onViewConflicts,
  isProcessing,
  t,
  tVacations
}: RequestRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        <Link
          href={`/en/admin/vacation-requests/${request.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {request.userName}
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {request.company || "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {request.type || "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {request.startDate}{request.endDate !== request.startDate ? ` to ${request.endDate}` : ""}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <ConflictBadge
          conflicts={request.conflicts}
          onViewConflicts={() => onViewConflicts(request.id)}
          t={t}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <ActionButtons
          requestId={request.id}
          onUpdateStatus={onUpdateStatus}
          isProcessing={isProcessing}
          t={t}
          tVacations={tVacations}
        />
      </td>
    </tr>
  );
}

function RequestCard({
  request,
  onUpdateStatus,
  onViewConflicts,
  isProcessing,
  t,
  tVacations
}: RequestRowProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header with employee name and company */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/en/admin/vacation-requests/${request.id}`}
            className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline block truncate"
          >
            {request.userName}
          </Link>
          <p className="text-sm text-gray-500 truncate">
            {request.company || "—"} • {request.type || "—"}
          </p>
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

      {/* Action buttons - full width on mobile */}
      <div className="flex gap-2">
        <ActionButtons
          requestId={request.id}
          onUpdateStatus={onUpdateStatus}
          isProcessing={isProcessing}
          t={t}
          tVacations={tVacations}
          fullWidth
        />
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
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  isProcessing: boolean;
  t: (key: string) => string;
  tVacations: (key: string) => string;
  fullWidth?: boolean;
}

function ActionButtons({
  requestId,
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
      <button
        onClick={() => onUpdateStatus(requestId, "approved")}
        disabled={isProcessing}
        className={`${buttonClass} bg-green-600 hover:bg-green-700 ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isProcessing ? '...' : tVacations('approve')}
      </button>
      <button
        onClick={() => onUpdateStatus(requestId, "rejected")}
        disabled={isProcessing}
        className={`${buttonClass} bg-red-600 hover:bg-red-700 ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isProcessing ? '...' : tVacations('reject')}
      </button>
    </>
  );
}
