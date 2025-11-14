import { supabaseAdmin } from "@/lib/supabase/client";
import type { PersonaData } from "./persona-loader";

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class SupabasePersonaLoader {
  /**
   * Load all default personas
   */
  async loadDefaultPersonas(): Promise<PersonaData[]> {
    try {
      console.log("[PersonaLoader] Loading default personas from Supabase...");
      const { data, error } = await supabaseAdmin
        .from("personas")
        .select("*")
        .eq("is_default", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[PersonaLoader] Supabase error loading default personas:", error);
        throw error;
      }

      console.log("[PersonaLoader] Supabase returned", data?.length || 0, "default personas");
      return (data || []).map(this.mapToPersonaData);
    } catch (error) {
      console.error("[PersonaLoader] Error loading default personas:", error);
      return [];
    }
  }

  /**
   * Load all custom personas for a specific user
   */
  async loadCustomPersonas(userId: string): Promise<PersonaData[]> {
    // Validate UUID - if not a valid UUID, return empty array
    // This handles cases like "default-user" for unauthenticated users
    // Unauthenticated users only see default personas, which is expected behavior
    if (!isValidUUID(userId)) {
      return [];
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("personas")
        .select("*")
        .eq("user_id", userId)
        .eq("is_default", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapToPersonaData);
    } catch (error) {
      console.error("Error loading custom personas:", error);
      return [];
    }
  }

  /**
   * Load all personas (default + custom for user)
   */
  async loadAllPersonas(userId?: string): Promise<PersonaData[]> {
    console.log("[PersonaLoader] loadAllPersonas called with userId:", userId || "undefined");
    const defaultPersonas = await this.loadDefaultPersonas();
    console.log("[PersonaLoader] Default personas loaded:", defaultPersonas.length);
    const customPersonas = userId ? await this.loadCustomPersonas(userId) : [];
    console.log("[PersonaLoader] Custom personas loaded:", customPersonas.length);

    const allPersonas = [...defaultPersonas, ...customPersonas];
    console.log("[PersonaLoader] Total personas:", allPersonas.length);
    return allPersonas;
  }

  /**
   * Load a specific persona by ID
   */
  async loadPersona(
    personaId: string,
    userId?: string
  ): Promise<PersonaData | null> {
    try {
      // First try to find default persona
      let { data, error } = await supabaseAdmin
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .eq("is_default", true)
        .single();

      // If not found and userId provided and is valid UUID, try custom persona
      if ((error || !data) && userId && isValidUUID(userId)) {
        const result = await supabaseAdmin
          .from("personas")
          .select("*")
          .eq("id", personaId)
          .eq("user_id", userId)
          .eq("is_default", false)
          .single();

        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        return null;
      }

      return this.mapToPersonaData(data);
    } catch (error) {
      console.error("Error loading persona:", error);
      return null;
    }
  }

  /**
   * Save a custom persona
   */
  async saveCustomPersona(persona: PersonaData, userId: string): Promise<void> {
    // Validate UUID
    if (!isValidUUID(userId)) {
      throw new Error("Invalid user ID format. User must be authenticated.");
    }

    try {
      const now = new Date().toISOString();

      const { error } = await supabaseAdmin.from("personas").insert({
        id: persona.id,
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        condition: persona.condition,
        difficulty: persona.difficulty,
        description: persona.description,
        personality: persona.personality,
        background: persona.background,
        voice_settings: persona.voiceSettings,
        system_prompt: persona.systemPrompt,
        few_shot_examples: persona.fewShotExamples,
        is_default: false,
        user_id: userId,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - update instead
          await this.updateCustomPersona(persona.id, persona, userId);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error saving custom persona:", error);
      throw new Error("Failed to save persona");
    }
  }

  /**
   * Update a custom persona
   */
  async updateCustomPersona(
    personaId: string,
    updates: Partial<PersonaData>,
    userId: string
  ): Promise<void> {
    // Validate UUID
    if (!isValidUUID(userId)) {
      throw new Error("Invalid user ID format. User must be authenticated.");
    }

    try {
      const existingPersona = await this.loadPersona(personaId, userId);

      if (!existingPersona || existingPersona.isDefault) {
        throw new Error("Persona not found or cannot be updated");
      }

      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.age !== undefined) updateData.age = updates.age;
      if (updates.occupation !== undefined) updateData.occupation = updates.occupation;
      if (updates.condition !== undefined) updateData.condition = updates.condition;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.personality !== undefined) updateData.personality = updates.personality;
      if (updates.background !== undefined) updateData.background = updates.background;
      if (updates.voiceSettings !== undefined) updateData.voice_settings = updates.voiceSettings;
      if (updates.systemPrompt !== undefined) updateData.system_prompt = updates.systemPrompt;
      if (updates.fewShotExamples !== undefined) updateData.few_shot_examples = updates.fewShotExamples;

      const { error } = await supabaseAdmin
        .from("personas")
        .update(updateData)
        .eq("id", personaId)
        .eq("user_id", userId)
        .eq("is_default", false);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating custom persona:", error);
      throw new Error("Failed to update persona");
    }
  }

  /**
   * Delete a custom persona
   */
  async deleteCustomPersona(personaId: string, userId: string): Promise<void> {
    // Validate UUID
    if (!isValidUUID(userId)) {
      throw new Error("Invalid user ID format. User must be authenticated.");
    }

    try {
      const { error } = await supabaseAdmin
        .from("personas")
        .delete()
        .eq("id", personaId)
        .eq("user_id", userId)
        .eq("is_default", false);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting custom persona:", error);
      throw new Error("Failed to delete persona");
    }
  }

  /**
   * Get persona statistics
   */
  async getPersonaStats(userId?: string): Promise<{
    total: number;
    default: number;
    custom: number;
  }> {
    try {
      const defaultResult = await supabaseAdmin
        .from("personas")
        .select("id", { count: "exact", head: true })
        .eq("is_default", true);

      const customResult = userId && isValidUUID(userId)
        ? await supabaseAdmin
            .from("personas")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_default", false)
        : { count: 0 };

      return {
        total: (defaultResult.count || 0) + (customResult.count || 0),
        default: defaultResult.count || 0,
        custom: customResult.count || 0,
      };
    } catch (error) {
      console.error("Error getting persona stats:", error);
      return { total: 0, default: 0, custom: 0 };
    }
  }

  /**
   * Map database row to PersonaData
   */
  private mapToPersonaData(row: any): PersonaData {
    return {
      id: row.id,
      name: row.name,
      age: row.age,
      occupation: row.occupation,
      condition: row.condition,
      difficulty: row.difficulty,
      description: row.description,
      personality: row.personality,
      background: row.background,
      voiceSettings: row.voice_settings,
      systemPrompt: row.system_prompt,
      fewShotExamples: row.few_shot_examples,
      isDefault: row.is_default,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

