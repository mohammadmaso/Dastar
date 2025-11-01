/**
 * Client-side intelligent file creation system
 * Analyzes chat messages and voice transcriptions to automatically create markdown files
 */

import { getSettings, getAllMarkdownFiles, getAllDirectories } from "./db";
import type { MarkdownFile, Directory } from "@/types";

export interface FileAnalysisResult {
  shouldCreateFile: boolean;
  shouldUpdateFile: boolean;
  confidence: number; // 0-1
  suggestedPath: string;
  suggestedName: string;
  suggestedDirectory: string;
  directoryExists: boolean;
  summary: string;
  content: string;
  existingFileId?: string;
  reasoning: string;
  relatedFiles?: string[];
  relatedDirectories?: string[];
}

/**
 * Analyzes a message to determine if a file should be created
 */
export async function analyzeMessageForFiles(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<FileAnalysisResult | null> {
  const settings = await getSettings();

  if (!settings?.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const baseURL = settings.openaiBaseUrl || "https://api.openai.com/v1";
  const apiKey = settings.openaiApiKey;

  // Get existing files and directories for context
  const existingFiles = await getAllMarkdownFiles();
  const existingDirectories = await getAllDirectories();

  // Create structured context about existing organization
  const filesSummary = existingFiles.map(f => ({
    path: f.path,
    name: f.name,
    summary: f.summary,
    tags: f.tags || [],
  }));

  const directoriesList = existingDirectories.map(d => ({
    path: d.path,
    name: d.name,
  }));

  // Extract unique directory paths from files
  const directoryPaths = new Set<string>();
  existingFiles.forEach(file => {
    const dirPath = file.path.split('/').slice(0, -1).join('/');
    if (dirPath) directoryPaths.add(dirPath);
  });

  // Create analysis prompt
  const prompt = `You are an intelligent file organization assistant. Analyze this conversation and determine if a markdown file should be created or updated.

CONVERSATION HISTORY:
${conversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

CURRENT MESSAGE:
${message}

EXISTING DIRECTORIES:
${directoriesList.length > 0 ? JSON.stringify(directoriesList, null, 2) : "No directories yet"}

DIRECTORY PATHS IN USE:
${Array.from(directoryPaths).length > 0 ? Array.from(directoryPaths).join('\n') : "No directories yet"}

EXISTING FILES (with summaries):
${filesSummary.length > 0 ? JSON.stringify(filesSummary.slice(0, 20), null, 2) : "No files yet"}

TASK:
1. Analyze if this message contains information worth saving
2. Search for related existing directories and files
3. Decide whether to:
   - CREATE a new file in an existing directory
   - CREATE a new file in a NEW directory (if topic is unrelated to existing ones)
   - UPDATE an existing file
4. Suggest appropriate directory name and file name
5. Generate a summary and markdown content

DIRECTORY NAMING GUIDELINES:
- Use clear, descriptive names (e.g., "project-alpha", "meeting-notes", "ideas")
- Prefer existing directories if content is related
- Create new directories for new topics/projects
- Use lowercase with hyphens

FILE NAMING GUIDELINES:
- Descriptive but concise
- Include date if time-sensitive (e.g., "meeting-2025-11-01.md")
- Use lowercase with hyphens

Respond in JSON format:
{
  "shouldCreateFile": boolean,
  "shouldUpdateFile": boolean,
  "confidence": number (0-1),
  "suggestedPath": "directory/filename.md",
  "suggestedName": "filename.md",
  "suggestedDirectory": "directory",
  "directoryExists": boolean,
  "summary": "Brief one-sentence summary",
  "content": "# Title\\n\\nFull formatted markdown content...",
  "existingFileId": "id-if-updating" or null,
  "reasoning": "Explanation of why this file/directory was suggested",
  "relatedFiles": ["path/to/related1.md", "path/to/related2.md"],
  "relatedDirectories": ["related-dir-1", "related-dir-2"]
}`;

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes messages and intelligently organizes files into directories. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;

    // Extract JSON from response (handle code blocks)
    let jsonText = resultText;
    if (resultText.includes("```json")) {
      jsonText = resultText.split("```json")[1].split("```")[0].trim();
    } else if (resultText.includes("```")) {
      jsonText = resultText.split("```")[1].split("```")[0].trim();
    }

    const result: FileAnalysisResult = JSON.parse(jsonText);

    // Verify directory existence
    if (result.suggestedDirectory) {
      const dirExists = Array.from(directoryPaths).some(
        path => path === result.suggestedDirectory || path.startsWith(result.suggestedDirectory + '/')
      );
      result.directoryExists = dirExists;
    }

    // Only return if confidence is high enough and action is warranted
    if (result.confidence > 0.6 && (result.shouldCreateFile || result.shouldUpdateFile)) {
      return result;
    }

    return null;
  } catch (error) {
    console.error("File analysis error:", error);
    return null;
  }
}

/**
 * Generates markdown content for a specific topic
 */
export async function generateFileContent(
  topic: string,
  context: string = ""
): Promise<{ content: string; summary: string }> {
  const settings = await getSettings();

  if (!settings?.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const baseURL = settings.openaiBaseUrl || "https://api.openai.com/v1";
  const apiKey = settings.openaiApiKey;

  const prompt = `Create a well-formatted markdown document about: ${topic}

${context ? `CONTEXT:\n${context}\n\n` : ""}

Generate:
1. A concise summary (one sentence)
2. Full markdown content with proper headings, lists, and formatting

Respond in JSON:
{
  "summary": "Brief one-sentence summary",
  "content": "# Title\\n\\nFull markdown content..."
}`;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates well-formatted markdown documents. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  const resultText = data.choices[0].message.content;

  // Extract JSON
  let jsonText = resultText;
  if (resultText.includes("```json")) {
    jsonText = resultText.split("```json")[1].split("```")[0].trim();
  } else if (resultText.includes("```")) {
    jsonText = resultText.split("```")[1].split("```")[0].trim();
  }

  return JSON.parse(jsonText);
}

/**
 * Suggests an appropriate file path based on content
 */
export function suggestFilePath(
  content: string,
  existingFiles: MarkdownFile[]
): string {
  // Extract topic from content
  const lines = content.split("\n");
  const title = lines.find(line => line.startsWith("# "))?.replace("# ", "") || "note";

  // Sanitize filename
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  // Determine directory based on content keywords
  let directory = "notes";

  if (content.toLowerCase().includes("meeting") || content.toLowerCase().includes("agenda")) {
    directory = "meetings";
  } else if (content.toLowerCase().includes("todo") || content.toLowerCase().includes("task")) {
    directory = "tasks";
  } else if (content.toLowerCase().includes("idea") || content.toLowerCase().includes("brainstorm")) {
    directory = "ideas";
  } else if (content.toLowerCase().includes("project") || content.toLowerCase().includes("plan")) {
    directory = "projects";
  }

  // Add date for uniqueness
  const date = new Date().toISOString().split("T")[0];
  const filename = `${sanitized}-${date}.md`;

  // Check for duplicates
  const path = `${directory}/${filename}`;
  const exists = existingFiles.some(f => f.path === path);

  if (exists) {
    // Add timestamp
    const timestamp = Date.now().toString().substring(8);
    return `${directory}/${sanitized}-${date}-${timestamp}.md`;
  }

  return path;
}
