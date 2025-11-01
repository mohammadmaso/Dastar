"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoiceRecorder } from "@/components/voice-recorder";
import { FileSystemConnect } from "@/components/file-system-connect";
import { ApiKeyReminder } from "@/components/api-key-reminder";
import { FileCreationDialog } from "@/components/file-creation-dialog";
import { streamChatCompletion } from "@/lib/client-ai";
import { getAllChatMessages, saveChatMessage, getSettings, saveMarkdownFile, saveDirectory, getDirectoryByPath } from "@/lib/db";
import { analyzeMessageForFiles } from "@/lib/file-intelligence";
import type { ChatMessage } from "@/types";
import type { FileAnalysisResult } from "@/lib/file-intelligence";
import { nanoid } from "nanoid";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysisResult | null>(null);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages from IndexedDB on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await getAllChatMessages();
        setMessages(storedMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: input,
      createdAt: Date.now(),
    };

    // Save user message to IndexedDB
    await saveChatMessage(userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Get messages after the last checkpoint (or all if no checkpoint)
      const lastCheckpointIndex = messages.findLastIndex((m) => m.isCheckpoint);

      // If there's a checkpoint, include messages AFTER it (not including the checkpoint itself)
      const contextMessages = lastCheckpointIndex >= 0
        ? [...messages.slice(lastCheckpointIndex + 1), userMessage]
        : [...messages, userMessage];

      const messageList = contextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Use client-side AI streaming
      let assistantContent = "";
      for await (const chunk of streamChatCompletion(messageList)) {
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
          )
        );
      }

      // Save complete assistant message to IndexedDB
      await saveChatMessage({ ...assistantMessage, content: assistantContent });

      // Analyze message for potential file creation
      analyzeForFileCreation(userMessage.content, assistantContent);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        createdAt: Date.now(),
      };
      await saveChatMessage(errorMessage);
      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze message for file creation
  const analyzeForFileCreation = async (userMessage: string, assistantResponse: string) => {
    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: userMessage });
      conversationHistory.push({ role: "assistant", content: assistantResponse });

      // Analyze if file should be created
      const analysis = await analyzeMessageForFiles(
        `User: ${userMessage}\n\nAssistant: ${assistantResponse}`,
        conversationHistory
      );

      if (analysis) {
        const settings = await getSettings();

        if (settings?.autoCreateFiles) {
          // Auto-create without confirmation
          await createFileFromAnalysis(
            analysis.suggestedPath,
            analysis.suggestedName,
            analysis.content,
            analysis.summary
          );

          // Show notification (simple alert for now)
          console.log(`Created file: ${analysis.suggestedPath}`);
        } else {
          // Show confirmation dialog
          setFileAnalysis(analysis);
          setShowFileDialog(true);
        }
      }
    } catch (error) {
      console.error("File analysis error:", error);
    }
  };

  // Create file from analysis
  const createFileFromAnalysis = async (
    path: string,
    name: string,
    content: string,
    summary: string
  ) => {
    try {
      // Create directory if needed
      const pathParts = path.split("/");
      const fileName = pathParts.pop() || name;
      const dirPath = pathParts.join("/");

      if (dirPath) {
        const parts = dirPath.split("/").filter(Boolean);
        let currentPath = "";

        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          // Check if directory already exists before creating
          const existingDir = await getDirectoryByPath(currentPath);

          if (!existingDir) {
            await saveDirectory({
              id: nanoid(),
              name: part,
              path: currentPath,
              createdAt: Date.now(),
            });
          }
        }
      }

      // Create file
      const file = {
        id: nanoid(),
        path,
        name: fileName,
        content,
        summary,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
      };

      await saveMarkdownFile(file);
      console.log(`File created: ${path}`);
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  // Handle file approval from dialog
  const handleFileApprove = async (
    path: string,
    name: string,
    content: string,
    summary: string
  ) => {
    await createFileFromAnalysis(path, name, content, summary);
  };

  // Handle file rejection from dialog
  const handleFileReject = () => {
    setFileAnalysis(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleTranscript = (transcript: string, audioBlob: Blob) => {
    if (transcript.trim()) {
      setInput(transcript);
    }
  };

  const toggleCheckpoint = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const updatedMessage = {
      ...message,
      isCheckpoint: !message.isCheckpoint,
    };

    // Update in state
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? updatedMessage : m))
    );

    // Update in IndexedDB
    await saveChatMessage(updatedMessage);
  };

  const addCheckpoint = async () => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Toggle checkpoint on the last message
    const updatedMessage = {
      ...lastMessage,
      isCheckpoint: !lastMessage.isCheckpoint,
    };

    // Update in state
    setMessages((prev) =>
      prev.map((m) => (m.id === lastMessage.id ? updatedMessage : m))
    );

    // Update in IndexedDB
    await saveChatMessage(updatedMessage);
  };

  const removeCheckpointsAfterLast = async () => {
    // Find the last checkpoint
    const lastCheckpointIndex = messages.findLastIndex((m) => m.isCheckpoint);
    if (lastCheckpointIndex === -1) return;

    // Remove all checkpoints after the last one
    const updatedMessages = messages.map((m, index) => ({
      ...m,
      isCheckpoint: index === lastCheckpointIndex ? m.isCheckpoint : (index < lastCheckpointIndex ? m.isCheckpoint : false),
    }));

    // Update in state
    setMessages(updatedMessages);

    // Update all affected messages in IndexedDB
    for (const msg of updatedMessages) {
      await saveChatMessage(msg);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dastar Assistant</h1>
            <p className="text-sm text-gray-600">
              Chat with your AI assistant to manage notes and files
            </p>
          </div>
          <FileSystemConnect />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6 md:px-6" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4">
          <ApiKeyReminder />
          {isLoadingMessages ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-gray-100 p-6">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Welcome to Dastar</h2>
                <p className="text-sm text-gray-600">
                  Start a conversation to organize your thoughts and notes
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Create a note</Badge>
                <Badge variant="secondary">Organize files</Badge>
                <Badge variant="secondary">Search notes</Badge>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isLastCheckpoint = message.isCheckpoint &&
                  messages.findLastIndex((m) => m.isCheckpoint) === index;

                return (
                  <div key={message.id} className="space-y-2">
                    {/* Checkpoint marker before message */}
                    {message.isCheckpoint && (
                      <div className="flex items-center justify-center my-4">
                        <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                          isLastCheckpoint
                            ? 'bg-amber-100 border border-amber-300'
                            : 'bg-gray-100 border border-gray-300'
                        }`}>
                          <Flag className={`h-4 w-4 ${isLastCheckpoint ? 'text-amber-700' : 'text-gray-500'}`} />
                          <span className={`text-xs font-semibold ${
                            isLastCheckpoint ? 'text-amber-900' : 'text-gray-600'
                          }`}>
                            {isLastCheckpoint
                              ? 'Active Checkpoint: AI memory starts from here'
                              : 'Old Checkpoint (inactive)'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCheckpoint(message.id)}
                            className="h-5 px-2 text-xs ml-2"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Message card */}
                    <div className="group relative">
                      <Card
                        className={`p-4 ${
                          message.role === "user"
                            ? "ml-auto max-w-[80%] bg-black text-white"
                            : "mr-auto max-w-[80%]"
                        } ${message.isCheckpoint && isLastCheckpoint ? "ring-2 ring-amber-400" : ""}`}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </Card>

                      {/* Add checkpoint button (hover) */}
                      {!message.isCheckpoint && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCheckpoint(message.id)}
                          className={`absolute top-2 ${
                            message.role === "user" ? "left-2" : "right-2"
                          } opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs`}
                          title="Set checkpoint here"
                        >
                          <Flag className="h-3 w-3 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add checkpoint button at the end */}
              {messages.length > 0 && !messages[messages.length - 1].isCheckpoint && (
                <div className="flex items-center justify-center my-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCheckpoint}
                    className="gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Add Checkpoint Here
                  </Button>
                </div>
              )}
            </>
          )}
          {isLoading && (
            <Card className="mr-auto max-w-[80%] p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 animation-delay-200" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 animation-delay-400" />
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 md:px-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-3">
          {/* Voice Recorder */}
          <div className="flex justify-center">
            <VoiceRecorder
              onTranscript={handleTranscript}
              disabled={isLoading}
            />
          </div>

          {/* Text Input and Send Button */}
          <div className="flex items-end space-x-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message or record audio..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input || input.trim() === "" || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* File Creation Dialog */}
      <FileCreationDialog
        open={showFileDialog}
        onOpenChange={setShowFileDialog}
        analysis={fileAnalysis}
        onApprove={handleFileApprove}
        onReject={handleFileReject}
      />
    </div>
  );
}