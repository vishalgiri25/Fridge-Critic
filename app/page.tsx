
"use client";

import React, { useState, useRef } from 'react';
import { PersonaType, AnalysisResponse, LanguageType } from '../types';
import { analyzeFridge } from '../services/geminiService';
import Scanner, { ScannerHandle } from '../components/Scanner';
import AnalysisDisplay from '../components/AnalysisDisplay';
import PersonaSelector from '../components/PersonaSelector';
import VoiceInteraction from '../components/VoiceInteraction';
import { Globe, ShieldCheck, PieChart, UtensilsCrossed, Sparkles } from 'lucide-react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.WITTY_PAL);
  const [language, setLanguage] = useState<LanguageType>(LanguageType.ENGLISH);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<ScannerHandle>(null);

  const handleCapture = async (base64: string) => {
    setImage(base64);
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeFridge(base64, persona, language);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The Kitchen Link is temporarily unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResults(null);
    setError(null);
  };

  const triggerUpload = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    scannerRef.current?.triggerUpload();
  };

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto selection:bg-sky-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,_#0f172a_0%,_#0a0c10_100%)] -z-10"></div>
      
      <VoiceInteraction 
        persona={persona} 
        language={language} 
        currentAnalysis={results}
      />

      <header className="mb-20 flex flex-col md:flex-row md:items-start justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
               <ShieldCheck className="w-6 h-6 text-sky-400" />
             </div>
             <span className="text-[10px] font-bold tracking-[0.4em] text-sky-400 uppercase">Neural Kitchen Guard</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-space font-extrabold tracking-tight text-white">
            Fridge<span className="text-slate-500">Burn</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
            Elevate your kitchen consciousness with playful AI companionship.
          </p>
        </div>

        <div className="flex flex-col md:items-end gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Language</span>
            <div className="flex items-center gap-2 glass p-1.5 rounded-2xl">
              {[
                { id: LanguageType.ENGLISH, label: 'EN' },
                { id: LanguageType.HINDI, label: 'HI' },
                { id: LanguageType.PUNJABI, label: 'PB' }
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    language === lang.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
              <Globe className="w-3 h-3 text-slate-600 ml-2 mr-2" />
            </div>
          </div>
          <PersonaSelector selected={persona} onSelect={setPersona} />
        </div>
      </header>

      <main>
        {error && (
          <div className="mb-10 p-6 glass border-rose-500/30 rounded-[2rem] flex items-center gap-4 text-rose-300 animate-in zoom-in-95">
             <p className="font-semibold">{error}</p>
          </div>
        )}

        {!image && !isAnalyzing ? (
          <div className="space-y-20 animate-in fade-in duration-1000">
            <Scanner ref={scannerRef} onImageCapture={handleCapture} isAnalyzing={isAnalyzing} />
            
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: <PieChart className="w-5 h-5 text-sky-400" />, title: "Nutritional Health", desc: "A sophisticated breakdown of your current stock's dietary profile." },
                { icon: <UtensilsCrossed className="w-5 h-5 text-emerald-400" />, title: "Rescue Protocol", desc: "Chef-grade recipes derived from your soon-to-expire ingredients." },
                { icon: <Sparkles className="w-5 h-5 text-indigo-400" />, title: "Atmospheric Roasting", desc: "Playful banter about your fridge habits, tailored to your mood." }
              ].map((feat, i) => (
                <div 
                  key={i} 
                  onClick={(e) => triggerUpload(e)}
                  className="group text-left glass p-8 rounded-[2.5rem] border-white/5 space-y-4 hover:border-white/20 hover:bg-white/[0.05] transition-all hover:-translate-y-1 active:scale-95 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-sky-500/10 group-hover:border-sky-500/30 transition-colors">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight font-space">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AnalysisDisplay 
            image={image} 
            results={results} 
            isAnalyzing={isAnalyzing} 
            onReset={reset}
            personaType={persona}
            language={language}
          />
        )}
      </main>

      <footer className="mt-40 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-600 text-[10px] font-bold tracking-[0.2em] uppercase gap-6">
        <p>© 2024 FridgeBurn AI • Intelligent Food Management</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-sky-400 transition-colors">Protocols</a>
          <a href="#" className="hover:text-sky-400 transition-colors">Neural Security</a>
        </div>
      </footer>
    </div>
  );
}
