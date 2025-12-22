
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Scenario, TranscriptionItem, AnalysisResult, SessionRecord, SalesRep } from '../types';
import { Setup } from './Setup';
import { Report } from './Report';
import { LiveClient } from '../services/liveClient';
import { analyzeSession } from '../services/analysisService';
import { AIAgentLogo } from './AIAgentLogo';
import { Visualizer } from './Visualizer';
import { motion, AnimatePresence } from 'framer-motion';

const ANALYSIS_STEPS = [
  "Scanning transcripts...",
  "Evaluating objections...",
  "Identifying win-loss patterns...",
  "Scoring WK product knowledge...",
  "Generating feedback roadmap..."
];

interface DealCoachProps {
  currentUser: SalesRep;
}

export const DealCoach: React.FC<DealCoachProps> = ({ currentUser }) => {
  const [state, setState] = useState<AppState>(AppState.SETUP);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [activeTurn, setActiveTurn] = useState<{ speaker: 'user' | 'model', text: string } | null>(null);
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWaitingForModel, setIsWaitingForModel] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  const liveClientRef = useRef<LiveClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const transcriptsRef = useRef<TranscriptionItem[]>([]);
  const activeTurnRef = useRef<{ speaker: 'user' | 'model', text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wk_dealcoach_history');
    if (saved) { try { setHistory(JSON.parse(saved)); } catch (e) {} }
  }, []);

  useEffect(() => { localStorage.setItem('wk_dealcoach_history', JSON.stringify(history)); }, [history]);
  
  useEffect(() => { 
    if (state === AppState.LIVE) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [transcripts, activeTurn, state]);

  useEffect(() => { return () => { 
    liveClientRef.current?.disconnect(); 
    if (timerRef.current) clearInterval(timerRef.current);
  }; }, []);

  useEffect(() => {
    let interval: any;
    if (state === AppState.ANALYZING) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === AppState.LIVE && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          const next = prev - 1;
          
          if (next === 30) {
            liveClientRef.current?.sendText(`[SYSTEM: 30 seconds remaining in the meeting. Sarah, please start to wrap up the conversation naturally.]`);
          }
          
          if (next === 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleEndSession();
            return 0;
          }
          return next;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [state]);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    if (scenario) handleStart(scenario);
  };

  const handleStart = async (config: Scenario) => {
    setIsConnecting(true); 
    setErrorMessage(null); 
    setScenario(config); 
    setTranscripts([]); 
    setActiveTurn(null);
    transcriptsRef.current = [];
    activeTurnRef.current = null;
    
    let durationSec = null;
    if (config.duration === '5 MIN') durationSec = 5 * 60;
    else if (config.duration === '10 MIN') durationSec = 10 * 60;
    else if (config.duration === '15 MIN') durationSec = 15 * 60;
    setTimeLeft(durationSec);

    const companyName = "Acme Global Enterprises";
    // Force Sarah to acknowledge Michael Thompson immediately
    const systemInstruction = `YOU ARE SARAH CHEN, ${config.prospectRole} at ${companyName}. 
    USER IS MICHAEL THOMPSON, a Sales Representative from Wolters Kluwer selling ${config.product}. 

    ROLEPLAY RULES:
    1. NEVER BREAK CHARACTER. You do not know you are an AI.
    2. BE REALISTIC. You have a budget but you are cautious. 
    3. PRODUCT CONTEXT: You are interested in ${config.product} (${config.productDescription}).
    4. CALL CONTEXT: ${config.context || 'General discovery call'}.
    5. DIFFICULTY: ${config.difficulty}. If "Hard", be skeptical about ROI.

    GREETING REQUIREMENT:
    You MUST start by greeting Michael Thompson by name. 
    Example: "Hi Michael, thanks for jumping on. I'm Sarah Chen. I've been hearing a lot about Wolters Kluwer's ${config.product} and I'm curious to see if it actually solves our ${config.prospectRole.toLowerCase()} workflow issues."`;

    if (liveClientRef.current) liveClientRef.current.disconnect();

    liveClientRef.current = new LiveClient({
      onOpen: () => { 
        setIsConnecting(false); 
        setState(AppState.LIVE); 
        liveClientRef.current?.sendText(`[SYSTEM: Start simulation. Sarah Chen, please introduce yourself and greet Michael Thompson.]`); 
      },
      onAudioData: (vol) => {
        setVolume(vol);
        if (vol > 0.05) setIsWaitingForModel(true);
      },
      onTranscription: (speaker, text) => {
        if (speaker === 'model') {
          setIsSpeaking(true);
          setIsWaitingForModel(false);
        }
        
        if (activeTurnRef.current && activeTurnRef.current.speaker === speaker) {
          activeTurnRef.current.text += text;
        } else {
          // If a speaker change occurred without turnComplete, flush previous
          if (activeTurnRef.current) {
            transcriptsRef.current.push({ ...activeTurnRef.current, timestamp: Date.now() });
            setTranscripts([...transcriptsRef.current]);
          }
          activeTurnRef.current = { speaker, text };
        }
        setActiveTurn({ ...activeTurnRef.current });
      },
      onTurnComplete: () => {
        setIsSpeaking(false);
        if (activeTurnRef.current && activeTurnRef.current.text.trim()) {
          const completedItem = { ...activeTurnRef.current, timestamp: Date.now() };
          transcriptsRef.current = [...transcriptsRef.current, completedItem];
          setTranscripts(transcriptsRef.current);
        }
        activeTurnRef.current = null;
        setActiveTurn(null);
      },
      onError: (err) => { 
        setErrorMessage(err.message); 
        setIsConnecting(false); 
        setState(AppState.SETUP); 
      }
    });
    
    try { 
      await liveClientRef.current.connect(systemInstruction); 
    } catch (e: any) { 
      setErrorMessage(e.message || "Failed to start AI Coach."); 
      setIsConnecting(false); 
      setState(AppState.SETUP); 
    }
  };

  const handleEndSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const finalTranscripts = [...transcriptsRef.current];
    if (activeTurnRef.current && activeTurnRef.current.text.trim()) {
      finalTranscripts.push({ ...activeTurnRef.current, timestamp: Date.now() });
    }

    if (liveClientRef.current) { 
      liveClientRef.current.disconnect(); 
      liveClientRef.current = null; 
    }

    // Relaxed validation: ensure at least something was said
    if (finalTranscripts.length < 1) { 
      setErrorMessage("The simulation ended without any recorded conversation. Please ensure your microphone is enabled and you are speaking clearly.");
      setState(AppState.SETUP); 
      return; 
    }

    setState(AppState.ANALYZING);
    try {
      const result = await analyzeSession(finalTranscripts, scenario?.duration || 'NONE');
      
      setAnalysis(result);
      setHistory(prev => [{ 
        id: Date.now().toString(), 
        date: new Date().toLocaleDateString(), 
        prospectRole: scenario?.prospectRole || 'Unknown', 
        product: scenario?.product || 'Unknown', 
        score: result.scores.overall, 
        transcripts: finalTranscripts, 
        analysis: result 
      }, ...prev]);
      
      setState(AppState.REPORT);
    } catch (e: any) { 
      setErrorMessage(e.message || "AI Analysis failed. We couldn't evaluate this session."); 
      setState(AppState.SETUP); 
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const agentState = isSpeaking ? 'speaking' : volume > 0.05 ? 'listening' : state === AppState.ANALYZING ? 'processing' : 'idle';

  return (
    <div className="bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#6366f1] min-h-screen p-2 md:p-4 animate-ios-slide flex flex-col w-full relative">
      {state === AppState.SETUP && !isConnecting && (
        <div className="px-2 pb-12 w-full max-w-xl mx-auto">
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 bg-rose-500 text-white rounded-[24px] p-6 shadow-2xl border border-rose-400/50"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 p-2 rounded-full shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-1">Coach Connectivity Guard</h4>
                    <p className="text-[14px] font-bold leading-tight mb-2">{errorMessage}</p>
                    <p className="text-[11px] opacity-70">Gemini Live requires a project with active billing enabled. Please select a paid API key.</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button onClick={handleSelectKey} className="flex-1 bg-white text-rose-600 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg border border-white">Select Paid Key</button>
                  <button onClick={() => setErrorMessage(null)} className="flex-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl">Dismiss</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Setup onStart={handleStart} onViewHistory={() => setState(AppState.HISTORY)} />
        </div>
      )}

      {state === AppState.HISTORY && !isConnecting && (
        <div className="px-4 py-6 space-y-6 pb-32 w-full max-w-2xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Archive</p>
                <h3 className="text-3xl font-black text-white tracking-tight">Session History</h3>
            </div>
            <button onClick={() => setState(AppState.SETUP)} className="bg-white/30 text-white rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-white/20">Back</button>
          </div>
          <div className="space-y-4">
            {history.length > 0 ? history.map(record => (
              <button 
                key={record.id} 
                onClick={() => { setAnalysis(record.analysis); setTranscripts(record.transcripts); setState(AppState.REPORT); }} 
                className="w-full bg-white/10 backdrop-blur-xl rounded-[24px] border border-white/20 p-5 text-left flex justify-between items-center group active:scale-[0.98]"
              >
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl border border-white/20">📈</div>
                    <div>
                      <h4 className="text-white font-black text-base">{record.prospectRole}</h4>
                      <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-1">{record.product}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-white">{record.score}</div>
                    <div className="text-[8px] text-white/70 font-black uppercase tracking-widest">Score</div>
                </div>
              </button>
            )) : (
              <div className="bg-white/5 rounded-[32px] p-20 text-center border border-white/10 opacity-50">No simulations recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/10 backdrop-blur-xl">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full mb-8"
          />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Meeting Sarah Chen...</h2>
          <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Synchronizing Native Audio Modality</p>
        </div>
      )}

      {state === AppState.LIVE && !isConnecting && (
        <div className="flex-1 flex flex-col min-h-0 relative max-w-2xl mx-auto w-full">
          <div className="sticky top-0 z-[100] w-full bg-white/15 backdrop-blur-3xl shadow-2xl px-6 py-5 border border-white/20 rounded-3xl mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <div>
                <h2 className="text-white font-black text-[18px] tracking-tight leading-none">Sarah Chen</h2>
                <p className="text-white/60 text-[8px] font-black uppercase mt-1 tracking-widest">{scenario?.prospectRole}</p>
              </div>
            </div>
            
            {timeLeft !== null && (
              <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/10 flex flex-col items-center">
                <span className="text-[18px] font-black text-white tabular-nums leading-none">{formatTime(timeLeft)}</span>
                <span className="text-[7px] text-white/40 font-black uppercase tracking-widest mt-1">Remaining</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-6 flex flex-col no-scrollbar pb-32">
            {transcripts.length === 0 && !activeTurn ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <AIAgentLogo state={agentState} size="xl" />
                <h3 className="text-white font-black text-[26px] mt-10 mb-2 tracking-tight text-center">Simulating Sarah Chen</h3>
                <p className="text-white/60 text-center max-w-[280px] mb-10 text-sm font-medium">Say hello to Michael Thompson's new prospect.</p>
                <Visualizer 
                  inputAnalyser={liveClientRef.current?.inputAnalyser || null} 
                  outputAnalyser={liveClientRef.current?.outputAnalyser || null} 
                  isActive={true} 
                />
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                <div className="mb-4">
                    <Visualizer 
                        inputAnalyser={liveClientRef.current?.inputAnalyser || null} 
                        outputAnalyser={liveClientRef.current?.outputAnalyser || null} 
                        isActive={true} 
                    />
                </div>
                {[...transcripts, ...(activeTurn ? [activeTurn] : [])].map((t, idx) => {
                  const isModel = t.speaker === 'model';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={idx} 
                      className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className="flex flex-col max-w-[85%]">
                        <span className={`text-[8px] font-black uppercase tracking-widest mb-1 px-2 ${isModel ? 'text-white/40 text-left' : 'text-blue-200 text-right'}`}>
                          {isModel ? 'Sarah Chen (Prospect)' : 'Michael Thompson (Rep)'}
                        </span>
                        <div className={`px-5 py-4 text-[15px] shadow-2xl leading-relaxed rounded-[24px] border transition-all ${
                          isModel 
                            ? 'bg-white/15 text-white border-white/20 backdrop-blur-md rounded-tl-none' 
                            : 'bg-white text-blue-900 border-white rounded-tr-none font-bold'
                        }`}>
                          {t.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                <AnimatePresence>
                  {isWaitingForModel && !activeTurn && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 flex space-x-2">
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={transcriptEndRef} className="h-24" />
              </div>
            )}
          </div>

          <div className="fixed bottom-[84px] left-0 right-0 px-6 z-50">
            <div className="max-w-2xl mx-auto">
              <button 
                onClick={handleEndSession} 
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-3xl shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[13px] border border-rose-400/30"
              >
                Analyze Call Performance
              </button>
            </div>
          </div>
        </div>
      )}

      {state === AppState.ANALYZING && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/10 backdrop-blur-3xl">
          <div className="relative w-28 h-28 mb-12">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[6px] border-white/10 border-t-cyan-400 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-3xl">🧠</span>
            </div>
          </div>
          <motion.div 
            key={analysisStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">AI Coach Scoring</h2>
            <p className="text-cyan-400 font-bold text-sm tracking-wide h-6">{ANALYSIS_STEPS[analysisStep]}</p>
          </motion.div>
          <div className="w-72 bg-white/10 h-1.5 rounded-full mt-10 overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
            />
          </div>
        </div>
      )}

      {state === AppState.REPORT && analysis && (
        <div className="px-4 pb-32 w-full max-w-4xl mx-auto">
          <Report analysis={analysis} transcripts={transcripts} onRestart={() => setState(AppState.SETUP)} scenario={scenario} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
};
