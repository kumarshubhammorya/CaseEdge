import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

type Props = {
  onExport: () => void;
};

export const Timer = ({ onExport }: Props) => {
  const [duration, setDuration] = useState<number>(30 * 60); // setup 30 mins default
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
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

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    window.dispatchEvent(new CustomEvent('timer-tick', { detail: 0 }));
  };

  const handleSetDuration = (mins: number) => {
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

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 flex items-center justify-center font-bold text-white rounded italic">CE</div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Case<span className="text-blue-500">Edge</span></h1>
        <span className="ml-4 px-2 py-0.5 border border-slate-700 text-[10px] uppercase tracking-widest text-slate-400 font-mono hidden sm:inline-block">v2.4.1 Competition Mode</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 hidden md:flex">
          {[15, 30, 45, 60].map((mins) => (
             <button
               key={mins}
               onClick={() => handleSetDuration(mins)}
               disabled={isRunning}
               className={`text-[10px] px-1.5 py-0.5 border rounded uppercase tracking-wider font-bold transition-colors ${
                 duration === mins * 60
                   ? 'border-blue-600 text-blue-500 bg-blue-900/20'
                   : 'border-slate-700 text-slate-500 hover:text-slate-300 disabled:opacity-50'
               }`}
             >
               {mins}m
             </button>
          ))}
        </div>

        <div className="flex flex-col items-end border-l border-slate-800 pl-6 border-r pr-6">
          <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Remaining Time</span>
          <div className="flex items-center gap-2 -mt-1">
            <span className={`text-2xl font-mono font-bold ${colorClass}`}>
              {formatTime(timeLeft)}
            </span>
            <div className="flex gap-1">
              <button onClick={toggleTimer} className="w-6 h-6 bg-slate-800 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300">
                {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button onClick={resetTimer} className="w-6 h-6 bg-slate-800 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <button onClick={onExport} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors hidden sm:block">
          Export Session
        </button>
      </div>
    </header>
  );
};
