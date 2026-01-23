
import React, { useState, useRef } from 'react';
import { PersonaType, AnalysisResponse } from './types';
import { analyzeFridge } from './services/geminiService';
import Scanner, { ScannerHandle } from './components/Scanner';
import AnalysisDisplay from './components/AnalysisDisplay';
import PersonaSelector from './components/PersonaSelector';
import VoiceInteraction from './components/VoiceInteraction';
import { ChefHat, AlertTriangle, Info, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.GORDON_RAMSAY);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<ScannerHandle>(null);

  const handleCapture = async (base64: string) => {
    setImage(base64);
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeFridge(base64, persona);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The Kitchen Guardian is offline.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResults(null);
    setError(null);
  };

  const triggerUpload = () => {
    scannerRef.current?.triggerUpload();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Decorative Element */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/5 blur-[120px] pointer-events-none z-0"></div>

      {/* Voice Interaction Layer */}
      <VoiceInteraction persona={persona} />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase">System Status: Active</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-orbitron font-black tracking-tighter leading-none">
            <span className="brand-gradient drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              FRIDGEBURN
            </span>
            <span className="block md:inline-block md:ml-4 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              AI
            </span>
          </h1>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="h-px w-16 bg-gradient-to-r from-cyan-500 to-transparent"></div>
            <p className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase italic">
              Social Experience • Food Safety • Tactical Roasting
            </p>
          </div>
        </div>
        
        {!results && !isAnalyzing && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-1000">
            <PersonaSelector selected={persona} onSelect={setPersona} />
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-6xl mx-auto">
        {error && (
          <div className="mb-8 p-6 glass border-red-500/50 flex items-center gap-4 text-red-400 animate-in zoom-in-95 duration-300">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">System Override Detected</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {!image && !isAnalyzing ? (
          <div className="space-y-16 animate-in fade-in duration-1000">
            <Scanner ref={scannerRef} onImageCapture={handleCapture} isAnalyzing={isAnalyzing} />
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <ChefHat className="text-cyan-400" />, 
                  title: "RESCUE RECIPES", 
                  desc: "Zero-waste tactical maneuvers for your lonely leftovers.",
                  border: "hover:border-cyan-500/50"
                },
                { 
                  icon: <AlertTriangle className="text-lime-400" />, 
                  title: "EXPIRY BOMBS", 
                  desc: "Detect biological hazards before they detect you.",
                  border: "hover:border-lime-500/50"
                },
                { 
                  icon: <Info className="text-fuchsia-400" />, 
                  title: "SOCIAL ROASTING", 
                  desc: "Psychological triggers to fix your failing lifestyle.",
                  border: "hover:border-fuchsia-500/50"
                }
              ].map((feature, i) => (
                <button 
                  key={i} 
                  onClick={triggerUpload}
                  className={`glass p-8 rounded-3xl border-white/5 transition-all duration-500 group text-left w-full ${feature.border} hover:bg-white/[0.02] hover:-translate-y-2`}
                >
                  <div className="mb-6 p-4 w-fit bg-white/5 rounded-2xl group-hover:scale-110 group-hover:bg-white/10 transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="font-orbitron font-black text-xl mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </button>
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
          />
        )}
      </main>

      <footer className="relative z-10 max-w-6xl mx-auto mt-32 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-gray-500 text-[10px] font-bold tracking-[0.2em] gap-6">
        <p className="uppercase">© 2024 FRIDGEBURN AI • PREVENTING WASTE THROUGH PSYCHOLOGICAL WARFARE</p>
        <div className="flex gap-8 uppercase">
          <a href="#" className="hover:text-cyan-400 transition-colors">Neural Link Protocol</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Shield</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
