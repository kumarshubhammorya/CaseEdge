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
  const { user, signIn, logout } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
        <Database className="w-16 h-16 text-cyan-500/50 mb-6" />
        <h2 className="text-2xl font-bold font-serif mb-4 text-white">Save to Cloud</h2>
        <p className="text-slate-400 text-sm mb-8 text-center max-w-md">
          Sign up or log in to securely save your case files to the cloud, allowing you to access them from anywhere and export them easily.
        </p>
        <button
          onClick={signIn}
          className="bg-blue-600 hover:bg-blue-500 text-sm uppercase font-bold text-white px-6 py-3 rounded transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
        >
          <LogIn className="w-5 h-5" />
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-serif mb-2 text-white">Cloud Files</h2>
          <p className="text-slate-400 text-sm">Save your cases to the database to access them later.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 text-right">
            <span className="block text-slate-300 font-medium">{user.displayName || user.email}</span>
            Signed in
          </div>
          <button 
            onClick={logout}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSaveCurrent}
          disabled={saving || !appState.caseBrief}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-sm uppercase font-bold text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Current Case'}
        </button>
        <button
          onClick={fetchCases}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm uppercase font-bold text-slate-300 px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col p-4">
        {loading && cases.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">Loading cases...</div>
        ) : cases.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
             <Database className="w-8 h-8 opacity-50" />
             <p className="text-sm font-medium uppercase tracking-wider">No cases saved in cloud</p>
           </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(c.createdAt?.toDate ? c.createdAt.toDate() : Date.now()).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(c.extractedText)}
                    className="text-slate-400 hover:text-blue-400 p-2 rounded hover:bg-slate-800 transition-colors"
                    title="Load into app"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-slate-400 hover:text-red-400 p-2 rounded hover:bg-slate-800 transition-colors"
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
  );
};
