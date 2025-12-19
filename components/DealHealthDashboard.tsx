
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
    <div className="relative h-full w-full bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[24px] p-5 hover:backdrop-blur-[40px] hover:brightness-[1.08] transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col group cursor-pointer shadow-[0_8px_32px_oklch(0.2_0_0_/_0.15)] active:scale-[0.98]">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[oklch(1_0_0_/_0.85)] font-semibold text-[11px] uppercase tracking-[1px]">{title}</h3>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-center min-h-0 text-[oklch(1_0_0_/_0.96)]">
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
      if (score >= 100) return '#00D9FF'; 
      if (score >= 80) return '#60A5FA'; 
      if (score >= 60) return '#FF6B35'; 
      return '#EF4444'; 
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

  // UX Optimization: Fixed Data Structure for Leaderboard view
  const leaderboardData = useMemo(() => {
    if (showFullLeaderboard) {
        return { type: 'full' as const, items: leaderboard };
    }
    
    const top3 = leaderboard.slice(0, 3);
    if (userRank <= 3) {
        return { type: 'full' as const, items: top3 };
    }

    // Context around current user
    const contextStart = Math.max(3, userRankIndex - 1);
    const contextEnd = Math.min(leaderboard.length, userRankIndex + 2);
    const contextWindow = leaderboard.slice(contextStart, contextEnd);
    
    return { 
        type: 'windowed' as const, 
        top3, 
        contextWindow, 
        hasGap: contextStart > 3 
    };
  }, [leaderboard, userRank, userRankIndex, showFullLeaderboard]);

  const quickPathAction = visibleActions.length > 0 ? visibleActions[0] : null;

  return (
    <div className="space-y-6 animate-ios-slide pb-24 mesh-bg min-h-screen p-6 rounded-[48px] -m-4">
      
      {/* 1. SALES EXCELLENCE SCORECARD */}
      <section className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(31,38,135,0.2)]">
        <div className="px-6 py-4 border-b border-white/15 flex justify-between items-center bg-white/5">
            <div>
                <h2 className="text-[oklch(1_0_0_/_0.98)] font-semibold text-lg tracking-[0.5px]">Sales Scorecard</h2>
                <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[2px] mt-0.5">Performance Metrics</p>
            </div>
            <div className="px-3 py-1.5 rounded-full flex items-center space-x-2 bg-[oklch(1_0_0_/_0.25)]">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${animatedScore >= 100 ? 'bg-cyan-400' : (animatedScore >= 80 ? 'bg-blue-400' : 'bg-[#FF6B35]')}`}></div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[oklch(1_0_0_/_0.98)]">
                    {animatedScore >= 100 ? 'Peak' : (animatedScore >= 80 ? 'Solid' : 'In Progress')}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-white/10">
            {/* PERFORMANCE SECTION */}
            <div className="px-6 pt-4 pb-8 flex flex-col items-center">
                <Tooltip 
                    title="DEAL HEALTH BREAKDOWN" 
                    description="Your Health Score is a composite index representing the overall quality, completeness, and risk profile of your active pipeline data."
                    metrics={[
                        { label: 'Process Adherence', value: `${metrics.processAdherence.completionRate}%`, desc: 'Level of compliance with required CRM hygiene standards.' },
                        { label: 'Exposure Risk', value: `${metrics.pipeline.atRisk} Critical`, desc: 'Number of opportunities with significant data gaps or late stages.' },
                        { label: 'Data Integrity', value: `${metrics.dataQuality.score}/100`, desc: 'Statistical accuracy of close dates and value projections.' },
                        { label: 'Momentum', value: metrics.trend, desc: 'The directional movement of your performance score over time.' }
                    ]}
                >
                    <div className="relative w-56 h-56 flex items-center justify-center mb-2 group cursor-pointer">
                        <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_60px_rgba(59,130,246,0.2)] transition-shadow duration-500 pointer-events-none"></div>
                        
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RadialBarChart innerRadius="85%" outerRadius="100%" barSize={14} data={scoreData} startAngle={90} endAngle={-270}>
                                <RadialBar 
                                    background={{ fill: 'rgba(255,255,255,0.06)' }} 
                                    dataKey="value" 
                                    cornerRadius={50} 
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center m-6">
                            <span className="text-[84px] font-[300] tracking-tighter text-[oklch(1_0_0_/_0.96)] leading-none drop-shadow-2xl">{animatedScore}</span>
                            <span className="text-[12px] text-[oklch(1_0_0_/_0.85)] font-semibold uppercase tracking-[2.5px] mt-1">Health</span>
                        </div>
                    </div>
                </Tooltip>

                <div className="w-full max-w-sm space-y-4">
                    {animatedScore >= 100 ? (
                        <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 backdrop-blur-xl border border-white/20 text-[oklch(1_0_0_/_0.98)] p-4 rounded-[20px] text-center shadow-2xl">
                            <span className="text-2xl mb-1 block">🏆</span>
                            <span className="font-semibold text-[11px] uppercase tracking-[2.5px]">Mastery Achieved</span>
                        </div>
                    ) : (
                        <div className="bg-white/5 p-4 rounded-[20px] text-center border border-white/15 backdrop-blur-md shadow-inner">
                             <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-[2px] text-[oklch(1_0_0_/_0.85)] mb-2">
                                <span>Pace to Target</span>
                                <span className="text-[oklch(1_0_0_/_0.96)]">{animatedScore}/100</span>
                             </div>
                             <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] transition-all duration-1000 ease-out" style={{ width: `${animatedScore}%` }}></div>
                             </div>
                             <p className="text-[oklch(1_0_0_/_0.96)] font-semibold text-[11px] uppercase tracking-[2px]">Reach 100% for peak bonus</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => !isRiskComplete && scrollToActions('missing_field')}
                            disabled={isRiskComplete}
                            className={`bg-white/8 border border-white/15 p-3 rounded-[20px] transition-all flex flex-col items-center justify-center backdrop-blur-lg ${isRiskComplete ? 'opacity-40 cursor-default' : 'hover:bg-white/15 hover:border-white/30 hover:shadow-lg active:scale-95'}`}
                        >
                            <p className="text-[11px] font-semibold text-[oklch(1_0_0_/_0.85)] uppercase tracking-[1px] mb-1">Exposure</p>
                            <p className={`font-semibold tracking-tight text-lg text-[oklch(1_0_0_/_0.96)] flex items-center`}>
                                {!isRiskComplete && <span className="w-2 h-2 rounded-full bg-[#FF6B35] mr-2"></span>}
                                {isRiskComplete ? 'None ✓' : `${pointsAtRisk} PTS`}
                            </p>
                        </button>
                        <button 
                            onClick={() => !isGrowthComplete && scrollToActions('potential')}
                            disabled={isGrowthComplete}
                            className={`bg-white/8 border border-white/15 p-3 rounded-[20px] transition-all flex flex-col items-center justify-center backdrop-blur-lg ${isGrowthComplete ? 'opacity-40 cursor-default' : 'hover:bg-white/15 hover:border-white/30 hover:shadow-lg active:scale-95'}`}
                        >
                            <p className="text-[11px] font-semibold text-[oklch(1_0_0_/_0.85)] uppercase tracking-[1px] mb-1">Potential</p>
                            <p className={`font-semibold tracking-tight text-lg text-[oklch(1_0_0_/_0.96)] flex items-center`}>
                                {!isGrowthComplete && <span className="w-2 h-2 rounded-full bg-[#00D9FF] mr-2"></span>}
                                {isGrowthComplete ? 'Maxed ✓' : `+${pointsUnlockable} PTS`}
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {/* LEADERBOARD SECTION */}
            <div className="bg-white/[0.03] p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[oklch(1_0_0_/_0.98)] font-semibold text-base tracking-[0.5px]">Team Rankings</h3>
                    <div className="bg-white/15 text-[oklch(1_0_0_/_0.96)] px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[1.5px] shadow-sm">Current: #{userRank}</div>
                </div>

                <div className="flex-1 space-y-1.5 mb-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {leaderboardData.type === 'full' ? (
                        leaderboardData.items.map(rep => (
                            <LeaderboardRow key={rep.id} rep={rep} isUser={rep.id === currentUser.id} />
                        ))
                    ) : (
                        <>
                            {leaderboardData.top3.map(rep => (
                                <LeaderboardRow key={rep.id} rep={rep} isUser={rep.id === currentUser.id} />
                            ))}
                            
                            {leaderboardData.hasGap && (
                                <div className="py-1 text-center text-white/30 text-[10px] tracking-[4px]">...</div>
                            )}

                            {leaderboardData.contextWindow.map(rep => (
                                <LeaderboardRow key={rep.id} rep={rep} isUser={rep.id === currentUser.id} />
                            ))}
                        </>
                    )}
                </div>
                
                <button 
                    onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                    className="w-full py-3 text-[11px] font-semibold uppercase tracking-[2px] text-white/65 border border-white/15 rounded-xl hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                >
                    {showFullLeaderboard ? 'Close View' : `See All 100 Reps`}
                </button>
            </div>
        </div>

        {/* QUICK PATH CTA */}
        <button 
            onClick={() => quickPathAction && onFixAction(quickPathAction)}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#3B82F6] py-5 px-6 flex items-center justify-between group hover:brightness-110 transition-all duration-500 active:scale-[0.99] border-t border-white/10"
        >
            <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-2 rounded-full text-sm shadow-xl border border-white/30 group-hover:scale-110 transition-transform">⚡</div>
                <div className="text-left">
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-[2.5px] mb-0.5">Top Recommendation</p>
                    <p className="text-[oklch(1_0_0_/_0.98)] font-bold text-base leading-none tracking-tight">{quickPathAction?.label || "Scan for Insights"}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/25 backdrop-blur-xl text-[oklch(1_0_0_/_0.98)] px-4 py-1.5 rounded-full font-black text-[10px] shadow-2xl border border-white/25 group-hover:translate-x-1 transition-all">
                <span>+{quickPathAction?.points || 15} PTS</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
        </button>
      </section>

      {/* 2. METRIC CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
             title="Coverage"
             tooltip={{
                 title: "TERRITORY COVERAGE",
                 description: "The percentage of your annual quota currently represented in your pipeline.",
                 metrics: [{ label: 'Coverage', value: `${Math.round((metrics.territory.coverage / metrics.territory.quotaTarget) * 100)}%`, desc: 'Overall trend vs goal.' }]
             }}
          >
             <div className="text-[28px] font-bold text-[oklch(1_0_0_/_0.96)] mb-1 leading-none">{Math.round((metrics.territory.coverage / metrics.territory.quotaTarget) * 100)}%</div>
             <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[1px] mt-1">to target</p>
          </MetricCard>

          <MetricCard title="Multiple" tooltip={{ 
              title: "PIPELINE MULTIPLE", 
              description: "The ratio of total pipeline value to remaining quota.",
              metrics: [{ label: 'Ratio', value: `${metrics.pipeline.coverageMultiple}x`, desc: 'Target ratio for safe attainment is 3x.' }]
          }}>
             <div className="text-[28px] font-bold text-[oklch(1_0_0_/_0.96)] mb-1 leading-none">{metrics.pipeline.coverageMultiple}x</div>
             <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[1px] mt-1">pipeline multiple</p>
          </MetricCard>

          <MetricCard title="Velocity" tooltip={{ 
              title: "MATURATION VELOCITY", 
              description: "The speed and volume of leads maturing into qualified opportunities.",
              metrics: [{ label: 'SQLs', value: metrics.leadMaturation.sqls, desc: 'Average monthly output.' }]
          }}>
             <div className="text-[28px] font-bold text-[oklch(1_0_0_/_0.96)] mb-1 leading-none">{metrics.leadMaturation.sqls}</div>
             <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[1px] mt-1">SQLs monthly</p>
          </MetricCard>

          <MetricCard title="Adherence" tooltip={{ 
              title: "PROCESS ADHERENCE", 
              description: "Compliance with methodology and data entry requirements.",
              metrics: [{ label: 'Rate', value: `${metrics.processAdherence.completionRate}%`, desc: 'CRM data integrity score.' }]
          }}>
             <div className="text-[28px] font-bold text-[oklch(1_0_0_/_0.96)] mb-1 leading-none">{metrics.processAdherence.completionRate}%</div>
             <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[1px] mt-1">compliance</p>
          </MetricCard>
      </div>

      {/* 3. ACTION PLAN SECTION */}
      <section ref={actionsSectionRef} className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(31,38,135,0.2)] scroll-mt-24">
          <div className="p-5 border-b border-white/15 flex items-center justify-between bg-white/5">
              <div>
                  <h2 className="text-[oklch(1_0_0_/_0.98)] font-semibold text-base tracking-[0.5px]">Prioritized Roadmap</h2>
                  <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[2px] mt-1">Managed by AI Coach</p>
              </div>
              <button onClick={() => onNavigate('DEALS')} className="text-[11px] font-bold text-white/80 border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/10 transition-all uppercase tracking-[2px]">Inspect All</button>
          </div>
          
          <div className="divide-y divide-white/10">
              {visibleActions.length > 0 ? (
                  visibleActions.map((action) => (
                      <div key={action.id} className={`p-5 flex items-center justify-between group hover:bg-white/10 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${highlightedType === action.type ? 'bg-white/20 ring-2 ring-white/30 border-white/20 shadow-2xl' : ''}`}>
                          <div className="flex items-center space-x-5">
                              <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center text-base shrink-0 transition-all duration-300 shadow-xl backdrop-blur-md border border-white/25 ${
                                  action.type === 'missing_field' 
                                    ? 'bg-orange-500/25 text-orange-400 group-hover:bg-orange-500/40' 
                                    : 'bg-cyan-500/25 text-cyan-400 group-hover:bg-cyan-500/40'
                              }`}>
                                  {action.type === 'missing_field' ? '⚠️' : '⚡'}
                              </div>
                              <div>
                                  <p className="text-[oklch(1_0_0_/_0.98)] font-bold text-[14px] tracking-tight mb-1 leading-none">{action.label}</p>
                                  <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[2px] leading-none mt-1.5 flex items-center opacity-60">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 mr-2"></span>
                                      {action.dealName}
                                  </p>
                              </div>
                          </div>
                          <div className="flex items-center space-x-4">
                              <div className="text-right mr-2 hidden sm:block">
                                  <span className="text-cyan-400 font-black text-[11px] tracking-widest">+{action.points} PTS</span>
                                  <div className="w-full h-0.5 bg-cyan-500/20 mt-1 rounded-full"></div>
                              </div>
                              <button 
                                  onClick={() => onFixAction(action)}
                                  className={`w-24 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[2.5px] transition-all duration-300 active:scale-95 shadow-2xl border border-white/15 ${
                                      action.type === 'missing_field' 
                                        ? 'bg-[#FF6B35] text-white hover:bg-orange-500/90 shadow-orange-500/20' 
                                        : 'bg-[#3B82F6] text-white hover:bg-blue-600/90 shadow-blue-500/20'
                                  }`}
                              >
                                  {action.type === 'missing_field' ? 'Resolve' : 'Boost'}
                              </button>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="p-12 text-center bg-white/5 backdrop-blur-md">
                      <div className="text-4xl mb-4 animate-bounce">✨</div>
                      <h3 className="text-[oklch(1_0_0_/_0.98)] font-black text-xl mb-1 tracking-tight">Optimal Performance</h3>
                      <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[2.5px]">Your pipeline hygiene is currently peak.</p>
                  </div>
              )}
          </div>
      </section>
    </div>
  );
};

// Properly type LeaderboardRow as a React.FC to handle React-managed attributes like 'key'.
const LeaderboardRow: React.FC<{ rep: any; isUser: boolean }> = ({ rep, isUser }) => (
    <div className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 ${isUser ? 'bg-white/18 shadow-xl ring-1 ring-white/30 border border-white/10' : 'hover:bg-white/8'}`}>
        <div className="flex items-center space-x-3">
            <span className={`text-[10px] font-black w-5 ${isUser ? 'text-cyan-400' : 'text-white/40'}`}>#{rep.rank}</span>
            <img src={rep.profilePicUrl} className="w-8 h-8 rounded-full object-cover border border-white/25 shadow-md" alt="" />
            <span className={`text-[12px] font-medium ${isUser ? 'text-white font-bold' : 'text-[oklch(1_0_0_/_0.96)]'}`}>
                {isUser ? 'Michael T. (You)' : `${rep.firstName} ${rep.lastName.charAt(0)}.`}
            </span>
        </div>
        <div className="flex items-center space-x-2">
            <span className={`text-[12px] font-black ${isUser ? 'text-cyan-400' : 'text-[oklch(1_0_0_/_0.96)]'}`}>{rep.score}</span>
            {isUser && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>}
        </div>
    </div>
);
