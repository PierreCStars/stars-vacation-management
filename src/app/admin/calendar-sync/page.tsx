"use client";
import { useEffect, useState } from "react";

type SyncLog = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "ok" | "error";
  summary?: string;
  itemsInserted?: number;
  itemsUpdated?: number;
  itemsDeleted?: number;
  error?: string | null;
};

type SyncState = {
  id: string;
  syncToken?: string | null;
  lastSyncAt?: string | null;
  lastResult?: "ok" | "partial" | "error";
  lastError?: string | null;
  totalImported?: number;
};

export default function CalendarSyncAdmin() {
  const [state, setState] = useState<SyncState | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string>("");

  async function fetchData() {
    try {
      const s = await fetch("/api/admin/calendar-sync/state").then(r => r.json()).catch(() => null);
      const l = await fetch("/api/admin/calendar-sync/logs").then(r => r.json()).catch(() => []);
      setState(s);
      setLogs(l);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function runSync() {
    setLoading(true);
    setNote("Starting sync...");
    
    try {
      const res = await fetch("/api/sync/import-remote").then(r => r.json()).catch(e => ({status:"error", note: String(e)}));
      setNote(`Sync status: ${res.status}. ${res.note || ""} (+${res.inserted||0}/${res.updated||0}/${res.deleted||0})`);
    } catch (error) {
      setNote(`Sync failed: ${error}`);
    } finally {
      setLoading(false);
      await fetchData(); // Refresh data after sync
    }
  }

  useEffect(() => { 
    fetchData(); 
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'partial': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Calendar B Sync Administration</h1>
        <p className="text-gray-600 mt-2">Manage synchronization between Calendar B and the app's internal calendar</p>
      </div>

      {/* Sync Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Sync Status</h2>
          <button 
            disabled={loading} 
            onClick={runSync} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Running..." : "Run Sync Now"}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Last Sync</div>
            <div className="font-medium">
              {state?.lastSyncAt ? formatDate(state.lastSyncAt) : "—"}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Last Result</div>
            <div className={`font-medium ${getStatusColor(state?.lastResult || '')}`}>
              {state?.lastResult ? state.lastResult.toUpperCase() : "—"}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Total Imported</div>
            <div className="font-medium text-2xl text-blue-600">
              {state?.totalImported ?? 0}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Sync Token</div>
            <div className="font-mono text-xs text-gray-500 truncate">
              {state?.syncToken ? `${state.syncToken.substring(0, 20)}...` : "Not set"}
            </div>
          </div>
        </div>

        {state?.lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-800">
              <strong>Last Error:</strong> {state.lastError}
            </div>
          </div>
        )}

        {note && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">{note}</div>
          </div>
        )}
      </div>

      {/* Sync Logs Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sync Logs</h2>
        
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map(log => (
              <div key={log.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'ok' ? 'bg-green-100 text-green-800' :
                      log.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(log.startedAt)}
                    </span>
                  </div>
                  {log.finishedAt && (
                    <span className="text-xs text-gray-500">
                      Duration: {Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  {log.summary || log.error || "—"}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Inserted: {log.itemsInserted || 0}</span>
                  <span>Updated: {log.itemsUpdated || 0}</span>
                  <span>Deleted: {log.itemsDeleted || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">No sync logs yet</div>
              <div className="text-sm">Run your first sync to see logs here</div>
            </div>
          )}
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How it works</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Incremental Sync:</strong> Uses Google Calendar's syncToken for efficient updates</p>
          <p>• <strong>Conflict Resolution:</strong> App-internal vacations take precedence over external events</p>
          <p>• <strong>Automatic Recovery:</strong> Handles expired sync tokens by performing full resync</p>
          <p>• <strong>Timezone:</strong> All events use Europe/Monaco timezone</p>
        </div>
      </div>
    </div>
  );
}
