"use client";

import { useState, useEffect } from "react";
import { FolderOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { requestDirectoryAccess, isFileSystemAccessSupported } from "@/lib/file-system";

export function FileSystemConnect() {
  const { directoryHandle, setDirectoryHandle } = useAppStore();
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    isFileSystemAccessSupported().then(setIsSupported);
  }, []);

  const handleConnect = async () => {
    const handle = await requestDirectoryAccess();
    if (handle) {
      setDirectoryHandle(handle);
    }
  };

  if (!isSupported) {
    return (
      <Badge variant="outline" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        File System API not supported
      </Badge>
    );
  }

  if (directoryHandle) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Connected to {directoryHandle.name}
      </Badge>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleConnect}
      className="gap-2"
    >
      <FolderOpen className="h-4 w-4" />
      Connect Folder
    </Button>
  );
}
