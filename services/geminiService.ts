
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAnimalPerformance = async (data: { breed: string, weight: string, birthDate: string, animalId: string }) => {
  try {
    // Obtenemos la fecha de hoy para que la IA tenga un punto de referencia real
    const today = new Date().toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompt = `Actúa como un experto veterinario y analista ganadero. 
    DATOS DEL ANIMAL:
    - ID: ${data.animalId}
    - Raza: ${data.breed}
    - Peso Actual: ${data.weight} kg
    - Fecha de Nacimiento: ${data.birthDate}
    
    CONTEXTO TEMPORAL:
    - Hoy es: ${today}
    
    TAREA:
    1. Calcula la edad exacta del animal en meses basándote en la fecha de hoy y su nacimiento.
    2. Evalúa si el peso de ${data.weight} kg es adecuado para un animal de esa raza y esa edad calculada.
    3. Proporciona un diagnóstico técnico MUY breve (máximo 20 palabras). 
    
    Sé profesional, preciso con la edad y directo.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text?.trim() || 'Análisis no disponible.';
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al procesar el diagnóstico técnico.";
  }
};
