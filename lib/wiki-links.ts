import { getAllMarkdownFiles, getMarkdownFileByPath, saveLinkRelation, deleteLinkRelationsBySource } from "@/lib/db";
import { nanoid } from "nanoid";
import type { MarkdownFile } from "@/types";

/**
 * Extract wiki-style links from markdown content
 * Matches [[filename]] or [[path/to/filename]]
 */
export function extractWikiLinks(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const matches = Array.from(content.matchAll(wikiLinkRegex));
  return matches.map(match => match[1].trim());
}

/**
 * Convert wiki-style links to markdown links for rendering
 * [[filename]] becomes [filename](filename.md)
 * [[path/to/filename]] becomes [filename](path/to/filename.md)
 */
export function convertWikiLinksToMarkdown(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    const trimmedLink = linkText.trim();
    // Get display text (last part of path)
    const displayText = trimmedLink.split('/').pop() || trimmedLink;
    // Ensure .md extension
    const href = trimmedLink.endsWith('.md') ? trimmedLink : `${trimmedLink}.md`;
    return `[${displayText}](${href})`;
  });
}

/**
 * Find a file by name or path (fuzzy matching)
 */
export async function findFileByWikiLink(linkText: string): Promise<MarkdownFile | null> {
  const files = await getAllMarkdownFiles();

  // Try exact path match first
  const exactPath = linkText.endsWith('.md') ? linkText : `${linkText}.md`;
  let file = await getMarkdownFileByPath(exactPath);
  if (file) return file;

  // Try matching by filename
  const linkName = linkText.split('/').pop() || linkText;
  const nameWithExt = linkName.endsWith('.md') ? linkName : `${linkName}.md`;

  const foundByName = files.find(f => f.name === nameWithExt);
  if (foundByName) return foundByName;

  // Try partial path match
  const foundByPath = files.find(f => f.path.includes(linkText));
  return foundByPath || null;
}

/**
 * Update link relations for a file based on wiki links in content
 */
export async function updateWikiLinkRelations(fileId: string, content: string): Promise<void> {
  // Delete old relations
  await deleteLinkRelationsBySource(fileId);

  // Extract wiki links
  const wikiLinks = extractWikiLinks(content);

  // Create new relations
  for (const linkText of wikiLinks) {
    const targetFile = await findFileByWikiLink(linkText);
    if (targetFile) {
      await saveLinkRelation({
        id: nanoid(),
        sourceFileId: fileId,
        targetFileId: targetFile.id,
        createdAt: Date.now(),
      });
    }
  }
}

/**
 * Search files for autocomplete suggestions
 */
export async function searchFilesForAutocomplete(query: string): Promise<MarkdownFile[]> {
  const files = await getAllMarkdownFiles();

  if (!query) return files.slice(0, 10);

  const lowerQuery = query.toLowerCase();

  // Filter and sort by relevance
  return files
    .filter(file => {
      const nameMatch = file.name.toLowerCase().includes(lowerQuery);
      const pathMatch = file.path.toLowerCase().includes(lowerQuery);
      const summaryMatch = file.summary.toLowerCase().includes(lowerQuery);
      return nameMatch || pathMatch || summaryMatch;
    })
    .sort((a, b) => {
      // Prioritize name matches over path matches
      const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery);
      const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);
}

/**
 * Get file path without extension for wiki link display
 */
export function getWikiLinkText(file: MarkdownFile): string {
  return file.path.replace(/\.md$/, '');
}
