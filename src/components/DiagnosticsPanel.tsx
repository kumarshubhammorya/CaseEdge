import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Terminal, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Gauge, 
  Bug, 
  Trash2,
  RefreshCw,
  Play
} from 'lucide-react';
import { telemetry, LatencyLog, ErrorLog } from '../lib/telemetry';

export function DiagnosticsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'latency' | 'errors'>('dashboard');
  const [latencies, setLatencies] = useState<LatencyLog[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [sentryActive, setSentryActive] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    // Update local state initially
    setLatencies(telemetry.getLatencies());
    setErrors(telemetry.getErrors());
    setSentryActive(telemetry.isSentryActive());

    // Subscribe to telemetry service changes
    const unsubscribe = telemetry.subscribe(() => {
      setLatencies([...telemetry.getLatencies()]);
      setErrors([...telemetry.getErrors()]);
    });

    return () => unsubscribe();
  }, []);

  const triggerSimulatedError = () => {
    try {
      throw new Error(`Simulated Diagnostic Error at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      telemetry.recordError(err, { testing: true, userTriggered: true });
    }
  };

  const triggerSimulatedLatency = async () => {
    setSimulating(true);
    const mockActions = ['analyzeCase', 'buildIssueTree', 'recommendFrameworks', 'simulateQA'];
    const selectedAction = mockActions[Math.floor(Math.random() * mockActions.length)];
    const simulatedDuration = Math.floor(Math.random() * 4000) + 200; // 200ms to 4.2s
    
    setTimeout(() => {
      telemetry.recordLatency(selectedAction + ' (Simulated)', simulatedDuration, true);
      setSimulating(false);
    }, 300);
  };

  // Stats calculation
  const totalRequests = latencies.length;
  const avgLatency = totalRequests > 0 
    ? Math.round(latencies.reduce((acc, curr) => acc + curr.durationMs, 0) / totalRequests)
    : 0;
  const errorCount = errors.length;

  const appEnv = import.meta.env.MODE || 'development';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/80 hover:border-cyan-500/50 rounded-full shadow-lg transition-all duration-300 group cursor-pointer"
        title="Open Diagnostics Console"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <Activity className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">Telemetry</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-300 font-sans text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">Diagnostics Console</h2>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 bg-slate-950/50 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${
            activeTab === 'dashboard'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('latency')}
          className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'latency'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          Latency
          {totalRequests > 0 && (
            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px]">
              {totalRequests}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'errors'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          Errors
          {errorCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-900/50 rounded text-[10px] animate-pulse">
              {errorCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* System Status Indicators */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Environment Status</h3>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Environment Mode</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950 text-blue-400 border border-blue-900/50">
                  {appEnv}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Sentry Logger</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${sentryActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-300">
                    {sentryActive ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-center">
                <div className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Avg Latency</div>
                <div className="text-2xl font-bold mt-1 text-cyan-400 font-mono">
                  {avgLatency}<span className="text-[10px] text-slate-500 ml-0.5">ms</span>
                </div>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-center">
                <div className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Error Count</div>
                <div className={`text-2xl font-bold mt-1 font-mono ${errorCount > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                  {errorCount}
                </div>
              </div>
            </div>

            {/* Diagnostic Actions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Diagnostic Utilities</h3>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={triggerSimulatedLatency}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-xs transition-colors cursor-pointer"
                >
                  {simulating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  Simulate API Latency Trace
                </button>
                
                <button
                  onClick={triggerSimulatedError}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-red-950/40 hover:bg-red-950/60 text-red-300 hover:text-red-200 rounded border border-red-900/50 text-xs transition-colors cursor-pointer"
                >
                  <Bug className="w-3.5 h-3.5 text-red-400" />
                  Simulate Runtime Crash
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'latency' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-500">
              <span>ACTION</span>
              <span>LATENCY</span>
            </div>
            
            {latencies.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs italic bg-slate-900/20 border border-dashed border-slate-800/80 rounded-lg">
                No API transactions captured yet
              </div>
            ) : (
              latencies.map((log) => {
                let badgeClass = 'bg-green-950 text-green-400 border border-green-900/50';
                if (log.durationMs > 5000) {
                  badgeClass = 'bg-red-950 text-red-400 border border-red-900/50';
                } else if (log.durationMs > 1500) {
                  badgeClass = 'bg-amber-950 text-amber-400 border border-amber-900/50';
                }
                
                return (
                  <div 
                    key={log.id} 
                    className="flex justify-between items-center p-2.5 bg-slate-900/40 border border-slate-800/50 rounded-lg text-xs hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono font-semibold text-slate-300 truncate">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {log.success ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${badgeClass}`}>
                        {log.durationMs}ms
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-2.5">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs italic bg-slate-900/20 border border-dashed border-slate-800/80 rounded-lg">
                No error events logged
              </div>
            ) : (
              errors.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs flex flex-col gap-2 relative overflow-hidden group hover:border-red-900/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono font-bold text-red-400 truncate pr-4">
                      {log.message}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                  
                  {log.stack && (
                    <div className="bg-slate-950/70 border border-slate-900 rounded p-1.5 text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre select-all max-h-24 custom-scrollbar">
                      {log.stack}
                    </div>
                  )}

                  {log.context && (
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-950/40 p-1.5 rounded">
                      <span className="text-slate-500 font-bold uppercase block text-[10px] mb-0.5">Context:</span>
                      <pre className="overflow-x-auto whitespace-pre">{JSON.stringify(log.context, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-900 bg-slate-950/70 text-center font-mono text-[10px] text-slate-500 shrink-0 select-none">
        Telemetry Hub v1.0.0
      </div>
    </div>
  );
}
