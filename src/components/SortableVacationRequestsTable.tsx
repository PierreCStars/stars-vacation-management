'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/config/admins';
import Link from 'next/link';
import { getVacationTypeLabel, parseVacationType } from '@/lib/vacation-types';

interface VacationRequest {
  id: string;
  userName: string;
  userId: string;
  company: string;
  type?: string;
  startDate: string;
  endDate: string;
  status: string;
  comment?: string;
  reason?: string;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: string;
}

interface SortableVacationRequestsTableProps {
  requests: VacationRequest[];
  type: 'pending' | 'reviewed';
  onRefresh?: () => void;
  locale?: 'en' | 'fr' | 'it';
}

export default function SortableVacationRequestsTable({ requests, type, onRefresh, locale = 'en' }: SortableVacationRequestsTableProps) {
  const [sortField, setSortField] = useState<'userName' | 'company'>('userName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Get session to check admin status (defense-in-depth)
  const { data: session } = useSession();
  const isAdminUser = isAdmin(session?.user?.email);

  const handleSort = (field: 'userName' | 'company') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const aValue = a[sortField].toLowerCase();
    const bValue = b[sortField].toLowerCase();
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const exportToGoogleSheets = async () => {
    try {
      console.log('Exporting CSV for', type, 'requests:', sortedRequests.length);
      
      if (sortedRequests.length === 0) {
        alert('No data to export.');
        return;
      }
      
      const headers = type === 'reviewed' 
        ? ['Employee', 'Company', 'Type', 'Start Date', 'End Date', 'Status', 'Reviewed By', 'Review Date', 'Comment']
        : ['Employee', 'Company', 'Type', 'Start Date', 'End Date', 'Status', 'Comment'];
      
      const csvContent = [
        headers.join(','),
        ...sortedRequests.map(req => {
          const baseRow = [
            `"${req.userName || ''}"`,
            `"${req.company || ''}"`,
            `"${getVacationTypeLabel(parseVacationType(req.type || ''), locale)}"`,
            `"${req.startDate ? new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}"`,
            `"${req.endDate ? new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}"`,
            `"${req.status || ''}"`,
          ];
          
          if (type === 'reviewed') {
            baseRow.push(
              `"${req.reviewedBy || 'Unknown'}"`,
              `"${req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}"`
            );
          }
          
          baseRow.push(`"${req.comment || req.reason || ''}"`);
          
          return baseRow.join(',');
        })
      ].join('\n');

      console.log('CSV content generated:', csvContent.substring(0, 200) + '...');
      
      // Create blob with BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Method 1: Try download attribute
      try {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vacation-requests-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('CSV export completed successfully');
        return;
      } catch (error) {
        console.warn('Download method 1 failed:', error);
      }
      
      // Method 2: Try window.open
      try {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        console.log('CSV export opened in new window');
        return;
      } catch (error) {
        console.warn('Download method 2 failed:', error);
      }
      
      // Method 3: Copy to clipboard (fallback)
      try {
        await navigator.clipboard.writeText(csvContent);
        alert('CSV data copied to clipboard. Please paste it into a text file and save with .csv extension.');
        console.log('CSV data copied to clipboard');
        return;
      } catch (error) {
        console.warn('Clipboard method failed:', error);
      }
      
      // Final fallback: Show data in alert
      alert('Download failed. CSV data:\n\n' + csvContent.substring(0, 500) + '...');
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getSortIcon = (field: 'userName' | 'company') => {
    if (sortField !== field) {
      return (
        <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 4 }}>↕</span>
      );
    }
    return sortDirection === 'asc' ? (
      <span style={{ color: '#2563eb', fontSize: 12, marginLeft: 4 }}>↑</span>
    ) : (
      <span style={{ color: '#2563eb', fontSize: 12, marginLeft: 4 }}>↓</span>
    );
  };

  const handleApproveReject = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const comment = prompt(`Please enter a comment for ${status.toLowerCase()} this request (optional):`);
      
      const response = await fetch(`/api/vacation-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comment: comment || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await response.json();
      alert(`Request ${status.toLowerCase()} successfully!`);
      
      // Refresh the data without reloading the page
      if (onRefresh) {
        onRefresh();
      } else {
        // Fallback to page reload if no refresh callback provided
        window.location.reload();
      }
      
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing request:`, error);
      alert(`Error ${status.toLowerCase()}ing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (sortedRequests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ width: 64, height: 64, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <span style={{ color: '#9ca3af', fontSize: 32, fontWeight: 700 }}>📄</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No {type} requests found</h3>
        <p style={{ color: '#6b7280' }}>There are currently no {type} vacation requests to display.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
      <div style={{ overflowX: 'auto', borderRadius: 16 }}>
        <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', fontSize: 14, border: '1px solid #000' }}>
          <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>Action</th>
                <th 
                style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}
                  onClick={() => handleSort('userName')}
                >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Employee</span>
                      {getSortIcon('userName')}
                  </div>
                </th>
                <th 
                style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}
                  onClick={() => handleSort('company')}
                >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Company</span>
                      {getSortIcon('company')}
                  </div>
                </th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>Type</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>Start</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>End</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>Status</th>
              {type === 'reviewed' && (
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>Reviewed By</th>
              )}
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, background: '#f9fafb', position: 'sticky', top: 0, zIndex: 20 }}>Comment</th>
              </tr>
            </thead>
          <tbody>
              {sortedRequests.map((req, index) => (
                <tr 
                  key={req.id} 
                style={{
                  borderBottom: '1px solid #000',
                  background: index % 2 === 0 ? '#fff' : '#d3d3d3',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#e0e7ff')}
                onMouseOut={e => (e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#d3d3d3')}
              >
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  {type === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                      <Link
                        href={`/admin/vacation-requests/${req.id}`}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          padding: '6px 16px', 
                          border: 'none', 
                          fontSize: 12, 
                          fontWeight: 600, 
                          borderRadius: 8, 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.10)', 
                          cursor: 'pointer', 
                          background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', 
                          color: '#fff', 
                          transition: 'background 0.2s, box-shadow 0.2s', 
                          margin: 0,
                          textDecoration: 'none'
                        }}
                      >
                        Review
                      </Link>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleApproveReject(req.id, 'APPROVED')}
                          disabled={processingRequests.has(req.id)}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            padding: '4px 8px', 
                            border: 'none', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            borderRadius: 6, 
                            cursor: processingRequests.has(req.id) ? 'not-allowed' : 'pointer', 
                            background: processingRequests.has(req.id) ? '#9ca3af' : 'linear-gradient(90deg, #22c55e 0%, #059669 100%)', 
                            color: '#fff', 
                            transition: 'background 0.2s', 
                            margin: 0,
                            opacity: processingRequests.has(req.id) ? 0.6 : 1
                          }}
                        >
                          {processingRequests.has(req.id) ? '...' : '✓'}
                        </button>
                        <button
                          onClick={() => handleApproveReject(req.id, 'REJECTED')}
                          disabled={processingRequests.has(req.id)}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            padding: '4px 8px', 
                            border: 'none', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            borderRadius: 6, 
                            cursor: processingRequests.has(req.id) ? 'not-allowed' : 'pointer', 
                            background: processingRequests.has(req.id) ? '#9ca3af' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', 
                            color: '#fff', 
                            transition: 'background 0.2s', 
                            margin: 0,
                            opacity: processingRequests.has(req.id) ? 0.6 : 1
                          }}
                        >
                          {processingRequests.has(req.id) ? '...' : '✗'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/admin/vacation-requests/${req.id}`}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '8px 20px', 
                        border: 'none', 
                        fontSize: 14, 
                        fontWeight: 600, 
                        borderRadius: 12, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.10)', 
                        cursor: 'pointer', 
                        background: '#f3f4f6', 
                        color: '#374151', 
                        transition: 'background 0.2s, box-shadow 0.2s', 
                        margin: 0,
                        textDecoration: 'none'
                      }}
                    >
                      View
                    </Link>
                  )}
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{req.userName}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', display: 'none' }}>{req.userId}</div>
                    </div>
                  </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 16, color: '#111827', fontWeight: 500 }}>{req.company}</div>
                  </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#dbeafe', color: '#1e40af' }}>
                      {getVacationTypeLabel(parseVacationType(req.type || ''), locale)}
                    </span>
                  </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: '#111827' }}>
                  {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Paris' })}
                  </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: '#111827' }}>
                  {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Paris' })}
                  </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: req.status === 'APPROVED' ? '#d1fae5' : req.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: req.status === 'APPROVED' ? '#065f46' : req.status === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                      {req.status}
                    </span>
                </td>
                {type === 'reviewed' && (
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{req.reviewedBy || 'Unknown'}</div>
                      {req.reviewedAt && (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {new Date(req.reviewedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: '#111827' }}>
                  {isAdminUser && (req.comment || req.reason) ? (
                    <span title={req.comment || req.reason} style={{ cursor: 'help' }}>
                      {(req.comment || req.reason || '').length > 30 ? `${(req.comment || req.reason || '').substring(0, 30)}...` : (req.comment || req.reason || '')}
                      </span>
                    ) : (
                    <span style={{ color: '#d1d5db' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      {/* Export Button for Reviewed Requests */}
      {type === 'reviewed' && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={exportToGoogleSheets}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '10px 24px', 
              background: sortedRequests.length > 0 ? 'linear-gradient(90deg, #22c55e 0%, #059669 100%)' : '#9ca3af', 
              color: '#fff', 
              fontSize: 14, 
              fontWeight: 600, 
              borderRadius: 12, 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)', 
              cursor: sortedRequests.length > 0 ? 'pointer' : 'not-allowed', 
              transition: 'background 0.2s, box-shadow 0.2s', 
              margin: 0 
            }}
            onMouseOver={e => {
              if (sortedRequests.length > 0) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #16a34a 0%, #047857 100%)';
              }
            }}
            onMouseOut={e => {
              if (sortedRequests.length > 0) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #22c55e 0%, #059669 100%)';
              }
            }}
            disabled={sortedRequests.length === 0}
          >
            <span style={{ fontSize: 18, marginRight: 8 }}>📥</span>
            Export to CSV ({sortedRequests.length} requests)
          </button>
      </div>
      )}
    </div>
  );
} 