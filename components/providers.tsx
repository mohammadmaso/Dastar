"use client";

import { ThemeProvider } from "@pipecat-ai/voice-ui-kit";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="system" storageKey="voice-ui-kit-theme">{children}</ThemeProvider>;
}
