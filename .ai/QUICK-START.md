# Quick Start Guide - Dastar PWA

## You're Ready to Start Development! 🎉

Phase 1 is complete. Here's how to get started with development:

## Run the App

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

The app will start with:
- ✅ Hot reload enabled (Turbopack)
- ✅ TypeScript checking
- ✅ Tailwind CSS processing
- ✅ PWA features (disabled in development)

## What Works Now

1. **Basic Next.js App** - The app loads and renders
2. **Tailwind CSS v4** - Styling system is ready
3. **TypeScript** - Full type checking
4. **IndexedDB Utilities** - Ready to use ([lib/db.ts](../lib/db.ts))
5. **File System API** - Ready to use ([lib/file-system.ts](../lib/file-system.ts))
6. **Mastra Agent** - Configured and ready ([lib/mastra.ts](../lib/mastra.ts))

## Next Development Tasks

### Option 1: Build the Chat Interface (Recommended First)

Create the main chat page where users interact with the AI:

1. **Create chat page**: `app/chat/page.tsx`
2. **Add Vercel AI SDK useChat hook**
3. **Create API route**: `app/api/chat/route.ts`
4. **Integrate Mastra agent**
5. **Add audio recording component**

### Option 2: Build the File Manager

Create the file browser interface:

1. **Install shadcn file manager**: `npx shadcn@latest add https://www.shadcn.io/registry/drawer-left-5.json`
2. **Create files page**: `app/files/page.tsx`
3. **Connect to IndexedDB**
4. **Add CRUD operations**

### Option 3: Set Up the Editor

Create the markdown editor:

1. **Create editor page**: `app/editor/[id]/page.tsx`
2. **Integrate Novel editor**
3. **Connect to IndexedDB for save/load**
4. **Add File System API integration**

## Install shadcn Components

As you build, install UI components:

```bash
# Common components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge

# Menu dock for navigation
npx shadcn@latest add https://www.shadcn.io/registry/menu-dock.json

# File manager drawer
npx shadcn@latest add https://www.shadcn.io/registry/drawer-left-5.json
```

## Using IndexedDB

```typescript
import { getDB, saveMarkdownFile, getAllMarkdownFiles } from '@/lib/db';
import { nanoid } from 'nanoid';

// Save a file
await saveMarkdownFile({
  id: nanoid(),
  path: '/notes/my-note.md',
  name: 'my-note.md',
  content: '# Hello World',
  summary: 'A simple note',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Get all files
const files = await getAllMarkdownFiles();
```

## Using File System API

```typescript
import { requestDirectoryAccess, saveFile, readFile } from '@/lib/file-system';

// Request access (first time)
const handle = await requestDirectoryAccess();

// Save a file
await saveFile('notes/test.md', '# Test Content');

// Read a file
const content = await readFile('notes/test.md');
```

## Using the Mastra Agent

You'll need to create an API route that uses the agent:

```typescript
// app/api/chat/route.ts
import { markdownAssistant } from '@/lib/mastra';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: markdownAssistant.model,
    messages,
    // Add tool implementations
  });

  return result.toDataStreamResponse();
}
```

## Environment Setup

Don't forget to create `.env.local`:

```bash
cp .env.local.example .env.local
```

Then add your OpenAI API key:

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Recommended Development Order

1. **Set up basic navigation** (menu dock)
2. **Create chat interface** (main feature)
3. **Implement file CRUD** (create/read/update/delete)
4. **Add markdown editor**
5. **Implement audio recording**
6. **Add visualizations** (markmap, d3)
7. **Create settings page**
8. **Polish and test offline mode**

## Useful Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Mastra Documentation](https://mastra.ai/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

## Need Help?

- Check [.ai/PROGRESS.md](.ai/PROGRESS.md) for what's been done
- Check [.ai/HLD/00-Description.md](.ai/HLD/00-Description.md) for the full spec
- Look at type definitions in [types/index.ts](../types/index.ts)
- Review the database schema in [lib/db.ts](../lib/db.ts)

## Testing the Build

```bash
# Development mode (fast, with hot reload)
npm run dev

# Production build (optimized)
npm run build
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

**Happy Coding! 🚀**

Your foundation is solid. Now it's time to build the features!
