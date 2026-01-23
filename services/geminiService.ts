
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, PersonaType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sinnerScore: { type: Type.NUMBER, description: "A score from 0 (saint) to 100 (junk king) based on fridge health." },
    personaName: { type: Type.STRING },
    personaDialogue: { type: Type.STRING, description: "A witty, character-driven roast of the fridge contents." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          healthImpact: { type: Type.STRING, enum: ["GOOD", "NEUTRAL", "BAD"] },
          freshness: { type: Type.NUMBER },
          roast: { type: Type.STRING, description: "A short, funny comment about this specific item." },
          x: { type: Type.NUMBER, description: "X coordinate (0-100) for positioning a speech bubble on the image." },
          y: { type: Type.NUMBER, description: "Y coordinate (0-100) for positioning a speech bubble on the image." },
          isExpiryBomb: { type: Type.BOOLEAN, description: "True if item looks old or near expiry." }
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

export const analyzeFridge = async (base64Image: string, persona: PersonaType): Promise<AnalysisResponse> => {
  const model = 'gemini-3-flash-preview';
  
  const personaPrompts = {
    [PersonaType.GYM_TRAINER]: "You are an aggressive, high-energy gym trainer who hates processed sugar and junk food. Use words like 'gains', 'failure', and 'cardio'.",
    [PersonaType.DESI_MOM]: "You are a classic Desi Mom who thinks everything from outside is 'poison'. Use sarcasm and emotional taunts. Mention 'bahar ka kachra'.",
    [PersonaType.GORDON_RAMSAY]: "You are Gordon Ramsay. Be professional but brutally honest about the culinary disaster you see. Use 'idiot sandwich' or 'raw' where applicable."
  };

  const prompt = `
    Perform a deep visual analysis of this fridge image. 
    Act as the following persona: ${personaPrompts[persona]}.
    
    1. Identify all visible food items.
    2. Assess their healthiness and estimated freshness.
    3. Calculate a 'Sinner Score' (0-100) where 100 means the fridge is full of junk.
    4. Provide a witty dialogue based on your persona.
    5. Find 3-4 items that can be combined into a simple, 'rescue recipe' to prevent waste.
    6. For each item, provide approximate coordinates (0-100) for UI overlays.
    
    Return the response strictly in JSON format matching the provided schema.
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze fridge. The Guardian is sleeping.");
  }
};
