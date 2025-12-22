
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SalesRep, Deal } from '../types';
import { getAllDeals } from '../data/deals';
import { ActionItem } from '../App';

interface DealPipelineProps {
    currentUser: SalesRep;
    activeAction?: ActionItem | null;
    visibleActions?: ActionItem[];
    onCompleteAction?: () => void;
    onCancelAction?: () => void;
    isSubmitting?: boolean;
    progress?: { current: number, total: number } | null;
    completionMessage?: string | null;
    searchQuery?: string;
}

interface ClientGroup {
    name: string;
    domain: string;
    deals: Deal[];
}

// Map specific accounts to simplified branded badges with distinctive vibrant colors
const BADGE_CONFIG: Record<string, { initials: string, color: string }> = {
  'UnitedHealth Group': { initials: 'UG', color: 'bg-[#00529b]' }, // UHG Blue
  'Mayo Clinic': { initials: 'MC', color: 'bg-[#14B8A6]' }, // Teal
  'HCA Healthcare': { initials: 'HH', color: 'bg-[#22C55E]' }, // Green
  'Skadden Arps': { initials: 'SA', color: 'bg-[#e31837]' }, // Red
  'CVS': { initials: 'CVS', color: 'bg-[#cc0000]' }, // Red
  'Baker McKenzie': { initials: 'B', color: 'bg-[#F97316]' }, // Orange
  'JPMorgan Chase': { initials: 'JPM', color: 'bg-[#1e3a8a]' }, // Navy
  'Goldman Sachs': { initials: 'GS', color: 'bg-[#73b9ee] text-black' }, // Light Blue
  'Deloitte': { initials: 'D', color: 'bg-[#86bc25]' }, // Green
  'PwC': { initials: 'P', color: 'bg-[#db532d]' }, // Orange-Red
  'EY': { initials: 'EY', color: 'bg-[#ffe600] text-black' }, // Yellow
  'KPMG': { initials: 'K', color: 'bg-[#00338d]' }, // Royal Blue
  'White & Case': { initials: 'WC', color: 'bg-[#111827]' }, // Dark Gray
  'Latham & Watkins': { initials: 'LW', color: 'bg-[#800000]' }, // Maroon
  'DLA Piper': { initials: 'DLA', color: 'bg-[#333333]' }, // Slate
  'Kaiser Permanente': { initials: 'KP', color: 'bg-[#007cc3]' }, // Blue
  'Pfizer': { initials: 'PF', color: 'bg-[#007abc]' }, // Sky Blue
  'Microsoft': { initials: 'MS', color: 'bg-[#737373]' }, // Gray
  'Apple': { initials: 'AP', color: 'bg-[#000000]' }, // Black
  'Anthem': { initials: 'A', color: 'bg-[#005596]' }, // Deep Blue
  'Cravath Swaine': { initials: 'CS', color: 'bg-[#1e293b]' }, // Slate
  'Kirkland & Ellis': { initials: 'KE', color: 'bg-[#be123c]' }, // Crimson
  'Alphabet Inc.': { initials: 'G', color: 'bg-[#4285f4]' }, // Google Blue
  'Walmart': { initials: 'W', color: 'bg-[#0071ce]' }, // Blue
  'Amazon': { initials: 'AM', color: 'bg-[#ff9900] text-black' }, // Orange
  'Citigroup': { initials: 'C', color: 'bg-[#00b0f0] text-black' }, // Light Blue
  'Bank of America': { initials: 'BO', color: 'bg-[#003a70]' }, // Navy Blue
  'Cleveland Clinic': { initials: 'CC', color: 'bg-[#66ccff] text-black' }, // Light Blue
  'Federal Trade Commission (FTC)': { initials: 'FT', color: 'bg-[#0d9488]' }, // Teal
  'Wells Fargo': { initials: 'WF', color: 'bg-[#d97706]' }, // Amber
  'Morgan Stanley': { initials: 'MS', color: 'bg-[#002f5d]' }, // Navy
  'Sidley Austin': { initials: 'SID', color: 'bg-[#002244]' }, // Dark Navy
  'Jones Day': { initials: 'JD', color: 'bg-[#2d3748]' }, // Charcoal
};

