import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

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

  // Create OpenAI client with custom base URL
  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages,
    system: `You are a helpful assistant that helps users organize their thoughts and notes into markdown files.

You can help users:
- Create and organize markdown files
- Generate summaries of their content
- Suggest appropriate file and directory structures
- Link related notes together

When a user asks you to create or update files, describe what you would do and ask for confirmation.`,
    /* tools: {
      getMarkdownFilesList: tool({
        description: "Get a list of all markdown files with their summaries",
        parameters: z.object({}),
        execute: async () => {
          const files = await getAllMarkdownFiles();
          return {
            files: files.map((f) => ({
              id: f.id,
              path: f.path,
              name: f.name,
              summary: f.summary,
              updatedAt: f.updatedAt,
            })),
          };
        },
      }),

      getMarkdownFileContent: tool({
        description: "Get the full content of a specific markdown file by path",
        parameters: z.object({
          path: z.string().describe("The path of the markdown file to retrieve"),
        }),
        execute: async ({ path }) => {
          const file = await getMarkdownFileByPath(path);
          if (!file) {
            return { error: "File not found", path };
          }
          return {
            id: file.id,
            path: file.path,
            name: file.name,
            content: file.content,
            summary: file.summary,
            updatedAt: file.updatedAt,
          };
        },
      }),

      createOrUpdateMarkdownFile: tool({
        description:
          "Create a new markdown file or update an existing one. This will save to IndexedDB and should be synced to the file system by the user.",
        parameters: z.object({
          path: z
            .string()
            .describe("The path where the file should be saved (e.g., 'notes/my-note.md')"),
          content: z.string().describe("The markdown content to save"),
          summary: z
            .string()
            .describe("A brief summary (1-2 sentences) of the file content"),
        }),
        execute: async ({ path, content, summary }) => {
          try {
            // Check if file already exists
            const existing = await getMarkdownFileByPath(path);

            const file = {
              id: existing?.id || nanoid(),
              path,
              name: path.split("/").pop() || "untitled.md",
              content,
              summary,
              createdAt: existing?.createdAt || Date.now(),
              updatedAt: Date.now(),
            };

            await saveMarkdownFile(file);

            // Extract and save links
            const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+\.md)\)/g);
            const links = Array.from(linkMatches).map((match) => match[2]);

            // Delete old links and create new ones
            await deleteLinkRelationsBySource(file.id);

            for (const targetPath of links) {
              const targetFile = await getMarkdownFileByPath(targetPath);
              if (targetFile) {
                await saveLinkRelation({
                  id: nanoid(),
                  sourceFileId: file.id,
                  targetFileId: targetFile.id,
                  createdAt: Date.now(),
                });
              }
            }

            return {
              success: true,
              fileId: file.id,
              path: file.path,
              summary: file.summary,
              isNew: !existing,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),

      createDirectory: tool({
        description: "Create a new directory structure",
        parameters: z.object({
          path: z
            .string()
            .describe("The path of the directory to create (e.g., 'projects/work')"),
        }),
        execute: async ({ path }) => {
          try {
            const existing = await getDirectoryByPath(path);
            if (existing) {
              return {
                success: true,
                directoryId: existing.id,
                path: existing.path,
                alreadyExists: true,
              };
            }

            const pathParts = path.split("/").filter(Boolean);
            const name = pathParts[pathParts.length - 1];
            const parentPath = pathParts.slice(0, -1).join("/");

            const directory = {
              id: nanoid(),
              name,
              path,
              parentId: parentPath ? (await getDirectoryByPath(parentPath))?.id : undefined,
              createdAt: Date.now(),
            };

            await saveDirectory(directory);

            return {
              success: true,
              directoryId: directory.id,
              path: directory.path,
              alreadyExists: false,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
    }, */
  });

  return result.toTextStreamResponse();
}
