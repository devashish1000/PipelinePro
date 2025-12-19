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
  private ai: GoogleGenAI | null = null;
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
  private isConnected = false;
  private isIntentionalDisconnect = false;

  constructor(events: LiveClientEvents) {
    this.events = events;
  }

  async connect(systemInstruction: string) {
    if (this.isConnected) return;
    this.isIntentionalDisconnect = false;

    try {
      // Check for API key and prompt if missing
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // Per instructions: assume success and proceed after triggering the dialog
      }

      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found. Please select a paid Google Cloud project API key.");
      }

      // MANDATORY: Create fresh instance right before use to capture latest API key state
      this.ai = new GoogleGenAI({ apiKey });

      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await this.inputAudioContext.resume();
      await this.outputAudioContext.resume();

      this.inputNode = this.inputAudioContext.createGain();
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionConfig = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: (e: any) => {
            if (this.isIntentionalDisconnect) return;
            
            console.error('[LiveClient] WebSocket Error:', e);
            let message = "A connection error occurred.";
            
            // Extract meaningful message from ErrorEvent or simple Error
            if (e.message) message = e.message;
            else if (e.reason) message = e.reason;
            else if (typeof e === 'string') message = e;
            else if (e.error?.message) message = e.error.message;

            // Handle "Requested entity was not found" per instructions
            if (message.toLowerCase().includes("requested entity was not found")) {
                (window as any).aistudio.openSelectKey();
            }

            this.events.onError?.(new Error(`LIVE API CONNECTION FAILED: ${message.toUpperCase()}`));
            this.disconnect();
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

      this.sessionPromise = this.ai.live.connect(sessionConfig);
      // Wait for the promise to resolve/reject to catch immediate errors in the connect call
      await this.sessionPromise;
      this.isConnected = true;
    } catch (err) {
      console.error('[LiveClient] connect exception:', err);
      const msg = err instanceof Error ? err.message : String(err);
      
      if (msg.toLowerCase().includes("requested entity was not found")) {
         await (window as any).aistudio.openSelectKey();
      }
      
      this.events.onError?.(new Error(`LIVE API CONNECTION FAILED: ${msg.toUpperCase()}`));
      this.disconnect();
    }
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }

  private handleOpen() {
    this.events.onOpen?.();
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected || this.isIntentionalDisconnect) return;
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) { sum += inputData[i] * inputData[i]; }
      const rms = Math.sqrt(sum / inputData.length);
      this.events.onAudioData?.(rms);
      const pcmBlob = this.createBlob(inputData);
      
      // Critical: solely rely on sessionPromise resolves to prevent race conditions
      this.sessionPromise!.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
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

  private handleClose() {
    if (!this.isIntentionalDisconnect) {
      this.events.onClose?.();
    }
    this.disconnect();
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this.isConnected = false;
    
    if (this.sessionPromise) {
        this.sessionPromise.then(s => { try { s.close(); } catch(e) {} }).catch(() => {});
    }
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') { this.inputAudioContext.close().catch(() => {}); }
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') { this.outputAudioContext.close().catch(() => {}); }
    
    this.processor = null; 
    this.source = null; 
    this.stream = null;
    this.inputAudioContext = null; 
    this.outputAudioContext = null;
    this.sessionPromise = null; 
    this.ai = null;
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
