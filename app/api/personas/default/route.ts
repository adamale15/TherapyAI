import { NextResponse } from "next/server";
import { SupabasePersonaLoader } from "@/lib/knowledge-base/services/supabase-persona-loader";

const personaLoader = new SupabasePersonaLoader();

export async function GET() {
  try {
    const personas = await personaLoader.loadDefaultPersonas();
    return NextResponse.json({ success: true, personas });
  } catch (error) {
    console.error("Error loading default personas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load default personas",
      },
      { status: 500 }
    );
  }
}

