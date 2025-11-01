"use client";

import { useState, useEffect, useCallback } from "react";
import { File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarkdownFile } from "@/types";

interface WikiLinkAutocompleteProps {
  query: string;
  files: MarkdownFile[];
  position: { top: number; left: number };
  onSelect: (file: MarkdownFile) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function WikiLinkAutocomplete({
  query,
  files,
  position,
  onSelect,
  onClose,
  selectedIndex,
  onSelectIndex,
}: WikiLinkAutocompleteProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-w-md w-72 max-h-64 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="p-2 space-y-1">
        {files.map((file, index) => {
          const isSelected = index === selectedIndex;
          const pathParts = file.path.split('/');
          const fileName = pathParts.pop() || file.name;
          const directory = pathParts.length > 0 ? pathParts.join('/') : null;

          return (
            <button
              key={file.id}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors",
                "hover:bg-blue-50 focus:outline-none",
                isSelected && "bg-blue-100"
              )}
              onClick={() => onSelect(file)}
              onMouseEnter={() => onSelectIndex(index)}
            >
              <div className="flex items-start gap-2">
                <File className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {fileName.replace(/\.md$/, '')}
                  </div>
                  {directory && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Folder className="h-3 w-3" />
                      <span className="truncate">{directory}</span>
                    </div>
                  )}
                  {file.summary && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {file.summary}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
