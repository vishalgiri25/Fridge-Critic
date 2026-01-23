
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PersonaType, LanguageType, AnalysisResponse } from '../types';
import { Mic, MicOff, Loader2, Activity, Trash2 } from 'lucide-react';

interface VoiceInteractionProps {
  persona: PersonaType;
  language: LanguageType;
  currentAnalysis: AnalysisResponse | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({ persona, language, currentAnalysis }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const getSystemInstruction = () => {
    const langNames: Record<LanguageType, string> = {
      [LanguageType.ENGLISH]: "English",
      [LanguageType.HINDI]: "Hindi",
      [LanguageType.PUNJABI]: "Punjabi"
    };

    const fridgeContext = currentAnalysis 
      ? `CURRENT FRIDGE STOCK: ${currentAnalysis.items.map(i => `${i.name} (${i.freshness}% fresh, ${i.category})`).join(', ')}. 
         SINNER SCORE: ${currentAnalysis.sinnerScore}.`
      : "The fridge hasn't been scanned yet.";

    const personaInstructions = {
      [PersonaType.WITTY_PAL]: "You are a witty best friend. Use dry humor and high-level roasts.",
      [PersonaType.SAVAGE_MOM]: "You are a 'Savage Mom.' Sweet surface, but every word is a calculated strike at the user's laziness.",
      [PersonaType.GYM_TRAINER]: "You are a protein-obsessed Gym Trainer. If it's not macros, it's trash.",
      [PersonaType.FRIENDLY_CHEF]: "You are an elite Michelin star chef who thinks the user's fridge is a crime scene.",
      [PersonaType.SARCASTIC_COUSIN]: "You're the lazy, eye-rolling cousin who thinks the user's food choices are a joke."
    };

    return `
      Identity: ${personaInstructions[persona]}
      Communication Style:
      - VOICE: Speak with emotion and natural cadence.
      - ROASTING: Be witty and playful. Avoid harsh language that might trigger filters.
      - LANGUAGE: Strictly speak in ${langNames[language]}.
      
      ${fridgeContext}
    `;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
            } 
          },
          systemInstruction: getSystemInstruction(),
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setChatHistory(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: message.serverContent.inputTranscription.text }]);
            } else if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'ai') return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                return [...prev, { id: Date.now().toString() + "-ai", sender: 'ai', text }];
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current) {
              const audioData = decode(base64Audio);
              const buffer = await decodeAudioData(audioData, outputContextRef.current, 24000, 1);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: () => stopSession()
        }
      });
    } catch (err) {
      console.error("Live session failed:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-6 pointer-events-none">
      {isActive && (
        <div className="glass-heavy w-[360px] max-h-[450px] rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-6 duration-500 pointer-events-auto border-slate-700/30 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`}></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Audit</span>
             </div>
             <button onClick={() => setChatHistory([])} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-rose-400">
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-sky-500/10 text-sky-200' : 'bg-white/5 text-slate-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        </div>
      )}
      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 pointer-events-auto shadow-2xl relative group ${isActive ? 'bg-rose-500/10 border border-rose-500/50 text-rose-500' : 'bg-sky-500/10 border border-sky-500/50 text-sky-400'}`}
      >
        {isConnecting ? <Loader2 className="w-8 h-8 animate-spin" /> : isActive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>
    </div>
  );
};

export default VoiceInteraction;
