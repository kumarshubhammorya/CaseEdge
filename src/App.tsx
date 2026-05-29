import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Timer } from './components/Timer';
import { IntakeSection } from './components/IntakeSection';
import { IssueTreeSection } from './components/IssueTreeSection';
import { FrameworksSection } from './components/FrameworksSection';
import { DrafterSection } from './components/DrafterSection';
import { SlideOutlineSection } from './components/SlideOutlineSection';
import { QASection } from './components/QASection';
import { DatabaseSection } from './components/DatabaseSection';
import { LibrarySection } from './components/LibrarySection';
import { AssumptionTracker } from './components/AssumptionTracker';
import { AdminSection } from './components/AdminSection';
import { ProfileSection } from './components/ProfileSection';
import { Landing } from './components/Landing';
import { UserGuide } from './components/UserGuide';
import { ScrollDownIndicator } from './components/ScrollDownIndicator';
import { ProgressBar } from './components/ProgressBar';
import { useAppContext } from './context/AppContext';
import { useAuth } from './lib/AuthContext';
import { exportSessionToPdf } from './lib/exportUtils';
import { sounds } from './lib/sounds';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { Lock, BookOpen, Settings, LogIn, LogOut, Loader2 } from 'lucide-react';
import { saveCaseAnalytics, updateUserTokens, saveUserProfile, getUserProfile, getSystemSecrets } from './lib/firestoreService';
import { db } from './lib/firebase';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';


interface SystemConfig {
  maintenanceMode: boolean;
  signupBonusTokens: number;
  aiEvaluationCost: number;
  hintCost: number;
  activeModel: string;
  geminiApiKeyOverride: string;
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  signupBonusTokens: 55,
  aiEvaluationCost: 15,
  hintCost: 2,
  activeModel: 'gemini-1.5-flash',
  geminiApiKeyOverride: ''
};

