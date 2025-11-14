import type { ChatTurn } from "./llm";

export interface SessionData {
  history: ChatTurn[];
  persona: string;
}

// In-memory session storage
// In production, use Redis or a database
class SessionStore {
  private sessions = new Map<string, SessionData>();

  getSession(sessionId: string): SessionData {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { history: [], persona: "sarah" });
    }
    return this.sessions.get(sessionId)!;
  }

  setSession(sessionId: string, data: SessionData): void {
    this.sessions.set(sessionId, data);
  }

  updatePersona(sessionId: string, persona: string): void {
    const session = this.getSession(sessionId);
    session.persona = persona;
  }

  clearHistory(sessionId: string): void {
    const session = this.getSession(sessionId);
    session.history = [];
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const sessionStore = new SessionStore();