const ACCOUNT_RECOMMENDATIONS: Record<string, { label: string; action: string }> = {
  'UnitedHealth Group': { label: 'Schedule renewal call - 3 entities expiring Q1', action: 'CREATE TASK' },
  'Baker McKenzie': { label: 'Verify tax compliance status for EMEA regional office', action: 'RUN AUDIT' },
  'JPMorgan Chase': { label: 'Identify expansion opportunities for Asset Management wing', action: 'GENERATE PLAN' },
  'Goldman Sachs': { label: 'Review CCH Axcess migration for investment banking team', action: 'START SYNC' },
  'Deloitte': { label: 'Finalize enterprise licensing for global audit workflow', action: 'SEND PROPOSAL' },
  'PwC': { label: 'Schedule VitalLaw demo for cross-border tax practice', action: 'BOOK DEMO' },
  'Kaiser Permanente': { label: 'Update healthcare compliance thresholds for Pacific Northwest', action: 'UPDATE SPECS' },
  'Microsoft': { label: 'Coordinate with Legal Operations for global entity management', action: 'SYNC OPS' }
};

const IconPhone = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);

const IconTrendUp = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);

const IconAlert = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);

interface ClientAvatarProps {
    client: ClientGroup;
    isActive: boolean;
    onClick: () => void;
}

const ClientAvatar: React.FC<ClientAvatarProps> = ({ client, isActive, onClick }) => {
    const config = BADGE_CONFIG[client.name] || { 
        initials: client.name.split(' ').map(n => n[0]).join('').slice(0, 2), 
        color: 'bg-white/10' 
    };

    return (
        <button
            onClick={onClick}
            className={`group shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border overflow-hidden shadow-lg ${
                isActive 
                ? `${config.color} ring-4 ring-white/30 scale-110 border-white text-white` 
                : `${config.color} opacity-60 hover:opacity-100 border-white/5 text-white/90`
            } ${config.color.includes('text-black') ? 'text-black' : 'text-white'}`}
        >
            <span className="text-[13px] font-black uppercase tracking-tighter leading-none">
                {config.initials}
            </span>
        </button>
    );
};

