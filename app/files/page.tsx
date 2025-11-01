"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { FileText, Folder, Search, List, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { CreateFileDialog } from "@/components/create-file-dialog";
import { FileTreeView } from "@/components/file-tree-view";
import { cn } from "@/lib/utils";

type ViewMode = "tree" | "list";

export default function FilesPage() {
  const router = useRouter();
  const { files, directories } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFiles, setFilteredFiles] = useState(files);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredFiles(
        files.filter(
          (f) =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.path.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      // Switch to list view when searching
      setViewMode("list");
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Files</h1>
            <p className="text-sm text-gray-600">
              {files.length} files, {directories.length} directories
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-md border border-gray-300 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("tree")}
                className={cn(
                  "rounded-r-none border-r",
                  viewMode === "tree" && "bg-gray-100"
                )}
                title="Tree View"
              >
                <TreePine className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-l-none",
                  viewMode === "list" && "bg-gray-100"
                )}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <CreateFileDialog />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-300"
          />
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl">
          {files.length === 0 && directories.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No files yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start by creating your first markdown file
              </p>
              <CreateFileDialog />
            </div>
          ) : (
            <>
              {viewMode === "tree" && !searchQuery ? (
                /* Tree View */
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <FileTreeView files={files} directories={directories} />
                </div>
              ) : (
                /* List View */
                <div className="space-y-2">
                  {filteredFiles.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
                      <Search className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">No files found</h3>
                      <p className="text-sm text-gray-600">
                        No files match your search query
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Directories (only show when not searching) */}
                      {directories.length > 0 && !searchQuery && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            Directories
                          </h3>
                          <div className="grid gap-2 md:grid-cols-2">
                            {directories.map((dir) => (
                              <Card
                                key={dir.id}
                                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border-gray-200"
                              >
                                <div className="flex items-center gap-2">
                                  <Folder className="h-5 w-5 text-blue-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-gray-900">{dir.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {dir.path}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Files ({filteredFiles.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredFiles.map((file) => (
                            <Card
                              key={file.id}
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-gray-200"
                              onClick={() => router.push(`/editor/${file.id}`)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                                    <h4 className="font-medium truncate text-gray-900">{file.name}</h4>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {file.summary || "No summary"}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="truncate">{file.path}</span>
                                    <span>•</span>
                                    <span>
                                      {formatDistanceToNow(file.updatedAt, {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                </div>
                                {file.tags && file.tags.length > 0 && (
                                  <div className="flex gap-1 shrink-0">
                                    {file.tags.slice(0, 2).map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