export default function App() {
  // Persist landing state across OAuth redirect round-trips via sessionStorage
  const [showLanding, setShowLanding] = useState(() => {
    return sessionStorage.getItem('caseedge_app_launched') !== 'true';
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showCaseBriefDrawer, setShowCaseBriefDrawer] = useState(false);
  const [activeSection, setActiveSection] = useState('intake');
  const [sessionKey, setSessionKey] = useState(0);
  
  const { 
    user, 
    signIn, 
    logout,
    signUpWithEmail, 
    signInWithEmail, 
    sendVerificationEmail, 
    checkVerificationStatus, 
    emailVerified 
  } = useAuth();
  const { appState, handleReset: resetContext, setAppState } = useAppContext();
  const lastAuthStatusRef = React.useRef<'logged-in' | 'logged-out' | null>(null);

  // Auth states for blocked/verification panels
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'signup' | 'signin'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (emailMode === 'signup') {
      if (passwordInput !== confirmPasswordInput) {
        toast.error("Passwords do not match.");
        return;
      }
      if (passwordInput.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (emailMode === 'signup') {
        await signUpWithEmail(emailInput.trim(), passwordInput);
        toast.success("Account created! Verification email sent.");
      } else {
        await signInWithEmail(emailInput.trim(), passwordInput);
        toast.success("Logged in successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setVerifying(true);
    try {
      const verified = await checkVerificationStatus();
      if (verified) {
        toast.success("Email verified successfully! App unlocked.");
      } else {
        toast.info("Email is still unverified. Please check your inbox.");
      }
    } catch (err: any) {
      toast.error("Failed to check status: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      toast.success("Verification email resent!");
    } catch (err: any) {
      toast.error("Failed to send email: " + err.message);
    }
  };

  const completedCount = parseInt(localStorage.getItem('caseedge_completed_sessions_count') || '0', 10);
  const hasActiveCompletedCase = appState.isSessionCompleted && appState.caseBrief;
  const isBlocked = user?.isAnonymous && completedCount >= 1 && !hasActiveCompletedCase;

  useEffect(() => {
    if (user && !user.isAnonymous) {
      if (lastAuthStatusRef.current === 'logged-in') {
        return;
      }
      lastAuthStatusRef.current = 'logged-in';

      setAppState(prev => {
        if (prev.hasReceivedLoginBonus) {
          return prev;
        }
        toast.success("Login bonus! You received 50 tokens.", { duration: 4000 });
        return {
          ...prev,
          tokens: (prev.tokens ?? 50) + 50,
          hasReceivedLoginBonus: true
        };
      });
    } else if (user && user.isAnonymous) {
      if (lastAuthStatusRef.current === 'logged-out') {
        return;
      }
      lastAuthStatusRef.current = 'logged-out';

      setAppState(prev => {
        if (!prev.hasReceivedLoginBonus) {
          return prev;
        }
        toast.success("Signed out successfully. (-50 tokens)");
        return {
          ...prev,
          tokens: Math.max(0, (prev.tokens ?? 50) - 50),
          hasReceivedLoginBonus: false
        };
      });
    }
  }, [user, setAppState]);

  // 1. Real-time Firestore user profile tokens listener
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.tokens !== undefined) {
          setAppState(prev => {
            if (prev.tokens !== data.tokens) {
              return { ...prev, tokens: data.tokens };
            }
            return prev;
          });
        }
      }
    }, (error) => {
      console.error("Error listening to user profile changes:", error);
    });

    return () => unsubscribe();
  }, [user, setAppState]);

  // 2. Sync local state tokens to Firestore on change
  useEffect(() => {
    if (!user || user.isAnonymous || appState.tokens === undefined) return;

    const syncTokensToDb = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.tokens !== appState.tokens) {
            await updateUserTokens(user.uid, appState.tokens);
          }
        } else {
          // If profile doc doesn't exist, create it with initial tokens
          await saveUserProfile(user.uid, {
            username: user.displayName || 'Consultant',
            bio: '',
            dob: '',
            collegeName: '',
            photoURL: user.photoURL || '',
            tokens: appState.tokens
          });
        }
      } catch (err) {
        console.error("Error syncing tokens to Firestore:", err);
      }
    };

    // Debounce database sync slightly to prevent double-writes on rapid updates
    const timer = setTimeout(() => {
      syncTokensToDb();
    }, 500);

    return () => clearTimeout(timer);
  }, [appState.tokens, user]);

  // 3. Real-time Firestore system config listener (excluding API key overrides for security)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'system_config', 'default'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const updatedConfig = {
          maintenanceMode: !!data.maintenanceMode,
          signupBonusTokens: data.signupBonusTokens ?? 50,
          aiEvaluationCost: data.aiEvaluationCost ?? 15,
          hintCost: data.hintCost ?? 2,
          activeModel: data.activeModel || 'gemini-1.5-flash',
          geminiApiKeyOverride: '' // Excluded from public document reader for security
        };
        setSystemConfig(updatedConfig);
        localStorage.setItem('caseedge-system-config', JSON.stringify(updatedConfig));
      } else {
        setSystemConfig(DEFAULT_SYSTEM_CONFIG);
        localStorage.setItem('caseedge-system-config', JSON.stringify(DEFAULT_SYSTEM_CONFIG));
      }
    }, (error) => {
      console.error("Error listening to system config:", error);
    });

    return () => unsubscribe();
  }, []);

  // 4. Admin-only secrets loader (secured via Firestore security rules)
  useEffect(() => {
    if (user && user.email?.toLowerCase().trim() === 'kumarshubhammorya@gmail.com') {
      const fetchSecrets = async () => {
        try {
          const secrets = await getSystemSecrets();
          if (secrets && secrets.geminiApiKeyOverride) {
            setSystemConfig(prev => {
              const updated = {
                ...prev,
                geminiApiKeyOverride: secrets.geminiApiKeyOverride
              };
              localStorage.setItem('caseedge-system-config', JSON.stringify(updated));
              return updated;
            });
          }
        } catch (err) {
          console.warn("Failed to load admin secrets:", err);
        }
      };
      fetchSecrets();
    } else {
      // Clear overrides for standard users
      setSystemConfig(prev => {
        if (prev.geminiApiKeyOverride) {
          const updated = {
            ...prev,
            geminiApiKeyOverride: ''
          };
          localStorage.setItem('caseedge-system-config', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [user]);

  const handleExport = async () => {
    try {
      await exportSessionToPdf(appState);
      toast.success("Case study exported as PDF!");
      
      // Calculate elapsed time from the timer
      const timeLeft = (window as any).caseedge_timer_timeleft ?? (30 * 60);
      const totalTimeSeconds = Math.max(0, (30 * 60) - timeLeft);

      if (user && !user.isAnonymous) {
        try {
          await saveCaseAnalytics({
            caseTitle: appState.caseGlance?.industry || 'General Case Study',
            caseType: appState.caseGlance?.caseType || 'General Case',
            intakeScore: appState.intakeFeedback?.score || 0,
            structuringScore: appState.meceFeedback?.score || 0,
            frameworkScore: appState.frameworksScore || 0,
            totalTimeSeconds: totalTimeSeconds,
            isCompleted: true
          });
          toast.success("Practice analytics saved to cloud!");
        } catch (analyticsErr) {
          console.error("Failed to save case analytics:", analyticsErr);
        }
      }
      
      if (!appState.isSessionCompleted) {
        setAppState(prev => ({ ...prev, isSessionCompleted: true }));
        const count = parseInt(localStorage.getItem('caseedge_completed_sessions_count') || '0', 10);
        localStorage.setItem('caseedge_completed_sessions_count', (count + 1).toString());
      }
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to export case study");
    }
  };

  const handleReset = () => {
    resetContext();
    setActiveSection('intake');
    setSessionKey(prev => prev + 1);
  };

  const handleLaunch = () => {
    sounds.playLaunch();
    sessionStorage.setItem('caseedge_app_launched', 'true');
    setShowLanding(false);
    setShowUserGuide(true);
  };

  // Auto-skip landing page if user is already signed in (e.g. after OAuth redirect)
  useEffect(() => {
    if (user && !user.isAnonymous) {
      sessionStorage.setItem('caseedge_app_launched', 'true');
      setShowLanding(false);
    }
  }, [user]);

  const userEmail = user?.email?.toLowerCase().trim();
  const isAdmin = userEmail === 'kumarshubhammorya@gmail.com';
  const showMaintenance = systemConfig.maintenanceMode && !isAdmin;

  if (showMaintenance) {
    return (
      <div className="bg-[#0f172a] text-slate-200 font-sans h-screen flex flex-col items-center justify-center relative p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-400 border border-blue-500/20">
            <Settings className="w-8 h-8 animate-spin-slow" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3 font-heading">Scheduled Maintenance</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            CaseEdge is currently undergoing scheduled system upgrades. We will be back online shortly. Thanks for your patience!
          </p>
          
          <div className="text-[10px] text-slate-600 font-mono tracking-wider uppercase border-t border-slate-850 pt-4">
            Status: System Offline
          </div>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return <Landing onLaunch={handleLaunch} />;
  }

  const isUnverified = user && !user.isAnonymous && !emailVerified;

  if (isUnverified) {
    return (
      <div className="bg-[#0f172a] text-slate-200 font-sans h-screen flex flex-col items-center justify-center relative p-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.1] pointer-events-none fixed [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl relative z-10">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
          
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 text-amber-400 border border-amber-500/20 animate-pulse">
            <span className="text-2xl">✉️</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3 font-heading">Verify Your Email</h2>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            We sent a verification link to <strong className="text-slate-200">{user.email}</strong>. Please check your inbox and verify your email to unlock CaseEdge.
          </p>
          
          <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl text-[11px] text-slate-500 mb-6 font-sans">
            Don't see it? Check your spam folder or resend the verification link.
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCheckVerification}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {verifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xs">🔄</span>
              )}
              <span>I've Verified My Email</span>
            </button>

            <div className="flex justify-between items-center gap-4 mt-2">
              <button
                onClick={handleResendVerification}
                className="text-xs text-blue-400 hover:underline cursor-pointer focus:outline-none"
              >
                Resend Email
              </button>
              
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {
                    console.error("Sign out failed", e);
                  }
                }}
                className="text-xs text-red-400 hover:underline cursor-pointer focus:outline-none flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="bg-[#0f172a] text-slate-200 font-sans h-screen flex flex-col items-center justify-center relative p-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.1] pointer-events-none fixed [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-5 text-blue-400 border border-blue-500/20 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading mb-2 text-white">Trial Limit Reached</h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            You have completed your 1 free case study session. Please sign up to unlock unlimited sessions, permanent cloud saving, and slide deck exports.
          </p>

          {/* Auth Method Tabs */}
          <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-850 mb-6 w-full text-center">
            <button
              type="button"
              onClick={() => { setAuthMethod('google'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMethod === 'google'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('email'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMethod === 'email'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Email / Password
            </button>
          </div>

          {authMethod === 'google' ? (
            <button
              onClick={signIn}
              className="w-full bg-blue-600 hover:bg-blue-500 text-sm uppercase font-bold text-white py-3 px-6 rounded transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In with Google to Unlock</span>
            </button>
          ) : (
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4 text-left w-full">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xs select-none">
                    ✉️
                  </span>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl py-2.5 pl-8 pr-4 text-xs text-white placeholder-slate-650 focus:outline-none transition-all font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xs select-none">
                    🔑
                  </span>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl py-2.5 pl-8 pr-4 text-xs text-white placeholder-slate-650 focus:outline-none transition-all font-sans"
                    required
                  />
                </div>
              </div>

              {emailMode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xs select-none">
                      🔒
                    </span>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl py-2.5 pl-8 pr-4 text-xs text-white placeholder-slate-650 focus:outline-none transition-all font-sans"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{emailMode === 'signup' ? 'Create Account & Unlock' : 'Sign In & Unlock'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode(prev => prev === 'signin' ? 'signup' : 'signin');
                  }}
                  className="text-xs text-blue-400 hover:underline cursor-pointer focus:outline-none"
                >
                  {emailMode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] text-slate-200 font-sans h-screen overflow-hidden flex flex-col relative">
      <Toaster position="top-right" richColors theme="dark" />
      {showUserGuide && <UserGuide onClose={() => setShowUserGuide(false)} />}
      <Timer 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        onExport={handleExport} 
        onReset={handleReset} 
        showCaseBriefDrawer={showCaseBriefDrawer}
        onToggleCaseBrief={() => setShowCaseBriefDrawer(prev => !prev)}
      />
      
      <div className="flex flex-1 min-h-0 relative">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} onShowGuide={() => setShowUserGuide(true)} />
        
        <main key={sessionKey} className="flex-1 overflow-hidden bg-slate-800/10 min-h-0 flex flex-col relative">
          <ProgressBar />
          {!showUserGuide && (activeSection !== 'intake' || appState.caseGlance) && <ScrollDownIndicator />}
          <div className="w-full max-w-5xl mx-auto py-2 md:py-4 px-4 md:px-6 lg:px-8 flex-1 flex flex-col min-h-0 pb-[100px] md:pb-8">
            {activeSection === 'intake' && <IntakeSection onNext={() => setActiveSection('issueTree')} />}
            {activeSection === 'library' && <LibrarySection onImport={() => setActiveSection('intake')} />}
            {activeSection === 'issueTree' && <IssueTreeSection onNext={() => setActiveSection('frameworks')} onGoBack={() => setActiveSection('intake')} />}
            {activeSection === 'frameworks' && <FrameworksSection onNext={() => setActiveSection('drafter')} onGoBack={() => setActiveSection('issueTree')} />}
            {activeSection === 'drafter' && <DrafterSection onNext={() => setActiveSection('slideOutline')} onGoToAssumptions={() => setActiveSection('assumptions')} onGoBack={() => setActiveSection('frameworks')} />}
            {activeSection === 'slideOutline' && <SlideOutlineSection onNext={() => setActiveSection('qa')} onGoBack={() => setActiveSection('drafter')} />}
            {activeSection === 'qa' && <QASection onGoBack={() => setActiveSection('slideOutline')} />}
            {activeSection === 'assumptions' && <AssumptionTracker onGoBack={() => setActiveSection('intake')} />}
            {activeSection === 'database' && <DatabaseSection />}
            {activeSection === 'admin' && <AdminSection />}
            {activeSection === 'profile' && <ProfileSection />}
          </div>
        </main>
      </div>

      <MobileNav activeSection={activeSection} setActiveSection={setActiveSection} onShowGuide={() => setShowUserGuide(true)} />

      <footer className="h-8 border-t border-slate-800 bg-slate-900 flex items-center px-3 sm:px-6 justify-between shrink-0 font-mono text-[10px] text-slate-500 z-40 overflow-hidden">
        <div className="flex gap-3 sm:gap-6 w-1/3 sm:w-auto truncate">
          <span className="truncate">ID: CSR_{Math.random().toString(36).substring(7).toUpperCase()}</span>
        </div>
        <div className="flex flex-shrink-0 items-center justify-center w-1/3 sm:w-auto opacity-80 hover:opacity-100 transition-opacity truncate">
          Built by <a href="https://www.linkedin.com/in/shubham-kumar-b79969232" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold ml-1">Shubham K. M.</a>
        </div>
        <div className="flex gap-3 sm:gap-6 w-1/3 sm:w-auto justify-end truncate">
          <span className="text-blue-500 truncate">● <span className="hidden sm:inline">GEMINI_</span>ONLINE</span>
        </div>
      </footer>
      <DiagnosticsPanel />

      {/* Case Brief Slide-out Drawer */}
      {showCaseBriefDrawer && appState.caseBrief && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setShowCaseBriefDrawer(false)}
          />
          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900/95 border-l border-slate-800 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="font-heading font-bold text-base text-white">Active Case Brief</h3>
              </div>
              <button 
                onClick={() => setShowCaseBriefDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6">
              {appState.caseGlance && (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider">Case Glance</span>
                  <h4 className="text-sm font-semibold text-slate-200 mt-1 mb-3">{appState.caseGlance.industry} Analysis</h4>
                  
                  <div className="space-y-3.5 text-xs text-slate-300">
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wide">Core Problem</span>
                      <p className="mt-0.5 leading-relaxed text-slate-350">{appState.caseGlance.coreProblem}</p>
                    </div>
                    {appState.caseGlance.keyStakeholders && appState.caseGlance.keyStakeholders.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wide">Key Stakeholders</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {appState.caseGlance.keyStakeholders.map((st, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-850 border border-slate-800 text-slate-300 rounded text-[10px]">{st}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {appState.caseGlance.keyConstraints && appState.caseGlance.keyConstraints.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wide">Key Constraints</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {appState.caseGlance.keyConstraints.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-850 border border-slate-800 text-slate-300 rounded text-[10px]">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider block">Full Case Text</span>
                <div className="bg-slate-950/20 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {appState.caseBrief}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
              <button 
                onClick={() => setShowCaseBriefDrawer(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
