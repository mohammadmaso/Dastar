"use client";

// File System Access API utilities for saving/loading markdown files locally

export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

let directoryHandle: FileSystemDirectoryHandle | null = null;

export async function isFileSystemAccessSupported(): Promise<boolean> {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    "showOpenFilePicker" in window &&
    "showSaveFilePicker" in window
  );
}

export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!window.showDirectoryPicker) {
    console.error("File System Access API is not supported");
    return null;
  }

  try {
    directoryHandle = await window.showDirectoryPicker();
    return directoryHandle;
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      console.error("Error accessing directory:", err);
    }
    return null;
  }
}

export function getDirectoryHandle(): FileSystemDirectoryHandle | null {
  return directoryHandle;
}

export function setDirectoryHandle(handle: FileSystemDirectoryHandle | null): void {
  directoryHandle = handle;
}

export async function saveFile(
  path: string,
  content: string,
  rootHandle?: FileSystemDirectoryHandle
): Promise<boolean> {
  const handle = rootHandle || directoryHandle;
  if (!handle) {
    console.error("No directory handle available");
    return false;
  }

  try {
    const pathParts = path.split("/").filter(Boolean);
    const fileName = pathParts.pop()!;

    // Navigate to the correct directory
    let currentHandle = handle;
    for (const dirName of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(dirName, { create: true });
    }

    // Create or get the file
    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    return true;
  } catch (err) {
    console.error("Error saving file:", err);
    return false;
  }
}

export async function readFile(
  path: string,
  rootHandle?: FileSystemDirectoryHandle
): Promise<string | null> {
  const handle = rootHandle || directoryHandle;
  if (!handle) {
    console.error("No directory handle available");
    return null;
  }

  try {
    const pathParts = path.split("/").filter(Boolean);
    const fileName = pathParts.pop()!;

    // Navigate to the directory
    let currentHandle = handle;
    for (const dirName of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(dirName);
    }

    // Read the file
    const fileHandle = await currentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    console.error("Error reading file:", err);
    return null;
  }
}

export async function deleteFile(
  path: string,
  rootHandle?: FileSystemDirectoryHandle
): Promise<boolean> {
  const handle = rootHandle || directoryHandle;
  if (!handle) {
    console.error("No directory handle available");
    return false;
  }

  try {
    const pathParts = path.split("/").filter(Boolean);
    const fileName = pathParts.pop()!;

    // Navigate to the directory
    let currentHandle = handle;
    for (const dirName of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(dirName);
    }

    // Delete the file
    await currentHandle.removeEntry(fileName);
    return true;
  } catch (err) {
    console.error("Error deleting file:", err);
    return false;
  }
}

export async function createDirectory(
  path: string,
  rootHandle?: FileSystemDirectoryHandle
): Promise<boolean> {
  const handle = rootHandle || directoryHandle;
  if (!handle) {
    console.error("No directory handle available");
    return false;
  }

  try {
    const pathParts = path.split("/").filter(Boolean);

    // Navigate and create directories
    let currentHandle = handle;
    for (const dirName of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(dirName, { create: true });
    }

    return true;
  } catch (err) {
    console.error("Error creating directory:", err);
    return false;
  }
}

export async function listFiles(
  dirPath: string = "",
  rootHandle?: FileSystemDirectoryHandle
): Promise<{ name: string; kind: "file" | "directory" }[]> {
  const handle = rootHandle || directoryHandle;
  if (!handle) {
    console.error("No directory handle available");
    return [];
  }

  try {
    // Navigate to the directory
    let currentHandle = handle;
    if (dirPath) {
      const pathParts = dirPath.split("/").filter(Boolean);
      for (const dirName of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(dirName);
      }
    }

    const entries: { name: string; kind: "file" | "directory" }[] = [];
    for await (const entry of currentHandle.values()) {
      entries.push({ name: entry.name, kind: entry.kind });
    }

    return entries;
  } catch (err) {
    console.error("Error listing files:", err);
    return [];
  }
}
