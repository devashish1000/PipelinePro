
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveClientEvents {
  onOpen?: () => void;
  onClose?: () => void;
  onAudioData?: (volume: number) => void;
  onTranscription?: (speaker: 'user' | 'model', text: string) => void;
  onTurnComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LiveClient {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;
  private events: LiveClientEvents;
  private isIntentionalDisconnect = false;
  private retryCount = 0;
  private maxRetries = 3;

  // Public analysers for visualization
  public inputAnalyser: AnalyserNode | null = null;
  public outputAnalyser: AnalyserNode | null = null;

  constructor(events: LiveClientEvents) {
    this.events = events;
  }

  private async initializeAudio() {
    await this.cleanupAudio();

    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
      if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

      this.inputNode = this.inputAudioContext.createGain();
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputNode.connect(this.outputAnalyser);

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
    } catch (err) {
      console.error("[LiveClient] Audio Hardware Error:", err);
      throw new Error("Microphone access denied. Please check your browser permissions.");
    }
  }

  async connect(systemInstruction: string, isRetry = false) {
    this.isIntentionalDisconnect = false;
    if (!isRetry) this.retryCount = 0;

    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }

      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found. Please click 'Select Key' and choose a paid project.");
      }

      await this.initializeAudio();

      // Create a fresh instance for every connection attempt
      const ai = new GoogleGenAI({ apiKey });

      const sessionConfig = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("[LiveClient] Connection established.");
            this.retryCount = 0;
            this.handleOpen();
          },
          onmessage: this.handleMessage.bind(this),
          onclose: (e: CloseEvent) => {
            if (!this.isIntentionalDisconnect) {
              this.handleAutoReconnect(systemInstruction);
            }
          },
          onerror: async (e: any) => {
            if (this.isIntentionalDisconnect) return;
            
            const rawMessage = (e.message || String(e)).toLowerCase();
            console.error('[LiveClient] WebSocket Error:', rawMessage);

            if (rawMessage.includes("requested entity was not found") || rawMessage.includes("403") || rawMessage.includes("billing")) {
              await (window as any).aistudio.openSelectKey();
              this.events.onError?.(new Error("AI Coach Connection Failed: Please ensure you select an API key from a project with active billing. Free projects do not support native audio streams."));
              this.disconnect();
              return;
            }

            if (this.retryCount < this.maxRetries) {
              this.handleAutoReconnect(systemInstruction);
            } else {
              this.events.onError?.(new Error("Persistent connection error. Please try again later."));
              this.disconnect();
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: systemInstruction,
        },
      };

      this.sessionPromise = ai.live.connect(sessionConfig);
      await this.sessionPromise;
      
    } catch (err) {
      console.error('[LiveClient] Connection setup error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      this.events.onError?.(new Error(msg));
      this.disconnect();
    }
  }

  private async handleAutoReconnect(instruction: string) {
    this.retryCount++;
    const delay = Math.min(Math.pow(2, this.retryCount) * 1000, 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
    this.connect(instruction, true).catch(() => {});
  }

  private async cleanupAudio() {
    if (this.processor) { this.processor.onaudioprocess = null; this.processor.disconnect(); this.processor = null; }
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.inputAnalyser) { this.inputAnalyser.disconnect(); this.inputAnalyser = null; }
    if (this.outputAnalyser) { this.outputAnalyser.disconnect(); this.outputAnalyser = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      try { await this.inputAudioContext.close(); } catch(e) {}
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      try { await this.outputAudioContext.close(); } catch(e) {}
      this.outputAudioContext = null;
    }
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      }).catch(() => {});
    }
  }

  private handleOpen() {
    this.events.onOpen?.();
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise || !this.inputAnalyser) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    this.source.connect(this.inputAnalyser);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) { sum += inputData[i] * inputData[i]; }
      const rms = Math.sqrt(sum / inputData.length);
      this.events.onAudioData?.(rms);

      const pcmBlob = this.createBlob(inputData);
      this.sessionPromise?.then((session) => {
          if (!this.isIntentionalDisconnect) {
            session.sendRealtimeInput({ media: pcmBlob });
          }
      }).catch(() => {});
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (this.isIntentionalDisconnect) return;

    if (message.serverContent?.outputTranscription?.text) {
      this.events.onTranscription?.('model', message.serverContent.outputTranscription.text);
    }
    if (message.serverContent?.inputTranscription?.text) {
      this.events.onTranscription?.('user', message.serverContent.inputTranscription.text);
    }
    if (message.serverContent?.turnComplete) {
      this.events.onTurnComplete?.();
    }

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      try {
        const audioBuffer = await this.decodeAudioData(this.decode(base64Audio), this.outputAudioContext, 24000, 1);
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        source.addEventListener('ended', () => { this.sources.delete(source); });
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
      } catch (e) {
        console.error('[LiveClient] Audio decoding error:', e);
      }
    }

    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => { try { source.stop(); } catch (e) {} });
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.sessionPromise) {
        this.sessionPromise.then(s => { try { s.close(); } catch(e) {} }).catch(() => {});
        this.sessionPromise = null;
    }
    this.cleanupAudio();
  }

  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    return { data: this.encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}
