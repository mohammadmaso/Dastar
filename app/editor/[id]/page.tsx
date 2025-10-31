"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getMarkdownFile, saveMarkdownFile, deleteMarkdownFile } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { saveFile as saveToFileSystem } from "@/lib/file-system";
import type { MarkdownFile } from "@/types";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { directoryHandle } = useAppStore();
  const [file, setFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFile();
  }, [params.id]);

  const loadFile = async () => {
    try {
      const fileData = await getMarkdownFile(params.id as string);
      if (fileData) {
        setFile(fileData);
        setContent(fileData.content);
        setName(fileData.name);
        setSummary(fileData.summary);
      }
    } catch (error) {
      console.error("Error loading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;

    setIsSaving(true);
    try {
      const updatedFile: MarkdownFile = {
        ...file,
        name,
        content,
        summary,
        updatedAt: Date.now(),
      };

      // Save to IndexedDB
      await saveMarkdownFile(updatedFile);

      // Save to file system if connected
      if (directoryHandle) {
        await saveToFileSystem(file.path, content, directoryHandle);
      }

      // Update local state
      setFile(updatedFile);
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save file");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      await deleteMarkdownFile(file.id);
      router.push("/files");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">File not found</h2>
          <Button onClick={() => router.push("/files")}>Go to Files</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/files")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold"
                placeholder="File name"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        {directoryHandle && (
          <Badge variant="secondary" className="mt-2">
            Synced to {directoryHandle.name}
          </Badge>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 py-6 md:px-6">
          <div className="mx-auto max-w-4xl space-y-4">
            {/* Summary */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Summary
              </label>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of this file..."
              />
            </div>

            {/* Path */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Path
              </label>
              <Input value={file.path} disabled className="text-sm text-gray-600" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Content (Markdown)
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="# Start writing your markdown here..."
              />
            </div>

            {/* Preview hint */}
            <p className="text-xs text-gray-500">
              Tip: Use Markdown syntax. Headers: #, Bold: **text**, Links: [text](url)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
