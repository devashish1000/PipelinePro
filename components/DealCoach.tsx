import React, { useState, useEffect, useRef } from 'react';
import { AppState, Scenario, TranscriptionItem, AnalysisResult, SessionRecord, SalesRep } from '../types';
import { Setup } from './Setup';
import { Report } from './Report';
import { LiveClient } from '../services/liveClient';
import { analyzeSession } from '../services/analysisService';
import { AIAgentLogo } from './AIAgentLogo';

const SUGGESTED_PROMPTS = [
  "Begin discovery call",
  "Practice objection handling",
  "Pitch the Tax Software solution",
  "Handle a price negotiation"
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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const liveClientRef = useRef<LiveClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

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
    if (state === AppState.LIVE && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          const next = prev - 1;
          if (next === 30) {
            liveClientRef.current?.sendText(`[SYSTEM: 30 seconds remaining. As the PROSPECT, start looking for a way to naturally end the meeting soon by talking to ${currentUser.firstName}.]`);
          }
          if (next === 0) {
            handleEndSession();
            return 0;
          }
          return next;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [state, timeLeft, currentUser.firstName]);

  const handleStart = async (config: Scenario) => {
    setIsConnecting(true); setErrorMessage(null); setScenario(config); setTranscripts([]); setActiveTurn(null);
    let durationSec = null;
    if (config.duration === '5 MIN') durationSec = 5 * 60;
    else if (config.duration === '10 MIN') durationSec = 10 * 60;
    else if (config.duration === '15 MIN') durationSec = 15 * 60;
    setTimeLeft(durationSec);

    const systemInstruction = `Roleplay as SARAH, ${config.prospectRole}. ${currentUser.firstName} is selling ${config.product}. Be tough, difficulty ${config.difficulty}. Address user as ${currentUser.firstName}.`;

    liveClientRef.current = new LiveClient({
      onOpen: () => { setIsConnecting(false); setState(AppState.LIVE); liveClientRef.current?.sendText(`Hi ${currentUser.firstName}, ready to start?`); },
      onAudioData: (vol) => setVolume(vol),
      onTranscription: (speaker, text) => {
        if (speaker === 'model') setIsSpeaking(true);
        setActiveTurn(prev => prev && prev.speaker === speaker ? { speaker, text: prev.text + text } : { speaker, text });
      },
      onTurnComplete: () => {
        setIsSpeaking(false);
        setActiveTurn(current => { if (current) setTranscripts(prev => [...prev, { ...current, timestamp: Date.now() }]); return null; });
      },
      onError: (err) => { setErrorMessage(err.message); setIsConnecting(false); setState(AppState.SETUP); }
    });
    
    try { await liveClientRef.current.connect(systemInstruction); } catch (e) { setErrorMessage(String(e)); setIsConnecting(false); setState(AppState.SETUP); }
  };

  const handleEndSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (liveClientRef.current) { liveClientRef.current.disconnect(); liveClientRef.current = null; }
    if (transcripts.length < 2) { setState(AppState.SETUP); return; }
    setState(AppState.ANALYZING);
    try {
      const result = await analyzeSession(transcripts, scenario?.duration || 'NONE');
      setAnalysis(result);
      setHistory(prev => [{ id: Date.now().toString(), date: new Date().toLocaleDateString(), prospectRole: scenario?.prospectRole || 'Unknown', product: scenario?.product || 'Unknown', score: result.scores.overall, transcripts: [...transcripts], analysis: result }, ...prev]);
      setState(AppState.REPORT);
    } catch (e) { setErrorMessage("Analysis failed."); setState(AppState.SETUP); }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const agentState = isSpeaking ? 'speaking' : volume > 0.05 ? 'listening' : state === AppState.ANALYZING ? 'processing' : 'idle';

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 min-h-screen p-6 animate-ios-slide flex flex-col h-full w-full relative rounded-[48px] -m-4">
      {state === AppState.SETUP && !isConnecting && (
        <div className="px-4 pb-20 w-full max-w-2xl mx-auto">
          {errorMessage && <div className="mb-4 bg-rose-500/20 border border-rose-500/40 rounded-xl p-4 text-white text-sm font-bold uppercase tracking-widest">{errorMessage}</div>}
          <Setup onStart={handleStart} onViewHistory={() => setState(AppState.HISTORY)} />
        </div>
      )}

      {state === AppState.HISTORY && !isConnecting && (
        <div className="px-4 py-6 space-y-6 pb-20 w-full max-w-2xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Archive</p>
                <h3 className="text-3xl font-black text-white tracking-tight leading-none">History</h3>
            </div>
            <button onClick={() => setState(AppState.SETUP)} className="bg-white/30 hover:bg-white/40 text-white rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border border-white/20">New Call</button>
          </div>
          <div className="space-y-4">
            {history.length > 0 ? history.map(record => (
              <button key={record.id} onClick={() => { setAnalysis(record.analysis); setTranscripts(record.transcripts); setState(AppState.REPORT); }} className="w-full bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-xl p-5 text-left flex justify-between items-center group active:scale-[0.98] transition-all">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl border border-white/20">👤</div>
                    <div>
                      <h4 className="text-white font-black text-base leading-none">{record.prospectRole}</h4>
                      <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-2">{record.product}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-white">{record.score}</div>
                    <div className="text-[8px] text-white/70 font-black uppercase tracking-widest">Score</div>
                </div>
              </button>
            )) : <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center border border-white/20 text-white/70">No Sessions Yet</div>}
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting...</h2>
        </div>
      )}

      {state === AppState.LIVE && !isConnecting && (
        <div className="flex-1 flex flex-col min-h-0 relative max-w-2xl mx-auto w-full">
          <div className="sticky top-0 z-[100] w-full bg-white/20 backdrop-blur-xl shadow-2xl px-4 py-5 border border-white/30 rounded-2xl mb-4">
            <div className="flex flex-col items-center">
                <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                    <h2 className="text-white font-extrabold text-[18px] tracking-tight">{scenario?.prospectRole}</h2>
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase mt-1">Roleplay Active</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-6 flex flex-col no-scrollbar pb-32">
            {transcripts.length === 0 && !activeTurn ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <AIAgentLogo state={agentState} />
                <h3 className="text-white font-bold text-[22px] mt-8 mb-2">Meeting with Sarah</h3>
                <p className="text-white/70 text-center max-w-[300px]">Lead the conversation. Practice your discovery skills.</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {[...transcripts, ...(activeTurn ? [activeTurn] : [])].map((t, idx) => {
                  const isModel = t.speaker === 'model';
                  return (
                    <div key={idx} className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'}`}>
                      <div className={`px-5 py-3 text-[15px] shadow-xl leading-relaxed rounded-2xl border border-white/30 ${isModel ? 'bg-white/20 text-white rounded-tl-none' : 'bg-white/40 text-white rounded-tr-none font-semibold'}`}>
                        {t.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={transcriptEndRef} className="h-12" />
              </div>
            )}
          </div>
          <div className="fixed bottom-[84px] left-0 right-0 px-6 z-50">
            <div className="max-w-2xl mx-auto flex items-center space-x-3">
              {timeLeft !== null && <div className="bg-white/20 backdrop-blur-lg px-5 py-4 rounded-full border border-white/30 text-white font-black text-[14px] shadow-xl">{formatTime(timeLeft)}</div>}
              <button onClick={handleEndSession} className="flex-1 bg-white/30 hover:bg-white/40 text-white font-black py-4 rounded-full shadow-2xl transition-all uppercase tracking-widest text-[13px] border border-white/30">End Session</button>
            </div>
          </div>
        </div>
      )}

      {state === AppState.ANALYZING && <div className="flex-1 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"></div><h2 className="text-xl font-bold text-white uppercase tracking-widest">Analyzing...</h2></div>}

      {state === AppState.REPORT && analysis && (
        <div className="px-4 pb-20 w-full max-w-4xl mx-auto">
          <Report analysis={analysis} transcripts={transcripts} onRestart={() => setState(AppState.SETUP)} scenario={scenario} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
};
