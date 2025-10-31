import { NextResponse } from "next/server";
import {
  getAllMarkdownFiles,
  getMarkdownFile,
  saveMarkdownFile,
  deleteMarkdownFile,
  getAllDirectories,
} from "@/lib/db";
import { nanoid } from "nanoid";

// GET /api/files - Get all files and directories
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("id");

    if (fileId) {
      const file = await getMarkdownFile(fileId);
      if (!file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      return NextResponse.json(file);
    }

    const [files, directories] = await Promise.all([
      getAllMarkdownFiles(),
      getAllDirectories(),
    ]);

    return NextResponse.json({ files, directories });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// POST /api/files - Create or update a file
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, path, name, content, summary, tags } = body;

    if (!path || !name || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const file = {
      id: id || nanoid(),
      path,
      name,
      content,
      summary: summary || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: tags || [],
    };

    await saveMarkdownFile(file);

    return NextResponse.json(file);
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}

// PUT /api/files - Update an existing file
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, path, name, content, summary, tags } = body;

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const existing = await getMarkdownFile(id);
    if (!existing) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = {
      ...existing,
      path: path || existing.path,
      name: name || existing.name,
      content: content !== undefined ? content : existing.content,
      summary: summary !== undefined ? summary : existing.summary,
      tags: tags !== undefined ? tags : existing.tags,
      updatedAt: Date.now(),
    };

    await saveMarkdownFile(file);

    return NextResponse.json(file);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

// DELETE /api/files - Delete a file
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    await deleteMarkdownFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
