"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarkdownFile, Directory } from "@/types";

interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  file?: MarkdownFile;
  children: TreeNode[];
  depth: number;
}

interface FileTreeViewProps {
  files: MarkdownFile[];
  directories: Directory[];
}

export function FileTreeView({ files, directories }: FileTreeViewProps) {
  const router = useRouter();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["/"]));

  // Build tree structure
  const tree = useMemo(() => {
    const root: TreeNode = {
      id: "root",
      name: "root",
      path: "/",
      type: "directory",
      children: [],
      depth: 0,
    };

    // Create directory nodes
    const dirNodes = new Map<string, TreeNode>();
    dirNodes.set("/", root);

    // Sort directories by path length (parents before children)
    const sortedDirs = [...directories].sort((a, b) => a.path.split("/").length - b.path.split("/").length);

    for (const dir of sortedDirs) {
      const pathParts = dir.path.split("/").filter(Boolean);
      const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "/";
      const parent = dirNodes.get(parentPath) || root;

      const node: TreeNode = {
        id: dir.id,
        name: dir.name,
        path: dir.path,
        type: "directory",
        children: [],
        depth: parent.depth + 1,
      };

      dirNodes.set(dir.path, node);
      parent.children.push(node);
    }

    // Add files to their directories
    for (const file of files) {
      const pathParts = file.path.split("/").filter(Boolean);
      const fileName = pathParts.pop() || file.name;
      const dirPath = pathParts.length > 0 ? pathParts.join("/") : "/";
      const parent = dirNodes.get(dirPath) || root;

      const fileNode: TreeNode = {
        id: file.id,
        name: fileName,
        path: file.path,
        type: "file",
        file,
        children: [],
        depth: parent.depth + 1,
      };

      parent.children.push(fileNode);
    }

    // Sort children: directories first, then files, alphabetically
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    };
    sortChildren(root);

    return root;
  }, [files, directories]);

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (file: MarkdownFile) => {
    router.push(`/editor/${file.id}`);
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    if (node.path === "/") {
      // Render root children directly
      return node.children.map((child) => renderNode(child));
    }

    const isExpanded = expandedPaths.has(node.path);
    const isDirectory = node.type === "directory";

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors",
            !isDirectory && "hover:bg-blue-50"
          )}
          style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              toggleExpanded(node.path);
            } else if (node.file) {
              handleFileClick(node.file);
            }
          }}
        >
          {isDirectory ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500 shrink-0" />
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              <FileText className="h-4 w-4 text-gray-400 shrink-0" />
            </>
          )}
          <span className={cn(
            "flex-1 truncate text-sm",
            isDirectory ? "font-medium text-gray-900" : "text-gray-700"
          )}>
            {node.name}
          </span>
          {!isDirectory && node.file?.tags && node.file.tags.length > 0 && (
            <span className="text-xs text-gray-500 shrink-0">
              {node.file.tags.length} tags
            </span>
          )}
        </div>

        {/* Render children if directory is expanded */}
        {isDirectory && isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {tree.children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Folder className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No files or directories yet</p>
        </div>
      ) : (
        renderNode(tree)
      )}
    </div>
  );
}
