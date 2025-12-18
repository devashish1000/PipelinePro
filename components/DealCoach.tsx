import React, { useState, useEffect, useRef } from 'react';
import { AppState, Scenario, TranscriptionItem, AnalysisResult, SessionRecord } from '../types';
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

export const DealCoach = () => {
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
  const [textInput, setTextInput] = useState('');
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

  // Timer logic
  useEffect(() => {
    if (state === AppState.LIVE && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          const next = prev - 1;
          if (next === 30) {
            liveClientRef.current?.sendText("[SYSTEM: 30 seconds remaining. As the PROSPECT, start looking for a way to naturally end the meeting soon.]");
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
  }, [state, timeLeft]);

  const handleStart = async (config: Scenario) => {
    setIsConnecting(true); 
    setErrorMessage(null);
    setScenario(config); 
    setTranscripts([]);
    setActiveTurn(null);
    
    let durationSec = null;
    if (config.duration === '5 MIN') durationSec = 5 * 60;
    else if (config.duration === '10 MIN') durationSec = 10 * 60;
    else if (config.duration === '15 MIN') durationSec = 15 * 60;
    
    setTimeLeft(durationSec);

    const systemInstruction = `
      ROLEPLAY INSTRUCTION:
      You are SARAH, the ${config.prospectRole}. You are the BUYER/PROSPECT.
      The user is Michael Thompson, a Wolters Kluwer sales representative trying to sell you ${config.product}.
      
      YOUR CHARACTER TRAITS:
      - You currently use a competitor (Thomson Reuters) and are skeptical about ROI.
      - Difficulty: ${config.difficulty}. (If Hard/Impossible, be very defensive and demand deep data).
      - Your job is to CHALLENGE the rep. Ask tough questions. Raise objections about pricing, implementation time, and actual business value.
      - DO NOT act as a helpful assistant. DO NOT ask the user if they have questions. 
      - YOU are the one with the budget and the power.
      
      CONTEXT: ${config.context || 'Standard sales call.'}
      
      DURING THE CALL:
      - Stay in character at all times.
      - Keep responses punchy and natural for a business meeting.
      - If the user provides a weak answer, press them.
    `;

    liveClientRef.current = new LiveClient({
      onOpen: () => { 
        setIsConnecting(false); 
        setState(AppState.LIVE); 
        // Start the call as the prospect
        liveClientRef.current?.sendText("Hi, this is Sarah. I'm ready for our meeting, but I only have a few minutes. What do you have for me?"); 
      },
      onAudioData: (vol) => setVolume(vol),
      onTranscription: (speaker, text) => {
        if (speaker === 'model') { setIsSpeaking(true); }
        setActiveTurn(prev => {
          if (prev && prev.speaker === speaker) {
            return { speaker, text: prev.text + text };
          }
          return { speaker, text };
        });
      },
      onTurnComplete: () => {
        setIsSpeaking(false);
        setActiveTurn(current => {
          if (current) {
            setTranscripts(prev => [...prev, { speaker: current.speaker, text: current.text, timestamp: Date.now() }]);
          }
          return null;
        });
      },
      onError: (err) => { 
        setErrorMessage(err.message || "A network error occurred.");
        setIsConnecting(false); 
        setState(AppState.SETUP);
      }
    });
    
    try { 
      await liveClientRef.current.connect(systemInstruction); 
    } catch (e) { 
      setErrorMessage(e instanceof Error ? e.message : "Failed to initialize.");
      setIsConnecting(false); 
      setState(AppState.SETUP); 
    }
  };

  const handleEndSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    liveClientRef.current?.disconnect(); 
    liveClientRef.current = null;
    if (transcripts.length < 2) { setState(AppState.SETUP); return; }
    setState(AppState.ANALYZING);
    try {
      const result = await analyzeSession(transcripts, scenario?.duration || 'NONE');
      setAnalysis(result);
      setHistory(prev => [{ id: Date.now().toString(), date: new Date().toLocaleDateString(), prospectRole: scenario?.prospectRole || 'Unknown', product: scenario?.product || 'Unknown', score: result.scores.overall, transcripts: [...transcripts], analysis: result }, ...prev]);
      setState(AppState.REPORT);
    } catch (e) { 
      setErrorMessage("Analysis failed.");
      setState(AppState.SETUP); 
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualSend = () => {
    if (!textInput.trim() || !liveClientRef.current) return;
    setTranscripts(prev => [...prev, { speaker: 'user', text: textInput, timestamp: Date.now() }]);
    liveClientRef.current.sendText(textInput); 
    setTextInput('');
  };

  const agentState = isSpeaking ? 'speaking' : volume > 0.05 ? 'listening' : state === AppState.ANALYZING ? 'processing' : 'idle';

  return (
    <div className="flex flex-col h-full animate-ios-slide max-w-2xl mx-auto w-full">
      {state === AppState.SETUP && !isConnecting && (
        <div className="px-4 pb-20">
          {errorMessage && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center space-x-3 text-rose-200">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-bold uppercase tracking-widest">{errorMessage}</p>
            </div>
          )}
          <Setup onStart={handleStart} onViewHistory={() => setState(AppState.HISTORY)} />
        </div>
      )}

      {state === AppState.HISTORY && !isConnecting && (
        <div className="px-4 py-6 space-y-6 pb-20">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white tracking-tight">Session History</h3>
            <button onClick={() => setState(AppState.SETUP)} className="text-[12px] font-bold uppercase tracking-wider text-[#4DB8A8]">New Session</button>
          </div>
          <div className="space-y-4">
            {history.map(record => (
              <button key={record.id} onClick={() => {
                setAnalysis(record.analysis);
                setTranscripts(record.transcripts);
                setState(AppState.REPORT);
              }} className="w-full glass-card p-5 text-left flex justify-between items-center group">
                <div>
                  <h4 className="text-white font-semibold text-[16px]">{record.prospectRole}</h4>
                  <p className="text-white/40 text-[12px] mt-1 uppercase tracking-wider">{record.product}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#4DB8A8] metric-value">{record.score}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest">{record.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#4DB8A8] rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting to AI Coach</h2>
          <p className="text-white/50 text-[13px] uppercase tracking-widest">Entering Virtual Boardroom...</p>
        </div>
      )}

      {state === AppState.LIVE && !isConnecting && (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* HEADER SECTION */}
          <div className="px-4 py-3 flex flex-col items-center border-b border-white/5 bg-[#1E3250]/40 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <h2 className="text-white font-bold text-[17px] tracking-tight">{scenario?.prospectRole}</h2>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-white/50 text-[12px] font-medium tracking-wide uppercase">Simulation Active</p>
              {timeLeft !== null && (
                <span className={`text-[12px] font-bold metric-value ${timeLeft <= 30 ? 'text-rose-400' : 'text-white/60'}`}>
                  {formatTime(timeLeft)} left
                </span>
              )}
            </div>
            <button 
              onClick={handleEndSession}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10"
            >
              End Call
            </button>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-4 flex flex-col custom-scrollbar">
            {transcripts.length === 0 && !activeTurn ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="mb-6">
                  <AIAgentLogo state={agentState} />
                </div>
                <h3 className="text-white font-bold text-[18px] mb-1 tracking-tight">Start your AI coaching session</h3>
                <p className="text-white/50 text-[14px] leading-relaxed mb-8 max-w-[280px]">I'm Sarah, your prospect. I'll challenge your pitch and raise common objections.</p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-[320px]">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        setTextInput(prompt);
                      }}
                      className="glass-card bg-white/10 text-white/80 py-3 px-5 rounded-2xl text-[13px] font-medium hover:bg-white/20 text-left transition-colors active:scale-[0.98]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {transcripts.map((t, idx) => {
                  const isModel = t.speaker === 'model';
                  const prevSpeaker = idx > 0 ? transcripts[idx - 1].speaker : null;
                  const isSameSpeaker = prevSpeaker === t.speaker;

                  return (
                    <div 
                      key={idx} 
                      className={`flex w-full animate-ios-slide ${isModel ? 'justify-start' : 'justify-end'}`}
                      style={{ 
                        marginTop: isSameSpeaker ? '4px' : '16px',
                        animationDelay: `${idx * 0.05}s`
                      }}
                    >
                      <div 
                        className={`max-w-[75%] px-[14px] py-[10px] text-[15px] shadow-md relative ${
                        isModel 
                          ? 'bg-[#1E3250]/85 backdrop-blur-md text-white border border-white/10 rounded-[16px] rounded-tl-[4px]' 
                          : 'bg-[#4DB8A8]/90 text-white border border-white/10 rounded-[16px] rounded-tr-[4px]'
                      }`}
                        style={{ lineHeight: '1.4' }}
                      >
                        {t.text}
                      </div>
                    </div>
                  );
                })}

                {/* ACTIVE STREAMING TURN */}
                {activeTurn && (
                  <div 
                    className={`flex w-full animate-ios-slide ${activeTurn.speaker === 'model' ? 'justify-start' : 'justify-end'}`}
                    style={{ marginTop: '16px' }}
                  >
                    <div className={`max-w-[75%] px-[14px] py-[10px] text-[15px] shadow-md relative ${
                      activeTurn.speaker === 'model' 
                        ? 'bg-[#1E3250]/85 backdrop-blur-md text-white border border-white/10 rounded-[16px] rounded-tl-[4px]' 
                        : 'bg-[#4DB8A8]/90 text-white border border-white/10 rounded-[16px] rounded-tr-[4px]'
                    }`} style={{ lineHeight: '1.4' }}>
                      {activeTurn.text}
                      {activeTurn.speaker === 'model' && (
                         <span className="inline-flex ml-1 items-center space-x-0.5">
                            <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                         </span>
                      )}
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} className="h-8" />
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="fixed bottom-[80px] left-0 right-0 px-4 z-40">
            <div className="max-w-2xl mx-auto glass-card bg-white/95 backdrop-blur-xl p-1.5 flex items-center shadow-[0_12px_40px_rgba(0,0,0,0.3)] border-white/20 h-[52px] rounded-[26px]">
              <input 
                type="text" 
                value={textInput} 
                onChange={e => setTextInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleManualSend()}
                placeholder="Respond to the prospect..." 
                className="flex-1 bg-transparent px-4 py-2 text-[#1E3250] outline-none placeholder-[#1E3250]/40 text-[15px] font-medium"
              />
              <button 
                onClick={handleManualSend} 
                disabled={!textInput.trim()} 
                className={`w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all shadow-md ${
                  textInput.trim() ? 'bg-[#4DB8A8] text-white scale-100' : 'bg-[#1E3250]/5 text-[#1E3250]/20 scale-95 opacity-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {state === AppState.ANALYZING && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#4DB8A8] rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Analyzing Performance</h2>
          <p className="text-white/50 text-[13px] uppercase tracking-widest">Calculating Metrics...</p>
        </div>
      )}

      {state === AppState.REPORT && analysis && (
        <div className="px-4 pb-20">
          <Report analysis={analysis} transcripts={transcripts} onRestart={() => setState(AppState.SETUP)} />
        </div>
      )}
    </div>
  );
};