"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

type EmployeeRow = { 
  userId?: string; 
  userEmail?: string;
  userName: string; 
  company: string; 
  totalDays: number; 
  count: number; 
  avg: number;
  lastRequestDate?: string;
  firstRequestDate?: string;
};

type FreqByType = { 
  type: string; 
  count: number; 
};

type StackRow = { 
  company: string; 
  [type: string]: number | string; 
};

export default function AnalyticsPage() {
  const [status, setStatus] = useState<"approved"|"pending"|"denied"|"all">("approved");
  const [data, setData] = useState<{
    meta: { 
      statusFilter: string; 
      totalRequests: number;
      dateRange?: {
        earliest: number;
        latest: number;
      };
    };
    employees: EmployeeRow[];
    freqByType: FreqByType[];
    freqByCompanyStack: StackRow[];
    daysByCompanyStack: StackRow[];
    freqByReason?: { reason: string; count: number }[];
    freqByStatus?: { status: string; count: number }[];
    monthlyTrends?: { month: string; requests: number; days: number }[];
    typeKeys: string[];
    companyKeys: string[];
    reasonKeys?: string[];
    statusKeys?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<"userName"|"company"|"totalDays"|"count"|"avg">("totalDays");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/analytics/vacations?status=${status}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(err => {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [status]);

  const employeesSorted = useMemo(() => {
    if (!data) return [];
    const arr = [...data.employees];
    arr.sort((a,b)=>{
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "userName" || sortKey === "company") {
        return a[sortKey].localeCompare(b[sortKey]) * dir;
      }
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">No analytics data available.</p>
        </div>
      </div>
    );
  }

  const colors = ["#8884d8","#82ca9d","#ffc658","#ff8042","#8dd1e1","#a4de6c","#d0ed57","#d885a3","#a888e1"];
  const typeKeys = data.typeKeys;

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="text-sm text-gray-500 mb-2">
          <span>Admin</span> <span className="mx-1">/</span> <span className="text-gray-900 font-medium">Analytics</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vacation Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into vacation patterns and trends</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status Filter</label>
            <select 
              value={status} 
              onChange={e=>setStatus(e.target.value as any)} 
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Only</option>
              <option value="denied">Denied Only</option>
              <option value="all">All Statuses</option>
            </select>
            <a
              href={`/api/analytics/vacations.csv?status=${status}`}
              className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              download
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </a>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">Total Requests</div>
          <div className="text-3xl font-bold text-gray-900">{data.meta.totalRequests}</div>
          <div className="text-xs text-gray-500 mt-1">Current filter: {data.meta.statusFilter}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">Unique Employees</div>
          <div className="text-3xl font-bold text-gray-900">{new Set(data.employees.map(e=>e.userEmail || e.userName)).size}</div>
          <div className="text-xs text-gray-500 mt-1">Active users</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">Total Days</div>
          <div className="text-3xl font-bold text-gray-900">{data.employees.reduce((s,e)=>s+e.totalDays,0).toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Sum of all requests</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">Avg Days/Employee</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.employees.length > 0 ? (data.employees.reduce((s,e)=>s+e.totalDays,0) / data.employees.length).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Average per employee</div>
        </div>
      </section>

      {/* Employees table */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Employee Summary</h2>
              <p className="text-sm text-gray-600 mt-1">Detailed breakdown by employee</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Sort by</label>
              <select 
                value={sortKey} 
                onChange={e=>setSortKey(e.target.value as any)} 
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="totalDays">Days taken</option>
                <option value="count">Frequency</option>
                <option value="avg">Avg duration</option>
                <option value="userName">Employee</option>
                <option value="company">Company</option>
              </select>
              <button 
                onClick={()=>setSortDir(d=> d==="asc" ? "desc" : "asc")} 
                className="border border-gray-300 rounded px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                {sortDir==="asc" ? "↑ Ascending" : "↓ Descending"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Days taken</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last request</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeesSorted.map((e, i)=>(
                <tr key={e.userEmail || e.userId || e.userName || i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.userEmail || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{e.totalDays.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{e.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{e.avg.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {e.lastRequestDate ? new Date(e.lastRequestDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {employeesSorted.length===0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="text-center">
                      <div className="text-gray-400 text-4xl mb-2">📊</div>
                      <p className="text-lg font-medium text-gray-900">No employee data</p>
                      <p className="text-sm text-gray-500">Try adjusting the status filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequency by Type (Pie) */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Type of Vacation — Frequency</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie 
                dataKey="count" 
                nameKey="type" 
                data={data.freqByType} 
                outerRadius={120} 
                label={({ type, count }) => `${type}: ${count}`}
              >
                {data.freqByType.map((entry, index) => (
                  <Cell key={entry.type} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Frequency by Company (stacked bar) */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequency by Company</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={data.freqByCompanyStack}>
              <XAxis dataKey="company" />
              <YAxis allowDecimals />
              <Tooltip formatter={(value) => [value, 'Count']} />
              <Legend />
              {typeKeys.map((k, i)=>(
                <Bar key={k} dataKey={k} stackId="freq" fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Duration by Company (stacked bar) */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Duration by Company (days)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={data.daysByCompanyStack}>
              <XAxis dataKey="company" />
              <YAxis allowDecimals />
              <Tooltip formatter={(value) => [value, 'Days']} />
              <Legend />
              {typeKeys.map((k, i)=>(
                <Bar key={k} dataKey={k} stackId="days" fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Status Distribution */}
      {data.freqByStatus && data.freqByStatus.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Status Distribution</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  dataKey="count" 
                  nameKey="status" 
                  data={data.freqByStatus} 
                  outerRadius={120} 
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {data.freqByStatus.map((entry, index) => (
                    <Cell key={entry.status} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Vacation Reasons */}
      {data.freqByReason && data.freqByReason.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vacation Reasons</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={data.freqByReason.slice(0, 10)} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="reason" type="category" width={200} />
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Monthly Trends */}
      {data.monthlyTrends && data.monthlyTrends.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={data.monthlyTrends}>
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => [value, name === 'requests' ? 'Requests' : 'Days']} />
                <Legend />
                <Bar yAxisId="left" dataKey="requests" fill="#8884d8" name="requests" />
                <Bar yAxisId="right" dataKey="days" fill="#82ca9d" name="days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
