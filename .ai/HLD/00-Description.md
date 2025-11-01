# Dastar PWA App

- A personal assitante app
- PWA 
- Offline first (Indexed db as local db)
- Markdown based files 
- mobile first design
- minimal ui/ux


- Use context7 mcp for each technology and library that i mention for better context and knoldge about that library 


## User story

- user see chatbot interface as main page, user record audio or write text and send
- Voice transcript with whisper or other model to text and also voice save and pop into chat and also save audio file to local file system  and also transcript pop in chat (whit date and time (jalali calendar/ or gregorian calendar based on user preference))
- Ai agent start process user input (trancript or user message) and also see directories and markdown summeries (each markdown must have summarie field in indexed db for fast access) and based on user input update related files or create new markdown files in proper existed or non existed directories (show progress to user with vercel ai elemtnt of `task` before for all change (all in one prompt) it must use human in the loop of mastra to confirm user for each change with `Confirmation` componnt of ai sdk eleemnt to the user).
- also send back to the user (in `sources` component of ai sdk element) what files updated or created with link to open that file in editor mode (full markdown editor with shadcn editor component)
- if there is any link between markdown files (like link to other markdown file in markdown content), the agent must also update those links accordingly.
- in other menu item we have this file manager (npx shadcn@latest add https://www.shadcn.io/registry/drawer-left-5.json) that show all directories and markdown files. on click to each file open that file in full markdown editor mode. also in this file manager we have button to create new directory and new markdown file in proper directory.
- also in another menu item we have markmap view of all markdown files and directories - also in another menu item we have d3.js disjoint force-directed graph view of all markdown files as node and relations of them between other markdown files that linked in them. 
- in another page we have setting app that get user preferences like 
  - calendar type (jalali or gregorian)
  - Api key and model baseurl for openai or other ai service provider
  - voice settings (text to speech voice selection, speech to text model selection)
  - other app settings
- also in another menu item we have `Dev` page that show all logs of ai agent
- It must use mastra workflow api with human in the loop for confirmation of each change before applying them to files.
- for manage link graph between markdown files we can use a separate service and database (triple data store from indexed db) to manage that link graph and query that service when we need to update links between files. (or generate graph on the fly form files content but it may be slow for large number of files)
- about us page in another menu item to show info about app and developer and contact info.


## Tech stack 
- Next js
- Typescript
- Shadcn
- Indexed db (Local db)
- @shadcn-editor/editor (Markdown editor)
-  File System Access API (Save markdowns to local files)
-  menu dock: npx shadcn@latest add https://www.shadcn.io/registry/menu-dock.json
- Mastra as ai agent
- MAstra text to speech (https://mastra.ai/docs/voice/text-to-speech)
- MAstra speech to text (https://mastra.ai/docs/voice/speech-to-text)

  - UserAudioControl component from @pipecat-ai/voice-ui-kit  for record button (use Web Audio API for advanced audio processing)

-  OpenAI Whisper (for transcription) after user end each recording (queue management needed)

- Vercel ai sdk useChat hook for chat management
- npx shadcn@latest add @ai-elements/all (to use ai elements components)
  - conversation
  - sources (to show what markdown files updated after processing)
  - task (working logs)
  - Confirmation (to confirm change that agent want make in files)
  -  
- markmap.js with like sahdcn css style to show hierarchy of directories and markdowns
- D3.js Disjoint force-directed graph for render markdown files as node and relations of them between other markdown files that linked in them.
- 


