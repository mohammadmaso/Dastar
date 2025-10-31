"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { initializeDefaultSettings, getSettings, getAllMarkdownFiles, getAllDirectories } from "@/lib/db";

export function DbInitializer() {
  const { setDbInitialized, setSettings, setFiles, setDirectories } = useAppStore();

  useEffect(() => {
    const initDb = async () => {
      try {
        // Initialize default settings if needed
        await initializeDefaultSettings();

        // Load settings
        const settings = await getSettings();
        if (settings) {
          setSettings(settings);
        }

        // Load files and directories into store
        const [files, directories] = await Promise.all([
          getAllMarkdownFiles(),
          getAllDirectories(),
        ]);

        setFiles(files);
        setDirectories(directories);
        setDbInitialized(true);

        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    initDb();
  }, [setDbInitialized, setSettings, setFiles, setDirectories]);

  return null;
}
