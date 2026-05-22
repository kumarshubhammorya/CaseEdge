import { FileText, Grid, CheckCircle, HelpCircle, Network, Users, Zap, Presentation, Database, ShieldCheck, BookOpen, BarChart, ExternalLink } from 'lucide-react';
import React from 'react';
import { AppState } from '../types';
import { sounds } from '../lib/sounds';

import { useAppContext } from '../context/AppContext';

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onShowGuide?: () => void;
};

export const SECTIONS = [
  { id: 'intake', label: 'Case Intake', icon: FileText },
  { id: 'issueTree', label: 'Issue Tree', icon: Network },
  { id: 'frameworks', label: 'Frameworks', icon: Grid },
  { id: 'drafter', label: 'Recommendation', icon: CheckCircle },
  { id: 'assumptions', label: 'Assumptions', icon: ShieldCheck },
  { id: 'slideOutline', label: 'Slide Outline', icon: Presentation },
  { id: 'qa', label: 'Judge Q&A', icon: HelpCircle },
  { id: 'database', label: 'Cloud Files', icon: Database },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, onShowGuide }) => {
  const { appState } = useAppContext();
  const activeCaseTitle = appState.caseGlance?.industry 
    ? `${appState.caseGlance.industry} Analysis`
    : 'No active case';

  return (
    <aside className="w-56 border-r border-slate-800 bg-[#0f172a] flex flex-col py-6 shrink-0 z-10 hidden md:flex">
      <nav className="space-y-1 px-3 flex-1">
        {SECTIONS.map((sec) => (
          <React.Fragment key={sec.id}>
            {sec.id === 'database' && <div className="mx-2 my-4 border-t border-slate-800/50" />}
            <button
              onClick={() => {
                sounds.playTransition();
                setActiveSection(sec.id);
              }}
              onMouseEnter={() => sounds.playHover()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                activeSection === sec.id
                  ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-600'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <sec.icon className={`w-4 h-4 ${activeSection === sec.id ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="text-sm font-medium">{sec.label}</span>
            </button>
          </React.Fragment>
        ))}
        {onShowGuide && (
          <button
            onClick={() => {
              sounds.playTransition();
              onShowGuide();
            }}
            onMouseEnter={() => sounds.playHover()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-slate-400 hover:bg-slate-800 hover:text-cyan-400 mt-2"
          >
            <BookOpen className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
            <span className="text-sm font-medium">Quick Guide</span>
          </button>
        )}
        
        <div className="mx-2 my-4 border-t border-slate-800/50" />
        
        <a
          href="https://biedge.shubhammaurya.online/#/app"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => sounds.playHover()}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-blue-400 hover:bg-slate-800 hover:text-blue-300 pointer"
        >
          <div className="flex items-center gap-3">
             <BarChart className="w-4 h-4 text-blue-500" />
             <span className="text-sm font-medium">Data BI Dashboard</span>
          </div>
          <ExternalLink className="w-3 h-3 text-blue-500/50" />
        </a>
      </nav>

      <div className="mt-auto px-6">

        <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50 block">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-tighter">Active Case</p>
          <p className="text-xs font-semibold text-white leading-tight truncate">{activeCaseTitle}</p>
        </div>
      </div>
    </aside>
  );
};
