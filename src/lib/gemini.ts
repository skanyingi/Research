import { GoogleGenerativeAI } from "@google/generative-ai";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

export async function performResearch(query: string, onProgress: (step: string) => void) {
  try {
    onProgress("Initializing research agent...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 1. If we have a backend/API_BASE_URL, use it (could be Netlify function)
    if (API_BASE_URL) {
      onProgress("Analyzing request via backend...");
      const response = await fetch(`${API_BASE_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          apiKey: GEMINI_API_KEY || OPENROUTER_API_KEY,
          model: import.meta.env.VITE_OPENROUTER_MODEL
        })
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Backend request failed: ${details}`);
      }
      
      const data = await response.json();
      onProgress("Synthesizing information and generating report...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Handle both direct OpenRouter response and our custom Netlify format
      const text = data?.choices ? (data.choices[0]?.message?.content || "") : (data.text || "");
      const groundingMetadata = data?.choices ? (data.choices[0]?.message?.groundingMetadata || null) : (data.groundingMetadata || null);

      return {
        text,
        sources: groundingMetadata,
        groundingMetadata
      };
    }

    // 2. If we have Gemini Key, use Gemini SDK for better "context" (Grounding)
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
      const response = await result.response;
      const text = response.text();
      const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata || null;

      onProgress("Synthesizing information and generating report...");
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        text,
        sources: groundingMetadata,
        groundingMetadata
      };
    }

    // 3. Fallback to OpenRouter
    onProgress("Searching the web for relevant information...");
    const prompt = `Conduct comprehensive research on: ${query}

Please follow these steps:
1. Search for the latest and most relevant information.
2. Analyze the sources and identify key themes.
3. Synthesize the information into a structured report with sections like Overview, Key Findings, Detailed Analysis, and Conclusion.
4. Include citations where appropriate.

Return the final answer in markdown format.`;

    const response = await fetch(OPENROUTER_API_URL, {
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
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${details}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const groundingMetadata = data?.choices?.[0]?.message?.groundingMetadata || null;

    onProgress("Synthesizing information and generating report...");
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      text,
      sources: groundingMetadata,
      groundingMetadata
    };
  } catch (error) {
    console.error("Research error:", error);
    throw error;
  }
}
