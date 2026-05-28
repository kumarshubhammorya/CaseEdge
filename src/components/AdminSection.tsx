import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  Users, 
  Activity, 
  Settings, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  User,
  Coins,
  Search,
  Loader2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { telemetry } from '../lib/telemetry';
import { updateUserTokens, saveSystemConfig } from '../lib/firestoreService';
import { toast } from 'sonner';
import { sounds } from '../lib/sounds';

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

  // User list and directory states
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'users' | 'telemetry' | 'config'>('users');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [customTokenInputs, setCustomTokenInputs] = React.useState<{ [userId: string]: string }>({});

  // System config states
  const [configMaintenance, setConfigMaintenance] = React.useState(false);
  const [configSignupBonus, setConfigSignupBonus] = React.useState(50);
  const [configAiCost, setConfigAiCost] = React.useState(15);
  const [configHintCost, setConfigHintCost] = React.useState(2);
  const [configActiveModel, setConfigActiveModel] = React.useState('gemini-1.5-flash');
  const [configApiKeyOverride, setConfigApiKeyOverride] = React.useState('');
  const [savingConfig, setSavingConfig] = React.useState(false);

  const fetchMetrics = React.useCallback(async () => {
    setRefreshing(true);
    setLoadingUsers(true);
    try {
      const casesSnap = await getDocs(collection(db, 'cases'));
      const publicSnap = await getDocs(collection(db, 'public_cases'));
      const usersSnap = await getDocs(collection(db, 'users'));

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

      const uList: any[] = [];
      usersSnap.forEach(doc => {
        const data = doc.data();
        uniqueOwners.add(doc.id);
        uList.push({
          id: doc.id,
          username: data.username || 'Consultant',
          email: data.email || 'No email',
          collegeName: data.collegeName || '',
          tokens: data.tokens !== undefined ? data.tokens : 50,
          photoURL: data.photoURL || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setUsersList(uList);
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
      setLoadingUsers(false);
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

    // 2. Fetch Firestore counts & users
    fetchMetrics();

    // 3. Load default system configuration
    async function loadConfig() {
      try {
        const docRef = doc(db, 'system_config', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfigMaintenance(!!data.maintenanceMode);
          setConfigSignupBonus(data.signupBonusTokens ?? 50);
          setConfigAiCost(data.aiEvaluationCost ?? 15);
          setConfigHintCost(data.hintCost ?? 2);
          setConfigActiveModel(data.activeModel || 'gemini-1.5-flash');
          setConfigApiKeyOverride(data.geminiApiKeyOverride || '');
        }
      } catch (err) {
        console.error("Error loading system config inside Admin:", err);
      }
    }
    loadConfig();

    return () => unsubscribe();
  }, [fetchMetrics]);

  const handleUpdateTokens = async (userId: string, newTokens: number) => {
    try {
      sounds.playClick();
      await updateUserTokens(userId, newTokens);
      
      // Update local state list
      setUsersList(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, tokens: newTokens };
        }
        return u;
      }));

      // Log telemetry event
      telemetry.logEvent('Admin Token Adjustment', { userId, newTokens });
      toast.success(`Updated user's tokens to ${newTokens}!`);
    } catch (err: any) {
      console.error("Error adjusting tokens:", err);
      toast.error("Failed to update tokens: " + err.message);
    }
  };

  const handleCustomTokenChange = (userId: string, value: string) => {
    setCustomTokenInputs(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleCustomTokenSubmit = (userId: string, currentVal: number) => {
    const inputVal = customTokenInputs[userId];
    if (inputVal === undefined || inputVal.trim() === '') {
      toast.error("Please enter a token count");
      return;
    }
    const tokensVal = parseInt(inputVal, 10);
    if (isNaN(tokensVal) || tokensVal < 0) {
      toast.error("Invalid token count");
      return;
    }
    handleUpdateTokens(userId, tokensVal);
    // Clear input
    setCustomTokenInputs(prev => ({
      ...prev,
      [userId]: ''
    }));
  };

  const renderAvatar = (u: any) => {
    if (u.photoURL) {
      return (
        <img 
          src={u.photoURL} 
          alt={u.username} 
          className="w-8 h-8 rounded-full border border-slate-800 object-cover shrink-0" 
        />
      );
    }
    const initials = u.username 
      ? u.username.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
      : 'CE';
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center text-[10px] font-bold text-white border border-slate-800 shrink-0">
        {initials}
      </div>
    );
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    sounds.playClick();
    try {
      await saveSystemConfig({
        maintenanceMode: configMaintenance,
        signupBonusTokens: Number(configSignupBonus),
        aiEvaluationCost: Number(configAiCost),
        hintCost: Number(configHintCost),
        activeModel: configActiveModel,
        geminiApiKeyOverride: configApiKeyOverride.trim()
      });
      telemetry.logEvent('Admin Update System Config', {
        maintenanceMode: configMaintenance,
        activeModel: configActiveModel
      });
      toast.success("System configurations saved successfully!");
      sounds.playTransition();
    } catch (err: any) {
      console.error("Error saving system config:", err);
      toast.error("Failed to save config: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

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

  const filteredUsers = usersList.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.collegeName.toLowerCase().includes(query)
    );
  });

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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col min-h-0">
        {/* Tab Header Selector */}
        <div className="flex border-b border-slate-800 mb-4 pb-0.5 gap-6 shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('users');
            }}
            className={`text-xs uppercase font-bold tracking-wider py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>User & Token Directory</span>
          </button>
          
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('telemetry');
            }}
            className={`text-xs uppercase font-bold tracking-wider py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'border-purple-500 text-purple-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>System Telemetry Feed</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('config');
            }}
            className={`text-xs uppercase font-bold tracking-wider py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-emerald-500 text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Global Configurations</span>
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Filters */}
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, or university..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
              />
            </div>

            {/* Users Directory Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg bg-slate-950/40">
              {loadingUsers && usersList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-450 gap-3 py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-xs font-semibold">Retrieving user accounts...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                  <Users className="w-10 h-10 opacity-30 text-blue-400 mb-2" />
                  <span>No user accounts match your search.</span>
                </div>
              ) : (
                <table className="w-full text-left text-[11px] font-sans border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-850 bg-slate-900/40 sticky top-0 z-10">
                      <th className="py-3 px-4 font-bold uppercase tracking-wider bg-[#0f172a]">User</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider bg-[#0f172a]">College / Institution</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider text-center bg-[#0f172a]">AI Balance</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider text-right bg-[#0f172a]">Quick Token Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-350">
                    {filteredUsers.map((u) => {
                      const customInput = customTokenInputs[u.id] || '';
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            {renderAvatar(u)}
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate max-w-[150px]">{u.username}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{u.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="truncate max-w-[180px] block">
                              {u.collegeName || <span className="text-slate-600 italic">None specified</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold font-mono text-[10px]">
                              <Coins className="w-3.5 h-3.5" />
                              <span>{u.tokens}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick +50 */}
                              <button
                                onClick={() => handleUpdateTokens(u.id, u.tokens + 50)}
                                className="px-2 py-1 rounded bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/25 transition-all text-[9px] font-bold cursor-pointer"
                                title="Grant 50 tokens"
                              >
                                +50
                              </button>

                              {/* Quick -10 */}
                              <button
                                onClick={() => handleUpdateTokens(u.id, Math.max(0, u.tokens - 10))}
                                className="px-2 py-1 rounded bg-red-650/15 hover:bg-red-650 text-red-400 hover:text-white border border-red-500/25 transition-all text-[9px] font-bold cursor-pointer"
                                title="Deduct 10 tokens"
                              >
                                -10
                              </button>

                              {/* Custom Token Editor */}
                              <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                                <input
                                  type="text"
                                  value={customInput}
                                  onChange={(e) => handleCustomTokenChange(u.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCustomTokenSubmit(u.id, u.tokens);
                                    }
                                  }}
                                  placeholder="Set qty"
                                  className="w-12 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded px-1.5 py-1 text-center font-mono text-[10px] text-white focus:outline-none focus:ring-0"
                                />
                                <button
                                  onClick={() => handleCustomTokenSubmit(u.id, u.tokens)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white transition-colors cursor-pointer text-[9px] font-bold"
                                >
                                  Go
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : activeTab === 'telemetry' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Live Telemetry & Activity Feed */}
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
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-1">
            {/* Global Configurations Form */}
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Maintenance Mode Toggle */}
                <div className="md:col-span-2 bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Maintenance Mode</h4>
                    <p className="text-[11px] text-slate-505 font-sans mt-0.5">Toggle site offline blocking. Admins will bypass the lock screen to manage the dashboard.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={configMaintenance} 
                      onChange={(e) => {
                        sounds.playClick();
                        setConfigMaintenance(e.target.checked);
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-350 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white border border-slate-700"></div>
                  </label>
                </div>

                {/* Token Pricing Settings */}
                <div className="md:col-span-2 border-b border-slate-850 pb-2 mt-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Token Trial & Cost Controls</h4>
                </div>

                {/* Signup Bonus Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Signup Bonus Tokens
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="number"
                      value={configSignupBonus}
                      onChange={(e) => setConfigSignupBonus(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      required
                      min={0}
                    />
                  </div>
                </div>

                {/* AI Evaluation Cost Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Socratic Evaluation Cost (Tokens)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="number"
                      value={configAiCost}
                      onChange={(e) => setConfigAiCost(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      required
                      min={0}
                    />
                  </div>
                </div>

                {/* Socratic Hint Cost Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Socratic Hint Cost (Tokens)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="number"
                      value={configHintCost}
                      onChange={(e) => setConfigHintCost(Number(e.target.value))}
                      className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      required
                      min={0}
                    />
                  </div>
                </div>

                {/* Model and Key Settings */}
                <div className="md:col-span-2 border-b border-slate-850 pb-2 mt-4">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">AI Model & Key Settings</h4>
                </div>

                {/* Model Selection Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active AI Model
                  </label>
                  <select
                    value={configActiveModel}
                    onChange={(e) => setConfigActiveModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Experimental)</option>
                  </select>
                </div>

                {/* API Key Override Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gemini API Key Override
                  </label>
                  <div className="relative">
                    <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="password"
                      value={configApiKeyOverride}
                      onChange={(e) => setConfigApiKeyOverride(e.target.value)}
                      placeholder="AIzaSy... (Leave empty to use server default key)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/50">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                >
                  {savingConfig ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>{savingConfig ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
