"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getSettings, saveSettings } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Settings as SettingsIcon } from "lucide-react";
import type { AppSettings } from "@/types";

export default function SettingsPage() {
  const { settings, setSettings: setStoreSettings } = useAppStore();
  const [formData, setFormData] = useState<Partial<AppSettings>>({
    calendarType: "gregorian",
    openaiApiKey: "",
    openaiBaseUrl: "https://api.openai.com/v1",
    ttsVoice: "alloy",
    sttModel: "whisper-1",
    theme: "light",
    autoCreateFiles: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getSettings();
      if (savedSettings) {
        setFormData({
          calendarType: savedSettings.calendarType || "gregorian",
          openaiApiKey: savedSettings.openaiApiKey || "",
          openaiBaseUrl: savedSettings.openaiBaseUrl || "https://api.openai.com/v1",
          ttsVoice: savedSettings.ttsVoice || "alloy",
          sttModel: savedSettings.sttModel || "whisper-1",
          theme: savedSettings.theme || "light",
          autoCreateFiles: savedSettings.autoCreateFiles ?? false,
        });
      }
    };
    loadSettings();
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveMessage("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const settingsToSave: AppSettings = {
        id: "default",
        calendarType: (formData.calendarType as "jalali" | "gregorian") || "gregorian",
        openaiApiKey: formData.openaiApiKey,
        openaiBaseUrl: formData.openaiBaseUrl || "https://api.openai.com/v1",
        ttsVoice: formData.ttsVoice,
        sttModel: formData.sttModel,
        theme: (formData.theme as "light" | "dark") || "light",
        autoCreateFiles: formData.autoCreateFiles ?? false,
      };

      await saveSettings(settingsToSave);
      setStoreSettings(settingsToSave);
      setSaveMessage("Settings saved successfully!");

      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings
            </h1>
            <p className="text-sm text-gray-600">
              Configure your preferences and API settings
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <ScrollArea className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* AI Model Configuration */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">AI Model Configuration</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiBaseUrl">OpenAI Base URL</Label>
                <Input
                  id="openaiBaseUrl"
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={formData.openaiBaseUrl || ""}
                  onChange={(e) => handleChange("openaiBaseUrl", e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Use custom base URL for OpenAI-compatible APIs (e.g., LocalAI, Ollama with OpenAI compatibility)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  placeholder="sk-..."
                  value={formData.openaiApiKey || ""}
                  onChange={(e) => handleChange("openaiApiKey", e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Your OpenAI API key (stored locally in IndexedDB)
                </p>
              </div>
            </div>
          </Card>

          {/* Voice Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Voice Settings</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sttModel">Speech-to-Text Model</Label>
                <select
                  id="sttModel"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.sttModel || "whisper-1"}
                  onChange={(e) => handleChange("sttModel", e.target.value)}
                >
                  <option value="whisper-1">Whisper-1</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttsVoice">Text-to-Speech Voice</Label>
                <select
                  id="ttsVoice"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.ttsVoice || "alloy"}
                  onChange={(e) => handleChange("ttsVoice", e.target.value)}
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Calendar Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Calendar Settings</h2>
            <div className="space-y-2">
              <Label htmlFor="calendarType">Calendar Type</Label>
              <select
                id="calendarType"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={formData.calendarType || "gregorian"}
                onChange={(e) => handleChange("calendarType", e.target.value)}
              >
                <option value="gregorian">Gregorian</option>
                <option value="jalali">Jalali (Persian)</option>
              </select>
            </div>
          </Card>

          {/* Theme Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Appearance</h2>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={formData.theme || "light"}
                onChange={(e) => handleChange("theme", e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </Card>

          {/* File Creation Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Intelligent File Creation</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="autoCreateFiles"
                  checked={!formData.autoCreateFiles}
                  onChange={(e) => handleChange("autoCreateFiles", !e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <Label htmlFor="autoCreateFiles" className="cursor-pointer">
                    Always ask before creating files
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    When enabled, you'll be asked to confirm before AI creates markdown files from your conversations. When disabled, files will be created automatically.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
