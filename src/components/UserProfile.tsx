import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { useAppContext } from '../context/AppContext';
import { User, Coins, ChevronRight } from 'lucide-react';
import { sounds } from '../lib/sounds';

interface UserProfileProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ activeSection, setActiveSection }) => {
  const { user } = useAuth();
  const { appState } = useAppContext();

  const handleProfileClick = () => {
    sounds.playTransition();
    setActiveSection('profile');
  };

  const isProfileActive = activeSection === 'profile';

  if (!user || user.isAnonymous) {
    return (
      <button
        onClick={handleProfileClick}
        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
          isProfileActive 
            ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 text-slate-400">
            <User className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-bold truncate">Guest User</span>
            <span className="text-[9px] text-slate-500 truncate">Sign In / Profile</span>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>
    );
  }

  return (
    <button
      onClick={handleProfileClick}
      className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
        isProfileActive 
          ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
          : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-350 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Avatar" 
            className="w-8 h-8 rounded-full border border-slate-700 shrink-0 object-cover" 
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 text-slate-350">
            <User className="w-4.5 h-4.5" />
          </div>
        )}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-xs font-bold truncate text-left w-full">
            {user.displayName || 'Consultant'}
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-yellow-400">
            <Coins className="w-3 h-3" />
            <span className="text-[10px] font-bold">{appState.tokens ?? 0}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
    </button>
  );
};
