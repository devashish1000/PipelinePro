
import React from 'react';
import { AnalysisResult, TranscriptionItem } from '../types';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';

interface ReportProps {
  analysis: AnalysisResult;
  transcripts: TranscriptionItem[];
  onRestart: () => void;
}

const COLORS = ['#00BFA5', '#465B7D', '#FF6B35', '#818cf8', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ef4444'];

export const Report: React.FC<ReportProps> = ({ analysis, transcripts, onRestart }) => {
  const chartData = analysis.scores.breakdown.map((item, index) => ({
    name: item.label,
    score: item.score,
    fill: item.fill || COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-10 animate-ios-slide pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Simulation Complete</p>
          <h2 className="text-4xl font-black text-white tracking-tight">Performance Analysis</h2>
        </div>
        <button 
            onClick={onRestart}
            className="w-full md:w-auto px-10 py-5 bg-[#FF6B35] hover:bg-[#FF8B60] text-white font-black text-xs uppercase tracking-[0.25em] rounded-[24px] shadow-2xl shadow-orange-500/30 transition-all active:scale-95"
        >
            Restart Sandbox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/40 p-10 rounded-[40px] shadow-2xl lg:col-span-1 flex flex-col items-center">
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-10 w-full text-center">Competency Matrix</h3>
          <div className="relative w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="25%" outerRadius="100%" barSize={chartData.length > 7 ? 8 : 14} data={chartData} startAngle={180} endAngle={0}>
                    <RadialBar background={{ fill: 'rgba(0,0,0,0.03)' }} dataKey="score" cornerRadius={10} />
                    <ChartTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-16">
                <span className="text-7xl font-black text-slate-900 tracking-tighter">{analysis.scores.overall}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Overall Score</span>
            </div>
          </div>
          
          <div className="w-full mt-8 grid grid-cols-2 gap-3">
              {chartData.map(d => (
                  <div key={d.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center leading-none h-6 flex items-center">{d.name}</span>
                      <span className="text-base font-black" style={{ color: d.fill }}>{d.score}%</span>
                  </div>
              ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/95 backdrop-blur-xl border border-white/40 p-10 rounded-[40px] shadow-2xl">
                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8">Executive Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <h4 className="text-teal-600 font-black text-[10px] uppercase tracking-widest flex items-center">
                            <div className="w-2 h-2 rounded-full bg-teal-500 mr-2"></div> Key Strengths
                        </h4>
                        <div className="space-y-4">
                            {analysis.feedback.strengths.map((s, i) => (
                                <div key={i} className="p-5 bg-teal-50 rounded-[20px] border border-teal-100/50">
                                    <p className="text-slate-900 text-sm font-bold leading-relaxed">{s.point}</p>
                                    {s.quote && <p className="mt-3 text-[11px] text-teal-700/60 italic font-medium leading-relaxed">"{s.quote}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div> Growth Areas
                        </h4>
                        <div className="space-y-4">
                            {analysis.feedback.improvements.map((s, i) => (
                                <div key={i} className="p-5 bg-orange-50 rounded-[20px] border border-orange-100/50">
                                    <p className="text-slate-900 text-sm font-bold leading-relaxed">{s.point}</p>
                                    {s.quote && <p className="mt-3 text-[11px] text-orange-700/60 italic font-medium leading-relaxed">"{s.quote}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-10 pt-10 border-t border-slate-50">
                    <p className="text-slate-500 text-sm leading-relaxed font-medium italic italic">"{analysis.feedback.summary}"</p>
                </div>
            </div>
        </div>
      </div>

      {/* Detailed Transcript */}
      <div className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Transcript Analysis</h3>
            <span className="text-[10px] text-teal-600 font-black uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full">{transcripts.length} Interactions</span>
        </div>
        <div className="p-10 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar bg-slate-50/30">
            {transcripts.map((t, idx) => (
                <div key={idx} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[24px] shadow-sm ${
                        t.speaker === 'user' 
                            ? 'bg-[#465B7D] text-white rounded-tr-none' 
                            : 'bg-white text-slate-900 border border-slate-100 rounded-tl-none'
                    }`}>
                        <div className="flex items-center justify-between mb-3 opacity-60">
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {t.speaker === 'user' ? 'Michael T.' : 'Prospect AI'}
                            </span>
                        </div>
                        <p className="text-[14px] leading-relaxed font-medium">{t.text}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
