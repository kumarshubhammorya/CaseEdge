import React, { useState } from 'react';
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
import { AssumptionTracker } from './components/AssumptionTracker';
import { Landing } from './components/Landing';
import { UserGuide } from './components/UserGuide';
import { ScrollDownIndicator } from './components/ScrollDownIndicator';
import { ProgressBar } from './components/ProgressBar';
import { useAppContext } from './context/AppContext';
import { exportSessionToPdf } from './lib/exportUtils';
import { sounds } from './lib/sounds';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';


export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [activeSection, setActiveSection] = useState('intake');
  const [sessionKey, setSessionKey] = useState(0);
  const { appState, handleReset: resetContext } = useAppContext();

  const handleExport = async () => {
    try {
      await exportSessionToPdf(appState);
      toast.success("Case study exported as PDF!");
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
    setShowLanding(false);
    setShowUserGuide(true);
  };

  if (showLanding) {
    return <Landing onLaunch={handleLaunch} />;
  }

  return (
    <div className="bg-[#0f172a] text-slate-200 font-sans h-screen overflow-hidden flex flex-col relative">
      <Toaster position="top-right" richColors theme="dark" />
      {showUserGuide && <UserGuide onClose={() => setShowUserGuide(false)} />}
      <Timer onExport={handleExport} onReset={handleReset} />
      
      <div className="flex flex-1 min-h-0 relative">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} onShowGuide={() => setShowUserGuide(true)} />
        
        <main key={sessionKey} className="flex-1 overflow-y-auto bg-slate-800/10 min-h-0 flex flex-col relative custom-scrollbar">
          <ProgressBar />
          {!showUserGuide && (activeSection !== 'intake' || appState.caseGlance) && <ScrollDownIndicator />}
          <div className="w-full max-w-5xl mx-auto py-2 md:py-4 px-4 md:px-6 lg:px-8 flex-1 flex flex-col min-h-0 pb-[100px] md:pb-8">
            {activeSection === 'intake' && <IntakeSection onNext={() => setActiveSection('issueTree')} />}
            {activeSection === 'issueTree' && <IssueTreeSection onNext={() => setActiveSection('frameworks')} onGoBack={() => setActiveSection('intake')} />}
            {activeSection === 'frameworks' && <FrameworksSection onNext={() => setActiveSection('drafter')} onGoBack={() => setActiveSection('issueTree')} />}
            {activeSection === 'drafter' && <DrafterSection onNext={() => setActiveSection('slideOutline')} onGoToAssumptions={() => setActiveSection('assumptions')} onGoBack={() => setActiveSection('frameworks')} />}
            {activeSection === 'slideOutline' && <SlideOutlineSection onNext={() => setActiveSection('qa')} onGoBack={() => setActiveSection('drafter')} />}
            {activeSection === 'qa' && <QASection onGoBack={() => setActiveSection('slideOutline')} />}
            {activeSection === 'assumptions' && <AssumptionTracker onGoBack={() => setActiveSection('intake')} />}
            {activeSection === 'database' && <DatabaseSection />}
          </div>
        </main>
      </div>

      <MobileNav activeSection={activeSection} setActiveSection={setActiveSection} onShowGuide={() => setShowUserGuide(true)} />

      <footer className="h-8 border-t border-slate-800 bg-slate-900 flex items-center px-3 sm:px-6 justify-between shrink-0 font-mono text-[8px] sm:text-[9px] text-slate-500 z-40 overflow-hidden">
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
    </div>
  );
}
