"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export function ApiKeyReminder() {
  const router = useRouter();
  const { settings } = useAppStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if API key is configured
    if (!settings?.openaiApiKey && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [settings]);

  if (!show) return null;

  return (
    <Card className="mx-auto max-w-2xl p-4 mb-4 border-yellow-500 bg-yellow-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">
            API Key Required
          </h3>
          <p className="text-sm text-yellow-800 mb-3">
            Please configure your OpenAI API key in Settings to use AI features like chat and voice transcription.
          </p>
          <Button
            size="sm"
            onClick={() => router.push("/settings")}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}
