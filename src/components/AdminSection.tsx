import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Users, Activity, Settings, Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { telemetry } from '../lib/telemetry';

export function AdminSection() {
  const { user } = useAuth();
  
  const [metrics, setMetrics] = React.useState({
    totalPrivateCases: 0,
    totalPublicCases: 0,
    uniqueActiveUsers: 0,
    loading: true
  });

  const [telemetryLogs, setTelemetryLogs] = React.useState<{
    latencies: any[];
    errors: any[];
  }>({ latencies: [], errors: [] });

  const [refreshing, setRefreshing] = React.useState(false);

  const fetchMetrics = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const casesSnap = await getDocs(collection(db, 'cases'));
      const publicSnap = await getDocs(collection(db, 'public_cases'));

      const privateCount = casesSnap.size;
      const publicCount = publicSnap.size;

      const uniqueOwners = new Set<string>();
      casesSnap.forEach(doc => {
        const data = doc.data();
        if (data.ownerId) uniqueOwners.add(data.ownerId);
      });
      publicSnap.forEach(doc => {
        const data = doc.data();
        if (data.ownerId) uniqueOwners.add(data.ownerId);
      });

      setMetrics({
        totalPrivateCases: privateCount,
        totalPublicCases: publicCount,
        uniqueActiveUsers: uniqueOwners.size,
        loading: false
      });
    } catch (err) {
      console.error("Error fetching admin metrics", err);
      setMetrics(prev => ({ ...prev, loading: false }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    // 1. Fetch initial telemetry logs
    setTelemetryLogs({
      latencies: telemetry.getLatencies(),
      errors: telemetry.getErrors()
    });

    // Subscribe to telemetry updates
    const unsubscribe = telemetry.subscribe(() => {
      setTelemetryLogs({
        latencies: telemetry.getLatencies(),
        errors: telemetry.getErrors()
      });
    });

    // 2. Fetch Firestore counts
    fetchMetrics();

    return () => unsubscribe();
  }, [fetchMetrics]);

  const userEmail = user?.email?.toLowerCase().trim();
  const isAdmin = userEmail === 'kumarshubhammorya@gmail.com';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const allLogs = [
    ...telemetryLogs.errors.map(err => ({ type: 'error' as const, ...err })),
    ...telemetryLogs.latencies.map(lat => ({ type: 'latency' as const, ...lat }))
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-white tracking-tight">Admin Dashboard</h2>
            <p className="text-slate-400 text-sm">Welcome back, Shubham. Real-time system monitoring active.</p>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Unique Users (Firestore)</p>
            <p className="text-2xl font-bold text-white">
              {metrics.loading ? 'Loading...' : metrics.uniqueActiveUsers}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Cases Created</p>
            <p className="text-2xl font-bold text-white">
              {metrics.loading ? 'Loading...' : (metrics.totalPrivateCases + metrics.totalPublicCases)}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Session API Calls</p>
            <p className="text-2xl font-bold text-white">
              {telemetryLogs.latencies.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-1 flex flex-col min-h-0">
        <h3 className="font-bold text-lg mb-4 text-white">Live Telemetry & Activity Feed</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg bg-slate-950/40 p-4">
          {allLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No telemetry events recorded in this session yet.
            </div>
          ) : (
            <div className="space-y-3">
              {allLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-all ${
                    log.type === 'error'
                      ? 'bg-red-950/20 border-red-900/30 text-red-300'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-350'
                  }`}
                >
                  {log.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${log.success ? 'text-green-500' : 'text-amber-500'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`font-bold truncate ${log.type === 'error' ? 'text-red-400' : 'text-slate-200'}`}>
                        {log.type === 'error' ? 'Application Error' : log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-xs break-all leading-normal">
                      {log.type === 'error' ? log.message : `API Call completed in ${log.durationMs}ms (Success: ${log.success ? 'True' : 'False'})`}
                    </p>
                    {log.context && (
                      <pre className="mt-1.5 p-2 rounded bg-slate-950/80 border border-slate-850 font-mono text-[10px] text-slate-400 overflow-x-auto max-w-full">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
