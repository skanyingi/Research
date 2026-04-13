const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "mistralai/mistral-small-3.2-24b-instruct";

export async function performResearch(query: string, onProgress: (step: string) => void) {
  try {
    onProgress("Initializing research agent...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onProgress("Searching the web for relevant information...");

    const prompt = `Conduct comprehensive research on: ${query}

Please follow these steps:
1. Search for the latest and most relevant information.
2. Analyze the sources and identify key themes.
3. Synthesize the information into a structured report with sections like Overview, Key Findings, Detailed Analysis, and Conclusion.
4. Include citations where appropriate (inline markdown links or a Sources section).

Return the final answer in markdown format.`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "InsightFlow"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
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

    onProgress("Synthesizing information and generating report...");
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      text,
      sources: null,
      groundingMetadata: null
    };
  } catch (error) {
    console.error("Research error:", error);
    throw error;
  }
}
