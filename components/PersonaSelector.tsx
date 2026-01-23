
import React from 'react';
import { PersonaType } from '../types';
import { Dumbbell, Utensils, Flame } from 'lucide-react';

interface PersonaSelectorProps {
  selected: PersonaType;
  onSelect: (p: PersonaType) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selected, onSelect }) => {
  const personas = [
    { 
      id: PersonaType.GORDON_RAMSAY, 
      label: 'Ramsay', 
      icon: <Flame className="w-4 h-4" />,
      color: 'hover:text-red-400',
      activeColor: 'bg-red-500/20 text-red-400 border-red-500/50'
    },
    { 
      id: PersonaType.GYM_TRAINER, 
      label: 'Trainer', 
      icon: <Dumbbell className="w-4 h-4" />,
      color: 'hover:text-cyan-400',
      activeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
    },
    { 
      id: PersonaType.DESI_MOM, 
      label: 'Desi Mom', 
      icon: <Utensils className="w-4 h-4" />,
      color: 'hover:text-magenta-400',
      activeColor: 'bg-magenta-500/20 text-magenta-400 border-magenta-500/50'
    },
  ];

  return (
    <div className="flex items-center glass rounded-2xl p-1.5 border-white/5 backdrop-blur-xl">
      <span className="text-[10px] font-black text-gray-500 uppercase px-3 tracking-widest hidden md:block border-r border-white/10 mr-2">Guardian</span>
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${p.color} ${
            selected === p.id 
              ? p.activeColor + ' shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105 border' 
              : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          {p.icon}
          <span className="hidden sm:inline">{p.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PersonaSelector;
