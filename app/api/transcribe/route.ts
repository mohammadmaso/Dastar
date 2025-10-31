import { NextResponse } from "next/server";
import { saveAudioFile, getSettings } from "@/lib/db";
import { nanoid } from "nanoid";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Get settings for custom base URL and API key
    const settings = await getSettings();
    const baseURL = settings?.openaiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY || "";

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

    // Save audio metadata to IndexedDB
    const audioId = nanoid();
    await saveAudioFile({
      id: audioId,
      fileId: audioId,
      filePath: `audio/${audioId}.webm`,
      transcript,
      duration: 0, // We don't have duration from this API
      createdAt: Date.now(),
    });

    return NextResponse.json({
      transcript,
      audioId,
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
