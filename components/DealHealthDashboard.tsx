
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { SalesRep, View } from '../types';
import { getRepMetrics } from '../data/repMetrics';
import { woltersKluwerReps } from '../data/salesReps';
import { Tooltip } from './Tooltip';
import { ActionItem } from '../App';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  currentUser: SalesRep;
  onNavigate: (view: View) => void;
  onFixAction: (action: ActionItem) => void;
  completedActionIds: string[];
  activeActionId?: string;
  scoreAdjustment: number;
  allActions: ActionItem[];
}

const ZoomCardHeader = ({ title, onClose, colorClass = "text-teal-400" }: { title: string, onClose: () => void, colorClass?: string }) => (
  <div className="flex justify-between items-center mb-4">
    <h3 className={`${colorClass} font-black text-[10px] uppercase tracking-[3px]`}>{title} Analysis</h3>
    <button 
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
    >
      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const ZoomStatPill = ({ label, value, sub }: { label: string, value: string, sub: string }) => (
  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-0.5">{label}</span>
    <div className="text-lg font-black text-white leading-none mb-0.5">{value}</div>
    <p className="text-[8px] text-white/60 font-medium">{sub}</p>
  </div>
);

const ZoomActionSection = ({ title, items, accentColor = "bg-teal-400" }: { title: string, items: { account: string, type: string }[], accentColor?: string }) => (
  <div className="flex-1 min-w-0">
    <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center">
      <span className={`w-1 h-1 ${accentColor} rounded-full mr-1.5`}></span> {title}
    </h4>
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] font-bold text-white truncate mb-0.5">{item.account}</span>
          <span className={`text-[7px] font-black uppercase tracking-tighter opacity-80 ${accentColor.replace('bg-', 'text-')}`}>
            {item.type}
          </span>
        </div>
      ))}
    </div>
  </div>
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
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

  const userRank = leaderboard.findIndex(r => r.id === currentUser.id) + 1;

  const leaderboardData = useMemo(() => {
    if (showFullLeaderboard) return { type: 'full' as const, items: leaderboard };
    const top3 = leaderboard.slice(0, 3);
    if (userRank <= 3) return { type: 'full' as const, items: top3 };
    const userRankIndex = userRank - 1;
    const contextStart = Math.max(3, userRankIndex - 1);
    const contextEnd = Math.min(leaderboard.length, userRankIndex + 2);
    const contextWindow = leaderboard.slice(contextStart, contextEnd);
    return { type: 'windowed' as const, top3, contextWindow, hasGap: contextStart > 3 };
  }, [leaderboard, userRank, showFullLeaderboard]);

  const quickPathAction = visibleActions.length > 0 ? visibleActions[0] : null;

  const ScoreCardItem = ({ id, title, value, sub }: { id: string, title: string, value: string, sub: string }) => (
    <motion.button
      layoutId={`card-${id}`}
      onClick={() => setExpandedCard(id)}
      className="bg-white/10 backdrop-blur-[24px] border border-white/20 rounded-[24px] p-5 flex flex-col justify-between shadow-xl text-left transition-all active:scale-95"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white/80 font-black text-[10px] uppercase tracking-[2px]">{title}</h3>
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
          <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </div>
      </div>
      <div>
        <div className="text-[32px] font-black text-white leading-none tracking-tighter mb-1">{value}</div>
        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">{sub}</p>
      </div>
    </motion.button>
  );

  return (
    <div className="space-y-6 animate-ios-slide pb-32 mesh-bg min-h-screen p-4 md:p-8 w-full flex flex-col relative">
      
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
            <div className="px-6 pt-4 pb-8 flex flex-col items-center">
                <Tooltip 
                    title="DEAL HEALTH BREAKDOWN" 
                    description="Your Health Score represents overall pipeline data quality."
                    metrics={[
                        { label: 'Process Adherence', value: `${metrics.processAdherence.completionRate}%`, desc: 'CRM hygiene standards.' },
                        { label: 'Exposure Risk', value: `${metrics.pipeline.atRisk} Critical`, desc: 'Opportunities with significant data gaps.' },
                        { label: 'Momentum', value: metrics.trend, desc: 'Directional movement of performance.' }
                    ]}
                >
                    <div className="relative w-56 h-56 flex items-center justify-center mb-2 group cursor-pointer">
                        <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_60px_rgba(59,130,246,0.2)] transition-shadow duration-500 pointer-events-none"></div>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RadialBarChart innerRadius="85%" outerRadius="100%" barSize={14} data={scoreData} startAngle={90} endAngle={-270}>
                                <RadialBar background={{ fill: 'rgba(255,255,255,0.06)' }} dataKey="value" cornerRadius={50} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center m-6">
                            <span className="text-[84px] font-[300] tracking-tighter text-[oklch(1_0_0_/_0.96)] leading-none drop-shadow-2xl">{animatedScore}</span>
                            <span className="text-[12px] text-[oklch(1_0_0_/_0.85)] font-semibold uppercase tracking-[2.5px] mt-1">Health</span>
                        </div>
                    </div>
                </Tooltip>

                <div className="w-full max-sm space-y-3">
                    <div className="grid grid-cols-1 gap-2.5">
                        <button 
                            onClick={() => !isRiskComplete && scrollToActions('missing_field')}
                            disabled={isRiskComplete}
                            className={`group relative bg-white/5 border border-white/15 p-4 px-5 rounded-[20px] transition-all flex flex-row items-center justify-between backdrop-blur-lg ${isRiskComplete ? 'opacity-40 cursor-default' : 'hover:bg-white/15 hover:border-white/30 hover:shadow-lg active:scale-95'}`}
                        >
                            <span className="text-[12px] font-black text-[oklch(1_0_0_/_0.98)] uppercase tracking-[1.5px]">Fix Issues</span>
                            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ${isRiskComplete ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500 text-white border border-white/20'}`}>
                                {isRiskComplete ? <>NONE ✓</> : <>⚠️ {missingFieldActions.length} MISSING</>}
                            </div>
                        </button>
                        <button 
                            onClick={() => !isGrowthComplete && scrollToActions('potential')}
                            disabled={isGrowthComplete}
                            className={`group relative bg-white/5 border border-white/15 p-4 px-5 rounded-[20px] transition-all flex flex-row items-center justify-between backdrop-blur-lg ${isGrowthComplete ? 'opacity-40 cursor-default' : 'hover:bg-white/15 hover:border-white/30 hover:shadow-lg active:scale-95'}`}
                        >
                            <span className="text-[12px] font-black text-[oklch(1_0_0_/_0.98)] uppercase tracking-[1.5px]">Earn Points</span>
                            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ${isGrowthComplete ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500 text-white border border-white/20'}`}>
                                {isGrowthComplete ? <>MAXED ✓</> : <>⚡ +{pointsUnlockable} PTS</>}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.03] p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[oklch(1_0_0_/_0.98)] font-semibold text-base tracking-[0.5px]">Team Rankings</h3>
                    <div className="bg-white/15 text-[oklch(1_0_0_/_0.96)] px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[1.5px] shadow-sm">Current: #{userRank}</div>
                </div>
                <div className="flex-1 space-y-1.5 mb-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {leaderboardData.type === 'full' ? leaderboardData.items.map(rep => <LeaderboardRow key={rep.id} rep={rep} isUser={rep.id === currentUser.id} />) : (
                        <>
                            {leaderboardData.top3.map(rep => <LeaderboardRow key={rep.id} rep={rep} isUser={rep.id === currentUser.id} />)}
                            {leaderboardData.hasGap && <div className="py-1 text-center text-white/30 text-[10px] tracking-[4px]">...</div>}
                            {leaderboardData.contextWindow.map(rep => <LeaderboardRow key={rep.id} rep={rep} isUser={rep.id === currentUser.id} />)}
                        </>
                    )}
                </div>
                <button onClick={() => setShowFullLeaderboard(!showFullLeaderboard)} className="w-full py-3 text-[11px] font-semibold uppercase tracking-[2px] text-white/65 border border-white/15 rounded-xl hover:bg-white/10 hover:text-white transition-all backdrop-blur-md">
                    {showFullLeaderboard ? 'Close View' : `See All 100 Reps`}
                </button>
            </div>
        </div>

        <button onClick={() => quickPathAction && onFixAction(quickPathAction)} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#3B82F6] py-5 px-6 flex items-center justify-between group hover:brightness-110 transition-all duration-500 active:scale-[0.99] border-t border-white/10">
            <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-2 rounded-full text-sm shadow-xl border border-white/30 group-hover:scale-110 transition-transform">⚡</div>
                <div className="text-left">
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-[2.5px] mb-0.5">Top Recommendation</p>
                    <p className="text-[oklch(1_0_0_/_0.98)] font-bold text-base leading-none tracking-tight">{quickPathAction?.label || "Scan for Insights"}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/25 backdrop-blur-xl text-[oklch(1_0_0_/_0.96)] px-4 py-1.5 rounded-full font-black text-[10px] shadow-2xl border border-white/25 group-hover:translate-x-1 transition-all">
                <span>+{quickPathAction?.points || 15} PTS</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
        </button>
      </section>

      {/* 2. FOUR INTERACTIVE PULSE CARDS (2x2 GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCardItem 
            id="coverage"
            title="Coverage" 
            value={`${Math.round((metrics.territory.coverage / metrics.territory.quotaTarget) * 100)}%`} 
            sub="to target"
          />
          <ScoreCardItem 
            id="multiple"
            title="Multiple" 
            value={`${metrics.pipeline.coverageMultiple}x`} 
            sub="pipeline multiple"
          />
          <ScoreCardItem 
            id="velocity"
            title="Velocity" 
            value={`${metrics.leadMaturation.sqls}`} 
            sub="SQLs monthly"
          />
          <ScoreCardItem 
            id="adherence"
            title="Adherence" 
            value={`${metrics.processAdherence.completionRate}%`} 
            sub="compliance"
          />
      </div>

      {/* EXPANDED CARD OVERLAY */}
      <AnimatePresence>
        {expandedCard && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedCard(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl saturate-[1.6]"
            />
            
            <motion.div 
              layoutId={`card-${expandedCard}`}
              className="relative w-full max-w-lg bg-[#0F172A]/90 backdrop-blur-[40px] border border-white/20 rounded-[32px] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between h-[auto] max-h-[85vh]"
            >
              {expandedCard === 'coverage' && (
                <>
                  <ZoomCardHeader title="Coverage" onClose={() => setExpandedCard(null)} />
                  <div className="text-center mb-6">
                    <div className="text-[52px] font-black text-white leading-none tracking-tighter mb-1">95%</div>
                    <div className="flex items-center justify-center space-x-1.5">
                       <span className="text-teal-400 font-black text-[9px] uppercase tracking-widest">To Target</span>
                       <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                        <div className="h-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.6)]" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <ZoomStatPill label="Quota Gap" value={`$${((metrics.territory.quotaTarget - metrics.territory.coverage) / 1000).toFixed(0)}k`} sub="To hit 100% quota." />
                    <ZoomStatPill label="Weighted" value="$1.1M" sub="Risk-adjusted view." />
                  </div>
                  <div className="flex gap-4 mb-8">
                    <ZoomActionSection title="Whitespace" items={[
                      { account: 'Mayo Clinic', type: 'VitalLaw' },
                      { account: 'Skadden Arps', type: 'Tax' }
                    ]} />
                    <ZoomActionSection title="Renewals" items={[
                      { account: 'UnitedHealth', type: 'Exp. 24d' },
                      { account: 'Baker McK.', type: 'Exp. 12d' }
                    ]} />
                  </div>
                  <button onClick={() => { setExpandedCard(null); onNavigate('DEALS'); }} className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">View All in Pipeline</span>
                    <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </>
              )}

              {expandedCard === 'multiple' && (
                <>
                  <ZoomCardHeader title="Multiple" onClose={() => setExpandedCard(null)} colorClass="text-blue-400" />
                  <div className="text-center mb-6">
                    <div className="text-[52px] font-black text-white leading-none tracking-tighter mb-1">0.9x</div>
                    <div className="flex items-center justify-center space-x-1.5">
                       <span className="text-blue-400 font-black text-[9px] uppercase tracking-widest">Below 3x Benchmark</span>
                       <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                        <div className="h-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <ZoomStatPill label="Pipeline Deficit" value="$1.2M" sub="To reach 3x coverage." />
                    <ZoomStatPill label="Reality Score" value="42%" sub="Win-rate adjusted." />
                  </div>
                  <div className="flex gap-4 mb-8">
                    <ZoomActionSection title="Focus: Ghost Deals" items={[
                      { account: 'HCA Healthcare', type: '32 Days Stale' },
                      { account: 'Latham & Watkins', type: '24 Days Stale' }
                    ]} accentColor="bg-blue-400" />
                    <ZoomActionSection title="Concentration" items={[
                      { account: 'CVS Health', type: '18% of Pipe' },
                      { account: 'Deloitte', type: '12% of Pipe' }
                    ]} accentColor="bg-blue-400" />
                  </div>
                  <button onClick={() => { setExpandedCard(null); onNavigate('DEALS'); }} className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">Audit Large Deals</span>
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </>
              )}

              {expandedCard === 'velocity' && (
                <>
                  <ZoomCardHeader title="Velocity" onClose={() => setExpandedCard(null)} colorClass="text-emerald-400" />
                  <div className="text-center mb-6">
                    <div className="text-[52px] font-black text-white leading-none tracking-tighter mb-1">26</div>
                    <div className="flex items-center justify-center space-x-1.5">
                       <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest">SQLs Monthly</span>
                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                        <div className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <ZoomStatPill label="Speed-to-Lead" value="2.4 hrs" sub="MQL to Discovery." />
                    <ZoomStatPill label="Discovery Age" value="14 Days" sub="Avg Stage Length." />
                  </div>
                  <div className="flex gap-4 mb-8">
                    <ZoomActionSection title="Surging Intent" items={[
                      { account: 'UnitedHealth', type: 'High Activity' },
                      { account: 'JPM Chase', type: 'Webinar Attendee' }
                    ]} accentColor="bg-emerald-400" />
                    <ZoomActionSection title="Demo Risk" items={[
                      { account: 'Sidley Austin', type: 'No-Show 2x' },
                      { account: 'Bank of Am.', type: 'Contact Gap' }
                    ]} accentColor="bg-emerald-400" />
                  </div>
                  <button onClick={() => { setExpandedCard(null); onNavigate('DEALS'); }} className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">Accelerate Discovery</span>
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </>
              )}

              {expandedCard === 'adherence' && (
                <>
                  <ZoomCardHeader title="Adherence" onClose={() => setExpandedCard(null)} colorClass="text-purple-400" />
                  <div className="text-center mb-6">
                    <div className="text-[52px] font-black text-white leading-none tracking-tighter mb-1">75%</div>
                    <div className="flex items-center justify-center space-x-1.5">
                       <span className="text-purple-400 font-black text-[9px] uppercase tracking-widest">CRM Compliance</span>
                       <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                        <div className="h-full bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <ZoomStatPill label="Hygiene Score" value="A-" sub="MEDDPICC Complete." />
                    <ZoomStatPill label="Stale Dates" value="4 Deals" sub="Past-due Closures." />
                  </div>
                  <div className="flex gap-4 mb-8">
                    <ZoomActionSection title="Missing Next Step" items={[
                      { account: 'Microsoft', type: 'No Future Task' },
                      { account: 'Anthem', type: 'No Future Task' }
                    ]} accentColor="bg-purple-400" />
                    <ZoomActionSection title="Single-Threaded" items={[
                      { account: 'Walmart', type: '1 Decision Maker' },
                      { account: 'EY Global', type: '1 Decision Maker' }
                    ]} accentColor="bg-purple-400" />
                  </div>
                  <button onClick={() => { setExpandedCard(null); onNavigate('DEALS'); }} className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">Sync Next Steps</span>
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PRIORITIZED ROADMAP */}
      <section ref={actionsSectionRef} className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(31,38,135,0.2)] scroll-mt-24">
          <div className="p-5 border-b border-white/15 flex items-center justify-between bg-white/5">
              <div>
                  <h2 className="text-[oklch(1_0_0_/_0.98)] font-semibold text-base tracking-[0.5px]">Prioritized Roadmap</h2>
                  <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[2px] mt-1">Managed by AI Coach</p>
              </div>
          </div>
          <div className="divide-y divide-white/10">
              {visibleActions.length > 0 ? (
                  visibleActions.map((action) => (
                      <div key={action.id} className={`p-5 flex items-center justify-between group hover:bg-white/10 transition-all duration-300 ${highlightedType === action.type ? 'bg-white/20 ring-2 ring-white/30' : ''}`}>
                          <div className="flex items-center space-x-5 min-w-0 flex-1">
                              <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center text-base shrink-0 border border-white/25 ${action.type === 'missing_field' ? 'bg-orange-500/25 text-orange-400' : 'bg-cyan-500/25 text-cyan-400'}`}>
                                  {action.type === 'missing_field' ? '⚠️' : '⚡'}
                              </div>
                              <div className="min-w-0 flex-1 pr-4">
                                  <p className="text-[oklch(1_0_0_/_0.98)] font-bold text-[14px] tracking-tight mb-1 leading-snug break-words">{action.label}</p>
                                  <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-bold uppercase tracking-[0.5px] leading-tight mt-1.5 opacity-80 flex items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 mr-2 shrink-0 mt-1"></span>
                                      <span className="flex-1 break-words">{action.dealName}</span>
                                  </p>
                              </div>
                          </div>
                          <div className="flex items-center space-x-4 shrink-0">
                              <button onClick={() => onFixAction(action)} className={`w-20 py-2 rounded-full text-[9px] font-black uppercase tracking-[1.5px] shadow-xl border border-white/15 ${action.type === 'missing_field' ? 'bg-[#FF6B35]' : 'bg-[#3B82F6]'}`}>
                                  {action.type === 'missing_field' ? 'Resolve' : 'Boost'}
                              </button>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="p-12 text-center bg-white/5 backdrop-blur-md">
                      <div className="text-4xl mb-4 animate-bounce">✨</div>
                      <h3 className="text-[oklch(1_0_0_/_0.98)] font-black text-xl mb-1 tracking-tight">Optimal Performance</h3>
                      <p className="text-[oklch(1_0_0_/_0.85)] text-[11px] font-semibold uppercase tracking-[2.5px]">Your pipeline hygiene is peak.</p>
                  </div>
              )}
          </div>
      </section>
    </div>
  );
};

const LeaderboardRow: React.FC<{ rep: any; isUser: boolean }> = ({ rep, isUser }) => (
    <div className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 ${isUser ? 'bg-white/18 shadow-xl ring-1 ring-white/30' : 'hover:bg-white/8'}`}>
        <div className="flex items-center space-x-3">
            <span className={`text-[10px] font-black w-5 ${isUser ? 'text-cyan-400' : 'text-white/40'}`}>#{rep.rank}</span>
            <img src={rep.profilePicUrl} className="w-8 h-8 rounded-full object-cover border border-white/25" alt="" />
            <span className={`text-[12px] font-medium ${isUser ? 'text-white font-bold' : 'text-[oklch(1_0_0_/_0.96)]'}`}>
                {isUser ? 'Michael T. (You)' : `${rep.firstName} ${rep.lastName.charAt(0)}.`}
            </span>
        </div>
        <div className="flex items-center space-x-2">
            <span className={`text-[12px] font-black ${isUser ? 'text-cyan-400' : 'text-[oklch(1_0_0_/_0.96)]'}`}>{rep.score}</span>
        </div>
    </div>
);