export const DealPipeline: React.FC<DealPipelineProps> = ({ 
    currentUser, 
    activeAction, 
    visibleActions = [],
    onCompleteAction, 
    isSubmitting,
    searchQuery = ''
}) => {
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const fieldRef = useRef<HTMLInputElement>(null);

  const allDeals = useMemo(() => getAllDeals(), []);

  const filteredDeals = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      return allDeals.filter(deal => {
          if (deal.ownerId !== currentUser.id) return false;
          return query ? (deal.name.toLowerCase().includes(query) || deal.account.toLowerCase().includes(query)) : true;
      });
  }, [allDeals, searchQuery, currentUser.id]);

  const clientGroups = useMemo(() => {
      const groups: Record<string, ClientGroup> = {};
      filteredDeals.forEach(deal => {
          if (!groups[deal.account]) {
              groups[deal.account] = { name: deal.account, domain: '', deals: [] };
          }
          groups[deal.account].deals.push(deal);
      });
      return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredDeals]);

  useEffect(() => {
      if (activeAction) {
          const accountPart = activeAction.dealName.split(' - ')[0];
          setSelectedClientName(accountPart);
          setFieldValue('');
          setTimeout(() => fieldRef.current?.focus(), 400);
      } else if (clientGroups.length > 0 && !selectedClientName) {
          setSelectedClientName(clientGroups[0].name);
      }
  }, [activeAction, clientGroups, selectedClientName]);

  const selectedGroup = useMemo(() => 
      clientGroups.find(c => c.name === selectedClientName) || clientGroups[0],
      [clientGroups, selectedClientName]
  );

  const hasIncompleteTasks = useMemo(() => {
    if (!selectedGroup) return false;
    return visibleActions.some(action => action.dealName.startsWith(selectedGroup.name));
  }, [selectedGroup, visibleActions]);

  const getStageStyle = (stage: string) => {
      switch(stage) {
          case 'Discovery': return 'bg-purple-600 text-white';
          case 'Qualification': return 'bg-blue-600 text-white';
          case 'Proposal': return 'bg-orange-600 text-white';
          case 'Negotiation': return 'bg-amber-600 text-white';
          case 'Closed Won': return 'bg-emerald-600 text-white';
          default: return 'bg-white/20 text-white';
      }
  };

  const recommendation = selectedGroup ? ACCOUNT_RECOMMENDATIONS[selectedGroup.name] : null;

  return (
    <div className="space-y-6 animate-ios-slide pb-32 mesh-bg min-h-screen p-4 md:p-8 w-full flex flex-col">
      <section className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[24px] p-4 shadow-2xl overflow-hidden">
          <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar scroll-smooth px-2 py-2">
              {clientGroups.map((client) => (
                  <ClientAvatar 
                    key={client.name} 
                    client={client} 
                    isActive={selectedClientName === client.name} 
                    onClick={() => setSelectedClientName(client.name)} 
                  />
              ))}
          </div>
      </section>

      <AnimatePresence>
        {activeAction && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[oklch(1_0_0_/_0.2)] backdrop-blur-[32px] rounded-[24px] border border-orange-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 overflow-hidden"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-[14px] bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/20">
                            <IconAlert />
                        </div>
                        <div>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1 leading-none">Intervention Required</p>
                            <h3 className="text-white font-bold text-base leading-none">{activeAction.label}</h3>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-1 max-w-xl">
                        <input 
                            ref={fieldRef}
                            type="text"
                            value={fieldValue}
                            onChange={(e) => setFieldValue(e.target.value)}
                            placeholder="Complete required field..."
                            className="bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/10 transition-all flex-1"
                        />
                        <button 
                            onClick={onCompleteAction}
                            disabled={!fieldValue.trim() || isSubmitting}
                            className={`rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all ${
                                fieldValue.trim() ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            {isSubmitting ? 'Syncing...' : 'Resolve'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
          {selectedGroup && (
              <motion.section 
                  key={selectedGroup.name} 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="space-y-4"
              >
                  <div className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[32px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
                      <div className="px-6 md:px-8 py-5 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center space-x-5 min-w-0 flex-1">
                              <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border border-white/20 shadow-2xl shrink-0 overflow-hidden ${BADGE_CONFIG[selectedGroup.name]?.color || 'bg-white/10'}`}>
                                  <span className={`font-black text-xl uppercase ${BADGE_CONFIG[selectedGroup.name]?.color?.includes('text-black') ? 'text-black' : 'text-white'}`}>
                                      {BADGE_CONFIG[selectedGroup.name]?.initials || selectedGroup.name[0]}
                                  </span>
                              </div>
                              <div className="min-w-0 flex flex-col">
                                  <div className="flex flex-wrap items-center gap-3">
                                      <h3 className="text-white font-black text-[22px] md:text-[24px] tracking-tight leading-tight whitespace-nowrap">
                                          {selectedGroup.name}
                                      </h3>
                                      <AnimatePresence mode="wait">
                                          {!hasIncompleteTasks ? (
                                              <motion.span 
                                                  key="healthy"
                                                  initial={{ opacity: 0, scale: 0.9 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  exit={{ opacity: 0, scale: 0.9 }}
                                                  className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1 text-emerald-400 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2"
                                              >
                                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                                                  STATUS: HEALTHY
                                              </motion.span>
                                          ) : (
                                              <motion.span 
                                                  key="risk"
                                                  initial={{ opacity: 0, scale: 0.9 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  exit={{ opacity: 0, scale: 0.9 }}
                                                  className="bg-[#FF6B35]/20 border border-[#FF6B35]/30 rounded-full px-3 py-1 text-[#FF6B35] text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2"
                                              >
                                                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse shadow-[0_0_8px_rgba(255,107,53,1)]"></div>
                                                  STATUS: AT RISK
                                              </motion.span>
                                          )}
                                      </AnimatePresence>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="md:text-right md:min-w-[180px] shrink-0">
                              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-1">TOTAL PORTFOLIO VALUE</p>
                              <div className="flex items-center md:justify-end gap-3">
                                  <span className="text-[12px] font-black text-emerald-400 flex items-center gap-1.5">
                                      <IconTrendUp /> +{(Math.random() * 20).toFixed(1)}%
                                  </span>
                                  <p className="text-white font-black text-[24px] md:text-[28px] tracking-tighter leading-none whitespace-nowrap">
                                      ${selectedGroup.deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="divide-y divide-white/10">
                          {selectedGroup.deals.map((deal) => {
                              const isAtRisk = deal.health < 65;
                              const riskColor = isAtRisk ? 'bg-[#FF6B35]' : 'bg-emerald-500';
                              const statusLabel = deal.health >= 80 ? 'Verified - On Target' : 
                                                 deal.health >= 60 ? 'Pending Finance Verification' : 
                                                 'Urgent Remediation Required';
                              
                              return (
                                  <div key={deal.id} className="relative flex group hover:bg-white/[0.04] transition-all duration-300 cursor-pointer">
                                      <div className={`w-[5px] shrink-0 self-stretch ${riskColor} my-4 ml-1 rounded-full shadow-[0_0_12px_rgba(255,107,53,0.3)]`} />
                                      <div className="flex-1 p-6 flex flex-col gap-4">
                                          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                              <div className="flex-1 min-w-0">
                                                  <h4 className="text-white font-bold text-sm tracking-tight mb-3 leading-snug whitespace-normal">{deal.name}</h4>
                                                  <div className="flex flex-wrap items-center gap-4">
                                                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-xl ${getStageStyle(deal.stage)}`}>{deal.stage}</span>
                                                      <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-3">
                                                          <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Expected Close:</span>
                                                          <span className="text-white font-black text-[11px] uppercase">{deal.closeDate}</span>
                                                      </div>
                                                      <p className="text-white font-black text-[18px] tracking-tight shrink-0 pl-1">${deal.value.toLocaleString()}</p>
                                                  </div>
                                              </div>
                                              <div className="flex items-center space-x-8 shrink-0 xl:text-right">
                                                  <div className="flex flex-col xl:items-end min-w-[140px]">
                                                      <div className="flex items-center justify-between w-full mb-2">
                                                          <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Health Score</p>
                                                          <span className={`text-[14px] font-black ${isAtRisk ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>{deal.health}%</span>
                                                      </div>
                                                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                          <div className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.25)] ${isAtRisk ? 'bg-[#FF6B35]' : 'bg-emerald-500'}`} style={{ width: `${deal.health}%` }} />
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-white/5">
                                              <p className="text-white/70 text-[13px] font-medium">
                                                  <span className="text-white/30 font-black uppercase text-[9px] tracking-[0.15em] mr-2">Status:</span>
                                                  {statusLabel}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      {recommendation && (
                        <div className="bg-[#0F172A]/80 backdrop-blur-[32px] border-t border-white/20 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
                            <div className="flex items-center space-x-5 flex-1">
                                <div className="w-14 h-14 rounded-[20px] bg-blue-500/30 flex items-center justify-center text-white border border-white/25 shadow-2xl shrink-0">
                                    <IconPhone />
                                </div>
                                <div className="flex flex-col">
                                    <h5 className="text-white font-black text-[18px] md:text-[20px] tracking-tight leading-tight">{recommendation.label}</h5>
                                    <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2">RECOMMENDED ACTION</p>
                                </div>
                            </div>
                            <button className="bg-white text-[#0F172A] font-black text-[12px] md:text-[14px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.6)] hover:bg-slate-100 hover:scale-[1.02] transition-all active:scale-95 border border-white shrink-0">
                                {recommendation.action}
                            </button>
                        </div>
                      )}
                  </div>
              </motion.section>
          )}
      </AnimatePresence>
    </div>
  );
};
