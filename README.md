# Dastar - Personal Assistant PWA

A personal assistant Progressive Web App (PWA) with markdown-based note management, AI-powered organization, and offline-first capabilities.

## Features

- **AI-Powered Chat Interface** - Interact with your notes through natural language
- **Voice Input & Transcription** - Record audio notes with automatic transcription
- **Markdown File Management** - Create, edit, and organize markdown files
- **Offline-First** - Full functionality without internet connection
- **File System Integration** - Save files directly to your local filesystem
- **Smart Organization** - AI agent helps organize and link your notes
- **Visual Exploration** - Mind maps and force-directed graphs of your knowledge
- **Jalali Calendar Support** - Persian calendar for Iranian users
- **Mobile-First Design** - Optimized for mobile devices

## Tech Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **AI/Agents**: Mastra + Vercel AI SDK
- **LLM**: OpenAI GPT-4 Turbo
- **Storage**: IndexedDB + File System Access API
- **Audio**: Pipecat Voice UI Kit + Web Audio API
- **Editor**: Novel (Tiptap-based markdown editor)
- **Visualization**: Markmap + D3.js
- **PWA**: @ducanh2912/next-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dastar
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

This app requires a server runtime for API routes. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment options.

**Recommended**: Deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

**Note**: Users can provide their own OpenAI API keys in Settings, so the `OPENAI_API_KEY` environment variable is optional.

## Project Structure

```
dastar/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utilities and configurations
│   ├── db.ts        # IndexedDB operations
│   ├── file-system.ts # File System Access API
│   └── mastra.ts    # AI agent configuration
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Development Roadmap

See [.ai/PROGRESS.md](.ai/PROGRESS.md) for detailed development progress and [.ai/HLD/00-Description.md](.ai/HLD/00-Description.md) for the complete high-level design.

### Current Status: Phase 5 Complete ✅

- ✅ Phase 1: Project initialization and setup
- ✅ Phase 2: Core infrastructure (API routes, state management)
- ✅ Phase 3: Chat interface with AI and voice recording
- ✅ Phase 4: File management & markdown editor
- ✅ Phase 5: Visualizations (Markmap, D3.js graph)
- ✅ Phase 6: Settings, About, and Dev pages
- ✅ Phase 7: Deployment configuration

### Features Implemented

- ✅ AI chat with custom base URL support
- ✅ Voice recording with Whisper transcription
- ✅ File browser with search
- ✅ Markdown editor with CRUD operations
- ✅ Mind map visualization (Markmap)
- ✅ Knowledge graph (D3.js force-directed)
- ✅ Settings page with API configuration
- ✅ File System API integration
- ✅ IndexedDB storage
- ✅ PWA configuration
- ✅ Mobile-first responsive design

## Key Features in Detail

### AI-Powered Organization

The app uses Mastra workflows with human-in-the-loop confirmation to:
- Analyze user input and suggest file organization
- Create and update markdown files automatically
- Maintain links between related notes
- Generate summaries for quick reference

### Offline-First Architecture

- IndexedDB for local data storage
- File System Access API for direct file access
- Service Worker for offline functionality
- Sync when online

### Voice Features

- Record audio notes with UserAudioControl component
- Automatic transcription using OpenAI Whisper
- Text-to-speech for note reading
- Queue management for audio processing

### Visualizations

- **Markmap**: Hierarchical view of directories and files
- **D3.js Graph**: Interactive network of linked notes

## Browser Support

- Chrome/Edge 86+ (File System Access API)
- Modern browsers with IndexedDB support
- PWA installable on Android/iOS

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

ISC

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) for the component system
- [Mastra](https://mastra.ai) for the AI agent framework
- [Vercel](https://vercel.com) for the AI SDK
- [Novel](https://novel.sh) for the markdown editor
