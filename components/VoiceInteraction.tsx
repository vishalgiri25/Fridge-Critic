
import React, { useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PersonaType } from '../types';
import { Mic, MicOff, MessageSquareText, Activity } from 'lucide-react';

interface VoiceInteractionProps {
  persona: PersonaType;
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({ persona }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const personaPrompts = {
    [PersonaType.GYM_TRAINER]: "You are an aggressive gym trainer. Use gym slang, motivate the user to dump sugar, and yell about 'gains'. Keep it punchy.",
    [PersonaType.DESI_MOM]: "You are a sarcastic Desi Mom. Use phrases like 'Bahar ka kachra' and 'Beta, kya kar rahe ho?'. Roasting is your primary love language.",
    [PersonaType.GORDON_RAMSAY]: "You are Gordon Ramsay. Be professional but absolutely brutal. Use 'Idiot sandwich' and 'Raw' often."
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    setTranscription("Handshaking with the Guardian...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = inputCtx;
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: persona === PersonaType.DESI_MOM ? 'Kore' : 'Zephyr' } }
          },
          systemInstruction: personaPrompts[persona],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setTranscription("The Guardian is watching. Speak up!");
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Simple downsample to 16kHz
              const ratio = inputCtx.sampleRate / 16000;
              const newLen = Math.floor(inputData.length / ratio);
              const downsampled = new Int16Array(newLen);
              for(let i=0; i<newLen; i++) downsampled[i] = inputData[Math.floor(i*ratio)] * 32767;
              
              const base64 = btoa(String.fromCharCode(...new Uint8Array(downsampled.buffer)));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            sessionRef.current = { stream, scriptProcessor };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscription(`YOU: ${message.serverContent.inputTranscription.text}`);
            } else if (message.serverContent?.outputTranscription) {
              setTranscription(`GUARDIAN: ${message.serverContent.outputTranscription.text}`);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current) {
              const audioData = decodeBase64(base64Audio);
              const buffer = await decodeAudioData(audioData, outputContextRef.current);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => stopSession()
        }
      });
    } catch (err) {
      setIsConnecting(false);
      setTranscription("Access Denied.");
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    setTranscription("");
    if (sessionRef.current) {
      sessionRef.current.stream.getTracks().forEach((t: any) => t.stop());
      sessionRef.current.scriptProcessor.disconnect();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
      {isActive && transcription && (
        <div className="glass p-5 rounded-3xl border-cyan-500/30 max-w-[280px] animate-in slide-in-from-bottom-4 shadow-[0_20px_50px_rgba(6,182,212,0.2)] pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Neural Link</span>
            </div>
            <span className="text-[9px] font-bold text-white/30 px-2 py-0.5 rounded-full border border-white/10 uppercase">Persona: {persona}</span>
          </div>
          <p className="text-sm text-gray-200 font-medium leading-relaxed">
            {transcription.startsWith('YOU:') ? (
              <span className="text-cyan-400 font-black">{transcription}</span>
            ) : (
              <span className="italic">"{transcription.replace('GUARDIAN: ', '')}"</span>
            )}
          </p>
        </div>
      )}

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 pointer-events-auto relative group ${
          isActive 
            ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
            : 'bg-cyan-500/20 border-2 border-cyan-500 hover:scale-110 shadow-[0_0_40px_rgba(6,182,212,0.3)]'
        }`}
      >
        {isConnecting ? (
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        ) : isActive ? (
          <MicOff className="w-10 h-10 text-red-500 animate-pulse" />
        ) : (
          <Mic className="w-10 h-10 text-cyan-400" />
        )}
        
        <div className="absolute -top-14 right-0 glass px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          Neural Comms
        </div>
      </button>
    </div>
  );
};

export default VoiceInteraction;
