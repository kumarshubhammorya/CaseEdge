import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { User, Activity, PieChart, Presentation, ShieldAlert, CheckSquare } from 'lucide-react';

type Props = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
};

export const TeamSection: React.FC<Props> = ({ appState, setAppState }) => {
  const [elapsedPct, setElapsedPct] = useState(0);

  useEffect(() => {
    const handleTimerTick = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setElapsedPct(customEvent.detail);
    };

    window.addEventListener('timer-tick', handleTimerTick);
    return () => window.removeEventListener('timer-tick', handleTimerTick);
  }, []);

  const roles = [
    {
      id: 'caseLead',
      title: 'Case Lead',
      icon: Activity,
      desc: 'Drives overall structure & pacing.\nKeeps team on prompt.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      id: 'dataNumbers',
      title: 'Data & Numbers',
      icon: PieChart,
      desc: 'Builds quantitative estimates.\nOwns chart analysis & math.',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10'
    },
    {
      id: 'slideStory',
      title: 'Slide & Story',
      icon: Presentation,
      desc: 'Drafts SCR and visual layout.\nEnsures narrative flow.',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10'
    },
    {
      id: 'devilsAdvocate',
      title: "Devil's Advocate",
      icon: ShieldAlert,
      desc: 'Identify gaps & risks.\nPrep for judge Q&A.',
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10'
    }
  ];

  const updateRole = (id: string, value: string) => {
    setAppState(prev => ({
      ...prev,
      teamRoles: {
        ...(prev.teamRoles || { caseLead: "", dataNumbers: "", slideStory: "", devilsAdvocate: "" }),
        [id]: value
      }
    }));
  };

  const getPhaseHighlight = () => {
    if (elapsedPct < 0.3) return 'phase1';
    if (elapsedPct < 0.7) return 'phase2';
    return 'phase3';
  };

  const currentPhase = getPhaseHighlight();

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Team Setup</h2>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => {
            const val = appState.teamRoles ? (appState.teamRoles as any)[role.id] : "";
            return (
              <div key={role.id} className="border border-slate-800 bg-slate-900/50 rounded-xl p-4 flex flex-col cursor-default hover:border-slate-700 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${role.bgColor}`}>
                    <role.icon className={`w-5 h-5 ${role.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{role.title}</h3>
                    <p className="text-[10px] text-slate-400 whitespace-pre-line mt-1">{role.desc}</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/50">
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateRole(role.id, e.target.value)}
                      placeholder="Assign team member..."
                      className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-1.5 pl-9 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Phase Checklist</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phase 1 */}
            <div className={`space-y-3 p-4 rounded-xl border transition-all ${currentPhase === 'phase1' ? 'border-blue-500 bg-blue-900/10' : 'border-slate-800 bg-slate-900/30'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <p className={`text-xs font-bold uppercase tracking-widest ${currentPhase === 'phase1' ? 'text-blue-400' : 'text-slate-500'}`}>Phase 1: Setup</p>
                <span className="text-[10px] font-mono text-slate-500">0% - 30%</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Lead:</b> Run Case Intake & Issue Tree</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Data:</b> Identify missing data points</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Story:</b> Sketch skeleton outline</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Advocate:</b> Review prompt constraints</span></li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className={`space-y-3 p-4 rounded-xl border transition-all ${currentPhase === 'phase2' ? 'border-blue-500 bg-blue-900/10' : 'border-slate-800 bg-slate-900/30'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <p className={`text-xs font-bold uppercase tracking-widest ${currentPhase === 'phase2' ? 'text-blue-400' : 'text-slate-500'}`}>Phase 2: Build</p>
                <span className="text-[10px] font-mono text-slate-500">30% - 70%</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Lead:</b> Re-align team to core problem</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Data:</b> Run financial quantifications</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Story:</b> Draft SCR recommendation</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Advocate:</b> Stress-test initial numbers</span></li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className={`space-y-3 p-4 rounded-xl border transition-all ${currentPhase === 'phase3' ? 'border-blue-500 bg-blue-900/10' : 'border-slate-800 bg-slate-900/30'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <p className={`text-xs font-bold uppercase tracking-widest ${currentPhase === 'phase3' ? 'text-blue-400' : 'text-slate-500'}`}>Phase 3: Verify</p>
                <span className="text-[10px] font-mono text-slate-500">70% - 100%</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Lead:</b> Finalize narrative & pacing</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Data:</b> Format graphs clearly</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Story:</b> Generate and practice Hook</span></li>
                <li className="flex gap-2 items-start opacity-80"><CheckSquare className="w-3.5 h-3.5 mt-0.5" /> <span className="flex-1"><b>Advocate:</b> Run Q&A Simulator drilling</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
