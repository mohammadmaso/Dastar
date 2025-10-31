"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Github, Heart, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Info className="h-5 w-5" />
              About Dastar
            </h1>
            <p className="text-sm text-gray-600">
              Your personal AI-powered markdown assistant
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Dastar is a Progressive Web App (PWA) designed to help you organize your thoughts
              and notes using markdown files. It combines the power of AI with local-first storage
              to provide a seamless note-taking experience.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">PWA</Badge>
              <Badge variant="secondary">AI-Powered</Badge>
              <Badge variant="secondary">Offline-First</Badge>
              <Badge variant="secondary">Markdown</Badge>
            </div>
          </Card>

          {/* Features */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>AI Chat Assistant:</strong> Get help organizing and creating notes with GPT-4</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Voice Recording:</strong> Record voice notes with automatic transcription</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>File System Integration:</strong> Sync your notes with local filesystem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Visualizations:</strong> View your notes as mind maps and knowledge graphs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>IndexedDB Storage:</strong> All data stored locally in your browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Custom AI Models:</strong> Use any OpenAI-compatible API endpoint</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Jalali Calendar:</strong> Support for both Gregorian and Persian calendars</span>
              </li>
            </ul>
          </Card>

          {/* Technology Stack */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Technology Stack</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Frontend</p>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Next.js 16</li>
                  <li>• React 19</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS v4</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI & Data</p>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Vercel AI SDK</li>
                  <li>• OpenAI GPT-4</li>
                  <li>• Whisper API</li>
                  <li>• IndexedDB</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Visualization</p>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• D3.js</li>
                  <li>• Markmap</li>
                  <li>• Force-directed graphs</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Storage</p>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• IndexedDB (idb)</li>
                  <li>• Zustand</li>
                  <li>• File System API</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Version Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Version Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build:</span>
                <span className="font-medium">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">License:</span>
                <span className="font-medium">MIT</span>
              </div>
            </div>
          </Card>

          {/* Links */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Links & Resources</h2>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href="https://github.com/issues" target="_blank" rel="noopener noreferrer">
                  <Code className="h-4 w-4" />
                  Report an Issue
                </a>
              </Button>
            </div>
          </Card>

          {/* Credits */}
          <Card className="p-6">
            <div className="text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Made with love for organizing thoughts and building knowledge
              </p>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
