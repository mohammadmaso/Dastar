"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Save, ArrowLeft, Trash2, Check, AlertCircle, Clock, Eye, Edit2,
  Bold, Italic, List, Link2, Code, Heading1, Heading2, Quote, ListOrdered, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getMarkdownFile, saveMarkdownFile, deleteMarkdownFile } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { saveFile as saveToFileSystem } from "@/lib/file-system";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import { WikiLinkAutocomplete } from "@/components/wiki-link-autocomplete";
import {
  searchFilesForAutocomplete,
  getWikiLinkText,
  convertWikiLinksToMarkdown,
  updateWikiLinkRelations,
} from "@/lib/wiki-links";
import type { MarkdownFile } from "@/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { directoryHandle } = useAppStore();
  const [file, setFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [previewHtml, setPreviewHtml] = useState<string>("");

  // Wiki-link autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteFiles, setAutocompleteFiles] = useState<MarkdownFile[]>([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = useState(0);
  const [wikiLinkStart, setWikiLinkStart] = useState<number | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Render markdown to HTML for preview
  const renderMarkdown = useCallback(async (markdown: string): Promise<string> => {
    try {
      // Convert wiki-style links to markdown links before rendering
      const convertedMarkdown = convertWikiLinksToMarkdown(markdown);
      const result = await remark()
        .use(remarkGfm)
        .use(remarkHtml, { sanitize: false })
        .process(convertedMarkdown);
      return result.toString();
    } catch (error) {
      console.error("Error rendering markdown:", error);
      return markdown;
    }
  }, []);

  // Markdown formatting helpers
  const insertMarkdown = useCallback((before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Set cursor position
    setTimeout(() => {
      const cursorPos = start + before.length + selectedText.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, [content]);

  const formatBold = () => insertMarkdown("**", "**", "bold text");
  const formatItalic = () => insertMarkdown("*", "*", "italic text");
  const formatHeading1 = () => insertMarkdown("# ", "", "Heading 1");
  const formatHeading2 = () => insertMarkdown("## ", "", "Heading 2");
  const formatQuote = () => insertMarkdown("> ", "", "quote");
  const formatCode = () => insertMarkdown("`", "`", "code");
  const formatUnorderedList = () => insertMarkdown("- ", "", "list item");
  const formatOrderedList = () => insertMarkdown("1. ", "", "list item");
  const formatLink = () => insertMarkdown("[", "](url)", "link text");
  const formatImage = () => insertMarkdown("![", "](url)", "alt text");
  const formatWikiLink = () => insertMarkdown("[[", "]]", "");

  // Handle wiki-link autocomplete
  const handleTextareaChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPos);

    // Check if we're inside [[ ]]
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');
    const lastCloseBracket = textBeforeCursor.lastIndexOf(']]');

    if (lastOpenBracket > lastCloseBracket && lastOpenBracket !== -1) {
      // We're inside [[]]
      const query = textBeforeCursor.substring(lastOpenBracket + 2);
      setAutocompleteQuery(query);
      setWikiLinkStart(lastOpenBracket);

      // Get autocomplete suggestions
      const files = await searchFilesForAutocomplete(query);
      setAutocompleteFiles(files);
      setAutocompleteSelectedIndex(0);

      // Calculate position for autocomplete dropdown
      const textareaRect = textarea.getBoundingClientRect();
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const lineHeight = 20; // Approximate line height
      const top = textareaRect.top + (currentLine * lineHeight) + lineHeight + window.scrollY;
      const left = textareaRect.left + 10;

      setAutocompletePosition({ top, left });
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
      setWikiLinkStart(null);
    }
  }, []);

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback((selectedFile: MarkdownFile) => {
    if (wikiLinkStart === null || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const wikiLinkText = getWikiLinkText(selectedFile);

    // Replace from [[ to cursor with the selected file
    const newContent =
      content.substring(0, wikiLinkStart) +
      `[[${wikiLinkText}]]` +
      content.substring(cursorPos);

    setContent(newContent);
    setShowAutocomplete(false);
    setWikiLinkStart(null);

    // Set cursor after the inserted link
    setTimeout(() => {
      const newCursorPos = wikiLinkStart + wikiLinkText.length + 4; // 4 for [[ and ]]
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, wikiLinkStart]);

  // Handle keyboard navigation in autocomplete
  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showAutocomplete) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteSelectedIndex(prev =>
        prev < autocompleteFiles.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      if (autocompleteFiles[autocompleteSelectedIndex]) {
        e.preventDefault();
        handleAutocompleteSelect(autocompleteFiles[autocompleteSelectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowAutocomplete(false);
      setWikiLinkStart(null);
    }
  }, [showAutocomplete, autocompleteFiles, autocompleteSelectedIndex, handleAutocompleteSelect]);

  // Handle link clicks in preview mode
  const handlePreviewClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Check if clicked element is a link
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');

      if (!href) return;

      // Handle internal .md links (from wiki-links)
      if (href.endsWith('.md')) {
        const { findFileByWikiLink } = await import('@/lib/wiki-links');
        const linkText = href.replace(/\.md$/, '');
        const linkedFile = await findFileByWikiLink(linkText);

        if (linkedFile) {
          router.push(`/editor/${linkedFile.id}`);
        } else {
          alert(`File not found: ${href}`);
        }
      } else {
        // External link - open in new tab
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  }, [router]);

  useEffect(() => {
    loadFile();
  }, [params.id]);

  // Auto-save effect
  useEffect(() => {
    if (!file || isLoading) return;

    // Mark as having unsaved changes
    hasUnsavedChangesRef.current = true;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, name, summary]);

  // Update preview HTML when content changes
  useEffect(() => {
    if (editorMode === "preview") {
      renderMarkdown(content).then(setPreviewHtml);
    }
  }, [content, editorMode, renderMarkdown]);

  const loadFile = async () => {
    try {
      const fileData = await getMarkdownFile(params.id as string);
      if (fileData) {
        setFile(fileData);
        setContent(fileData.content);
        setName(fileData.name);
        setSummary(fileData.summary);
        setLastSaved(fileData.updatedAt);
      }
    } catch (error) {
      console.error("Error loading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!file || !hasUnsavedChangesRef.current) return;

    setSaveStatus("saving");
    try {
      const updatedFile: MarkdownFile = {
        ...file,
        name,
        content,
        summary,
        updatedAt: Date.now(),
      };

      // Save to IndexedDB
      await saveMarkdownFile(updatedFile);

      // Update wiki-link relations
      await updateWikiLinkRelations(file.id, content);

      // Save to file system if connected
      if (directoryHandle) {
        await saveToFileSystem(file.path, content, directoryHandle);
      }

      // Update local state
      setFile(updatedFile);
      setLastSaved(updatedFile.updatedAt);
      setSaveStatus("saved");
      hasUnsavedChangesRef.current = false;

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error auto-saving file:", error);
      setSaveStatus("error");
      // Reset error status after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 5000);
    }
  };

  const handleManualSave = async () => {
    if (!file) return;

    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const updatedFile: MarkdownFile = {
        ...file,
        name,
        content,
        summary,
        updatedAt: Date.now(),
      };

      // Save to IndexedDB
      await saveMarkdownFile(updatedFile);

      // Update wiki-link relations
      await updateWikiLinkRelations(file.id, content);

      // Save to file system if connected
      if (directoryHandle) {
        await saveToFileSystem(file.path, content, directoryHandle);
      }

      // Update local state
      setFile(updatedFile);
      setLastSaved(updatedFile.updatedAt);
      setSaveStatus("saved");
      hasUnsavedChangesRef.current = false;

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save file");
      setSaveStatus("error");
      // Reset error status after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      await deleteMarkdownFile(file.id);
      router.push("/files");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">File not found</h2>
          <Button onClick={() => router.push("/files")}>Go to Files</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/files")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0 max-w-md">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold border-gray-300"
                placeholder="File name"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-1 text-xs">
              {saveStatus === "saving" && (
                <>
                  <Clock className="h-3 w-3 animate-spin text-blue-500" />
                  <span className="text-blue-600">Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Save failed</span>
                </>
              )}
              {saveStatus === "idle" && lastSaved && (
                <span className="text-gray-500">
                  {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        {directoryHandle && (
          <Badge variant="secondary" className="mt-2">
            Synced to {directoryHandle.name}
          </Badge>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-auto relative">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Summary
            </label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of this file..."
              className="border-gray-300"
            />
          </div>

          {/* Path Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Path
            </label>
            <Input
              value={file.path}
              disabled
              className="text-sm text-gray-600 bg-gray-50"
            />
          </div>

          {/* Editor/Preview Toggle */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 bg-gray-50">
              <label className="text-sm font-medium text-gray-900">
                Content
              </label>
              <div className="flex items-center gap-1">
                <Button
                  variant={editorMode === "edit" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setEditorMode("edit")}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={editorMode === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setEditorMode("preview")}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>

            {editorMode === "edit" ? (
              <div className="relative">
                {/* Markdown Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-white flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatHeading1}
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatHeading2}
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatBold}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatItalic}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatCode}
                    title="Inline Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatUnorderedList}
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatOrderedList}
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatQuote}
                    title="Quote"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatWikiLink}
                    title="Wiki Link [[ ]]"
                    className="font-bold"
                  >
                    [[]]
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatLink}
                    title="Link"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatImage}
                    title="Image"
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </div>

                {/* Textarea Editor */}
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleTextareaKeyDown}
                  className="min-h-[600px] border-0 rounded-none font-mono text-sm resize-none focus-visible:ring-0 p-4"
                  placeholder="Start writing your markdown here... Use [[ to link to other files"
                />

                {/* Wiki-link Autocomplete */}
                {showAutocomplete && (
                  <WikiLinkAutocomplete
                    query={autocompleteQuery}
                    files={autocompleteFiles}
                    position={autocompletePosition}
                    onSelect={handleAutocompleteSelect}
                    onClose={() => setShowAutocomplete(false)}
                    selectedIndex={autocompleteSelectedIndex}
                    onSelectIndex={setAutocompleteSelectedIndex}
                  />
                )}
              </div>
            ) : (
              <div
                className="p-6 min-h-[600px] prose prose-sm prose-slate max-w-none
                  prose-headings:text-gray-900 prose-p:text-gray-700
                  prose-a:text-blue-600 prose-a:cursor-pointer prose-code:text-pink-600
                  prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                onClick={handlePreviewClick}
              />
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Markdown Tips:</strong> Use # for headings, **bold**, *italic*, `code`,
              [[filename]] for wiki-links to other files, [links](url), - for lists, and &gt; for quotes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
