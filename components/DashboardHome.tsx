import React from 'react';

export const DashboardHome = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, Alex</h1>
            <p className="text-slate-400 mt-1">Here is your training overview for the week.</p>
         </div>
         <button className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            View Full Report
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Sessions Completed</h3>
            <p className="text-3xl font-bold text-white mt-2">24</p>
            <span className="text-emerald-400 text-xs font-medium">+4 this week</span>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Avg. Empathy Score</h3>
            <p className="text-3xl font-bold text-white mt-2">87</p>
            <span className="text-emerald-400 text-xs font-medium">+12% vs last month</span>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Win Rate (Simulated)</h3>
            <p className="text-3xl font-bold text-white mt-2">64%</p>
            <span className="text-slate-500 text-xs font-medium">Consistent</span>
         </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
         <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
         </div>
         <div className="divide-y divide-slate-700">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </div>
                        <div>
                            <p className="text-white font-medium">Negotiation with "Skeptical CTO"</p>
                            <p className="text-slate-400 text-sm">2 hours ago • Duration: 5m 12s</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-white font-bold">92/100</p>
                            <p className="text-xs text-slate-400">Score</p>
                        </div>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};
