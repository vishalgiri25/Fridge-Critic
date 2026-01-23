
"use client";

import React from 'react';
import { PersonaType } from '../types';
import { Coffee, Sparkles, Dumbbell, Heart } from 'lucide-react';

interface PersonaSelectorProps {
  selected: PersonaType;
  onSelect: (p: PersonaType) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selected, onSelect }) => {
  const personas = [
    { 
      id: PersonaType.WITTY_PAL, 
      label: 'Witty Pal', 
      icon: <Sparkles className="w-4 h-4" />,
      activeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
    },
    { 
      id: PersonaType.SAVAGE_MOM, 
      label: 'Savage Mom', 
      icon: <Heart className="w-4 h-4" />,
      activeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    },
    { 
      id: PersonaType.GYM_TRAINER, 
      label: 'Gym Bro', 
      icon: <Dumbbell className="w-4 h-4" />,
      activeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    { 
      id: PersonaType.FRIENDLY_CHEF, 
      label: 'Chef', 
      icon: <Coffee className="w-4 h-4" />,
      activeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Archetype</span>
      <div className="flex items-center gap-2 glass p-1.5 rounded-2xl flex-wrap">
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border border-transparent ${
              selected === p.id 
                ? p.activeClass
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonaSelector;
