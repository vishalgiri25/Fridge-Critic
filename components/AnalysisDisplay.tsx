
"use client";

import React, { useState, useEffect } from 'react';
import { AnalysisResponse, PersonaType, LanguageType } from '../types';
import { RefreshCw, ChefHat, Heart, Shield, Clock, ChevronDown, ChevronUp, Sparkles, Target, Volume2, Loader2, PlayCircle } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface AnalysisDisplayProps {
  image: string | null;
  results: AnalysisResponse | null;
  isAnalyzing: boolean;
  onReset: () => void;
  personaType: PersonaType;
  language: LanguageType;
}

// Global reference to handle staccato playback issues
let currentAudioSource: AudioBufferSourceNode | null = null;
let audioCtxInstance: AudioContext | null = null;

async function playPcm(base64: string) {
  // Stop existing audio immediately
  if (currentAudioSource) {
    try { currentAudioSource.stop(); } catch(e) {}
  }

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Initialize or resume AudioContext
  if (!audioCtxInstance) {
    audioCtxInstance = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  
  if (audioCtxInstance.state === 'suspended') {
    await audioCtxInstance.resume();
  }

  // Raw PCM 16-bit is 2 bytes per sample. Ensure byte-alignment.
  // Using the offset and length explicitly to avoid errors with SharedArrayBuffers or misalignment.
  const dataInt16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  const buffer = audioCtxInstance.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    // Convert 16-bit signed integer to float (-1.0 to 1.0)
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  const source = audioCtxInstance.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtxInstance.destination);
  source.start();
  currentAudioSource = source;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ image, results, isAnalyzing, onReset, personaType, language }) => {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);

  useEffect(() => {
    if (results && results.items.length > 0) {
      const timer = setTimeout(() => setActiveItem(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [results]);

  const handleSpeakItem = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!results || isSpeaking !== null) return;
    
    setIsSpeaking(idx);
    try {
      const item = results.items[idx];
      const audio = await generateSpeech(item.roast, personaType, language);
      await playPcm(audio);
    } catch (err) {
      console.error("Voice Generation UI Error:", err);
      // Fail silently for user but log for debugging
    } finally {
      setIsSpeaking(null);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="relative rounded-[40px] overflow-hidden glass border-sky-500/20 aspect-video max-w-4xl mx-auto shadow-2xl">
          {image && <img src={image} className="w-full h-full object-cover opacity-20 grayscale" alt="Analyzing" />}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-sky-500/10 rounded-full animate-spin border-t-sky-400"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-8 h-8 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-space font-bold text-white tracking-tight">Assessing Inventory</h2>
              <div className="flex items-center gap-3 justify-center">
                <div className="h-px w-8 bg-sky-500/30"></div>
                <p className="text-slate-400 font-bold text-[10px] tracking-[0.4em] uppercase">Neural Object Detection • Freshness Audit</p>
                <div className="h-px w-8 bg-sky-500/30"></div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.5)] animate-scan z-10"></div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const scoreColor = results.sinnerScore > 70 ? 'text-rose-400' : results.sinnerScore > 30 ? 'text-amber-400' : 'text-emerald-400';
  const scoreBg = results.sinnerScore > 70 ? 'bg-rose-500/10' : results.sinnerScore > 30 ? 'bg-amber-500/10' : 'bg-emerald-500/10';

  return (
    <div className="space-y-16 pb-32 animate-in slide-in-from-bottom-8 duration-1000">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="relative rounded-[3rem] overflow-hidden glass border-white/5 shadow-2xl group/fridge">
            {image && <img src={image} className="w-full h-auto object-cover" alt="Fridge Scan" />}
            
            {results.items.map((item, idx) => (
              <div key={idx} className="absolute transition-transform duration-500" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
                <div className={`relative ${activeItem === idx ? 'z-50' : 'z-10'}`}>
                  <button 
                    onClick={() => setActiveItem(activeItem === idx ? null : idx)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center hover:scale-125
                      ${item.healthImpact === 'BAD' ? 'bg-rose-500/80 border-rose-200 shadow-lg shadow-rose-500/40' : 
                        item.healthImpact === 'GOOD' ? 'bg-emerald-500/80 border-emerald-200 shadow-lg shadow-emerald-500/40' : 'bg-slate-500/80 border-slate-200 shadow-lg'}`}
                  >
                    {isSpeaking === idx ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </button>
                  
                  {activeItem === idx && (
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-72 glass-heavy p-6 rounded-[2rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto ring-1 ring-white/20">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{item.category}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.healthImpact === 'BAD' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {item.freshness}% QUALITY
                        </div>
                      </div>
                      <p className="font-space font-bold text-xl text-white mb-3 tracking-tight">{item.name}</p>
                      <div className="relative mb-6">
                        <span className="absolute -left-2 -top-2 text-sky-500/30 text-4xl font-serif">"</span>
                        <p className="text-sm italic text-slate-300 leading-relaxed relative z-10 pl-2">
                          {item.roast}
                        </p>
                      </div>
                      
                      <button 
                        onClick={(e) => handleSpeakItem(idx, e)}
                        disabled={isSpeaking !== null}
                        className={`w-full py-3 rounded-xl border flex items-center justify-center gap-3 transition-all active:scale-95 ${
                          isSpeaking === idx 
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {isSpeaking === idx ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Generating Voice...</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4 text-sky-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Hear Roasting</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`glass p-12 rounded-[3rem] border-l-8 ${results.sinnerScore > 70 ? 'border-rose-500' : 'border-sky-500'} relative overflow-hidden group shadow-2xl`}>
            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="w-64 h-64" />
            </div>
            
            <div className="flex items-center gap-6 mb-8">
               <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${results.personaName}`} className="w-14 h-14" alt="Persona" />
               </div>
               <div>
                 <h4 className="font-space font-bold text-xl text-white tracking-tight">{results.personaName}</h4>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Neural Companion • Online</p>
               </div>
            </div>
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-slate-200">
              "{results.personaDialogue}"
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Inventory Score */}
          <div className="glass p-10 rounded-[3rem] border-white/5 text-center relative shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-[0.3em]">Inventory Balance</h3>
            
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 -rotate-90">
                <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                <circle 
                  cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray="502" strokeDashoffset={502 - (502 * results.sinnerScore) / 100}
                  className={`${scoreColor} transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-space font-bold tracking-tight ${scoreColor}`}>{results.sinnerScore}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-[0.2em]">SIN INDEX</span>
              </div>
            </div>

            <div className={`mt-8 py-2 px-6 rounded-full inline-block text-[10px] font-bold tracking-widest uppercase ${scoreColor} ${scoreBg}`}>
              {results.sinnerScore > 70 ? 'Requires Attention' : results.sinnerScore < 30 ? 'Pristine State' : 'Balanced Stock'}
            </div>
          </div>

          <div className="glass rounded-[3rem] overflow-hidden border-white/5 shadow-xl">
            <div className="bg-slate-800/40 p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ChefHat className="text-sky-400 w-6 h-6" />
                <h3 className="font-space font-bold text-lg text-white tracking-tight">Rescue Protocol</h3>
              </div>
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            
            <div className="p-8 space-y-8">
              <div>
                <h4 className="font-bold text-2xl text-white mb-2 tracking-tight leading-tight">{results.rescueRecipe.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{results.rescueRecipe.description}</p>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Strategic Ingredients</p>
                <div className="flex flex-wrap gap-2">
                  {results.rescueRecipe.ingredients.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white/5 rounded-xl text-xs font-semibold text-slate-300 border border-white/5">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {showSteps && (
                <div className="pt-6 border-t border-white/5 space-y-5 animate-in slide-in-from-top-4">
                  <ol className="space-y-6">
                    {results.rescueRecipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm text-slate-300 leading-relaxed">
                        <span className="text-sky-500 font-bold font-space">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button 
                onClick={() => setShowSteps(!showSteps)}
                className="w-full py-4 bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 shadow-xl"
              >
                {showSteps ? 'Hide Execution' : 'View Instructions'} 
                {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-20">
        <button 
          onClick={onReset} 
          className="group relative flex items-center gap-4 px-10 py-5 glass border-white/10 hover:border-white/20 rounded-2xl font-space font-bold text-slate-200 transition-all hover:-translate-y-1 shadow-2xl"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 text-sky-400" />
          START NEW ANALYSIS
        </button>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
