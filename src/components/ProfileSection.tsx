import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useAppContext } from '../context/AppContext';
import { 
  getUserProfile, 
  saveUserProfile,
  getCaseAnalytics
} from '../lib/firestoreService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  User, 
  LogIn, 
  LogOut, 
  Coins, 
  Save, 
  GraduationCap, 
  Calendar, 
  FileText, 
  Sparkles,
  Loader2,
  Camera,
  Upload,
  X,
  BarChart2,
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { sounds } from '../lib/sounds';

const PREDEFINED_GRADIENTS = [
  { start: '#3b82f6', end: '#1d4ed8', label: 'Tech Blue' },
  { start: '#a855f7', end: '#6b21a8', label: 'Royal Purple' },
  { start: '#14b8a6', end: '#0f766e', label: 'Ocean Teal' },
  { start: '#f43f5e', end: '#be123c', label: 'Sunset Rose' },
  { start: '#f59e0b', end: '#b45309', label: 'Warm Amber' },
  { start: '#6366f1', end: '#3730a3', label: 'Deep Indigo' }
];

const DEMO_DATA = [
  { caseTitle: "Eco Fit Logistics", caseType: "Growth Strategy", intakeScore: 85, structuringScore: 90, frameworkScore: 78, totalTimeSeconds: 22 * 60, createdAt: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
  { caseTitle: "Hospital IQ Staffing", caseType: "Operations", intakeScore: 92, structuringScore: 85, frameworkScore: 88, totalTimeSeconds: 28 * 60, createdAt: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
  { caseTitle: "Solar Tech Market Entry", caseType: "Market Entry", intakeScore: 78, structuringScore: 82, frameworkScore: 90, totalTimeSeconds: 19 * 60, createdAt: { toDate: () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } },
  { caseTitle: "Aero Parts Pricing", caseType: "Pricing Strategy", intakeScore: 88, structuringScore: 95, frameworkScore: 85, totalTimeSeconds: 25 * 60, createdAt: { toDate: () => new Date(Date.now() - 12 * 60 * 60 * 1000) } },
  { caseTitle: "Digital BI Acquisition", caseType: "M&A", intakeScore: 90, structuringScore: 88, frameworkScore: 92, totalTimeSeconds: 20 * 60, createdAt: { toDate: () => new Date(Date.now() - 2 * 60 * 60 * 1000) } }
];

export const ProfileSection: React.FC = () => {
  const { user, signIn, logout } = useAuth();
  const { appState } = useAppContext();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'details' | 'analytics'>('details');

  // Form states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract initials
  const getInitials = (name: string) => {
    if (!name) return 'CE';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Generate initials SVG data URL
  const generateInitialsSvg = (initials: string, start: string, end: string) => {
    const cleanStart = start.replace('#', '');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g_${cleanStart}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${start}"/>
            <stop offset="100%" stop-color="${end}"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#g_${cleanStart})"/>
        <text x="50" y="54" font-family="sans-serif" font-size="38" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Fetch profile details
  useEffect(() => {
    async function loadProfile() {
      if (!user || user.isAnonymous) {
        setUsername('');
        setBio('');
        setDob('');
        setCollegeName('');
        setPhotoURL('');
        return;
      }

      setLoadingProfile(true);
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUsername(profile.username || user.displayName || '');
          setBio(profile.bio || '');
          setDob(profile.dob || '');
          setCollegeName(profile.collegeName || '');
          setPhotoURL(profile.photoURL || user.photoURL || '');
        } else {
          setUsername(user.displayName || '');
          setPhotoURL(user.photoURL || '');
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
        toast.error("Failed to load profile data");
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user]);

  // Fetch analytics details on tab change
  useEffect(() => {
    async function loadAnalytics() {
      if (!user || user.isAnonymous || activeTab !== 'analytics') return;

      setLoadingAnalytics(true);
      try {
        const data = await getCaseAnalytics();
        setAnalyticsData(data);
        if (data.length > 0) {
          setUseDemoData(false);
        }
      } catch (err) {
        console.error("Error loading case analytics:", err);
        toast.error("Failed to fetch practice analytics");
      } finally {
        setLoadingAnalytics(false);
      }
    }

    loadAnalytics();
  }, [activeTab, user]);

  const handleSignIn = async () => {
    try {
      sounds.playClick();
      await signIn();
      toast.success("Successfully logged in with Google!");
    } catch (err: any) {
      toast.error('Failed to sign in: ' + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      sounds.playClick();
      await logout();
      toast.success("Signed out successfully.");
    } catch (err: any) {
      toast.error('Failed to sign out: ' + err.message);
    }
  };

  const handleUploadClick = () => {
    sounds.playClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sourceSize = Math.min(img.width, img.height);
          const xOffset = (img.width - sourceSize) / 2;
          const yOffset = (img.height - sourceSize) / 2;
          
          ctx.drawImage(
            img,
            xOffset,
            yOffset,
            sourceSize,
            sourceSize,
            0,
            0,
            size,
            size
          );
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoURL(compressedBase64);
          setShowAvatarModal(false);
          toast.success('Custom profile photo loaded successfully!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      toast.error("You must sign in to save your profile!");
      return;
    }

    if (!username.trim()) {
      toast.error("User Name is required!");
      return;
    }

    setSaving(true);
    sounds.playClick();

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username.trim(),
          photoURL: photoURL
        });
      }

      await saveUserProfile(user.uid, {
        username: username.trim(),
        bio: bio.trim(),
        dob: dob,
        collegeName: collegeName.trim(),
        photoURL: photoURL
      });

      toast.success("Profile saved successfully!");
      sounds.playTransition();
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compile active datasets
  const activeDataset = useDemoData ? DEMO_DATA : analyticsData;

  // Calculate Metrics
  const totalCases = activeDataset.length;
  const avgIntake = totalCases > 0 ? Math.round(activeDataset.reduce((sum, item) => sum + (item.intakeScore || 0), 0) / totalCases) : 0;
  const avgStructuring = totalCases > 0 ? Math.round(activeDataset.reduce((sum, item) => sum + (item.structuringScore || 0), 0) / totalCases) : 0;
  const avgFramework = totalCases > 0 ? Math.round(activeDataset.reduce((sum, item) => sum + (item.frameworkScore || 0), 0) / totalCases) : 0;
  const totalTimeSeconds = activeDataset.reduce((sum, item) => sum + (item.totalTimeSeconds || 0), 0);
  const avgTimeMinutes = totalCases > 0 ? Math.round((totalTimeSeconds / 60) / totalCases) : 0;

  // Radar chart dimensions
  const skillValues = [
    { label: 'Clue Extraction', value: avgIntake || 10 },
    { label: 'Structuring', value: avgStructuring || 10 },
    { label: 'Logic Reasoning', value: avgFramework || 10 },
    { label: 'Quantitative Skills', value: totalCases > 0 ? 85 : 10 }, // Demo baseline or general capability
    { label: 'Synthesis', value: totalCases > 0 ? 80 : 10 }          // Demo baseline or general capability
  ];

  // SVG Radar generator helper
  const generateRadarPoints = (skills: { label: string; value: number }[], cx: number, cy: number, maxRadius: number) => {
    return skills.map((skill, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const r = (skill.value / 100) * maxRadius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    });
  };

  const radarCx = 120;
  const radarCy = 115;
  const radarRadius = 75;
  const radarPoints = generateRadarPoints(skillValues, radarCx, radarCy, radarRadius);
  const radarPointsString = radarPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Outer ring lines
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const currentInitials = getInitials(username || user?.displayName || user?.email || 'CE');

  if (!user || user.isAnonymous) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-400 border border-blue-500/20">
            <User className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3 font-heading">Manage Your Account</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Create an account or sign in to build your personalized profile, save case summaries, track practice analytics, and unlock premium features.
          </p>

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In with Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 flex flex-col gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full space-y-6 flex-1"
      >
        {/* Header Hero */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Avatar display trigger */}
          <div className="relative shrink-0 group">
            <button 
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowAvatarModal(true);
              }}
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/40 object-cover shadow-lg relative cursor-pointer focus:outline-none"
            >
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt="Profile avatar" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <User className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 shadow-md border border-slate-900 pointer-events-none">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white font-heading truncate">
              {username || user.displayName || 'Welcome, Consultant!'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 truncate">{user.email}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
              {/* Token Display */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold">
                <Coins className="w-4 h-4" />
                <span>{appState.tokens ?? 0} AI Tokens</span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-905 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all text-xs text-slate-400 font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/30 px-6 shrink-0 gap-6">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('details');
            }}
            className={`text-xs uppercase font-bold tracking-wider py-3.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('analytics');
            }}
            className={`text-xs uppercase font-bold tracking-wider py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span>Practice Analytics</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'details' ? (
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white font-heading mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <span>Profile Details</span>
            </h2>

            {loadingProfile ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Loading profile details...</span>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      User Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  {/* College Input */}
                  <div className="space-y-2">
                    <label htmlFor="college" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      College / University Name
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="college"
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="e.g. Harvard Business School"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Date of Birth Input */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="dob" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Bio TextArea */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Bio
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {bio.length} / 500 characters
                      </span>
                    </div>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 500))}
                        placeholder="Describe your background, professional aspirations, or case prep goals..."
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/50">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Demo Mode Toggle */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Demo Performance Data</h4>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Toggle mock practice history to inspect layout graphics.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useDemoData} 
                  onChange={(e) => {
                    sounds.playClick();
                    setUseDemoData(e.target.checked);
                  }}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-350 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white border border-slate-700"></div>
              </label>
            </div>

            {loadingAnalytics ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Retrieving practice records...</span>
              </div>
            ) : totalCases === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
                <BarChart2 className="w-12 h-12 opacity-30 text-blue-400" />
                <div className="text-center">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">No Practice History Found</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed font-sans mx-auto">
                    Export your completed case studies as PDF to log performance scores and fill your skill dashboard!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Total Cases */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Cases Solved</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <div className="text-2xl font-bold font-mono text-white">{totalCases}</div>
                      <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">cases</span>
                    </div>
                  </div>

                  {/* Avg Clue Intake */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Avg. Intake</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <div className="text-2xl font-bold font-mono text-blue-400">{avgIntake}%</div>
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>

                  {/* Avg Issue Tree */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Avg. Issue Tree</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <div className="text-2xl font-bold font-mono text-emerald-400">{avgStructuring}%</div>
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                  </div>

                  {/* Avg Framework */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Avg. Framework</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <div className="text-2xl font-bold font-mono text-purple-400">{avgFramework}%</div>
                      <TrendingUp className="w-3 h-3 text-purple-500" />
                    </div>
                  </div>

                  {/* Practice Time */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1 shadow-md">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Avg. Time</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <div className="text-2xl font-bold font-mono text-amber-400">{avgTimeMinutes}</div>
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">mins</span>
                    </div>
                  </div>
                </div>

                {/* Radar and History flex layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                  {/* Radar Chart (Left Column) */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2 flex flex-col items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start pb-2 border-b border-slate-850 w-full mb-4">
                      Consultant Competency Radar
                    </h3>

                    {/* Radar SVG */}
                    <svg viewBox="0 0 240 220" className="w-full max-w-[200px] aspect-square overflow-visible">
                      <g>
                        {/* Grid Rings */}
                        {gridRings.map((scale, i) => {
                          const points = generateRadarPoints(skillValues, radarCx, radarCy, radarRadius * scale);
                          const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                          return (
                            <polygon 
                              key={i} 
                              points={pointsStr} 
                              fill="none" 
                              stroke="rgba(71, 85, 105, 0.4)" 
                              strokeWidth="0.8" 
                              strokeDasharray={i < 3 ? '2 2' : 'none'}
                            />
                          );
                        })}

                        {/* Axis grid lines */}
                        {skillValues.map((_, i) => {
                          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                          const targetX = radarCx + radarRadius * Math.cos(angle);
                          const targetY = radarCy + radarRadius * Math.sin(angle);
                          return (
                            <line 
                              key={i} 
                              x1={radarCx} 
                              y1={radarCy} 
                              x2={targetX} 
                              y2={targetY} 
                              stroke="rgba(71, 85, 105, 0.5)" 
                              strokeWidth="0.8"
                            />
                          );
                        })}

                        {/* Outer label texts */}
                        {skillValues.map((skill, i) => {
                          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                          // Offset label slightly outward from the max radius
                          const offsetRadius = radarRadius + 14;
                          const labelX = radarCx + offsetRadius * Math.cos(angle);
                          const labelY = radarCy + offsetRadius * Math.sin(angle);
                          
                          let textAnchor = 'middle';
                          if (Math.cos(angle) > 0.1) textAnchor = 'start';
                          else if (Math.cos(angle) < -0.1) textAnchor = 'end';

                          return (
                            <text
                              key={i}
                              x={labelX}
                              y={labelY}
                              textAnchor={textAnchor}
                              fill="#94a3b8"
                              fontSize="8"
                              fontWeight="bold"
                              fontFamily="monospace"
                              alignmentBaseline="middle"
                            >
                              {skill.label}
                            </text>
                          );
                        })}

                        {/* Value Polygon area */}
                        <polygon 
                          points={radarPointsString} 
                          fill="rgba(59, 130, 246, 0.25)" 
                          stroke="#3b82f6" 
                          strokeWidth="1.8"
                          className="transition-all duration-500"
                        />

                        {/* Point dots */}
                        {radarPoints.map((point, i) => (
                          <circle 
                            key={i} 
                            cx={point.x} 
                            cy={point.y} 
                            r="3" 
                            fill="#60a5fa" 
                            stroke="#1d4ed8" 
                            strokeWidth="1"
                          />
                        ))}
                      </g>
                    </svg>

                    {/* Skill axis legend values */}
                    <div className="w-full space-y-1.5 mt-4 pt-4 border-t border-slate-850">
                      {skillValues.map((skill, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-slate-400">{skill.label}</span>
                          <span className="text-blue-400 font-bold">{skill.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History Table (Right Column) */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-3 flex flex-col justify-between">
                    <div className="w-full flex-1">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-850 w-full mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Practice History
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] font-sans border-collapse">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-850">
                              <th className="py-2.5 font-bold uppercase tracking-wider">Date</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider">Case Name / Category</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider text-center">Intake</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider text-center">Structure</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider text-center">Logic</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider text-right">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 text-slate-300">
                            {activeDataset.map((item, idx) => {
                              const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
                              const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              const durationMinutes = Math.round((item.totalTimeSeconds || 0) / 60);

                              return (
                                <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                                  <td className="py-2.5 text-slate-500 font-mono font-medium">{formattedDate}</td>
                                  <td className="py-2.5 font-semibold">
                                    <div>{item.caseTitle}</div>
                                    <div className="text-[9px] text-slate-500 font-medium uppercase mt-0.5 tracking-tight flex items-center gap-1">
                                      <Briefcase className="w-2.5 h-2.5" />
                                      {item.caseType}
                                    </div>
                                  </td>
                                  <td className="py-2.5 text-center font-mono font-bold text-blue-400">{item.intakeScore}%</td>
                                  <td className="py-2.5 text-center font-mono font-bold text-emerald-400">{item.structuringScore}%</td>
                                  <td className="py-2.5 text-center font-mono font-bold text-purple-400">{item.frameworkScore}%</td>
                                  <td className="py-2.5 text-right font-mono text-slate-500">{durationMinutes}m</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Hidden file input for custom avatar uploading */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white font-heading">Choose Avatar</h3>
              <button 
                onClick={() => {
                  sounds.playClick();
                  setShowAvatarModal(false);
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom file upload row */}
            <button
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center gap-2 p-4 mb-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 hover:border-blue-500/50 text-slate-350 hover:text-white transition-all text-sm font-medium cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Upload Custom Photo</span>
            </button>

            <div className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-3">
              Predefined Gradients
            </div>

            {/* Predefined gradients grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {PREDEFINED_GRADIENTS.map((grad, i) => {
                const svgUrl = generateInitialsSvg(currentInitials, grad.start, grad.end);
                const isSelected = photoURL === svgUrl;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      sounds.playClick();
                      setPhotoURL(svgUrl);
                      setShowAvatarModal(false);
                      toast.success(`Selected ${grad.label} avatar!`);
                    }}
                    className={`relative aspect-square rounded-full overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/30' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img 
                      src={svgUrl} 
                      alt={grad.label} 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                );
              })}
            </div>

            {/* Close actions */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowAvatarModal(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
