"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function MapPage() {
  const { files, directories } = useAppStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !svgRef.current || files.length === 0) return;

    // Build markdown hierarchy
    const markdown = buildMarkdownHierarchy(files, directories);

    // Transform markdown to markmap data
    const transformer = new Transformer();
    const { root } = transformer.transform(markdown);

    // Create or update markmap
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        duration: 500,
        color: (node: any) => {
          const depth = node.depth || 0;
          const colors = ["#000000", "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];
          return colors[Math.min(depth, colors.length - 1)];
        },
      });
    }

    markmapRef.current.setData(root);
    markmapRef.current.fit();
  }, [files, directories, isClient]);

  const handleZoomIn = () => {
    if (markmapRef.current && svgRef.current) {
      // Use markmap's built-in rescale function
      (markmapRef.current as any).rescale(1.2);
    }
  };

  const handleZoomOut = () => {
    if (markmapRef.current && svgRef.current) {
      // Use markmap's built-in rescale function
      (markmapRef.current as any).rescale(0.8);
    }
  };

  const handleFit = () => {
    if (markmapRef.current) {
      markmapRef.current.fit();
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Maximize2 className="h-16 w-16 text-gray-300" />
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Files to Visualize</h2>
          <p className="text-sm text-gray-600">
            Create some markdown files to see them visualized as a mind map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-white shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-white shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleFit}
          className="bg-white shadow-md"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Markmap SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "#ffffff" }}
      />
    </div>
  );
}

function buildMarkdownHierarchy(files: any[], directories: any[]): string {
  // Build a tree structure
  const tree: any = { name: "Files", children: {} };

  // Add directories
  directories.forEach((dir: any) => {
    const parts = dir.path.split("/").filter(Boolean);
    let current: any = tree.children;

    parts.forEach((part: string, index: number) => {
      if (!current[part]) {
        current[part] = { name: part, children: {}, files: [] };
      }
      current = current[part].children;
    });
  });

  // Add files
  files.forEach((file: any) => {
    const parts = file.path.split("/").filter(Boolean);
    const fileName = parts.pop() || file.name;
    let current: any = tree.children;

    // Navigate to parent directory
    parts.forEach((part: string) => {
      if (!current[part]) {
        current[part] = { name: part, children: {}, files: [] };
      }
      current = current[part].children;
    });

    // Find the parent node
    let parent: any = tree;
    if (parts.length > 0) {
      let tempCurrent: any = tree.children;
      parts.forEach((part: string) => {
        parent = tempCurrent[part];
        tempCurrent = tempCurrent[part].children;
      });
      parent.files = parent.files || [];
      parent.files.push({ name: fileName, summary: file.summary });
    } else {
      tree.files = tree.files || [];
      tree.files.push({ name: fileName, summary: file.summary });
    }
  });

  // Convert tree to markdown
  function treeToMarkdown(node: any, depth = 0): string {
    let md = "";
    const indent = "  ".repeat(depth);

    if (depth > 0) {
      md += `${indent}- **${node.name}**\n`;
    } else {
      md += `# ${node.name}\n\n`;
    }

    // Add files
    if (node.files && node.files.length > 0) {
      node.files.forEach((file: any) => {
        const fileIndent = "  ".repeat(depth + 1);
        md += `${fileIndent}- ${file.name}`;
        if (file.summary) {
          md += ` - *${file.summary}*`;
        }
        md += "\n";
      });
    }

    // Add children directories
    Object.values(node.children || {}).forEach((child: any) => {
      md += treeToMarkdown(child, depth + 1);
    });

    return md;
  }

  return treeToMarkdown(tree);
}
