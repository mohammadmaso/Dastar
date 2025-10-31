"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudioRecorder } from "@/components/audio-recorder";
import { FileSystemConnect } from "@/components/file-system-connect";
import { ApiKeyReminder } from "@/components/api-key-reminder";
import { useAppStore } from "@/lib/store";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const { settings } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const messageList = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Try server-side API first
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messageList, settings }),
      });

      if (response.ok) {
        // Server-side API available
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
            )
          );
        }
      } else if (response.status === 404) {
        // API route not available, use client-side AI
        const { streamChatCompletion } = await import("@/lib/client-ai");
        let assistantContent = "";

        for await (const chunk of streamChatCompletion(messageList)) {
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
            )
          );
        }
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Try client-side as fallback
      try {
        const { streamChatCompletion } = await import("@/lib/client-ai");
        const messageList = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        };

        let assistantContent = "";
        for await (const chunk of streamChatCompletion(messageList)) {
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
            )
          );
        }
      } catch (clientError) {
        console.error("Client-side AI error:", clientError);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === (Date.now() + 1).toString()
              ? { ...m, content: "Error: " + (clientError as Error).message }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleTranscript = (transcript: string, audioBlob: Blob) => {
    if (transcript.trim()) {
      setInput(transcript);
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
      <ScrollArea className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <ApiKeyReminder />
          {messages.length === 0 ? (
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
            messages.map((message) => (
              <Card
                key={message.id}
                className={`p-4 ${
                  message.role === "user"
                    ? "ml-auto max-w-[80%] bg-black text-white"
                    : "mr-auto max-w-[80%]"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </Card>
            ))
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
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-end space-x-2">
            <AudioRecorder
              onTranscript={handleTranscript}
              disabled={isLoading}
            />
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message or record audio..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
