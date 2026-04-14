import { GoogleGenerativeAI } from "@google/generative-ai";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// In Vercel, we can usually just use relative paths if the API is in the same project
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

export async function performResearch(query: string, onProgress: (step: string) => void) {
  try {
    onProgress("Initializing research agent...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 1. Prefer the Serverless API (Vercel/Netlify)
    onProgress("Analyzing request via research engine...");
    const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/research` : "/api/research";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        apiKey: GEMINI_API_KEY || OPENROUTER_API_KEY,
        model: import.meta.env.VITE_OPENROUTER_MODEL
      })
    });

    if (response.ok) {
      const data = await response.json();
      onProgress("Synthesizing information and generating report...");
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        text: data.text || "",
        sources: data.groundingMetadata || null,
        groundingMetadata: data.groundingMetadata || null
      };
    }

    // 2. Client-side Fallback (if API fails or is not found)
    console.warn("API endpoint failed, falling back to client-side execution");

    if (GEMINI_API_KEY) {
      onProgress("Searching the web with Google Search...");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        tools: [{ googleSearchRetrieval: {} }] as any
      });
      
      const prompt = `Conduct comprehensive research on: ${query}

Please follow these steps:
1. Search for the latest and most relevant information.
2. Analyze the sources and identify key themes.
3. Synthesize the information into a structured report with sections like Overview, Key Findings, Detailed Analysis, and Conclusion.
4. Include citations where appropriate.

Return the final answer in markdown format.`;

      const result = await model.generateContent(prompt);
      const resultResponse = await result.response;
      const text = resultResponse.text();
      const groundingMetadata = (resultResponse as any).candidates?.[0]?.groundingMetadata || null;

      onProgress("Synthesizing information and generating report...");
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        text,
        sources: groundingMetadata,
        groundingMetadata
      };
    }

    // 3. Last resort: Direct OpenRouter call
    onProgress("Searching the web for relevant information...");
    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": import.meta.env.VITE_APP_URL || "http://localhost:3000",
        "X-Title": "InsightFlow"
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENROUTER_MODEL || "mistralai/mistral-small-3.2-24b-instruct",
        messages: [
          {
            role: "system",
            content: "You are an expert research agent. Your goal is to provide accurate, well-structured, and comprehensive reports from reliable information. Always cite your sources and use markdown formatting."
          },
          {
            role: "user",
            content: `Conduct comprehensive research on: ${query}
            
            Return the final answer in markdown format.`
          }
        ]
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`Research failed on all attempts.`);
    }

    const data = await openRouterResponse.json();
    return {
      text: data?.choices?.[0]?.message?.content || "",
      sources: null,
      groundingMetadata: null
    };

  } catch (error) {
    console.error("Research error:", error);
    throw error;
  }
}
