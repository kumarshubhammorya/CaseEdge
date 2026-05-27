import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Search, 
  Trash2, 
  Download, 
  RefreshCw, 
  SlidersHorizontal, 
  User, 
  Calendar, 
  BookOpen, 
  ArrowRight,
  PlusCircle,
  LogIn
} from 'lucide-react';
import { sounds } from '../lib/sounds';
import { useAuth } from '../lib/AuthContext';
import { useAppContext } from '../context/AppContext';
import { savePublicCase, getPublicCases, deletePublicCase } from '../lib/firestoreService';

type PublicCase = {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  industry: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  extractedText: string;
  createdAt?: any;
};

type LibrarySectionProps = {
  onImport: () => void;
};

export const LibrarySection: React.FC<LibrarySectionProps> = ({ onImport }) => {
  const { appState, setAppState } = useAppContext();
  const { user, signIn } = useAuth();
  
  const [publicCases, setPublicCases] = useState<PublicCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  
  // Publishing form states
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [description, setDescription] = useState('');
  const [showPublishForm, setShowPublishForm] = useState(false);

  const fetchPublicCases = async () => {
    setLoading(true);
    try {
      const data = await getPublicCases();
      setPublicCases(data as PublicCase[]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load library cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicCases();
  }, []);

  const handleImport = (pc: PublicCase) => {
    sounds.playTransition();
    
    // Load the public case and reset all other downstream states to ensure clean slate
    setAppState(prev => ({
      ...prev,
      caseBrief: pc.extractedText,
      caseGlance: null,
      hypothesis: "",
      issueTree: null,
      frameworks: null,
      coreRecommendation: "",
      expandedRecommendation: null,
      slideOutline: null,
      storyHook: null,
      quantificationPrompt: "",
      quantitativeEstimate: null,
      calibratedRecommendation: null,
      qas: null,
      activeFrameworks: [],
      assumptions: null,
      playgroundTree: null,
      meceFeedback: null,
      userClues: [],
      intakeFeedback: null,
      socraticFeedback: null,
      focusedNodeId: null,
      isSessionCompleted: false
    }));

    toast.success(`"${pc.title}" imported successfully! Directing to Case Intake...`);
    onImport();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      sounds.playError();
      toast.error("Please sign in with Google to publish cases.");
      return;
    }

    if (!title.trim() || !description.trim() || !industry.trim()) {
      sounds.playError();
      toast.error("All fields are required to publish a case.");
      return;
    }

    if (!appState.caseBrief.trim()) {
      sounds.playError();
      toast.error("No active case brief found to publish.");
      return;
    }

    setPublishing(true);
    try {
      sounds.playClick();
      await savePublicCase(
        title.trim(),
        description.trim(),
        industry.trim(),
        difficulty,
        appState.caseBrief
      );
      
      toast.success("Case successfully published to public library!");
      
      // Reset form fields
      setTitle('');
      setIndustry('');
      setDescription('');
      setShowPublishForm(false);
      
      // Refresh list
      await fetchPublicCases();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to publish case: " + (err.message || "Unknown error"));
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this case from the public library?")) return;
    
    sounds.playClick();
    try {
      await deletePublicCase(id);
      toast.success("Case deleted from public library");
      fetchPublicCases();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete case");
    }
  };

  // Filter public cases
  const filteredCases = publicCases.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.industry.toLowerCase().includes(query) ||
      (c.ownerName && c.ownerName.toLowerCase().includes(query));
      
    const matchesDifficulty = 
      selectedDifficulty === 'All' || 
      c.difficulty === selectedDifficulty;
      
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Hard': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Public Case Library
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {appState.caseBrief && (
            <button
              id="library-publish-toggle-btn"
              onClick={() => {
                sounds.playClick();
                setShowPublishForm(prev => !prev);
              }}
              className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-900/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {showPublishForm ? "Show Library" : "Publish Active Case"}
            </button>
          )}
          <button 
            onClick={fetchPublicCases}
            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-white rounded border border-slate-700/50 transition cursor-pointer"
            title="Refresh library"
            id="library-refresh-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        
        {/* Publish Active Case Form */}
        <AnimatePresence>
          {showPublishForm && appState.caseBrief && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shrink-0 space-y-4"
            >
              <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Publish Your Active Case to the Public Library
                </h3>
                <span className="text-[10px] bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                  Active
                </span>
              </div>

              {!user || user.isAnonymous ? (
                <div className="py-6 text-center space-y-4 max-w-md mx-auto">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    You must sign in with Google to publish cases to the library. This helps us ensure case quality and prevent spam.
                  </p>
                  <button
                    onClick={signIn}
                    id="library-sign-in-btn"
                    className="mx-auto bg-blue-600 hover:bg-blue-500 text-xs uppercase font-bold text-white px-5 py-2.5 rounded transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In with Google
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                        Case Title
                      </label>
                      <input 
                        type="text" 
                        id="pub-case-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Tesla India Entry Strategy"
                        maxLength={200}
                        required
                        className="w-full text-xs bg-slate-950/50 border border-slate-850 focus:border-blue-500/70 rounded p-2.5 text-white outline-none transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                          Industry
                        </label>
                        <input 
                          type="text" 
                          id="pub-case-industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g. Automotive, Retail"
                          maxLength={100}
                          required
                          className="w-full text-xs bg-slate-950/50 border border-slate-850 focus:border-blue-500/70 rounded p-2.5 text-white outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                          Difficulty
                        </label>
                        <select 
                          id="pub-case-difficulty"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-blue-500/70 rounded p-2.5 text-slate-300 outline-none transition-colors cursor-pointer"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <div className="flex-1 flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                        Short Summary / Prompt Description
                      </label>
                      <textarea 
                        id="pub-case-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Briefly describe what this case is about, core business questions, etc. (max 1000 chars)"
                        maxLength={1000}
                        required
                        className="w-full flex-1 min-h-[80px] text-xs bg-slate-950/50 border border-slate-850 focus:border-blue-500/70 rounded p-2.5 text-white outline-none transition-colors resize-none font-sans"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPublishForm(false)}
                        className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="pub-case-submit-btn"
                        disabled={publishing}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {publishing ? 'Publishing...' : 'Confirm & Publish'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Panel */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/10 border border-slate-850 rounded-xl p-4 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              id="library-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, industry, description..."
              className="w-full text-xs bg-slate-950/60 border border-slate-850 focus:border-slate-750 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto shrink-0 pb-1 sm:pb-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 mr-1" />
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                id={`library-filter-btn-${diff.toLowerCase()}`}
                onClick={() => {
                  sounds.playClick();
                  setSelectedDifficulty(diff);
                }}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                  selectedDifficulty === diff 
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' 
                    : 'bg-slate-950/20 text-slate-400 border-slate-850 hover:border-slate-750 hover:text-slate-300'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Public Library Grid */}
        <div className="flex-1 min-h-[250px] relative flex flex-col">
          {loading && publicCases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
              <span>Loading public cases...</span>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 border border-dashed border-slate-850 rounded-xl p-8 bg-slate-950/10">
              <BookOpen className="w-10 h-10 opacity-40 text-slate-550" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">
                {publicCases.length === 0 ? "Library is empty" : "No cases match your filters"}
              </p>
              <p className="text-[10px] text-slate-600 text-center max-w-xs leading-relaxed font-sans">
                {publicCases.length === 0 
                  ? "Load a case brief in Intake and click \"Publish Active Case\" to share the first case!" 
                  : "Try typing a different keyword or toggling the difficulty filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {filteredCases.map((c) => {
                const isOwner = user && c.ownerId === user.uid;
                
                return (
                  <motion.div 
                    key={c.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/25 border border-slate-850 hover:border-slate-750/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-950/25 transition-all group duration-300 relative overflow-hidden"
                  >
                    <div>
                      {/* Top metadata */}
                      <div className="flex justify-between items-start gap-4 mb-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border tracking-wider shrink-0 ${getDifficultyColor(c.difficulty)}`}>
                          {c.difficulty}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px]">
                          {c.industry}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-white text-sm font-bold leading-snug group-hover:text-cyan-400 transition-colors">
                        {c.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-450 mt-2.5 leading-relaxed font-sans line-clamp-3">
                        {c.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & CTA */}
                    <div className="mt-6 pt-3.5 border-t border-slate-850 flex items-center justify-between gap-4 shrink-0">
                      <div className="flex flex-col gap-0.5 text-[9px] text-slate-550 font-mono">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-650" />
                          <span className="truncate max-w-[100px]">{c.ownerName}</span>
                        </span>
                        {c.createdAt && (
                          <span className="flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-650" />
                            <span>
                              {new Date(c.createdAt.toDate ? c.createdAt.toDate() : Date.now()).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOwner && (
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            id={`public-case-delete-${c.id}`}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-slate-800 hover:border-red-500/20 transition-all cursor-pointer"
                            title="Delete case from library"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleImport(c)}
                          id={`public-case-import-${c.id}`}
                          className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-750 group-hover:bg-blue-600 group-hover:border-blue-500 text-[10px] font-extrabold uppercase tracking-widest text-slate-300 group-hover:text-white rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          Solve Case
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
