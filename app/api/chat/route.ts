import { createMarkdownAssistant } from "@/lib/mastra";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, settings } = await req.json();

  // Use settings from request body (client provides them) or fall back to env vars
  const baseURL = settings?.openaiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const apiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OpenAI API key not configured. Please add it in Settings." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create Mastra agent with custom OpenAI config
  const agent = createMarkdownAssistant(baseURL, apiKey);

  try {
    // Use Mastra agent's generate method for streaming
    const result = await agent.generate(messages);

    // Convert Mastra response to streaming text response
    const stream = new ReadableStream({
      async start(controller) {
        const text = result.text || "";
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Mastra agent error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
