import React from 'react';
import { SECTIONS, isSectionEnabled } from './Sidebar';
import { sounds } from '../lib/sounds';
import { BookOpen, BarChart, Lock, Settings, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';

type MobileNavProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onShowGuide?: () => void;
};

export const MobileNav: React.FC<MobileNavProps> = ({ activeSection, setActiveSection, onShowGuide }) => {
  const { appState } = useAppContext();
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl z-50 px-2 py-2 flex overflow-x-auto hide-scrollbar snap-x touch-pan-x">
      {SECTIONS.map((sec) => {
        const enabled = isSectionEnabled(sec.id, appState);
        return (
          <button
            key={sec.id}
            onClick={() => {
              if (enabled) {
                sounds.playClick();
                setActiveSection(sec.id);
              } else {
                sounds.playError();
                toast.error(`Complete previous steps to unlock ${sec.label}!`);
              }
            }}
            disabled={!enabled}
            className={`shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] ${
              !enabled
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeSection === sec.id
                ? 'text-blue-400 bg-blue-500/10 scale-[1.05]'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            <div className="relative">
              <sec.icon className="w-5 h-5 flex-shrink-0" />
              {!enabled && (
                <div className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-0.5 border border-slate-800">
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
              {sec.label}
            </span>
          </button>
        );
      })}
      {onShowGuide && (
        <button
          onClick={() => {
            sounds.playClick();
            onShowGuide();
          }}
          className="shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] text-slate-500 hover:text-cyan-400"
        >
          <BookOpen className="w-5 h-5 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
            Guide
          </span>
        </button>
      )}
      <a
        href="https://biedge.shubhammaurya.online/#/app"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] text-blue-400 hover:text-blue-300 pointer"
      >
        <BarChart className="w-5 h-5 flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
          Data BI
        </span>
      </a>
      <button
        onClick={() => {
          sounds.playClick();
          setActiveSection('profile');
        }}
        className={`shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] ${
          activeSection === 'profile'
            ? 'text-blue-400 bg-blue-500/10 scale-[1.05]'
            : 'text-slate-500 hover:text-slate-350'
        }`}
      >
        <User className="w-5 h-5 flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
          Profile
        </span>
      </button>
      {user?.email?.toLowerCase().trim() === 'kumarshubhammorya@gmail.com' && (
        <button
          onClick={() => {
            sounds.playClick();
            setActiveSection('admin');
          }}
          className={`shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] ${
            activeSection === 'admin'
              ? 'text-purple-400 bg-purple-500/10 scale-[1.05]'
              : 'text-purple-400/60 hover:text-purple-400'
          }`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
            Admin
          </span>
        </button>
      )}
    </nav>
  );
};
