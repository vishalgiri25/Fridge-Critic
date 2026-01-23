
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResponse, PersonaType, LanguageType } from "../types";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sinnerScore: { type: Type.NUMBER, description: "A score from 0 (very healthy) to 100 (junk food/unhealthy) based on current fridge balance." },
    personaName: { type: Type.STRING },
    personaDialogue: { type: Type.STRING, description: "A response reflecting the persona. Use mature humor." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          healthImpact: { type: Type.STRING, enum: ["GOOD", "NEUTRAL", "BAD"] },
          freshness: { type: Type.NUMBER, description: "Quality percentage (0-100)." },
          roast: { type: Type.STRING, description: "A witty, dry, and slightly judgmental roast. Keep it playful and safe for voice output." },
          x: { type: Type.NUMBER, description: "Horizontal percentage position (0-100)." },
          y: { type: Type.NUMBER, description: "Vertical percentage position (0-100)." },
          isExpiryBomb: { type: Type.BOOLEAN }
        },
        required: ["name", "category", "healthImpact", "freshness", "roast", "x", "y", "isExpiryBomb"]
      }
    },
    rescueRecipe: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "description", "ingredients", "steps"]
    }
  },
  required: ["sinnerScore", "personaName", "personaDialogue", "items", "rescueRecipe"]
};

export const analyzeFridge = async (base64Image: string, persona: PersonaType, language: LanguageType = LanguageType.ENGLISH): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const personaPrompts = {
    [PersonaType.WITTY_PAL]: "Witty best friend who loves food. Use dry humor, clever puns, and high-level roasting. Be brutal but likeable.",
    [PersonaType.FRIENDLY_CHEF]: "A world-class Michelin star chef who is deeply disappointed by your home cooking standards. Sarcastic, elite, and slightly pretentious.",
    [PersonaType.SARCASTIC_COUSIN]: "Sarcastic, lazy cousin who has seen it all. Uses slang, eye-rolls through words, and judges your 'adulting' skills.",
    [PersonaType.SAVAGE_MOM]: "The ultimate Savage Mom. Sweet surface, but every word is a calculated strike at your life choices. Sarcastic and judgmental.",
    [PersonaType.GYM_TRAINER]: "Hardcore Gym Trainer. Anything not pure protein is a personal insult to the gods of fitness. Loud, aggressive, and hilarious."
  };

  const languageContexts = {
    [LanguageType.ENGLISH]: "Modern English with urban slang.",
    [LanguageType.HINDI]: "Authentic Hindi with a sharp, witty Delhi/UP edge.",
    [LanguageType.PUNJABI]: "High-energy Punjabi with colorful expressions and 'gabru' vibes."
  };

  const prompt = `
    STRICT VISUAL AUDIT PROTOCOL:
    1. OBJECT DETECTION: Identify visible items accurately.
    2. ROASTING QUALITY: High-level roasts only. Be witty and playful. IMPORTANT: Ensure the roast is "TTS-Safe" (no harsh insults that trigger safety filters).
    3. LANGUAGE: Strictly use ${languageContexts[language]}. 
    4. PERSONA: ${personaPrompts[persona]}.
    
    Output valid JSON according to schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from analysis engine.");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Analysis failed. Try a clearer photo.");
  }
};

export const generateSpeech = async (text: string, persona: PersonaType, language: LanguageType): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const voiceConfigs = {
    [PersonaType.SAVAGE_MOM]: { name: 'Kore', tone: 'judgmentally' },
    [PersonaType.GYM_TRAINER]: { name: 'Fenrir', tone: 'shouting' },
    [PersonaType.WITTY_PAL]: { name: 'Zephyr', tone: 'wittily' },
    [PersonaType.FRIENDLY_CHEF]: { name: 'Puck', tone: 'elegantly' },
    [PersonaType.SARCASTIC_COUSIN]: { name: 'Charon', tone: 'lazily' }
  };

  const langNames = {
    [LanguageType.ENGLISH]: "English",
    [LanguageType.HINDI]: "Hindi",
    [LanguageType.PUNJABI]: "Punjabi"
  };

  const config = voiceConfigs[persona] || voiceConfigs[PersonaType.WITTY_PAL];
  
  // Use the standard "Say [tone]: [text]" format for the TTS model.
  const prompt = `Say ${config.tone} in ${langNames[language]}: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.name },
          },
        },
      },
    });

    // Safely search for the audio part
    let base64Audio = "";
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        break;
      }
    }

    if (!base64Audio) {
      throw new Error("Audio generation failed: Safety filter likely triggered.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Speech Generation Service Error:", error);
    throw error;
  }
};
