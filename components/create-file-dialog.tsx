"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { saveMarkdownFile, saveDirectory, getDirectoryByPath } from "@/lib/db";
import { nanoid } from "nanoid";
import type { MarkdownFile } from "@/types";

export function CreateFileDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [summary, setSummary] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Please enter a file name");
      return;
    }

    setIsCreating(true);
    try {
      // Ensure name ends with .md
      const fileName = name.endsWith(".md") ? name : `${name}.md`;

      // Build full path
      const fullPath = path.trim()
        ? `${path.trim()}/${fileName}`
        : fileName;

      // Create directory if path specified
      if (path.trim()) {
        const pathParts = path.trim().split("/").filter(Boolean);
        let currentPath = "";

        for (const part of pathParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const existing = await getDirectoryByPath(currentPath);

          if (!existing) {
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
      const newFile: MarkdownFile = {
        id: nanoid(),
        path: fullPath,
        name: fileName,
        content: `# ${fileName.replace(".md", "")}\n\n`,
        summary: summary.trim() || "New markdown file",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
      };

      await saveMarkdownFile(newFile);

      // Reset form
      setName("");
      setPath("");
      setSummary("");
      setOpen(false);

      // Navigate to editor
      router.push(`/editor/${newFile.id}`);
    } catch (error) {
      console.error("Error creating file:", error);
      alert("Failed to create file");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            Create a new markdown file in your notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">File Name</label>
            <Input
              placeholder="my-note.md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Path (optional)</label>
            <Input
              placeholder="projects/work"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Leave empty for root, or enter path like "projects/work"
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Summary (optional)</label>
            <Input
              placeholder="Brief description..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
