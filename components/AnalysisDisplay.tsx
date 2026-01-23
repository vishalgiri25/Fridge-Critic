
import React, { useState, useEffect } from 'react';
import { AnalysisResponse, PersonaType } from '../types';
import { RefreshCw, ChefHat, Skull, Flame, Clock, ChevronDown, ChevronUp, Zap, Target } from 'lucide-react';

interface AnalysisDisplayProps {
  image: string | null;
  results: AnalysisResponse | null;
  isAnalyzing: boolean;
  onReset: () => void;
  personaType: PersonaType;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ image, results, isAnalyzing, onReset, personaType }) => {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (results && results.items.length > 0) {
      const timer = setTimeout(() => setActiveItem(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [results]);

  if (isAnalyzing) {
    return (
      <div className="space-y-12 animate-in fade-in duration-500">
        <div className="relative rounded-[40px] overflow-hidden glass border-cyan-500/30 aspect-video max-w-4xl mx-auto shadow-[0_0_100px_rgba(6,182,212,0.15)]">
          {image && <img src={image} className="w-full h-full object-cover opacity-30 grayscale saturate-0" alt="Analyzing" />}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 border-[6px] border-cyan-500/10 rounded-full animate-spin border-t-cyan-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-12 h-12 text-cyan-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-orbitron font-black text-white tracking-tighter neon-title mb-2">RUNNING DEEP SCAN...</h2>
              <p className="text-cyan-400 font-bold text-xs tracking-[0.5em] uppercase animate-pulse">Neural Pathing • Object Recognition • Guilt Calculation</p>
            </div>
          </div>
          {/* Enhanced Scanning Laser */}
          <div className="absolute top-0 left-0 w-full h-[15%] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent shadow-[0_0_40px_#22d3ee] animate-scan z-10 opacity-80"></div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] opacity-60"></div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const scoreColor = results.sinnerScore > 70 ? 'text-red-500' : results.sinnerScore > 30 ? 'text-orange-400' : 'text-lime-400';
  const scoreGlow = results.sinnerScore > 70 ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : results.sinnerScore > 30 ? 'drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]' : 'drop-shadow-[0_0_15px_rgba(132,204,22,0.8)]';

  return (
    <div className="space-y-12 pb-32 animate-in slide-in-from-bottom-8 duration-1000">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative rounded-[40px] overflow-hidden glass border-white/10 group shadow-2xl">
            {image && <img src={image} className="w-full h-auto object-cover" alt="Fridge Content" />}
            
            {results.items.map((item, idx) => (
              <div key={idx} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
                <div className={`relative ${activeItem === idx ? 'z-50' : 'z-10'}`}>
                  <button 
                    onClick={() => setActiveItem(activeItem === idx ? null : idx)}
                    className={`w-8 h-8 rounded-full border-4 transition-all duration-500 flex items-center justify-center
                      ${item.healthImpact === 'BAD' ? 'bg-red-500 border-red-200 shadow-[0_0_20px_#ef4444]' : 
                        item.healthImpact === 'GOOD' ? 'bg-lime-500 border-lime-200 shadow-[0_0_20px_#84cc16]' : 'bg-cyan-500 border-cyan-200 shadow-[0_0_20px_#06b6d4]'}`}
                  >
                    {item.isExpiryBomb ? <Skull className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-white" />}
                  </button>
                  
                  {activeItem === idx && (
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 glass p-4 rounded-3xl border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-90">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{item.category}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.healthImpact === 'BAD' ? 'bg-red-500/20 text-red-400' : 'bg-lime-500/20 text-lime-400'}`}>FRESHNESS: {item.freshness}%</span>
                      </div>
                      <p className="font-orbitron font-black text-lg mb-2">{item.name}</p>
                      <p className="text-sm italic text-cyan-300 leading-relaxed">"{item.roast}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`glass p-10 rounded-[40px] border-l-[12px] ${results.sinnerScore > 70 ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.1)]'} relative`}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Flame className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-6 mb-6">
               <div className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${results.personaName}`} className="w-16 h-16" alt="Guardian" />
               </div>
               <div>
                 <h4 className="font-orbitron font-black text-2xl uppercase tracking-tighter">{results.personaName}</h4>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <p className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em]">Guardian Protocol: ROAST</p>
                 </div>
               </div>
            </div>
            <p className="text-2xl md:text-3xl font-medium italic leading-relaxed text-white">
              "{results.personaDialogue}"
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Speedometer Sinner Score */}
          <div className="glass p-10 rounded-[40px] border-white/10 text-center relative group">
            <h3 className="font-orbitron font-black text-white/40 mb-10 uppercase tracking-[0.3em] text-xs">Guilt Velocity</h3>
            
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-56 h-56 -rotate-90 drop-shadow-2xl">
                <circle cx="112" cy="112" r="100" fill="none" stroke="currentColor" strokeWidth="12" className="text-white/5" strokeDasharray="628" strokeDashoffset="157" />
                <circle 
                  cx="112" cy="112" r="100" fill="none" stroke="currentColor" strokeWidth="12" 
                  strokeDasharray="628" strokeDashoffset={628 - (628 * 0.75 * results.sinnerScore) / 100}
                  className={`${scoreColor} ${scoreGlow} transition-all duration-[2000ms] ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-7xl font-black font-orbitron tracking-tighter ${scoreColor} ${scoreGlow}`}>{results.sinnerScore}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase mt-2 tracking-[0.4em]">SIN INDEX</span>
              </div>
            </div>

            <div className="mt-10">
              <p className={`text-sm font-black tracking-widest uppercase ${scoreColor}`}>
                {results.sinnerScore > 70 ? '⚠️ BIOLOGICAL HAZARD' : results.sinnerScore < 30 ? '✨ NUTRITIONAL SAINT' : '⚖️ MODERATE DEVIANT'}
              </p>
            </div>
          </div>

          {/* Rescue Recipe Card */}
          <div className="glass rounded-[40px] overflow-hidden border-white/10 group">
            <div className="bg-gradient-to-r from-lime-600 via-lime-500 to-lime-400 p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ChefHat className="text-white w-8 h-8 drop-shadow-lg" />
                <h3 className="font-orbitron font-black text-white text-xl uppercase tracking-tighter">Rescue Ops</h3>
              </div>
              <Clock className="w-6 h-6 text-white/50" />
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <h4 className="font-black text-2xl text-white mb-3 tracking-tight">{results.rescueRecipe.title}</h4>
                <p className="text-gray-400 leading-relaxed text-sm">Targeting: {results.rescueRecipe.description}</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.3em]">Tactical Ingredients</p>
                <div className="flex flex-wrap gap-2">
                  {results.rescueRecipe.ingredients.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-gray-300">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {showSteps && (
                <div className="mt-6 space-y-5 animate-in slide-in-from-top-4">
                  <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Deployment Steps</p>
                  <ol className="space-y-4">
                    {results.rescueRecipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm text-gray-300 leading-relaxed">
                        <span className="text-lime-500 font-black font-orbitron">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button 
                onClick={() => setShowSteps(!showSteps)}
                className="w-full py-5 bg-white text-black font-black font-orbitron rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              >
                {showSteps ? 'REDACT STEPS' : 'EXECUTE RECIPE'} 
                {showSteps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-16">
        <button onClick={onReset} className="group relative px-12 py-6">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl group-hover:bg-cyan-500/40 transition-all"></div>
          <div className="relative glass border-white/20 hover:border-cyan-500/50 rounded-2xl font-orbitron font-black text-lg transition-all flex items-center gap-4 px-12 py-6">
            <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
            INITIATE NEW SCAN
          </div>
        </button>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
