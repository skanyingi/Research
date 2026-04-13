import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const model = "gemini-3-flash-preview";

export async function performResearch(query: string, onProgress: (step: string) => void) {
  try {
    onProgress("Initializing research agent...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onProgress("Searching the web for relevant information...");
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Conduct a comprehensive research on: ${query}. 
          
          Please follow these steps:
          1. Search for the latest and most relevant information.
          2. Analyze the sources and identify key themes.
          3. Synthesize the information into a structured report with sections like Overview, Key Findings, Detailed Analysis, and Conclusion.
          4. Include citations where appropriate.` }]
        }
      ],
      config: {
        systemInstruction: "You are an expert research agent. Your goal is to provide accurate, well-structured, and comprehensive reports based on real-time information. Always cite your sources. Use Markdown for formatting.",
        tools: [
          { googleSearch: {} }
        ],
      }
    });

    onProgress("Synthesizing information and generating report...");
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.renderedContent || "",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Research error:", error);
    throw error;
  }
}
