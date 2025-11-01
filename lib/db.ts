import { openDB, DBSchema, IDBPDatabase } from "idb";
import type {
  MarkdownFile,
  AudioFile,
  LinkRelation,
  AppSettings,
  Directory,
  ChatMessage,
} from "@/types";

interface DastarDB extends DBSchema {
  markdownFiles: {
    key: string;
    value: MarkdownFile;
    indexes: {
      "by-path": string;
      "by-name": string;
      "by-updatedAt": number;
    };
  };
  audioFiles: {
    key: string;
    value: AudioFile;
    indexes: { "by-createdAt": number };
  };
  linkRelations: {
    key: string;
    value: LinkRelation;
    indexes: {
      "by-source": string;
      "by-target": string;
    };
  };
  directories: {
    key: string;
    value: Directory;
    indexes: {
      "by-path": string;
      "by-parentId": string;
    };
  };
  chatMessages: {
    key: string;
    value: ChatMessage;
    indexes: {
      "by-createdAt": number;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = "dastar-db";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<DastarDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<DastarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DastarDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Markdown files store
        if (!db.objectStoreNames.contains("markdownFiles")) {
          const markdownStore = db.createObjectStore("markdownFiles", {
            keyPath: "id",
          });
          markdownStore.createIndex("by-path", "path", { unique: true });
          markdownStore.createIndex("by-name", "name");
          markdownStore.createIndex("by-updatedAt", "updatedAt");
        }

        // Audio files store
        if (!db.objectStoreNames.contains("audioFiles")) {
          const audioStore = db.createObjectStore("audioFiles", {
            keyPath: "id",
          });
          audioStore.createIndex("by-createdAt", "createdAt");
        }

        // Link relations store (triple store for markdown file relationships)
        if (!db.objectStoreNames.contains("linkRelations")) {
          const linksStore = db.createObjectStore("linkRelations", {
            keyPath: "id",
          });
          linksStore.createIndex("by-source", "sourceFileId");
          linksStore.createIndex("by-target", "targetFileId");
        }

        // Directories store
        if (!db.objectStoreNames.contains("directories")) {
          const dirStore = db.createObjectStore("directories", {
            keyPath: "id",
          });
          dirStore.createIndex("by-path", "path", { unique: true });
          dirStore.createIndex("by-parentId", "parentId");
        }

        // Chat messages store
        if (!db.objectStoreNames.contains("chatMessages")) {
          const chatStore = db.createObjectStore("chatMessages", {
            keyPath: "id",
          });
          chatStore.createIndex("by-createdAt", "createdAt");
        }

        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// Markdown file operations
export async function getAllMarkdownFiles(): Promise<MarkdownFile[]> {
  const db = await getDB();
  return db.getAll("markdownFiles");
}

export async function getMarkdownFile(id: string): Promise<MarkdownFile | undefined> {
  const db = await getDB();
  return db.get("markdownFiles", id);
}

export async function getMarkdownFileByPath(path: string): Promise<MarkdownFile | undefined> {
  const db = await getDB();
  return db.getFromIndex("markdownFiles", "by-path", path);
}

export async function saveMarkdownFile(file: MarkdownFile): Promise<void> {
  const db = await getDB();
  await db.put("markdownFiles", file);
}

export async function deleteMarkdownFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("markdownFiles", id);
}

// Directory operations
export async function getAllDirectories(): Promise<Directory[]> {
  const db = await getDB();
  return db.getAll("directories");
}

export async function getDirectory(id: string): Promise<Directory | undefined> {
  const db = await getDB();
  return db.get("directories", id);
}

export async function getDirectoryByPath(path: string): Promise<Directory | undefined> {
  const db = await getDB();
  return db.getFromIndex("directories", "by-path", path);
}

export async function saveDirectory(dir: Directory): Promise<void> {
  const db = await getDB();
  await db.put("directories", dir);
}

export async function deleteDirectory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("directories", id);
}

// Audio file operations
export async function getAllAudioFiles(): Promise<AudioFile[]> {
  const db = await getDB();
  return db.getAll("audioFiles");
}

export async function getAudioFile(id: string): Promise<AudioFile | undefined> {
  const db = await getDB();
  return db.get("audioFiles", id);
}

export async function saveAudioFile(audio: AudioFile): Promise<void> {
  const db = await getDB();
  await db.put("audioFiles", audio);
}

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("audioFiles", id);
}

// Link relation operations (triple store)
export async function getAllLinkRelations(): Promise<LinkRelation[]> {
  const db = await getDB();
  return db.getAll("linkRelations");
}

export async function getLinkRelationsBySource(sourceFileId: string): Promise<LinkRelation[]> {
  const db = await getDB();
  return db.getAllFromIndex("linkRelations", "by-source", sourceFileId);
}

export async function getLinkRelationsByTarget(targetFileId: string): Promise<LinkRelation[]> {
  const db = await getDB();
  return db.getAllFromIndex("linkRelations", "by-target", targetFileId);
}

export async function saveLinkRelation(link: LinkRelation): Promise<void> {
  const db = await getDB();
  await db.put("linkRelations", link);
}

export async function deleteLinkRelation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("linkRelations", id);
}

export async function deleteLinkRelationsBySource(sourceFileId: string): Promise<void> {
  const db = await getDB();
  const links = await getLinkRelationsBySource(sourceFileId);
  const tx = db.transaction("linkRelations", "readwrite");
  await Promise.all(links.map((link) => tx.store.delete(link.id)));
  await tx.done;
}

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  const allSettings = await db.getAll("settings");
  return allSettings[0];
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put("settings", settings);
}

// Initialize default settings
export async function initializeDefaultSettings(): Promise<void> {
  const existing = await getSettings();
  if (!existing) {
    await saveSettings({
      id: "default",
      calendarType: "gregorian",
      theme: "light",
    });
  }
}

// Chat message operations
export async function getAllChatMessages(): Promise<ChatMessage[]> {
  const db = await getDB();
  const messages = await db.getAllFromIndex("chatMessages", "by-createdAt");
  return messages;
}

export async function getChatMessages(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
  const db = await getDB();
  const tx = db.transaction("chatMessages", "readonly");
  const index = tx.store.index("by-createdAt");

  let messages: ChatMessage[] = [];
  let cursor = await index.openCursor(null, "prev"); // Newest first
  let skipped = 0;

  while (cursor && messages.length < limit) {
    if (skipped >= offset) {
      messages.push(cursor.value);
    } else {
      skipped++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return messages.reverse(); // Return in chronological order
}

export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put("chatMessages", message);
}

export async function deleteChatMessage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("chatMessages", id);
}

export async function deleteAllChatMessages(): Promise<void> {
  const db = await getDB();
  await db.clear("chatMessages");
}
