import React from 'react';
import { View, SalesRep } from '../types';

interface BottomNavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  currentUser: SalesRep;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onNavigate, currentUser }) => {
  const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
    {
      id: 'DASHBOARD',
      label: 'Scorecard',
      icon: <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      id: 'DEALS',
      label: 'Pipeline',
      icon: <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
      id: 'COACH',
      label: 'AI Coach',
      icon: <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
    },
    {
      id: 'SETTINGS',
      label: 'Setup',
      icon: <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    }
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[1000] h-[72px] bg-white/15 backdrop-blur-[32px] saturate-[180%] border border-white/25 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="flex justify-around items-center h-full px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`relative flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300 ${
              currentView === tab.id ? 'text-teal-400' : 'text-white/50'
            }`}
          >
            <div className={`transition-all duration-300 ${currentView === tab.id ? 'scale-110 translate-y-[-2px]' : 'scale-95'}`}>
                {tab.icon}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${currentView === tab.id ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
            {currentView === tab.id && (
              <div className="absolute bottom-1 w-6 h-1 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
