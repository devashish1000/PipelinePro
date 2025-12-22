import React from 'react';
import { AnalysisResult, TranscriptionItem, Scenario, SalesRep } from '../types';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';

interface ReportProps {
  analysis: AnalysisResult;
  transcripts: TranscriptionItem[];
  onRestart: () => void;
  scenario: Scenario | null;
  currentUser: SalesRep;
}

const COLORS = ['#00BFA5', '#465B7D', '#FF6B35', '#818cf8', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ef4444'];

export const Report: React.FC<ReportProps> = ({ analysis, transcripts, onRestart, scenario, currentUser }) => {
  const chartData = analysis.scores.breakdown.map((item, index) => ({
    name: item.label,
    score: item.score,
    fill: item.fill || COLORS[index % COLORS.length]
  }));

  const handleDownloadTranscript = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const transcriptHtml = transcripts.map(t => `
      <div style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
          ${t.speaker === 'user' ? `SALES REP (${currentUser.firstName})` : 'PROSPECT AI'}
        </div>
        <div style="font-size: 13px; color: #1e293b; line-height: 1.6; font-weight: 500;">
          ${t.text}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>WK AI Coach Transcript - ${currentUser.firstName} ${currentUser.lastName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              color: #1e293b; 
              margin: 0; 
              padding: 40px; 
              line-height: 1.5;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 2px solid #f1f5f9; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .logo-section { display: flex; flex-direction: column; }
            .logo-img { height: 32px; object-fit: contain; }
            .date { font-size: 12px; font-weight: 700; color: #64748b; }
            
            .main-title { font-size: 28px; font-weight: 900; margin-bottom: 24px; color: #0f172a; }
            
            .metadata-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 40px; 
              background: #f8fafc; 
              padding: 24px; 
              border-radius: 16px; 
            }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
            .meta-value { font-size: 14px; font-weight: 700; color: #334155; }
            
            .transcript-section { border-top: 1px solid #f1f5f9; padding-top: 30px; }
            .footer { 
              margin-top: 50px; 
              padding-top: 20px; 
              border-top: 1px solid #f1f5f9; 
              display: flex; 
              justify-content: space-between; 
              font-size: 10px; 
              color: #94a3b8; 
              font-weight: 500;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Wolters_Kluwer_logo.svg/320px-Wolters_Kluwer_logo.svg.png" class="logo-img" alt="Wolters Kluwer">
            </div>
            <div class="date">${dateStr}</div>
          </div>
          
          <h1 class="main-title">AI Coach Session Transcript</h1>
          
          <div class="metadata-grid">
            <div class="meta-item">
              <span class="meta-label">Sales Rep</span>
              <span class="meta-value">${currentUser.firstName} ${currentUser.lastName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date</span>
              <span class="meta-value">${dateStr}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Duration</span>
              <span class="meta-value">${scenario?.duration || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Overall Score</span>
              <span class="meta-value" style="color: #00BFA5">${analysis.scores.overall}/100</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Prospect Profile</span>
              <span class="meta-value">${scenario?.prospectRole || 'Unknown'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Target Product</span>
              <span class="meta-value">${scenario?.product || 'Unknown'}</span>
            </div>
            <div class="meta-item" style="grid-column: span 2">
              <span class="meta-label">Difficulty</span>
              <span class="meta-value">${scenario?.difficulty || 'Medium'}</span>
            </div>
          </div>
          
          <div class="transcript-section">
            ${transcriptHtml}
          </div>
          
          <div class="footer">
            <span>© 2025 Wolters Kluwer N.V.</span>
            <span>AI Sales Simulation Record</span>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-3 animate-ios-slide pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Simulation Complete</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Performance Analysis</h2>
        </div>
        <button 
            onClick={onRestart}
            className="w-full md:w-auto px-8 py-4 bg-[#FF6B35] hover:bg-[#FF8B60] text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-[20px] shadow-2xl shadow-orange-500/30 transition-all active:scale-95"
        >
            Restart Sandbox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Score Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/40 pt-3 pb-4 px-5 rounded-[32px] shadow-2xl lg:col-span-1 flex flex-col items-center">
          <h3 className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1 w-full text-center">Competency Matrix</h3>
          <div className="relative w-full h-40">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadialBarChart innerRadius="25%" outerRadius="100%" barSize={chartData.length > 7 ? 6 : 10} data={chartData} startAngle={180} endAngle={0}>
                    <RadialBar background={{ fill: 'rgba(0,0,0,0.03)' }} dataKey="score" cornerRadius={10} />
                    <ChartTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-14">
                <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{analysis.scores.overall}</span>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Overall Score</span>
            </div>
          </div>
          
          <div className="w-full mt-0 grid grid-cols-2 gap-2">
              {chartData.map(d => (
                  <div key={d.name} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center leading-none h-3.5 flex items-center">{d.name}</span>
                      <span className="text-xs font-black" style={{ color: d.fill }}>{d.score}%</span>
                  </div>
              ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="lg:col-span-2 space-y-3">
            <div className="bg-white/95 backdrop-blur-xl border border-white/40 p-5 rounded-[32px] shadow-2xl h-full">
                <h3 className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-3">Executive Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                        <h4 className="text-teal-600 font-black text-[9px] uppercase tracking-widest flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2"></div> Key Strengths
                        </h4>
                        <div className="space-y-2.5">
                            {analysis.feedback.strengths.map((s, i) => (
                                <div key={i} className="p-3.5 bg-teal-50/70 rounded-[18px] border border-teal-100/50">
                                    <p className="text-slate-900 text-[13px] font-bold leading-snug">{s.point}</p>
                                    {s.quote && <p className="mt-1.5 text-[11px] text-teal-600 italic font-medium leading-relaxed">"{s.quote}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-orange-600 font-black text-[9px] uppercase tracking-widest flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></div> Growth Areas
                        </h4>
                        <div className="space-y-2.5">
                            {analysis.feedback.improvements.map((s, i) => (
                                <div key={i} className="p-3.5 bg-orange-50/70 rounded-[18px] border border-orange-100/50">
                                    <p className="text-slate-900 text-[13px] font-bold leading-snug">{s.point}</p>
                                    {s.quote && <p className="mt-1.5 text-[11px] text-orange-600 italic font-medium leading-relaxed">"{s.quote}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-50">
                    <p className="text-slate-500 text-[12px] leading-relaxed font-medium italic">"{analysis.feedback.summary}"</p>
                </div>
            </div>
        </div>
      </div>

      {/* Download Action */}
      <div className="flex justify-center pt-2">
        <button 
          onClick={handleDownloadTranscript}
          className="flex items-center space-x-3.5 bg-white/95 backdrop-blur-xl border border-white/40 px-8 py-4 rounded-[12px] shadow-xl hover:shadow-2xl hover:opacity-90 transition-all active:scale-[0.98] group"
        >
          <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <span className="text-slate-800 font-semibold text-[16px]">Download Transcript</span>
        </button>
      </div>
    </div>
  );
};
