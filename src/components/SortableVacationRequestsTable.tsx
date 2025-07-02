'use client';

import { useState } from 'react';
import Link from 'next/link';

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
}

export default function SortableVacationRequestsTable({ requests, type }: SortableVacationRequestsTableProps) {
  const [sortField, setSortField] = useState<'userName' | 'company'>('userName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
      const headers = type === 'reviewed' 
        ? ['Employee', 'Company', 'Type', 'Start Date', 'End Date', 'Status', 'Reviewed By', 'Review Date', 'Comment']
        : ['Employee', 'Company', 'Type', 'Start Date', 'End Date', 'Status', 'Comment'];
      
      const csvContent = [
        headers.join(','),
        ...sortedRequests.map(req => {
          const baseRow = [
            `"${req.userName}"`,
            `"${req.company}"`,
            `"${req.type === 'PAID_VACATION' ? 'Paid Vacation' :
               req.type === 'UNPAID_VACATION' ? 'Unpaid Vacation' :
               req.type === 'SICK_LEAVE' ? 'Sick Leave' :
               req.type === 'OTHER' ? 'Other' : 
               req.type || 'Not specified'}"`,
            `"${new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}"`,
            `"${new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}"`,
            `"${req.status}"`,
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
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vacation-requests-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting data. Please try again.');
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
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
      <div style={{ overflowX: 'auto', borderRadius: 16 }}>
        <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', fontSize: 14, border: '1px solid #000' }}>
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
                  <button
                    onClick={() => window.location.href = `/admin/vacation-requests/${req.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 20px', border: 'none', fontSize: 14, fontWeight: 600, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.10)', cursor: 'pointer', background: type === 'pending' ? 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' : '#f3f4f6', color: type === 'pending' ? '#fff' : '#374151', transition: 'background 0.2s, box-shadow 0.2s', margin: 0 }}
                  >
                    {type === 'pending' ? 'Review' : 'View'}
                  </button>
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
                    {req.type === 'PAID_VACATION' ? 'Paid Vacation' :
                     req.type === 'UNPAID_VACATION' ? 'Unpaid Vacation' :
                     req.type === 'SICK_LEAVE' ? 'Sick Leave' :
                     req.type === 'OTHER' ? 'Other' : 
                     req.type || 'Not specified'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: '#111827' }}>
                  {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: '#111827' }}>
                  {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
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
                  {req.comment || req.reason ? (
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
      {type === 'reviewed' && sortedRequests.length > 0 && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={exportToGoogleSheets}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', background: 'linear-gradient(90deg, #22c55e 0%, #059669 100%)', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.10)', cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s', margin: 0 }}
          >
            <span style={{ fontSize: 18, marginRight: 8 }}>📥</span>
            Export to CSV
          </button>
        </div>
      )}
    </div>
  );
} 