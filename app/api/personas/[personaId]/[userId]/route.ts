import { NextRequest, NextResponse } from "next/server";
import { SupabasePersonaLoader } from "@/lib/knowledge-base/services/supabase-persona-loader";

const personaLoader = new SupabasePersonaLoader();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string; userId?: string }> }
) {
  try {
    const resolvedParams = await params;
    const { personaId, userId } = resolvedParams;
    const finalUserId = userId === "undefined" ? undefined : userId;
    const persona = await personaLoader.loadPersona(personaId, finalUserId);

    if (!persona) {
      return NextResponse.json(
        {
          success: false,
          error: "Persona not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, persona });
  } catch (error) {
    console.error("Error loading persona:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load persona",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string; userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { personaId, userId } = resolvedParams;
    await personaLoader.deleteCustomPersona(personaId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting persona:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete persona",
      },
      { status: 500 }
    );
  }
}

