export interface MarkdownFile {
  id: string;
  path: string;
  name: string;
  content: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface AudioFile {
  id: string;
  fileId: string;
  filePath: string;
  transcript: string;
  duration: number;
  createdAt: number;
}

export interface LinkRelation {
  id: string;
  sourceFileId: string;
  targetFileId: string;
  createdAt: number;
}

export interface AppSettings {
  id: string;
  calendarType: "jalali" | "gregorian";
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  ttsVoice?: string;
  sttModel?: string;
  theme?: "light" | "dark";
}

export interface Directory {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: number;
}
