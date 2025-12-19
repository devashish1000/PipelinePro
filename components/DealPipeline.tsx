import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { SalesRep, Deal } from '../types';
import { getAllDeals } from '../data/deals';
import { ActionItem } from '../App';

interface DealPipelineProps {
    currentUser: SalesRep;
    activeAction?: ActionItem | null;
    onCompleteAction?: () => void;
    onCancelAction?: () => void;
    isSubmitting?: boolean;
    progress?: { current: number, total: number } | null;
    completionMessage?: string | null;
}

interface ClientGroup {
    name: string;
    domain: string;
    deals: Deal[];
}

const DOMAIN_MAP: Record<string, string> = {
  'Baker McKenzie': 'bakermckenzie.com',
  'DLA Piper': 'dlapiper.com',
  'Latham & Watkins': 'lw.com',
  'Kirkland & Ellis': 'kirkland.com',
  'Skadden Arps': 'skadden.com',
  'Sidley Austin': 'sidley.com',
  'White & Case': 'whitecase.com',
  'Jones Day': 'jonesday.com',
  'Cleveland Clinic': 'clevelandclinic.org',
  'Kaiser Permanente': 'kp.org',
  'HCA Healthcare': 'hcahealthcare.com',
  'Mayo Clinic': 'mayoclinic.org',
  'UnitedHealth Group': 'unitedhealthgroup.com',
  'Pfizer': 'pfizer.com',
  'Johns Hopkins Medicine': 'hopkinsmedicine.org',
  'JPMorgan Chase': 'jpmorganchase.com',
  'Goldman Sachs': 'goldmansachs.com',
  'Bank of America': 'bankofamerica.com',
  'Wells Fargo': 'wellsfargo.com',
  'Citigroup': 'citigroup.com',
  'Morgan Stanley': 'morganstanley.com',
  'Barclays': 'barclays.com',
  'HSBC Holdings': 'hsbc.com',
  'Microsoft': 'microsoft.com',
  'Apple': 'apple.com',
  'Amazon': 'amazon.com',
  'Walmart': 'walmart.com',
  'ExxonMobil': 'exxonmobil.com',
  'Alphabet Inc.': 'abc.xyz',
  'Johnson & Johnson': 'jnj.com',
  'General Electric': 'ge.com',
  'Deloitte': 'deloitte.com',
  'PwC': 'pwc.com',
  'EY': 'ey.com',
  'KPMG': 'kpmg.com',
  'Grant Thornton': 'grantthornton.com',
  'BDO Global': 'bdo.global',
  'RSM International': 'rsm.global',
  'Internal Revenue Service (IRS)': 'irs.gov',
  'Department of Justice (DOJ)': 'justice.gov',
  'Securities and Exchange Commission (SEC)': 'sec.gov',
  'Federal Trade Commission (FTC)': 'ftc.gov',
  'FINRA': 'finra.org'
};

const IconPhone = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);

const IconTrendingUp = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);

interface ClientAvatarProps {
    client: ClientGroup;
    isActive: boolean;
    onClick: () => void;
}

const ClientAvatar: React.FC<ClientAvatarProps> = ({ client, isActive, onClick }) => {
    const [status, setStatus] = useState<'brandfetch' | 'favicon' | 'generating' | 'ai' | 'initials'>('brandfetch');
    const [logoUrl, setLogoUrl] = useState(`https://cdn.brandfetch.io/${client.domain}`);
    const generatingRef = useRef(false);
    const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2);

    useEffect(() => {
        setStatus('brandfetch');
        setLogoUrl(`https://cdn.brandfetch.io/${client.domain}`);
    }, [client.domain]);

    const handleImageError = async () => {
        if (status === 'brandfetch') {
            setStatus('favicon');
            setLogoUrl(`https://www.google.com/s2/favicons?domain=${client.domain}&sz=128`);
        } else if (status === 'favicon') {
            if (generatingRef.current) return;
            generatingRef.current = true;
            setStatus('generating');

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                        parts: [{ text: `Generate a minimalist corporate logo for ${client.name} on white background.` }],
                    },
                });

                let foundImage = false;
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            setLogoUrl(`data:image/png;base64,${part.inlineData.data}`);
                            setStatus('ai');
                            foundImage = true;
                            break;
                        }
                    }
                }
                if (!foundImage) throw new Error('AI returned no image data');
            } catch (error) {
                setStatus('initials');
            } finally {
                generatingRef.current = false;
            }
        }
    };

    return (
        <motion.button
            layout
            onClick={onClick}
            className={`relative group shrink-0 transition-all duration-300 z-10 ${isActive ? 'z-50 scale-110 -mx-1' : 'hover:z-50 hover:scale-105'}`}
            whileHover={{ y: -5 }}
        >
            <div className={`w-12 h-12 rounded-full border-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden flex items-center justify-center transition-all duration-300 bg-white ${
                isActive ? 'border-white ring-4 ring-white/30' : 'border-white/20 hover:border-white/40'
            }`}>
                {status === 'initials' ? (
                    <div className="text-slate-400 font-black text-xs uppercase bg-slate-50 w-full h-full flex items-center justify-center">
                        {initials}
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-1.5">
                        {status === 'generating' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <img 
                            src={logoUrl}
                            alt={client.name}
                            className={`w-full h-full object-contain transition-opacity duration-300 ${status === 'generating' ? 'opacity-20' : 'opacity-100'}`}
                            onError={handleImageError}
                        />
                    </div>
                )}
            </div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none z-[100]">
                {client.name}
            </div>
        </motion.button>
    );
};

