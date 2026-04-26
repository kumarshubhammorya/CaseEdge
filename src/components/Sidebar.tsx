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

  const getSectionProgress = (sectionId: string) => {
    switch (sectionId) {
      case 'team':
        return Object.values(appState.teamRoles).filter(Boolean).length / 4;
      case 'intake':
        return appState.caseGlance ? 1 : appState.caseBrief.trim() ? 0.5 : 0;
      case 'issueTree':
        return appState.issueTree ? 1 : 0;
      case 'frameworks':
        return appState.frameworks && appState.frameworks.length > 0 ? 1 : 0;
      case 'drafter':
        return appState.expandedRecommendation ? 1 : appState.coreRecommendation.trim() ? 0.5 : 0;
      case 'qa':
        return appState.qas && appState.qas.length > 0 ? 1 : 0;
      default:
        return 0;
    }
  };

  const activeCaseTitle = appState.caseGlance?.industry 
    ? `${appState.caseGlance.industry} Analysis`
    : 'No active case';

  return (
    <>
      <div className="md:hidden border-b border-slate-800 bg-[#0f172a] sticky top-0 z-20">
        <nav className="overflow-x-auto px-3 py-2">
          <div className="flex gap-2 min-w-max">
            {sections.map((sec) => {
              const progress = getSectionProgress(sec.id);
              const isActive = activeSection === sec.id;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex flex-col gap-1 px-3 py-2 rounded-md border transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-900/40 border-slate-700 text-slate-300'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <sec.icon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold whitespace-nowrap">{sec.label}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <aside className="w-56 border-r border-slate-800 bg-[#0f172a] flex-col py-6 shrink-0 z-10 hidden md:flex">
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
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-medium truncate">{sec.label}</span>
                <span className="text-[10px] text-emerald-400">{Math.round(getSectionProgress(sec.id) * 100)}%</span>
              </div>
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

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#0f172a] border-t border-slate-800 px-1 py-1">
        <ul className="grid grid-cols-6 gap-1">
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            const progress = getSectionProgress(sec.id);

            return (
              <li key={`${sec.id}-mobile-bottom`}>
                <button
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 ${
                    isActive ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 bg-transparent'
                  }`}
                  aria-label={`${sec.label} section`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <sec.icon className="w-4 h-4" />
                  <span className="text-[10px] leading-none">{sec.label.split(' ')[0]}</span>
                  <span
                    className={`h-1 w-6 rounded-full ${progress > 0 ? 'bg-emerald-400' : 'bg-slate-700'}`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};
