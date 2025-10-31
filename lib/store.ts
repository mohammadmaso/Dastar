import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, MarkdownFile, Directory } from "@/types";

interface AppState {
  // Settings
  settings: AppSettings | null;
  setSettings: (settings: AppSettings) => void;

  // Directory handle for File System API
  directoryHandle: any | null;
  setDirectoryHandle: (handle: any | null) => void;

  // Current files and directories (cached from IndexedDB)
  files: MarkdownFile[];
  directories: Directory[];
  setFiles: (files: MarkdownFile[]) => void;
  setDirectories: (directories: Directory[]) => void;

  // UI State
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;

  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Database initialization status
  isDbInitialized: boolean;
  setDbInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      settings: null,
      setSettings: (settings) => set({ settings }),

      // Directory handle (cannot be persisted, will be null on reload)
      directoryHandle: null,
      setDirectoryHandle: (handle) => set({ directoryHandle: handle }),

      // Files and directories
      files: [],
      directories: [],
      setFiles: (files) => set({ files }),
      setDirectories: (directories) => set({ directories }),

      // UI State
      selectedFileId: null,
      setSelectedFileId: (id) => set({ selectedFileId: id }),

      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      // Database initialization
      isDbInitialized: false,
      setDbInitialized: (initialized) => set({ isDbInitialized: initialized }),
    }),
    {
      name: "dastar-storage",
      partialize: (state) => ({
        settings: state.settings,
        selectedFileId: state.selectedFileId,
        isSidebarOpen: state.isSidebarOpen,
        // Don't persist directoryHandle, files, or directories
      }),
    }
  )
);