export const DealPipeline: React.FC<DealPipelineProps> = ({ 
    currentUser, 
    activeAction, 
    onCompleteAction, 
    onCancelAction,
    isSubmitting,
    progress,
    completionMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [fieldValue, setFieldValue] = useState('');
  const fieldRef = useRef<HTMLInputElement>(null);

  const allDeals = useMemo(() => getAllDeals(), []);

  const filteredDeals = useMemo(() => {
      return allDeals.filter(deal => {
          if (deal.ownerId !== currentUser.id) return false;
          const query = searchQuery.toLowerCase().trim();
          return query ? (deal.name.toLowerCase().includes(query) || deal.account.toLowerCase().includes(query)) : true;
      });
  }, [allDeals, searchQuery, currentUser.id]);

  const clientGroups = useMemo(() => {
      const groups: Record<string, ClientGroup> = {};
      filteredDeals.forEach(deal => {
          if (!groups[deal.account]) {
              const domain = DOMAIN_MAP[deal.account] || (deal.account.toLowerCase().replace(/[\s&]+/g, '') + '.com');
              groups[deal.account] = { name: deal.account, domain, deals: [] };
          }
          groups[deal.account].deals.push(deal);
      });
      return Object.values(groups);
  }, [filteredDeals]);

  useEffect(() => {
      if (activeAction) {
          setSearchQuery('');
          const accountPart = activeAction.dealName.split(' - ')[0];
          setSelectedClientName(accountPart);
          setFieldValue('');
          setValidationError(false);
          setTimeout(() => fieldRef.current?.focus(), 400);
      } else if (clientGroups.length > 0 && !selectedClientName) {
          setSelectedClientName(clientGroups[0].name);
      }
  }, [activeAction, clientGroups, selectedClientName]);

  const selectedGroup = useMemo(() => 
      clientGroups.find(c => c.name === selectedClientName) || clientGroups[0],
      [clientGroups, selectedClientName]
  );

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fieldValue.trim()) { setValidationError(true); fieldRef.current?.focus(); return; }
    setValidationError(false);
    onCompleteAction?.();
  };

  const getStageColor = (stage: string) => {
      switch(stage) {
          case 'Discovery': return 'text-white bg-purple-600 border-purple-400';
          case 'Qualification': return 'text-white bg-blue-600 border-blue-400';
          case 'Proposal': return 'text-white bg-orange-600 border-orange-400';
          case 'Negotiation': return 'text-white bg-amber-600 border-amber-400';
          case 'Closed Won': return 'text-white bg-emerald-600 border-emerald-400';
          case 'Closed Lost': return 'text-white bg-rose-600 border-rose-400';
          default: return 'text-white bg-white/20 border-white/20';
      }
  };

  const isButtonEnabled = fieldValue.trim().length > 0;

  return (
    <div className="bg-gradient-to-br from-blue-500/90 via-blue-600/90 to-indigo-700/90 min-h-screen p-6 space-y-5 animate-ios-slide pb-20 rounded-[48px] -m-4">
      {activeAction && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-white/25 backdrop-blur-2xl rounded-[16px] border border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.15)] p-5 relative overflow-hidden"
          >
              <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center space-x-4">
                      <div className="bg-white/30 p-2.5 rounded-[12px] backdrop-blur-md ring-1 ring-white/30">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                          <p className="text-white/80 text-[8px] font-black uppercase tracking-[0.2em] mb-1 leading-none">Focus Area</p>
                          <h3 className="text-[15px] font-black text-white tracking-tight leading-none">{activeAction.label}</h3>
                      </div>
                  </div>
                  <div className="flex items-center space-x-3">
                      {completionMessage ? (
                          <span className="text-white font-black text-[10px] uppercase tracking-widest">{completionMessage}</span>
                      ) : (
                          <button 
                            onClick={handleMarkComplete}
                            disabled={!isButtonEnabled || isSubmitting}
                            className={`rounded-full px-7 py-2.5 transition-all duration-300 font-black text-[10px] uppercase tracking-widest active:scale-95 text-white shadow-lg ${
                                isButtonEnabled 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-500/20 cursor-pointer' 
                                    : 'bg-emerald-300 cursor-not-allowed opacity-60'
                            }`}
                          >
                              {isSubmitting ? 'Syncing...' : 'Submit Fix'}
                          </button>
                      )}
                  </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                  <input 
                      ref={fieldRef}
                      type="text"
                      value={fieldValue}
                      onChange={(e) => { setFieldValue(e.target.value); if (e.target.value.trim()) setValidationError(false); }}
                      placeholder={`Enter verification details for ${activeAction.label}...`}
                      className={`w-full bg-white/15 border border-white/30 text-white placeholder-white/60 rounded-xl py-3 px-4 outline-none transition-all text-[14px] ${validationError ? 'border-rose-400 bg-rose-500/20 shadow-[0_0_12px_rgba(251,113,133,0.3)]' : 'focus:border-white/60 focus:bg-white/20'}`}
                  />
              </div>
          </motion.div>
      )}

      <div className="bg-white/20 backdrop-blur-2xl rounded-[16px] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 overflow-hidden">
          <div className="mb-6 flex items-center justify-between">
              <div>
                  <h2 className="text-white font-black text-lg tracking-tight leading-none">Managed Portfolios</h2>
                  <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-1.5">{clientGroups.length} Strategic Accounts</p>
              </div>
              <div className="relative">
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search accounts..."
                      className="bg-white/15 border border-white/30 text-white placeholder-white/60 rounded-full py-2 pl-8 pr-4 text-[10px] w-40 outline-none focus:bg-white/25 transition-all focus:ring-1 ring-white/20"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
          </div>
          <div className="flex items-center space-x-2 py-4 px-1 overflow-x-auto no-scrollbar scroll-smooth">
              {clientGroups.map((client) => (
                  <ClientAvatar key={client.name} client={client} isActive={selectedClientName === client.name} onClick={() => setSelectedClientName(client.name)} />
              ))}
          </div>
      </div>

      <AnimatePresence mode="wait">
          {selectedGroup && (
              <motion.section key={selectedGroup.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-2xl rounded-[16px] border border-white/30 shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden relative">
                      {/* PRIORITY ALERT BADGE */}
                      <div className="absolute top-5 right-5 z-20 group cursor-help">
                          <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white shadow-2xl transition-all hover:scale-105 ${
                              selectedGroup.deals.some(d => d.health < 60) ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                              <span className={`w-2 h-2 rounded-full ${selectedGroup.deals.some(d => d.health < 40) ? 'bg-rose-500 animate-pulse' : (selectedGroup.deals.some(d => d.health < 75) ? 'bg-amber-400' : 'bg-emerald-500')}`} />
                              <span>{selectedGroup.deals.some(d => d.health < 60) ? 'Action Required' : 'Status: Healthy'}</span>
                          </div>
                          <div className="absolute top-full right-0 mt-3 w-56 bg-slate-900/98 backdrop-blur-3xl border border-white/20 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover:translate-y-0">
                              <p className="text-white text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b border-white/10">Strategic Alerts</p>
                              {selectedGroup.deals.filter(d => d.health < 75).length > 0 ? (
                                  <p className="text-white/80 text-[11px] leading-relaxed">
                                      Critical focus: {selectedGroup.deals.filter(d => d.health < 75).length} active opportunities require documentation updates to maintain pipeline velocity.
                                  </p>
                              ) : (
                                  <p className="text-white/80 text-[11px] leading-relaxed">Account engagement and deal data are currently within healthy performance thresholds.</p>
                              )}
                          </div>
                      </div>

                      <div className="p-6 border-b border-white/15 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white border border-white/40 p-2 shadow-inner overflow-hidden">
                                  <img src={`https://cdn.brandfetch.io/${selectedGroup.domain}`} className="w-full h-full object-contain" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedGroup.name)}&background=ffffff&color=000000`; }} />
                              </div>
                              <div className="flex flex-col">
                                  <h3 className="text-white font-black text-lg tracking-tight leading-none">{selectedGroup.name}</h3>
                                  <div className="flex items-center space-x-3 mt-1.5 overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none">
                                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 shrink-0">
                                          <div className="w-3 h-3 rounded-full border border-teal-400/60 flex items-center justify-center p-[2px]">
                                              <div className="w-full h-full bg-teal-400 rounded-full" style={{ clipPath: 'inset(0 75% 0 0)' }}></div>
                                          </div>
                                          <span className="text-white/60 text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Service Coverage: 25%</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div className="text-right pr-32 md:pr-40">
                              <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mb-1">Total Value</p>
                              <div className="flex items-center justify-end space-x-2.5">
                                  <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                                      <IconTrendingUp /> +18%
                                  </span>
                                  <p className="text-white font-black text-xl leading-none tracking-tighter">${selectedGroup.deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</p>
                              </div>
                          </div>
                      </div>
                      <div className="divide-y divide-white/10 bg-white/[0.02]">
                          {selectedGroup.deals.map((deal) => {
                              const priorityColor = deal.health < 50 ? 'bg-[#FF6B35]' : deal.health < 75 ? 'bg-amber-500' : 'bg-emerald-500';
                              const statusLabel = deal.health < 50 ? 'Urgent Compliance Audit' : deal.health < 75 ? 'Pending Finance Verification' : 'Approved';
                              
                              const lastContactDays = Math.floor(Math.random() * 30);
                              const engagementColor = lastContactDays < 7 ? 'text-emerald-400' : lastContactDays < 21 ? 'text-amber-400' : 'text-[#FF6B35]';
                              const engagementLabel = lastContactDays < 7 ? 'Active' : lastContactDays < 21 ? 'Warm' : 'Risk';

                              return (
                                <div 
                                    key={deal.id} 
                                    className="relative flex hover:bg-white/10 transition-colors cursor-pointer group px-1"
                                >
                                    {/* Thicker Priority Accent Bar */}
                                    <div className={`w-[5px] self-stretch ${priorityColor} shrink-0 my-2 rounded-full`} />
                                    
                                    <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                                                <p className="text-white font-black text-[15px] tracking-tight leading-none truncate max-w-[280px]">{deal.name}</p>
                                                <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm ${getStageColor(deal.stage)}`}>{deal.stage}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2 bg-white/10 px-2.5 py-1 rounded-full border border-white/5">
                                                    <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">Close:</span>
                                                    <span className="text-white font-bold text-[10px] uppercase">{deal.closeDate}</span>
                                                </div>
                                                <p className="text-white font-black text-[13px] leading-none tracking-tight">${deal.value.toLocaleString()}</p>
                                            </div>
                                            
                                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                                <span className="bg-white/15 border border-white/20 text-white/80 text-[9px] font-bold px-3 py-1 rounded-md leading-none shadow-sm">
                                                    Teams: 3 Active
                                                </span>
                                                <span className="text-white/60 text-[11px] font-medium leading-none">
                                                    Status: {statusLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-6 shrink-0 mt-2 md:mt-0 md:text-right">
                                            {/* ENGAGEMENT SCORE */}
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`w-2 h-2 rounded-full ${engagementColor.replace('text-', 'bg-')}`}></span>
                                                    <span className={`text-[12px] font-black ${engagementColor}`}>{engagementLabel}</span>
                                                </div>
                                                <p className="text-[8px] text-white/50 font-black uppercase tracking-widest mt-1">Last Outreach: {lastContactDays}d ago</p>
                                            </div>

                                            <div className="flex flex-col items-end min-w-[100px]">
                                                <div className="flex items-center space-x-2.5">
                                                    <span className={`text-[13px] font-black ${deal.health > 70 ? 'text-emerald-400' : deal.health > 50 ? 'text-amber-300' : 'text-[#FF6B35]'}`}>{deal.health}%</span>
                                                    <div className="w-16 bg-white/15 rounded-full h-1 overflow-hidden shadow-inner">
                                                        <div className={`h-full bg-white transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.5)]`} style={{ width: `${deal.health}%` }}></div>
                                                    </div>
                                                </div>
                                                <p className="text-[8px] text-white/50 font-black uppercase tracking-widest mt-1">Deal Health Score</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Tooltip on Hover */}
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-slate-900/95 backdrop-blur-xl text-white/95 text-[10px] font-bold px-4 py-2 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[200] border border-white/20 translate-y-2 group-hover:translate-y-0">
                                        Cross-functional Audit Required: Compliance • Finance • Legal
                                    </div>
                                </div>
                              );
                          })}
                      </div>

                      {/* NEXT BEST ACTION BANNER - Standardized Spacing & Style */}
                      <div className="bg-white/10 backdrop-blur-3xl border-t-2 border-white/15 p-5 flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xl border border-white/20">
                                  <IconPhone />
                              </div>
                              <div className="flex flex-col">
                                  <p className="text-white font-black text-[13px] tracking-tight">Schedule renewal call - 3 entities expiring Q1</p>
                                  <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.15em] mt-1">Recommended</p>
                              </div>
                          </div>
                          <button className="bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:bg-slate-100 hover:shadow-[0_12px_28px_rgba(255,255,255,0.1)] transition-all active:scale-95 border border-white">
                              Create Task
                          </button>
                      </div>
                  </div>
              </motion.section>
          )}
      </AnimatePresence>
    </div>
  );
};
