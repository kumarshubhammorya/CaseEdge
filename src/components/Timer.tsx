import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, BookOpen, Settings } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { Tooltip } from './MicroInteractions';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../lib/AuthContext';

type Props = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onExport: () => Promise<void>;
  onReset: () => void;
  showCaseBriefDrawer: boolean;
  onToggleCaseBrief: () => void;
};

export const Timer = ({ activeSection, setActiveSection, onExport, onReset, showCaseBriefDrawer, onToggleCaseBrief }: Props) => {
  const { appState } = useAppContext();
  const { user } = useAuth();
  const [duration, setDuration] = useState<number>(30 * 60); // setup 30 mins default
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExported, setIsExported] = useState<boolean>(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(() => {
    return localStorage.getItem('caseedge_sounds_enabled') !== 'false';
  });
  const [floatingIndicators, setFloatingIndicators] = useState<{ id: number; text: string; className: string }[]>([]);
  const [prevTokens, setPrevTokens] = useState<number | null>(null);

  const toggleSounds = () => {
    const nextVal = sounds.toggle();
    setSoundsEnabled(nextVal);
    if (nextVal) {
      setTimeout(() => sounds.playClick(), 50);
    }
  };

  useEffect(() => {
    if (prevTokens === null) {
      setPrevTokens(appState.tokens ?? 50);
      return;
    }
    const current = appState.tokens ?? 50;
    const diff = current - prevTokens;
    if (diff !== 0) {
      setPrevTokens(current);
      const text = diff > 0 ? `+${diff} ⚡` : `${diff} ⚡`;
      const className = diff > 0 
        ? 'text-green-400 font-extrabold drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]'
        : 'text-red-400 font-extrabold drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]';
      
      const id = Date.now();
      setFloatingIndicators(prev => [...prev, { id, text, className }]);
      
      // Play coin sounds only if audio is enabled
      if (sounds.enabled) {
        if (diff > 0) {
          sounds.playAdd();
        } else {
          sounds.playRemove();
        }
      }

      // Remove indicator after 1.2s (matches CSS keyframe transition duration)
      setTimeout(() => {
        setFloatingIndicators(prev => prev.filter(ind => ind.id !== id));
      }, 1200);
    }
  }, [appState.tokens, prevTokens]);

  const prevBriefRef = useRef<string>(appState.caseBrief);

  useEffect(() => {
    if (appState.caseBrief && appState.caseBrief !== prevBriefRef.current) {
      const diff = Math.abs(appState.caseBrief.length - (prevBriefRef.current?.length || 0));
      if (diff > 20) {
        setTimeLeft(duration);
        setIsRunning(true);
      }
    }
    prevBriefRef.current = appState.caseBrief;
  }, [appState.caseBrief, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          (window as any).caseedge_timer_timeleft = next;
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    const elapsedPct = duration > 0 ? (duration - timeLeft) / duration : 0;
    window.dispatchEvent(new CustomEvent('timer-tick', { detail: elapsedPct }));
  }, [timeLeft, duration]);

  const toggleTimer = () => {
    sounds.playClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    sounds.playClick();
    setIsRunning(false);
    setTimeLeft(duration);
    window.dispatchEvent(new CustomEvent('timer-tick', { detail: 0 }));
  };

  const handleSetDuration = (mins: number) => {
    sounds.playClick();
    const newSeconds = mins * 60;
    setDuration(newSeconds);
    setTimeLeft(newSeconds);
    setIsRunning(false);
    window.dispatchEvent(new CustomEvent('timer-tick', { detail: 0 }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let colorClass = 'text-slate-200';
  const percentage = duration > 0 ? timeLeft / duration : 0;
  if (percentage <= 0.2) colorClass = 'text-red-500';
  else if (percentage <= 0.5) colorClass = 'text-amber-500';

  // Pacing Calculation
  let pacingLabel = 'On Track';
  let pacingColorClass = 'text-green-400 bg-green-950/20 border-green-500/20';

  const elapsed = duration - timeLeft;
  if (activeSection === 'intake') {
    if (elapsed > 5 * 60) {
      pacingLabel = 'Overtime (+5m)';
      pacingColorClass = 'text-amber-500 bg-amber-950/20 border-amber-500/20';
    }
  } else if (activeSection === 'issueTree' || activeSection === 'frameworks') {
    if (elapsed > 15 * 60) {
      pacingLabel = 'Overtime (+15m)';
      pacingColorClass = 'text-amber-500 bg-amber-950/20 border-amber-500/20';
    }
  } else if (activeSection === 'drafter' || activeSection === 'assumptions') {
    if (elapsed > 22 * 60) {
      pacingLabel = 'Overtime (+22m)';
      pacingColorClass = 'text-amber-500 bg-amber-950/20 border-amber-500/20';
    }
  } else if (activeSection === 'slideOutline' || activeSection === 'qa') {
    if (elapsed > 30 * 60) {
      pacingLabel = 'Overtime (+30m)';
      pacingColorClass = 'text-red-400 bg-red-950/20 border-red-500/20 animate-pulse';
    }
  }

  if (timeLeft === 0) {
    pacingLabel = 'Time Out';
    pacingColorClass = 'text-red-400 bg-red-950/20 border-red-500/20 animate-pulse';
  }

  return (
    <header className="h-14 sm:h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-3 sm:px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md shrink-0" viewBox="0 0 100 100">
          <rect width="100" height="100" rx="24" fill="#040b16" />
          
          {/* Inner dark background for the shield */}
          <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="#060f24" />

          {/* Left shield border (dark blue) */}
          <path d="M50 15 L18 32 L18 68 L50 85" fill="none" stroke="#0047ff" strokeWidth="8" strokeLinejoin="miter" />
          
          {/* Right shield border (cyan) */}
          <path d="M50 15 L82 32 L82 68 L50 85" fill="none" stroke="#00d4ff" strokeWidth="8" strokeLinejoin="miter" />

          {/* Inner Bars */}
          <rect x="33" y="56" width="14" height="24" fill="#0047ff" />
          <rect x="53" y="46" width="14" height="34" fill="#0077ff" />

          {/* Line Chart glowing line */}
          <polyline points="14,64 38,50 50,54 68,40 86,30" stroke="#00e5ff" strokeWidth="3" fill="none" strokeLinejoin="round" />
          
          {/* Line Chart dots */}
          <circle cx="14" cy="64" r="3.5" fill="#00e5ff" />
          <circle cx="38" cy="50" r="3.5" fill="#00e5ff" />
          <circle cx="68" cy="40" r="3.5" fill="#00e5ff" />
          <circle cx="86" cy="30" r="3.5" fill="#00e5ff" stroke="#040b16" strokeWidth="1" />
        </svg>
        <h1 className="text-sm sm:text-xl font-semibold tracking-tight text-white pr-2 sm:pr-0">Case<span className="text-blue-500">Edge</span></h1>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-6 min-w-0">
        {user?.email?.toLowerCase().trim() === 'kumarshubhammorya@gmail.com' && (
          <button
            onClick={() => {
              sounds.playClick();
              setActiveSection('admin');
            }}
            className={`px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              activeSection === 'admin'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-purple-950/20 text-purple-400/80 border border-purple-900/30 hover:bg-purple-900/20 hover:text-purple-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
            <span className="hidden sm:inline">Admin Panel</span>
            <span className="sm:hidden">Admin</span>
          </button>
        )}

        <div className="flex flex-col items-end border-l border-slate-800 pl-4 sm:pl-6 shrink-0 relative">
          <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest hidden sm:block">Tokens</span>
          <div className="flex items-center gap-1.5 sm:gap-2 sm:-mt-1 h-6 relative">
            <span className="text-xs sm:text-sm font-extrabold text-cyan-400 select-none flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20 shrink-0 animate-[pulse_3s_ease-in-out_infinite]" /> {appState.tokens ?? 0}
            </span>
            {floatingIndicators.map(ind => (
              <span 
                key={ind.id} 
                className={`absolute right-0 -top-6 text-[10px] font-mono animate-float-up pointer-events-none select-none ${ind.className}`}
              >
                {ind.text}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end border-r-0 border-l-0 sm:border-l border-slate-800 sm:pl-6 sm:border-r pr-2 sm:pr-6 shrink-0">
          <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest hidden sm:block">
            Remaining Time <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide border ${pacingColorClass}`}>{pacingLabel}</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 sm:-mt-1">
            <span className={`text-xl sm:text-2xl font-mono font-bold ${colorClass}`}>
              {formatTime(timeLeft)}
            </span>
            <span className={`text-[10px] sm:hidden px-1 py-0.5 rounded font-extrabold uppercase border ${pacingColorClass}`}>{pacingLabel}</span>
            <div className="flex gap-1">
              <Tooltip content={isRunning ? 'Pause Timer' : 'Start Timer'} position="bottom">
                <button onClick={toggleTimer} className="w-6 h-6 bg-slate-800 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300">
                  {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </Tooltip>
              <Tooltip content="Reset Timer" position="bottom">
                <button onClick={resetTimer} className="w-6 h-6 bg-slate-800 hidden sm:flex items-center justify-center rounded hover:bg-slate-700 text-slate-300">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </Tooltip>
              <Tooltip content={soundsEnabled ? 'Mute Sounds' : 'Unmute Sounds'} position="bottom">
                <button onClick={toggleSounds} className="w-6 h-6 bg-slate-800 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300">
                  {soundsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3 text-red-450" />}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!!appState.caseBrief && (
            <Tooltip content={showCaseBriefDrawer ? 'Close Case Brief' : 'Read Case Brief'} position="bottom">
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleCaseBrief();
                }}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showCaseBriefDrawer 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{showCaseBriefDrawer ? 'Hide Case' : 'Read Case'}</span>
              </button>
            </Tooltip>
          )}
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => {
                  sounds.playClick();
                  onReset();
                  setShowResetConfirm(false);
                  setTimeLeft(duration);
                  setIsRunning(true);
                }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded font-medium text-xs sm:text-sm transition-colors bg-red-600 hover:bg-red-500 text-white"
              >
                Yes
              </button>
              <button 
                onClick={() => {
                  sounds.playClick();
                  setShowResetConfirm(false);
                 }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded font-medium text-xs sm:text-sm transition-colors bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                No
              </button>
            </div>
          ) : (
            <Tooltip content="Start a brand new case session" position="bottom">
              <button 
                onClick={() => {
                  sounds.playClick();
                  setShowResetConfirm(true);
                }}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded font-medium text-xs sm:text-sm transition-colors bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap"
              >
                <span className="hidden sm:inline">New Session</span>
                <RotateCcw className="w-3.5 h-3.5 sm:hidden" />
              </button>
            </Tooltip>
          )}
          
          {/* We hide the Export Session text on mobile and just show an icon, or keep a compact button */}
          <Tooltip content="Export case data as PDF" position="bottom" className="inline-flex z-50">
            <button 
              onClick={async () => {
                 sounds.playClick();
                 await onExport();
                 sounds.playSuccess();
                 setIsExported(true);
                 setTimeout(() => setIsExported(false), 2000);
              }} 
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                isExported ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
               {isExported ? 'Done' : <><span className="hidden sm:inline">Export Session</span><span className="sm:hidden">Export</span></>}
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};
