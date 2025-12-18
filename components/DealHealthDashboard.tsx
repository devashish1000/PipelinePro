import React, { useMemo, useState, useRef, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { SalesRep, View } from '../types';
import { getRepMetrics } from '../data/repMetrics';
import { woltersKluwerReps } from '../data/salesReps';
import { Tooltip } from './Tooltip';
import { ActionItem } from '../App';

interface DashboardProps {
  currentUser: SalesRep;
  onNavigate: (view: View) => void;
  onFixAction: (action: ActionItem) => void;
  completedActionIds: string[];
  activeActionId?: string;
  scoreAdjustment: number;
  allActions: ActionItem[];
}

const MetricCard = ({ title, children, tooltip }: { title: string, children?: React.ReactNode, tooltip: any }) => (
  <Tooltip {...tooltip}>
    <div className="relative h-full w-full bg-white/95 backdrop-blur-md border border-white/20 rounded-[28px] p-4 hover:translate-y-[-4px] transition duration-300 flex flex-col group cursor-pointer shadow-xl active:scale-[0.98]">
        <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em]">{title}</h3>
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-center min-h-0">
            {children}
        </div>
    </div>
  </Tooltip>
);

export const DealHealthDashboard: React.FC<DashboardProps> = ({ 
    currentUser, 
    onNavigate, 
    onFixAction, 
    completedActionIds, 
    activeActionId, 
    scoreAdjustment,
    allActions
}) => {
  const metrics = getRepMetrics(currentUser.id);
  const repName = currentUser.firstName;
  
  const [animatedScore, setAnimatedScore] = useState(metrics.dealHealthScore + scoreAdjustment);
  const targetScoreValue = Math.min(100, metrics.dealHealthScore + scoreAdjustment);

  const actionsSectionRef = useRef<HTMLElement>(null);
  const [highlightedType, setHighlightedType] = useState<string | null>(null);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  const scrollToActions = (type: string) => {
    setHighlightedType(type);
    if (actionsSectionRef.current) {
      actionsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => setHighlightedType(null), 3000);
  };

  useEffect(() => {
    if (animatedScore !== targetScoreValue) {
        const timer = setTimeout(() => {
            const step = targetScoreValue > animatedScore ? 1 : -1;
            setAnimatedScore(prev => prev + step);
        }, 30);
        return () => clearTimeout(timer);
    }
  }, [animatedScore, targetScoreValue]);

  const getRingColor = (score: number) => {
      if (score >= 100) return '#00BFA5';
      if (score >= 80) return '#465B7D';
      if (score >= 60) return '#FF6B35';
      return '#E11D48';
  };

  const scoreData = [{ name: 'Health', value: animatedScore, fill: getRingColor(animatedScore) }];

  const visibleActions = allActions.filter(a => !completedActionIds.includes(a.id));
  const missingFieldActions = visibleActions.filter(a => a.type === 'missing_field');
  const potentialActions = visibleActions.filter(a => a.type === 'potential').sort((a, b) => b.points - a.points);
  
  const pointsAtRisk = missingFieldActions.reduce((sum, a) => sum + a.points, 0);
  const pointsUnlockable = potentialActions.reduce((sum, a) => sum + a.points, 0);

  const isRiskComplete = missingFieldActions.length === 0;
  const isGrowthComplete = potentialActions.length === 0;

  const leaderboard = useMemo(() => {
    return woltersKluwerReps.map(rep => {
        const m = getRepMetrics(rep.id);
        const score = rep.id === currentUser.id ? targetScoreValue : m.dealHealthScore;
        return { ...rep, score };
    }).sort((a, b) => b.score - a.score)
      .map((rep, index) => ({ ...rep, rank: index + 1 }));
  }, [targetScoreValue, currentUser.id]);

  const userRankIndex = leaderboard.findIndex(r => r.id === currentUser.id);
  const userRank = userRankIndex + 1;
  const top10 = leaderboard.slice(0, 10);

  const quickPathAction = visibleActions.length > 0 ? visibleActions[0] : null;

  return (
    <div className="space-y-4 animate-ios-slide pb-20">
      
      {/* 1. SALES EXCELLENCE SCORECARD */}
      <section className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
            <div>
                <h2 className="text-slate-900 font-black text-lg tracking-tight">Sales Scorecard</h2>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Performance Metrics</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full flex items-center space-x-1.5 ${animatedScore >= 100 ? 'bg-teal-500/10' : (animatedScore >= 80 ? 'bg-blue-500/10' : 'bg-orange-500/10')}`}>
                <div className={`w-1 h-1 rounded-full animate-pulse ${animatedScore >= 100 ? 'bg-teal-500' : (animatedScore >= 80 ? 'bg-blue-500' : 'bg-orange-500')}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${animatedScore >= 100 ? 'text-teal-600' : (animatedScore >= 80 ? 'text-blue-600' : 'text-orange-600')}`}>
                    {animatedScore >= 100 ? 'Excellent' : (animatedScore >= 80 ? 'On Target' : 'Improving')}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* PERFORMANCE SECTION */}
            <div className="px-5 pt-2 pb-5 flex flex-col items-center border-r border-slate-50">
                <div className="relative w-40 h-40 flex items-center justify-center mb-1 transform hover:scale-105 transition-all duration-500 cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="85%" outerRadius="100%" barSize={12} data={scoreData} startAngle={90} endAngle={-270}>
                            <RadialBar background={{ fill: 'rgba(0,0,0,0.03)' }} dataKey="value" cornerRadius={50} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black tracking-tighter text-slate-900 leading-none">{animatedScore}</span>
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Health</span>
                    </div>
                </div>

                <div className="w-full max-w-sm space-y-2.5">
                    {animatedScore >= 100 ? (
                        <div className="bg-teal-500 text-white p-3 rounded-[16px] text-center shadow-lg shadow-teal-500/20">
                            <span className="text-lg mb-0.5 block">🎯</span>
                            <span className="font-black text-[9px] uppercase tracking-[0.2em]">Target Achieved!</span>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-3 rounded-[16px] text-center border border-slate-100">
                             <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{animatedScore}/100</span>
                             </div>
                             <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                                <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${animatedScore}%` }}></div>
                             </div>
                             <p className="text-slate-900 font-black text-[10px] uppercase tracking-widest">+{100 - animatedScore}pts to target</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                        <button 
                            onClick={() => !isRiskComplete && scrollToActions('missing_field')}
                            disabled={isRiskComplete}
                            className={`bg-white border-2 border-slate-100 p-2.5 rounded-[16px] transition-all flex flex-col items-center justify-center ${isRiskComplete ? 'opacity-50 cursor-default grayscale' : 'hover:border-teal-500/30 active:scale-95'}`}
                        >
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Risk</p>
                            <p className={`font-black tracking-tight ${isRiskComplete ? 'text-slate-400 text-[10px]' : 'text-base text-orange-500'}`}>
                                {isRiskComplete ? 'All Completed ✓' : `${pointsAtRisk} PTS`}
                            </p>
                        </button>
                        <button 
                            onClick={() => !isGrowthComplete && scrollToActions('potential')}
                            disabled={isGrowthComplete}
                            className={`bg-white border-2 border-slate-100 p-2.5 rounded-[16px] transition-all flex flex-col items-center justify-center ${isGrowthComplete ? 'opacity-50 cursor-default grayscale' : 'hover:border-teal-500/30 active:scale-95'}`}
                        >
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Growth</p>
                            <p className={`font-black tracking-tight ${isGrowthComplete ? 'text-slate-400 text-[10px]' : 'text-base text-teal-500'}`}>
                                {isGrowthComplete ? 'All Completed ✓' : `+${pointsUnlockable} PTS`}
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {/* LEADERBOARD SECTION */}
            <div className="bg-slate-50/50 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-slate-900 font-black text-sm tracking-tight">Leaderboard</h3>
                    <div className="bg-[#465B7D] text-white px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Rank #{userRank}</div>
                </div>

                <div className="space-y-1 mb-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                    {(showFullLeaderboard ? leaderboard : top10).map((rep: any) => {
                        const isUser = rep.id === currentUser.id;
                        return (
                            <div key={rep.id} className={`flex items-center justify-between p-2 rounded-lg transition ${isUser ? 'bg-white shadow-sm ring-1 ring-teal-500/10' : 'hover:bg-white/40'}`}>
                                <div className="flex items-center space-x-2.5">
                                    <span className={`text-[9px] font-black w-4 ${isUser ? 'text-teal-600' : 'text-slate-400'}`}>#{rep.rank}</span>
                                    <img src={rep.profilePicUrl} className="w-7 h-7 rounded-full object-cover border border-white shadow-sm" alt="" />
                                    <span className={`text-[11px] font-bold ${isUser ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {isUser ? 'MICHAEL (YOU)' : `${rep.firstName} ${rep.lastName.charAt(0)}.`}
                                    </span>
                                </div>
                                <span className={`text-[11px] font-black ${isUser ? 'text-teal-600' : 'text-slate-900'}`}>{rep.score}</span>
                            </div>
                        );
                    })}
                </div>
                
                <button 
                    onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                    className="w-full py-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#465B7D] border border-[#465B7D]/10 rounded-lg hover:bg-[#465B7D]/5 transition"
                >
                    {showFullLeaderboard ? 'Collapse' : 'View All 100 Reps'}
                </button>
            </div>
        </div>

        {/* QUICK PATH CTA */}
        <button 
            onClick={() => quickPathAction && onFixAction(quickPathAction)}
            className="w-full bg-[#FF6B35] py-3.5 px-5 flex items-center justify-between group hover:saturate-150 transition-all active:scale-[0.99]"
        >
            <div className="flex items-center space-x-2.5">
                <div className="bg-white/20 p-1 rounded-full text-xs">🎯</div>
                <div className="text-left">
                    <p className="text-white/70 text-[7px] font-black uppercase tracking-[0.2em]">Recommended</p>
                    <p className="text-white font-black text-xs leading-none">{quickPathAction?.label || "Optimize Pipeline"}</p>
                </div>
            </div>
            <div className="flex items-center space-x-1 bg-white text-[#FF6B35] px-3 py-1 rounded-full font-black text-[9px] shadow-xl">
                <span>+{quickPathAction?.points || 15} PTS</span>
            </div>
        </button>
      </section>

      {/* 2. METRIC CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard 
             title="Coverage"
             tooltip={{
                 title: "COVERAGE (88% to target)",
                 description: "Analysis of territory gap vs goal.",
                 metrics: [
                     { label: 'Gap to Goal', value: '$49k', desc: 'Need $49k more (12% gap)' },
                     { label: 'Quick Win', value: '$85k', desc: '5 deals at 70%+ probability = $85k' },
                     { label: 'Risk', value: '$120k', desc: '⚠️ $120k in deals untouched 14+ days' }
                 ]
             }}
          >
             <div className="text-xl font-black text-slate-900 mb-0.5">{Math.round((metrics.territory.coverage / metrics.territory.quotaTarget) * 100)}%</div>
             <p className="text-slate-500 text-[8px] font-medium">to target</p>
          </MetricCard>

          <MetricCard title="Multiple" tooltip={{ 
              title: "MULTIPLE (0.9x pipeline multiple)", 
              description: "Pipeline depth and health assessment.",
              metrics: [
                  { label: 'Health Status', value: 'Low', desc: 'Need $452k more pipeline for healthy 2.0x' },
                  { label: 'Bottleneck', value: '60%', desc: '60% early stage vs optimal 40%' },
                  { label: 'Forecast', value: 'Behind', desc: 'Current pace = 65% of quota this quarter' }
              ]
          }}>
             <div className="text-xl font-black text-slate-900 mb-0.5">{metrics.pipeline.coverageMultiple}x</div>
             <p className="text-slate-500 text-[8px] font-medium">pipeline multiple</p>
          </MetricCard>

          <MetricCard title="Velocity" tooltip={{ 
              title: "VELOCITY (26 SQLs monthly)", 
              description: "Throughput and conversion performance.",
              metrics: [
                  { label: 'Conversion', value: '18%', desc: '18% MQL→SQL vs team avg 28% (losing 42 SQLs/mo)' },
                  { label: 'Cycle Time', value: '92d', desc: '92 days vs team avg 67 days (costing $180k)' },
                  { label: 'Quick Fix', value: '+60%', desc: 'Respond to MQLs within 1hr = +60% conversion' }
              ]
          }}>
             <div className="text-xl font-black text-slate-900 mb-0.5">{metrics.leadMaturation.sqls}</div>
             <p className="text-slate-500 text-[8px] font-medium">SQLs monthly</p>
          </MetricCard>

          <MetricCard title="Adherence" tooltip={{ 
              title: "ADHERENCE (75% compliance)", 
              description: "Execution tracking against methodology.",
              metrics: [
                  { label: 'Missing Steps', value: 'High', desc: 'Discovery (18%), Champion ID (22%), Exec sponsor (31%)' },
                  { label: 'Impact', value: '2.2x', desc: '42% win rate with all steps vs 19% without' },
                  { label: 'At Risk', value: '$240k', desc: '$240k in 8 deals missing required steps' }
              ]
          }}>
             <div className="text-xl font-black text-slate-900 mb-0.5">{metrics.processAdherence.completionRate}%</div>
             <p className="text-slate-500 text-[8px] font-medium">compliance</p>
          </MetricCard>
      </div>

      {/* 3. ACTION PLAN SECTION */}
      <section ref={actionsSectionRef} className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-[32px] overflow-hidden shadow-2xl scroll-mt-20">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                  <h2 className="text-slate-900 font-black text-base tracking-tight leading-none">Action Plan</h2>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">Michael Thompson</p>
              </div>
              <button onClick={() => onNavigate('DEALS')} className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline">View All</button>
          </div>
          
          <div className="divide-y divide-slate-50">
              {visibleActions.length > 0 ? (
                  visibleActions.map(action => (
                      <div key={action.id} className={`p-4 flex items-center justify-between group hover:bg-slate-50/50 transition duration-300 ${highlightedType === action.type ? 'bg-teal-50 ring-2 ring-teal-500/20' : ''}`}>
                          <div className="flex items-center space-x-3.5">
                              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center text-sm shrink-0 transition shadow-sm ${
                                  action.type === 'missing_field' ? 'bg-orange-500/10 text-orange-500' : 'bg-teal-500/10 text-teal-500'
                              }`}>
                                  {action.type === 'missing_field' ? '⚠️' : '⚡'}
                              </div>
                              <div>
                                  <p className="text-slate-900 font-black text-[13px] tracking-tight mb-0.5 leading-none">{action.label}</p>
                                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest leading-none">{action.dealName}</p>
                              </div>
                          </div>
                          <div className="flex items-center space-x-3">
                              <span className="text-teal-600 font-black text-[10px]">+{action.points} PTS</span>
                              <button 
                                  onClick={() => onFixAction(action)}
                                  className={`w-20 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition shadow-sm active:scale-95 ${
                                      action.type === 'missing_field' ? 'bg-[#FF6B35] text-white shadow-orange-500/20' : 'bg-[#10B981] text-white shadow-emerald-500/20'
                                  }`}
                              >
                                  {action.type === 'missing_field' ? 'Fix' : 'Unlock'}
                              </button>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="p-8 text-center">
                      <div className="text-3xl mb-3">🎉</div>
                      <h3 className="text-slate-900 font-black text-lg mb-0.5 tracking-tight">On Track!</h3>
                      <p className="text-slate-500 text-[10px] font-medium">Cleared all recommendations.</p>
                  </div>
              )}
          </div>
      </section>
    </div>
  );
};
