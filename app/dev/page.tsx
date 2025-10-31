"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Database, Trash2, Download } from "lucide-react";

export default function DevPage() {
  const { files, directories, settings } = useAppStore();
  const [dbSize, setDbSize] = useState<number>(0);

  useEffect(() => {
    // Calculate approximate database size
    const calculateSize = () => {
      const filesSize = JSON.stringify(files).length;
      const dirsSize = JSON.stringify(directories).length;
      const settingsSize = JSON.stringify(settings).length;
      return filesSize + dirsSize + settingsSize;
    };

    setDbSize(calculateSize());
  }, [files, directories, settings]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      if (confirm("This will delete ALL your files, directories, and settings. Are you ABSOLUTELY sure?")) {
        try {
          // Clear IndexedDB
          const databases = await window.indexedDB.databases();
          for (const db of databases) {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          }

          // Clear localStorage
          localStorage.clear();

          // Reload page
          window.location.reload();
        } catch (error) {
          console.error("Error clearing data:", error);
          alert("Failed to clear data");
        }
      }
    }
  };

  const handleExportData = () => {
    const data = {
      files,
      directories,
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dastar-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Code className="h-5 w-5" />
              Developer Tools
            </h1>
            <p className="text-sm text-gray-600">
              Debug information and data management
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Database Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Files</p>
                <p className="text-2xl font-bold">{files.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Directories</p>
                <p className="text-2xl font-bold">{directories.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Approx. Size</p>
                <p className="text-2xl font-bold">{formatBytes(dbSize)}</p>
              </div>
              <div>
                <p className="text-gray-600">Settings</p>
                <p className="text-2xl font-bold">{settings ? "✓" : "✗"}</p>
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">System Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">User Agent:</span>
                <span className="font-mono text-xs truncate max-w-[60%]">
                  {typeof window !== "undefined" ? navigator.userAgent.split(" ").slice(0, 3).join(" ") : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform:</span>
                <span className="font-medium">
                  {typeof window !== "undefined" ? navigator.platform : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Language:</span>
                <span className="font-medium">
                  {typeof window !== "undefined" ? navigator.language : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Online:</span>
                <Badge variant={typeof window !== "undefined" && navigator.onLine ? "default" : "destructive"}>
                  {typeof window !== "undefined" && navigator.onLine ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* API Support */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">API Support</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">IndexedDB:</span>
                <Badge variant="default">Supported</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File System Access API:</span>
                <Badge variant={typeof window !== "undefined" && "showDirectoryPicker" in window ? "default" : "secondary"}>
                  {typeof window !== "undefined" && "showDirectoryPicker" in window ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Worker:</span>
                <Badge variant={typeof window !== "undefined" && "serviceWorker" in navigator ? "default" : "secondary"}>
                  {typeof window !== "undefined" && "serviceWorker" in navigator ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Media Devices API:</span>
                <Badge variant={typeof window !== "undefined" && "mediaDevices" in navigator ? "default" : "secondary"}>
                  {typeof window !== "undefined" && "mediaDevices" in navigator ? "Supported" : "Not Supported"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Settings Debug */}
          {settings && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Current Settings</h2>
              <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(
                  {
                    ...settings,
                    openaiApiKey: settings.openaiApiKey ? "***" + settings.openaiApiKey.slice(-4) : undefined,
                  },
                  null,
                  2
                )}
              </pre>
            </Card>
          )}

          {/* Data Management */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Export All Data (JSON)
              </Button>
              <Button
                onClick={handleClearData}
                variant="destructive"
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
              <p className="text-xs text-gray-500">
                Warning: Clearing data will delete all files, directories, and settings permanently.
              </p>
            </div>
          </Card>

          {/* Console Logs */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Console</h2>
            <p className="text-sm text-gray-600">
              Open browser DevTools (F12) to view console logs and network activity.
            </p>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
