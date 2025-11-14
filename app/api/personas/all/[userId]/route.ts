import { NextRequest, NextResponse } from "next/server";
import { SupabasePersonaLoader } from "@/lib/knowledge-base/services/supabase-persona-loader";

const personaLoader = new SupabasePersonaLoader();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId?: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId === "undefined" || resolvedParams.userId === "default-user" 
      ? undefined 
      : resolvedParams.userId;
    
    console.log("[API] Loading personas for userId:", userId || "undefined (default)");
    
    const personas = await personaLoader.loadAllPersonas(userId);
    
    console.log("[API] Loaded personas:", {
      count: personas?.length || 0,
      personas: personas?.map(p => ({ id: p.id, name: p.name, isDefault: p.isDefault })) || []
    });
    
    // If no personas found, return empty array but still success
    // The frontend will use fallback personas
    const response = {
      success: true, 
      personas: personas || []
    };
    
    console.log("[API] Returning response:", {
      success: response.success,
      personaCount: response.personas.length
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] Error loading personas:", error);
    // Return empty array on error - frontend will use fallback
    return NextResponse.json(
      {
        success: true,
        personas: [],
      },
      { status: 200 }
    );
  }
}

