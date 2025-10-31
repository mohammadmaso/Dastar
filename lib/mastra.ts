import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Initialize Mastra instance
export const mastra = new Mastra({
  agents: {},
  workflows: {},
});

// Define tools for the markdown assistant agent
const getMarkdownFilesListTool = {
  id: "get-markdown-files",
  description: "Get a list of all markdown files with their summaries",
  inputSchema: z.object({}),
  execute: async () => {
    // This will be implemented to fetch from IndexedDB
    return { files: [] };
  },
};

const getMarkdownFileContentTool = {
  id: "get-markdown-content",
  description: "Get the full content of a specific markdown file by path",
  inputSchema: z.object({
    path: z.string().describe("The path of the markdown file to retrieve"),
  }),
  execute: async ({ path }: { path: string }) => {
    // This will be implemented to fetch from IndexedDB
    return { path, content: "" };
  },
};

const updateMarkdownFileTool = {
  id: "update-markdown-file",
  description: "Update or create a markdown file at a specific path",
  inputSchema: z.object({
    path: z.string().describe("The path where the file should be saved"),
    content: z.string().describe("The markdown content to save"),
    summary: z.string().describe("A brief summary of the file content"),
  }),
  execute: async ({
    path,
    content,
    summary,
  }: {
    path: string;
    content: string;
    summary: string;
  }) => {
    // This will be implemented to save to IndexedDB and File System
    return { success: true, path, summary };
  },
};

const createDirectoryTool = {
  id: "create-directory",
  description: "Create a new directory at the specified path",
  inputSchema: z.object({
    path: z.string().describe("The path of the directory to create"),
  }),
  execute: async ({ path }: { path: string }) => {
    // This will be implemented to create in File System
    return { success: true, path };
  },
};

// Create the markdown assistant agent
export const markdownAssistant = new Agent({
  name: "Markdown Assistant",
  instructions: `You are a helpful assistant that manages markdown-based notes and files.

Your responsibilities:
1. Help users organize their thoughts and notes into markdown files
2. Create, update, and manage markdown files in appropriate directories
3. Analyze user input and decide which files need to be created or updated
4. Generate clear summaries for each markdown file
5. Maintain proper links between related markdown files
6. Always ask for confirmation before making changes to files

When a user provides input:
1. Analyze the content and determine which files should be created/updated
2. Suggest appropriate directory structures
3. Generate meaningful file names
4. Create concise summaries
5. Present your plan and wait for user confirmation before making changes

Remember to:
- Use clear, descriptive file and directory names
- Keep summaries concise but informative
- Maintain consistency in file organization
- Link related files together when appropriate`,
  model: openai("gpt-4-turbo"),
  tools: {
    getMarkdownFilesList: getMarkdownFilesListTool,
    getMarkdownFileContent: getMarkdownFileContentTool,
    updateMarkdownFile: updateMarkdownFileTool,
    createDirectory: createDirectoryTool,
  },
});

// Export the agent for use in API routes
export default markdownAssistant;
