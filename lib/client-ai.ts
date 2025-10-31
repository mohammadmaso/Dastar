/**
 * Client-side AI utilities for static deployment
 * These functions call OpenAI directly from the browser using user-provided API keys
 *
 * WARNING: Only use this for static deployments where server-side API routes are not available
 * For production deployments with a server, use the API routes instead
 */

import { getSettings } from "./db";

export async function chatCompletion(messages: Array<{ role: string; content: string }>) {
  const settings = await getSettings();

  if (!settings?.openaiApiKey) {
    throw new Error("OpenAI API key not configured. Please add it in Settings.");
  }

  const baseURL = settings.openaiBaseUrl || "https://api.openai.com/v1";
  const apiKey = settings.openaiApiKey;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  return response;
}

export async function transcribeAudio(audioBlob: Blob) {
  const settings = await getSettings();

  if (!settings?.openaiApiKey) {
    throw new Error("OpenAI API key not configured. Please add it in Settings.");
  }

  const baseURL = settings.openaiBaseUrl || "https://api.openai.com/v1";
  const apiKey = settings.openaiApiKey;

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", settings.sttModel || "whisper-1");

  const response = await fetch(`${baseURL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const data = await response.json();
  return data.text || "";
}

/**
 * Stream text from OpenAI chat completion
 */
export async function* streamChatCompletion(
  messages: Array<{ role: string; content: string }>
): AsyncGenerator<string, void, unknown> {
  const response = await chatCompletion(messages);

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("Response body is not readable");
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
