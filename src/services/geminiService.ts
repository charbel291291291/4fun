import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processEarningsData(fileContent: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract earnings data from the following text. Return a JSON array of objects with 'name', 'id', and 'earnings' (number).
    
    Text:
    ${fileContent}`,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text);
}
