import { NextRequest, NextResponse } from "next/server";
import { SupabasePersonaLoader } from "@/lib/knowledge-base/services/supabase-persona-loader";

const personaLoader = new SupabasePersonaLoader();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId?: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId === "undefined" ? undefined : resolvedParams.userId;
    const personas = await personaLoader.loadAllPersonas(userId);
    return NextResponse.json({ success: true, personas });
  } catch (error) {
    console.error("Error loading personas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load personas",
      },
      { status: 500 }
    );
  }
}

