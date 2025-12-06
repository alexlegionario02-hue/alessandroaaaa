import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyCard = async (base64Image: string): Promise<ScanResult> => {
  try {
    const modelId = "gemini-2.5-flash"; // Fast and good at vision

    const prompt = `
      Identify the Trading Card (TCG) in this image. 
      Focus on Pokémon cards. 
      Return the Name of the card, the Set Name, the Card Number (e.g., 123/190), and an estimated market price in USD based on average raw condition.
      If no card is clearly visible or identified, set 'found' to false.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            found: { type: Type.BOOLEAN },
            name: { type: Type.STRING },
            set: { type: Type.STRING },
            number: { type: Type.STRING },
            estimatedPrice: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
          },
          required: ["found"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      return { found: false };
    }

    const result = JSON.parse(jsonText);
    
    if (result.found && result.name) {
      return {
        found: true,
        data: {
          id: crypto.randomUUID(),
          name: result.name,
          set: result.set || "Unknown Set",
          number: result.number || "N/A",
          estimatedPrice: result.estimatedPrice || 0,
          currency: result.currency || "USD",
          confidence: result.confidence || 0.8,
        },
      };
    }

    return { found: false };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { found: false };
  }
};