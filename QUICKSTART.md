# Quick Start Guide

## Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Open in browser**: [http://localhost:3000](http://localhost:3000)

## First Time Usage

### Configure Settings

1. Navigate to **Settings** page (bottom navigation)
2. Add your OpenAI API key (required for AI features)
3. Optional: Change base URL for custom OpenAI-compatible APIs
4. Optional: Select Jalali calendar if needed

### Create Your First Note

**Option 1: Using AI Chat**
1. Go to **Chat** page (home)
2. Ask the AI to help create a note
3. Example: "Create a note about project ideas"

**Option 2: Manual Creation**
1. Go to **Files** page
2. Click **New File** button
3. Enter file name, path (optional), and summary
4. Click **Create**

### Connect Local Folder (Optional)

1. Click **Connect Folder** button in Chat or Files page
2. Select a folder on your computer
3. Files will sync between the app and your folder

**Note**: Only works in Chrome, Edge, and Brave browsers

## Features Overview

### 📱 Pages

- **/** - AI chat assistant
- **/files** - Browse and search files
- **/editor/[id]** - Edit markdown files
- **/map** - Mind map visualization
- **/graph** - Knowledge graph
- **/settings** - Configuration
- **/dev** - Developer tools
- **/about** - App information

### 🎤 Voice Recording

1. Click microphone icon in chat
2. Speak your message
3. Click stop when done
4. Transcript appears in input field

### 🗺️ Visualizations

**Mind Map** (`/map`):
- Hierarchical tree view of all files
- Organized by directories
- Shows file summaries

**Knowledge Graph** (`/graph`):
- Network visualization of file relationships
- Based on markdown links between files
- Click nodes to edit files
- Drag nodes to rearrange

### 💾 Data Storage

All data is stored locally:
- **IndexedDB**: Files, directories, settings
- **File System API**: Optional sync with local folder
- **No cloud storage**: Your data never leaves your device

## Building for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment options:
- Vercel (recommended)
- Netlify
- Docker
- Self-hosted

## Troubleshooting

### File System API not working
- Only supported in Chrome, Edge, and Brave
- Shows "File System API not supported" badge
- You can still use the app, just no local folder sync

### AI features not working
- Make sure you added OpenAI API key in Settings
- Check if base URL is correct
- Open Dev page to see system info

### Voice recording not working
- Grant microphone permissions when prompted
- Check browser console for errors
- Only works with HTTPS or localhost

### Data not persisting
- Check if IndexedDB is enabled in browser
- Clear browser data might delete IndexedDB
- Export data from Dev page as backup

## Tips

1. **Organize with paths**: Use paths like `projects/work/meeting.md` to organize
2. **Link notes**: Use markdown links `[Note](path/to/note.md)` to connect notes
3. **Use AI**: Let the AI help organize and create notes
4. **Export data**: Regularly export from Dev page as backup
5. **Custom AI models**: Use local models (Ollama, LocalAI) by changing base URL

## Keyboard Shortcuts

- **Enter** - Send message in chat (Shift+Enter for new line)
- **Click on file** - Open in editor
- **Click on graph node** - Open file

## Browser Recommendations

**Best experience**:
- Chrome 86+
- Edge 86+
- Brave (latest)

**Limited support**:
- Firefox (no File System API)
- Safari (no File System API)

## Getting Help

- Check [README.md](README.md) for full documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Open issue on GitHub for bugs
- Check Dev page for system information
