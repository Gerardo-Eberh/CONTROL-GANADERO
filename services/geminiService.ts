
import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartObservation = async (context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un asistente experto en control de calidad. 
      Basándote en el siguiente contexto de prueba: "${context}", 
      genera una breve observación profesional (máximo 2 frases) para el informe técnico.`,
    });
    // response.text is a getter, correctly used here
    return response.text || 'Sin sugerencias disponibles.';
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al generar sugerencia.";
  }
};
