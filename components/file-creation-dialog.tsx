"use client";

import { useState, useEffect } from "react";
import { FileText, Check, X, FolderPlus, Folder, Files } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { FileAnalysisResult } from "@/lib/file-intelligence";

interface FileCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: FileAnalysisResult | null;
  onApprove: (path: string, name: string, content: string, summary: string) => void;
  onReject: () => void;
}

export function FileCreationDialog({
  open,
  onOpenChange,
  analysis,
  onApprove,
  onReject,
}: FileCreationDialogProps) {
  const [editedPath, setEditedPath] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedSummary, setEditedSummary] = useState("");

  // Update local state when analysis changes
  useEffect(() => {
    if (analysis) {
      const pathParts = analysis.suggestedPath.split("/");
      const name = pathParts.pop() || analysis.suggestedName;
      const path = pathParts.join("/");

      setEditedPath(path || analysis.suggestedDirectory || "");
      setEditedName(name);
      setEditedSummary(analysis.summary);
    }
  }, [analysis]);

  if (!analysis) return null;

  const handleApprove = () => {
    const fullPath = editedPath ? `${editedPath}/${editedName}` : editedName;
    onApprove(fullPath, editedName, analysis.content, editedSummary);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  const action = analysis.shouldUpdateFile ? "Update" : "Create";
  const contentPreview = analysis.content.substring(0, 300);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="h-5 w-5 text-blue-600" />
            {action} Markdown File
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            The AI suggests {action.toLowerCase()}ing a file based on your message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reasoning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">AI Analysis</p>
            <p className="text-sm text-blue-800">{analysis.reasoning}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-blue-700">
                Confidence: {Math.round(analysis.confidence * 100)}%
              </span>
              {!analysis.directoryExists && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-300">
                  <FolderPlus className="h-3 w-3 mr-1" />
                  New Directory
                </Badge>
              )}
            </div>
          </div>

          {/* Related Files/Directories */}
          {(analysis.relatedDirectories && analysis.relatedDirectories.length > 0) || 
           (analysis.relatedFiles && analysis.relatedFiles.length > 0) ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-900 mb-2">Related Content</p>
              
              {analysis.relatedDirectories && analysis.relatedDirectories.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <Folder className="h-3 w-3" />
                    <span>Directories:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.relatedDirectories.map((dir, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {dir}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis.relatedFiles && analysis.relatedFiles.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <Files className="h-3 w-3" />
                    <span>Files:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.relatedFiles.slice(0, 3).map((file, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {file.split('/').pop()}
                      </Badge>
                    ))}
                    {analysis.relatedFiles.length > 3 && (
                      <span className="text-xs text-gray-500">+{analysis.relatedFiles.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Directory Status */}
          {editedPath && (
            <div className={`border rounded-lg p-3 ${
              analysis.directoryExists 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                {analysis.directoryExists ? (
                  <Folder className="h-4 w-4 text-green-700" />
                ) : (
                  <FolderPlus className="h-4 w-4 text-yellow-700" />
                )}
                <p className={`text-sm font-medium ${
                  analysis.directoryExists ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {analysis.directoryExists 
                    ? `Using existing directory: "${editedPath}"` 
                    : `Will create new directory: "${editedPath}"`
                  }
                </p>
              </div>
            </div>
          )}

          {/* File Path */}
          <div className="grid gap-2">
            <Label htmlFor="file-path" className="text-gray-900">
              Directory
            </Label>
            <Input
              id="file-path"
              value={editedPath}
              onChange={(e) => setEditedPath(e.target.value)}
              placeholder="notes"
              className="bg-white border-gray-300 text-gray-900"
            />
            <p className="text-xs text-gray-500">
              Organize your file in a directory (e.g., "projects/alpha", "meeting-notes")
            </p>
          </div>

          {/* File Name */}
          <div className="grid gap-2">
            <Label htmlFor="file-name" className="text-gray-900">
              Filename
            </Label>
            <Input
              id="file-name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="my-note.md"
              className="bg-white border-gray-300 text-gray-900"
            />
          </div>

          {/* Summary */}
          <div className="grid gap-2">
            <Label htmlFor="summary" className="text-gray-900">
              Summary
            </Label>
            <Input
              id="summary"
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              placeholder="Brief description"
              className="bg-white border-gray-300 text-gray-900"
            />
          </div>

          {/* Content Preview */}
          <div className="grid gap-2">
            <Label className="text-gray-900">Content Preview</Label>
            <Textarea
              value={contentPreview + (analysis.content.length > 300 ? "..." : "")}
              readOnly
              className="min-h-[150px] font-mono text-xs bg-gray-50 border-gray-300 text-gray-800"
            />
            <p className="text-xs text-gray-500">
              {analysis.content.length} characters • Full content will be saved
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            className="flex items-center gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Check className="h-4 w-4" />
            {action} File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
