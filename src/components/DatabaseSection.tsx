import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppState } from '../types';
import { saveCase, getCases, deleteCase } from '../lib/firestoreService';
import { Database, Plus, RefreshCw, Trash2, Download, LogIn, LogOut } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { useAuth } from '../lib/AuthContext';

import { useAppContext } from '../context/AppContext';

type DatabaseSectionProps = {};

export const DatabaseSection: React.FC<DatabaseSectionProps> = () => {
  const { appState, setAppState } = useAppContext();
  const { user, signIn, logout, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLinkGoogle = async () => {
    try {
      sounds.playClick();
      await signIn();
      toast.success("Google account linked successfully!");
    } catch (err: any) {
      console.error("Linking failed:", err);
      toast.error("Linking failed: " + (err?.message || "Unknown error"));
    }
  };

  const handleSignIn = async () => {
    try {
      sounds.playClick();
      await signIn();
      toast.success("Signed in successfully!");
    } catch (err: any) {
      console.error("Sign in failed:", err);
      toast.error("Sign in failed: " + (err?.message || "Unknown error"));
    }
  };

  const fetchCases = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCases();
      setCases(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCases();
  }, [user]);

  const handleSaveCurrent = async () => {
    if (!appState.caseBrief) return toast.error("No case brief to save!");
    const name = appState.caseGlance?.industry 
      ? `${appState.caseGlance.industry} Case` 
      : 'Untitled Case';
    setSaving(true);
    try {
      sounds.playClick();
      await saveCase(name, appState.caseBrief);
      await fetchCases();
      toast.success("Case saved to cloud!");
    } catch (err) {
      toast.error("Failed to save case to cloud");
      console.error(err);
    }
    setSaving(false);
  };

  const handleLoad = (extractedText: string) => {
    sounds.playClick();
    setAppState(prev => ({ ...prev, caseBrief: extractedText }));
    toast.info("Case loaded! Go to Case Intake to analyze it.");
  };

  const handleDelete = async (id: string) => {
    sounds.playClick();
    try {
      await deleteCase(id);
      await fetchCases();
      toast.success("Case deleted from cloud");
    } catch (err) {
      toast.error("Failed to delete case");
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-sans">Connecting to database...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
        <Database className="w-16 h-16 text-cyan-500/50 mb-6" />
        <h2 className="text-2xl font-bold font-heading mb-4 text-white">Save to Cloud</h2>
        <p className="text-slate-400 text-sm mb-8 text-center max-w-md font-sans leading-relaxed">
          Sign up or log in to securely save your case files to the cloud, allowing you to access them from anywhere and export them easily.
        </p>
        <button
          onClick={handleSignIn}
          className="bg-blue-600 hover:bg-blue-500 text-xs uppercase font-bold text-white px-6 py-3 rounded transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Cloud Files Database
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {user.isAnonymous ? (
            <div className="text-[10px] text-slate-400 text-right">
              <span className="block text-amber-400 font-bold uppercase tracking-wider">Guest Session</span>
              Not synced
            </div>
          ) : (
            <>
              <div className="text-[10px] text-slate-400 text-right">
                <span className="block text-slate-300 font-bold">{user.displayName || user.email}</span>
                Signed in
              </div>
              <button 
                onClick={logout}
                className="p-1 hover:bg-slate-850 text-slate-400 hover:text-white rounded border border-slate-700/50 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        {user.isAnonymous && (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <span className="font-semibold block sm:inline mr-1 text-amber-300 text-xs">⚡ Temporary Session Active:</span>
              <span className="text-slate-350 text-xs font-sans">Your saved cases are stored in a temporary browser session. Link your Google account to secure them permanently.</span>
            </div>
            <button
              onClick={handleLinkGoogle}
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded transition text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-950/20 animate-pulse cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Link Google
            </button>
          </div>
        )}

        <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-lg flex items-start gap-3 shrink-0">
          <div className="text-cyan-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Cloud Database Management</h4>
            <p className="text-xs text-slate-450 mt-0.5 leading-normal font-sans">
              Save your cases to the database to access them later and sync across devices.
            </p>
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <button
            onClick={handleSaveCurrent}
            disabled={saving || !appState.caseBrief}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-xs uppercase font-bold text-white px-4 py-2 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Current Case'}
          </button>
          <button
            onClick={fetchCases}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs uppercase font-bold text-slate-300 px-4 py-2 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden flex flex-col p-4 min-h-[150px]">
          {loading && cases.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Loading cases...</div>
          ) : cases.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
               <Database className="w-8 h-8 opacity-50" />
               <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No cases saved in cloud</p>
             </div>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-1">
              {cases.map((c) => (
                <div key={c.id} className="bg-slate-800/30 border border-slate-800 rounded-lg p-4 flex items-center justify-between hover:border-slate-700/80 transition-colors">
                  <div>
                    <h3 className="text-white text-sm font-semibold">{c.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(c.createdAt?.toDate ? c.createdAt.toDate() : Date.now()).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoad(c.extractedText)}
                      className="text-slate-400 hover:text-blue-400 p-2 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Load into app"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-slate-400 hover:text-red-400 p-2 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
