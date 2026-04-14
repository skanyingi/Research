import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge',
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req: Request) {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle Preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers });
  }

  try {
    const { query, apiKey, model } = await req.json();

    if (!query || !apiKey) {
      return new Response(JSON.stringify({ error: "Missing query or API key" }), { status: 400, headers });
    }

    // Check if it's a Gemini key (usually starts with AIza)
    const isGeminiKey = apiKey.startsWith("AIza");

    if (isGeminiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ 
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

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata || null;

      return new Response(JSON.stringify({
        text,
        sources: groundingMetadata,
        groundingMetadata
      }), { status: 200, headers });
    } else {
      // Fallback to OpenRouter
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://research-agent.vercel.app",
          "X-Title": "InsightFlow"
        },
        body: JSON.stringify({
          model: model || "mistralai/mistral-small-3.2-24b-instruct",
          messages: [
            {
              role: "system",
              content: "You are an expert research agent. Your goal is to provide accurate, well-structured, and comprehensive reports from reliable information. Always cite your sources and use markdown formatting."
            },
            {
              role: "user",
              content: `Conduct comprehensive research on: ${query}

Please follow these steps:
1. Search for the latest and most relevant information.
2. Analyze the sources and identify key themes.
3. Synthesize the information into a structured report with sections like Overview, Key Findings, Detailed Analysis, and Conclusion.
4. Include citations where appropriate.

Return the final answer in markdown format.`
            }
          ]
        })
      });

      if (!response.ok) {
        const details = await response.text();
        return new Response(details, { status: response.status, headers });
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const groundingMetadata = data?.choices?.[0]?.message?.groundingMetadata || null;

      return new Response(JSON.stringify({
        text,
        sources: groundingMetadata,
        groundingMetadata
      }), { status: 200, headers });
    }
  } catch (error: any) {
    console.error("Research error:", error);
    return new Response(JSON.stringify({ error: "Research failed", details: error.message }), { status: 500, headers });
  }
}
