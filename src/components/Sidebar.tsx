import { FileText, Grid, CheckCircle, HelpCircle, Network, Users } from 'lucide-react';
import React from 'react';
import { AppState } from '../types';

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  appState: AppState;
};

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, appState }) => {
  const sections = [
    { id: 'team', label: 'Team', icon: Users },
    { id: 'intake', label: 'Case Intake', icon: FileText },
    { id: 'issueTree', label: 'Issue Tree', icon: Network },
    { id: 'frameworks', label: 'Frameworks', icon: Grid },
    { id: 'drafter', label: 'Recommendation', icon: CheckCircle },
    { id: 'qa', label: 'Judge Q&A', icon: HelpCircle },
  ];

  const activeCaseTitle = appState.caseGlance?.industry 
    ? `${appState.caseGlance.industry} Analysis`
    : 'No active case';

  return (
    <aside className="w-56 border-r border-slate-800 bg-[#0f172a] flex flex-col py-6 shrink-0 z-10 hidden md:flex">
      <nav className="space-y-1 px-3 flex-1">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
              activeSection === sec.id
                ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-600'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <sec.icon className={`w-4 h-4 ${activeSection === sec.id ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className="text-sm font-medium">{sec.label}</span>
          </button>
        ))}
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
