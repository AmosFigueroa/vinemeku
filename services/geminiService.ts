import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const getGeminiChatResponse = async (
  message: string, 
  context?: string
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure API_KEY in your environment.";
  }

  try {
    const systemInstruction = `You are an expert Anime Assistant named 'AniBot'. 
    Your tone is friendly, enthusiastic, and knowledgeable about Japanese animation (anime).
    You help users find new anime to watch, explain plot points, or discuss characters.
    ${context ? `Current Context: The user is currently viewing/watching: ${context}.` : ''}
    If the user asks for recommendations, give 3 distinct options with a brief reason why.
    Keep responses concise (under 150 words) unless asked for more detail.`;

    const model = 'gemini-3-flash-preview'; 

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I couldn't generate a response at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the anime network (AI Error).";
  }
};

export const getGeminiSummary = async (title: string, synopsis: string): Promise<string> => {
    if (!apiKey) return synopsis;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Rewrite this anime synopsis to be more engaging and concise for a streaming site hero section. 
            Anime: ${title}. 
            Original Synopsis: ${synopsis}`,
        });
        return response.text || synopsis;
    } catch (e) {
        return synopsis;
    }
}