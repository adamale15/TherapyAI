import type { ChatTurn } from "./llm";
import { supabaseAdmin } from "./supabase/client";

export interface SessionData {
  history: ChatTurn[];
  persona: string;
}

class SupabaseSessionStore {
  /**
   * Get or create session
   */
  async getSession(sessionId: string): Promise<SessionData> {
    try {
      const { data, error } = await supabaseAdmin
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        // Create new session
        const newSession: SessionData = { history: [], persona: "sarah" };
        await this.setSession(sessionId, newSession);
        return newSession;
      }

      return {
        history: (data.history as ChatTurn[]) || [],
        persona: data.persona_id || "sarah",
      };
    } catch (error) {
      console.error("Error getting session:", error);
      return { history: [], persona: "sarah" };
    }
  }

  /**
   * Set session data
   */
  async setSession(sessionId: string, data: SessionData): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("chat_sessions")
        .upsert(
          {
            id: sessionId,
            persona_id: data.persona,
            history: data.history,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error setting session:", error);
    }
  }

  /**
   * Update persona for session
   */
  async updatePersona(sessionId: string, persona: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      session.persona = persona;
      await this.setSession(sessionId, session);
    } catch (error) {
      console.error("Error updating persona:", error);
    }
  }

  /**
   * Clear session history
   */
  async clearHistory(sessionId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("chat_sessions")
        .update({ history: [] })
        .eq("id", sessionId);

      if (error) throw error;
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }

  /**
   * Save session history (for completed sessions)
   */
  async saveSessionHistory(
    userId: string,
    personaId: string,
    personaName: string,
    duration: number,
    totalMessages: number,
    scores: { empathy: number; technique: number; management: number; crisis: number },
    messages: any[]
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from("session_history").insert({
        user_id: userId,
        persona_id: personaId,
        persona_name: personaName,
        duration,
        total_messages: totalMessages,
        scores,
        messages,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving session history:", error);
    }
  }
}

export const supabaseSessionStore = new SupabaseSessionStore();

