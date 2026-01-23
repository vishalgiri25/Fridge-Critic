
export enum PersonaType {
  GYM_TRAINER = 'GYM_TRAINER',
  DESI_MOM = 'DESI_MOM',
  GORDON_RAMSAY = 'GORDON_RAMSAY'
}

export interface DetectedItem {
  name: string;
  category: string;
  healthImpact: 'GOOD' | 'NEUTRAL' | 'BAD';
  freshness: number; // 0-100
  roast: string;
  x: number; // 0-100 position for overlay
  y: number; // 0-100 position for overlay
  isExpiryBomb: boolean;
}

export interface AnalysisResponse {
  sinnerScore: number;
  personaDialogue: string;
  personaName: string;
  items: DetectedItem[];
  rescueRecipe: {
    title: string;
    description: string;
    ingredients: string[];
    steps: string[];
  };
}

export interface AppState {
  image: string | null;
  isAnalyzing: boolean;
  results: AnalysisResponse | null;
  error: string | null;
  selectedPersona: PersonaType;
}
