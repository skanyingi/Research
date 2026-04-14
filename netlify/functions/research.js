const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { query, apiKey, model } = JSON.parse(event.body || "{}");

    if (!query || !apiKey) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing query or API key" }) };
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://researc.netlify.app",
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
4. Include citations where appropriate (inline markdown links or a Sources section).

Return the final answer in markdown format.`
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return { statusCode: response.status, body: details };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200,
      body: JSON.stringify({
        text,
        sources: null,
        groundingMetadata: null
      })
    };
  } catch (error) {
    console.error("Research error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Research failed" }) };
  }
}