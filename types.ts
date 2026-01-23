
export enum PersonaType {
  FRIENDLY_CHEF = 'FRIENDLY_CHEF',
  WITTY_PAL = 'WITTY_PAL',
  SARCASTIC_COUSIN = 'SARCASTIC_COUSIN',
  SAVAGE_MOM = 'SAVAGE_MOM',
  GYM_TRAINER = 'GYM_TRAINER'
}

export enum LanguageType {
  ENGLISH = 'en-US',
  HINDI = 'hi-IN',
  PUNJABI = 'pa-IN'
}

export interface DetectedItem {
  name: string;
  category: string;
  healthImpact: 'GOOD' | 'NEUTRAL' | 'BAD';
  freshness: number;
  roast: string;
  x: number;
  y: number;
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
