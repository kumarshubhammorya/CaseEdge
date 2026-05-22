import React from 'react';
import { SECTIONS } from './Sidebar';
import { sounds } from '../lib/sounds';
import { BookOpen, BarChart } from 'lucide-react';

type MobileNavProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onShowGuide?: () => void;
};

export const MobileNav: React.FC<MobileNavProps> = ({ activeSection, setActiveSection, onShowGuide }) => {
  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl z-50 px-2 py-2 flex overflow-x-auto hide-scrollbar snap-x touch-pan-x">
      {SECTIONS.map((sec) => (
        <button
          key={sec.id}
          onClick={() => {
            sounds.playClick();
            setActiveSection(sec.id);
          }}
          className={`shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] ${
            activeSection === sec.id
              ? 'text-blue-400 bg-blue-500/10 scale-[1.05]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <sec.icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center">
            {sec.label}
          </span>
        </button>
      ))}
      {onShowGuide && (
        <button
          onClick={() => {
            sounds.playClick();
            onShowGuide();
          }}
          className="shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all snap-center min-w-[72px] text-slate-500 hover:text-cyan-400"
        >
          <BookOpen className="w-5 h-5 flex-shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center">
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
        <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center">
          Data BI
        </span>
      </a>
    </nav>
  );
};
