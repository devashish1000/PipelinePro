import React, { useState } from 'react';
import { View, SalesRep } from '../types';
import { woltersKluwerReps } from '../data/salesReps';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  currentUser: SalesRep;
  onUserSwitch: (user: SalesRep) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogout, currentUser, onUserSwitch }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const salesRepsOnly = woltersKluwerReps.filter(rep => rep.role === 'Sales Rep');

  return (
    <>
      <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-[60] ios-blur border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-12">
          {/* BRAND */}
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('DASHBOARD')}>
            <div className="bg-white py-2 px-5 rounded-[14px] flex flex-col items-center justify-center shadow-2xl transition-all group-hover:scale-[1.03]">
                <span className="text-[#003A70] font-black text-xl leading-none tracking-tighter">Wolters Kluwer</span>
                <span className="text-[10px] text-teal-600 uppercase tracking-[0.2em] font-black leading-none mt-1">Pipeline Manager</span>
            </div>
          </div>

          {/* NAV TABS */}
          <nav className="hidden lg:flex items-center space-x-2">
            {[
              { id: 'DASHBOARD', label: 'Scorecard' },
              { id: 'DEALS', label: 'My Pipeline' },
              { id: 'COACH', label: 'AI Coach' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => onNavigate(tab.id as View)}
                className={`px-5 py-2.5 rounded-full text-sm font-black uppercase tracking-widest transition-all ${
                  currentView === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex flex-col items-end leading-tight mr-2">
            <span className="text-white font-black text-sm uppercase tracking-widest">Michael T.</span>
            <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">Rank #50 • Sales Rep</span>
          </div>

          <div className="relative">
             <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center p-0.5 rounded-full hover:ring-2 ring-teal-500/50 transition-all duration-300"
             >
                <img 
                    src={currentUser.profilePicUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover shadow-2xl"
                />
             </button>
             
             {isDropdownOpen && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 overflow-hidden animate-ios-slide border border-white">
                    <div className="p-4 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Switch Account</div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {salesRepsOnly.map(rep => (
                            <button 
                                key={rep.id} 
                                onClick={() => {
                                    onUserSwitch(rep);
                                    setIsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-5 py-4 flex items-center space-x-4 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 ${currentUser.id === rep.id ? 'bg-teal-50/50' : ''}`}
                            >
                                <img src={rep.profilePicUrl} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="" />
                                <div>
                                    <p className={`text-[15px] font-black leading-none ${currentUser.id === rep.id ? 'text-teal-600' : 'text-slate-900'}`}>{rep.firstName} {rep.lastName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Rank #??</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="p-3 bg-slate-50 flex gap-2">
                        <button onClick={onLogout} className="flex-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/20">
                            Log Out
                        </button>
                    </div>
                </div>
                </>
             )}
          </div>
        </div>
      </header>
    </>
  );
};