
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

interface ClientAvatarProps {
    client: ClientGroup;
    isActive: boolean;
    onClick: () => void;
}

const ClientAvatar: React.FC<ClientAvatarProps> = ({ client, isActive, onClick }) => {
    // Hierarchy: Brandfetch -> Google Favicon -> AI Generating -> AI Result -> Initials
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
            console.debug(`[Logo] Brandfetch failed for ${client.name}, trying Google Favicon...`);
            setStatus('favicon');
            setLogoUrl(`https://www.google.com/s2/favicons?domain=${client.domain}&sz=128`);
        } else if (status === 'favicon') {
            if (generatingRef.current) return;
            console.debug(`[Logo] Favicon failed for ${client.name}, triggering AI Generation...`);
            generatingRef.current = true;
            setStatus('generating');

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            {
                                text: `Generate a high-quality, professional corporate logo for ${client.name}. Minimalist, vector style, accurate brand colors, white background.`,
                            },
                        ],
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
                console.error(`[Logo] AI Generation failed for ${client.name}:`, error);
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
            <div className={`w-12 h-12 rounded-full border-3 shadow-xl overflow-hidden flex items-center justify-center transition-all duration-300 bg-white ${
                isActive ? 'border-teal-500 ring-4 ring-teal-500/20' : 'border-white hover:border-teal-100'
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
            
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
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
          const matchesSearch = 
            deal.name.toLowerCase().includes(query) ||
            deal.account.toLowerCase().includes(query);
          return query ? matchesSearch : true;
      });
  }, [allDeals, searchQuery, currentUser.id]);

  const clientGroups = useMemo(() => {
      const groups: Record<string, ClientGroup> = {};
      filteredDeals.forEach(deal => {
          if (!groups[deal.account]) {
              const domain = DOMAIN_MAP[deal.account] || (deal.account.toLowerCase().replace(/[\s&]+/g, '') + '.com');
              groups[deal.account] = { 
                  name: deal.account, 
                  domain, 
                  deals: [] 
              };
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
    if (!fieldValue.trim()) {
      setValidationError(true);
      fieldRef.current?.focus();
      return;
    }
    setValidationError(false);
    onCompleteAction?.();
  };

  const getStageColor = (stage: string) => {
      switch(stage) {
          case 'Discovery': return 'text-purple-600 bg-purple-50 border-purple-100';
          case 'Qualification': return 'text-blue-600 bg-blue-50 border-blue-100';
          case 'Proposal': return 'text-orange-600 bg-orange-50 border-orange-100';
          case 'Negotiation': return 'text-amber-600 bg-amber-50 border-amber-100';
          case 'Closed Won': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
          case 'Closed Lost': return 'text-rose-600 bg-rose-50 border-rose-100';
          default: return 'text-slate-500 bg-slate-50 border-slate-100';
      }
  };

  return (
    <div className="space-y-4 animate-ios-slide pb-20">
      
      {activeAction && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-gradient-to-r from-[#465B7D] to-[#2A3F5F] rounded-[24px] p-4 shadow-xl relative overflow-hidden border border-white/20"
          >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center space-x-3.5">
                      <div className="bg-white/10 p-2 rounded-[12px] backdrop-blur-md ring-1 ring-white/20">
                          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                          <p className="text-white/60 text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 leading-none">Focus: {activeAction.dealName}</p>
                          <h3 className="text-[13px] font-black text-white tracking-tight leading-none mt-1">{activeAction.label}</h3>
                      </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                      {completionMessage ? (
                          <span className="text-teal-400 font-black text-[9px] uppercase tracking-widest">{completionMessage}</span>
                      ) : (
                          <button 
                            onClick={handleMarkComplete}
                            disabled={isSubmitting}
                            className="px-4 py-1.5 bg-[#FF6B35] text-white font-black rounded-full shadow-lg text-[9px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
                          >
                              {isSubmitting ? 'Syncing...' : 'Submit Fix'}
                          </button>
                      )}
                  </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                  <input 
                      ref={fieldRef}
                      type="text"
                      value={fieldValue}
                      onChange={(e) => { setFieldValue(e.target.value); if (e.target.value.trim()) setValidationError(false); }}
                      placeholder={`Provide details for ${activeAction.label.toLowerCase()}...`}
                      className={`w-full bg-white/5 border-b-2 rounded-lg py-2 px-3 text-white font-bold outline-none transition-all placeholder-white/30 text-[13px] ${validationError ? 'border-rose-500 bg-rose-500/10' : 'border-transparent focus:border-teal-400'}`}
                  />
              </div>
          </motion.div>
      )}

      <div className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-[32px] p-5 shadow-2xl overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
              <div>
                  <h2 className="text-slate-900 font-black text-base tracking-tight leading-none">Client Accounts</h2>
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">{clientGroups.length} Managed Portfolios</p>
              </div>
              <div className="relative">
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find Client..."
                      className="bg-slate-50 border border-slate-100 rounded-full py-1.5 pl-7 pr-3 text-slate-900 font-bold outline-none transition text-[9px] w-32 focus:border-teal-500/30"
                  />
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
          </div>

          <div className="flex items-center -space-x-3 py-3 px-1 overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth">
              {clientGroups.map((client) => (
                  <ClientAvatar 
                      key={client.name}
                      client={client}
                      isActive={selectedClientName === client.name}
                      onClick={() => setSelectedClientName(client.name)}
                  />
              ))}
          </div>
      </div>

      <AnimatePresence mode="wait">
          {selectedGroup && (
              <motion.section 
                  key={selectedGroup.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
              >
                  <div className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-[32px] overflow-hidden shadow-2xl">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 p-1 overflow-hidden">
                                  <img 
                                      src={`https://cdn.brandfetch.io/${selectedGroup.domain}`}
                                      className="w-full h-full object-contain"
                                      alt=""
                                      onError={(e) => { 
                                          const img = e.target as HTMLImageElement;
                                          if (!img.src.includes('google')) {
                                              img.src = `https://www.google.com/s2/favicons?domain=${selectedGroup.domain}&sz=128`;
                                          } else {
                                              img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedGroup.name)}&background=f8fafc&color=94a3b8&font-size=0.35&bold=true`;
                                          }
                                      }}
                                  />
                              </div>
                              <div>
                                  <h3 className="text-slate-900 font-black text-sm tracking-tight leading-none">{selectedGroup.name}</h3>
                                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">{selectedGroup.deals.length} Active Opportunities</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-slate-400 text-[7px] font-black uppercase tracking-widest mb-0.5">Portfolio Value</p>
                              <p className="text-slate-900 font-black text-base leading-none">
                                  ${selectedGroup.deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                              </p>
                          </div>
                      </div>

                      <div className="divide-y divide-slate-50">
                          {selectedGroup.deals.map((deal) => (
                              <div key={deal.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition cursor-pointer group">
                                  <div className="flex-1">
                                      <div className="flex items-center space-x-2.5 mb-1">
                                          <p className="text-slate-900 font-black text-xs tracking-tight group-hover:text-teal-600 transition-colors leading-none">{deal.name}</p>
                                          <span className={`px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest ${getStageColor(deal.stage)}`}>
                                              {deal.stage}
                                          </span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                          <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest leading-none">Est. Close: {deal.closeDate}</p>
                                          <p className="text-slate-900 font-black text-[10px] leading-none">${deal.value.toLocaleString()}</p>
                                      </div>
                                  </div>

                                  <div className="flex items-center space-x-3.5">
                                      <div className="text-right">
                                          <div className="flex items-center space-x-1.5">
                                              <span className={`text-[9px] font-black ${deal.health > 70 ? 'text-teal-600' : deal.health > 50 ? 'text-orange-500' : 'text-rose-600'}`}>{deal.health}</span>
                                              <div className="w-10 bg-slate-100 rounded-full h-0.5 overflow-hidden">
                                                  <div className={`h-full transition-all duration-1000 ${deal.health > 70 ? 'bg-teal-500' : deal.health > 50 ? 'bg-orange-400' : 'bg-rose-500'}`} style={{ width: `${deal.health}%` }}></div>
                                              </div>
                                          </div>
                                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Health Score</p>
                                      </div>
                                      <svg className="w-3 h-3 text-slate-300 group-hover:text-teal-500 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </motion.section>
          )}
      </AnimatePresence>

      {clientGroups.length === 0 && (
          <div className="p-16 text-center bg-white/20 backdrop-blur-xl rounded-[40px] border border-white/20">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-white font-black text-lg mb-0.5">No Clients Found</h3>
              <p className="text-white/60 text-[10px]">Adjust your search or filters to see accounts.</p>
          </div>
      )}
    </div>
  );
};
