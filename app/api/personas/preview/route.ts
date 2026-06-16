import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { DocumentParser } from "@/lib/services/document-parser";
import { PersonaGenerator } from "@/lib/services/persona-generator";
import { validateFileType } from "@/lib/services/file-upload";

async function writeTempFile(file: File) {
  const ext = path.extname(file.name);
  const filePath = path.join(
    os.tmpdir(),
    `vesh-persona-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  );
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function POST(request: NextRequest) {
  let filePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("personaFile");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Persona file is required" },
        { status: 400 }
      );
    }

    if (!validateFileType(file.name)) {
      return NextResponse.json(
        { success: false, error: "Only PDF and Word documents are supported" },
        { status: 400 }
      );
    }

    filePath = await writeTempFile(file);
    const parser = new DocumentParser();
    const rawText = await parser.parseDocument(filePath, file.name);
    const text = parser.cleanText(rawText);
    const validation = parser.validateTherapyContent(text);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: "Document does not appear to contain therapy case information",
        validation,
      });
    }

    const generator = new PersonaGenerator();
    const preview = await generator.generatePersonaPreview(text);

    return NextResponse.json({ success: true, preview, validation });
  } catch (error) {
    console.error("Persona preview error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate preview",
      },
      { status: 500 }
    );
  } finally {
    if (filePath) {
      await fs.unlink(filePath).catch(() => undefined);
    }
  }
}
