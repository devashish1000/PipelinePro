
import React from 'react';
import { View, SalesRep } from '../types';

interface BottomNavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  currentUser: SalesRep;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onNavigate, currentUser }) => {
  // SF Symbols style icons
  const tabs: { id: View; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'DASHBOARD',
      label: 'Scorecard',
      icon: (active) => (
        <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
           <path d="M4 19V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19Z" />
           <path d="M12 7V17M8 12H16" stroke={active ? "white" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'DEALS',
      label: 'Pipeline',
      icon: (active) => (
        <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" />
          <path d="M3 10H21M7 5V19M12 10V19M17 10V19" stroke={active ? "white" : "currentColor"} strokeWidth="1.5" />
        </svg>
      )
    },
    {
      id: 'COACH',
      label: 'AI Coach',
      icon: (active) => (
        <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" />
          <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" />
          {active && <circle cx="12" cy="8" r="2" fill="white" />}
        </svg>
      )
    },
    {
      id: 'SETTINGS',
      label: 'Settings',
      icon: (active) => (
        <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
          <path d="M19.4 15C19.8 14.1 20 13.1 20 12C20 10.9 19.8 9.9 19.4 9L21.4 7.5L19.4 4L17.1 4.9C16.4 4.3 15.6 3.8 14.7 3.5L14.3 1H10.3L9.9 3.5C9 3.8 8.2 4.3 7.5 4.9L5.2 4L3.2 7.5L5.2 9C4.8 9.9 4.6 10.9 4.6 12C4.6 13.1 4.8 14.1 5.2 15L3.2 16.5L5.2 20L7.5 19.1C8.2 19.7 9 20.2 9.9 20.5L10.3 23H14.3L14.7 20.5C15.6 20.2 16.4 19.7 17.1 19.1L19.4 20L21.4 16.5L19.4 15Z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] ios-blur border-t border-white/10 bg-black/30 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto h-[50px] flex justify-around items-center px-4">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-all active:opacity-60`}
            >
              <div className={`${isActive ? 'text-[#00BFA5]' : 'text-white/50'}`}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-[#00BFA5]' : 'text-white/50'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
