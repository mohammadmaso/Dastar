import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const settingsStr = formData.get("settings") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Parse settings from form data
    const settings = settingsStr ? JSON.parse(settingsStr) : null;
    const baseURL = settings?.openaiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add it in Settings." },
        { status: 400 }
      );
    }

    // Convert audio to base64 for OpenAI Whisper API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call OpenAI Whisper API
    const openaiFormData = new FormData();
    openaiFormData.append("file", new Blob([buffer], { type: "audio/webm" }), "audio.webm");
    openaiFormData.append("model", settings?.sttModel || "whisper-1");

    const transcriptionUrl = `${baseURL}/audio/transcriptions`;

    const response = await fetch(transcriptionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Whisper API error:", error);
      return NextResponse.json(
        { error: "Transcription failed", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const transcript = data.text || "";

    // Note: Audio metadata should be saved client-side to IndexedDB
    // The server just returns the transcript

    return NextResponse.json({
      transcript,
      audioId: nanoid(),
      duration: 0,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
