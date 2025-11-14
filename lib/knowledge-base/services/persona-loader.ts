import fs from "fs";
import path from "path";

export interface PersonaData {
  id: string;
  name: string;
  age: number;
  occupation: string;
  condition: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  personality: {
    traits: string[];
    speakingPatterns: string[];
    emotionalState: string;
    background: string;
  };
  background: {
    demographics: string[];
    presentingConcerns: string[];
    clinicalNotes: string[];
    sessionGoals: string[];
    therapeuticConsiderations: string[];
  };
  voiceSettings: {
    voice: string;
    speed: number;
    pitch: number;
  };
  systemPrompt: string;
  fewShotExamples: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  isDefault?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PersonaLoader {
  private personasDir: string;
  private customPersonasDir: string;

  constructor() {
    this.personasDir = path.join(process.cwd(), "lib", "knowledge-base", "personas");
    this.customPersonasDir = path.join(
      process.cwd(),
      "lib",
      "knowledge-base",
      "custom-personas"
    );

    // Ensure custom personas directory exists
    if (!fs.existsSync(this.customPersonasDir)) {
      fs.mkdirSync(this.customPersonasDir, { recursive: true });
    }
  }

  /**
   * Load all default personas
   */
  async loadDefaultPersonas(): Promise<PersonaData[]> {
    const personas: PersonaData[] = [];

    try {
      const files = fs.readdirSync(this.personasDir);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      for (const file of jsonFiles) {
        const filePath = path.join(this.personasDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const persona = JSON.parse(content) as PersonaData;
        personas.push(persona);
      }
    } catch (error) {
      console.error("Error loading default personas:", error);
    }

    return personas;
  }

  /**
   * Load all custom personas for a specific user
   */
  async loadCustomPersonas(userId: string): Promise<PersonaData[]> {
    const personas: PersonaData[] = [];

    try {
      const userDir = path.join(this.customPersonasDir, userId);

      if (!fs.existsSync(userDir)) {
        return personas;
      }

      const files = fs.readdirSync(userDir);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      for (const file of jsonFiles) {
        const filePath = path.join(userDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const persona = JSON.parse(content) as PersonaData;
        personas.push(persona);
      }
    } catch (error) {
      console.error("Error loading custom personas:", error);
    }

    return personas;
  }

  /**
   * Load all personas (default + custom for user)
   */
  async loadAllPersonas(userId?: string): Promise<PersonaData[]> {
    const defaultPersonas = await this.loadDefaultPersonas();
    const customPersonas = userId ? await this.loadCustomPersonas(userId) : [];

    return [...defaultPersonas, ...customPersonas];
  }

  /**
   * Load a specific persona by ID
   */
  async loadPersona(
    personaId: string,
    userId?: string
  ): Promise<PersonaData | null> {
    // First try default personas
    const defaultPersonas = await this.loadDefaultPersonas();
    const defaultPersona = defaultPersonas.find((p) => p.id === personaId);

    if (defaultPersona) {
      return defaultPersona;
    }

    // Then try custom personas if userId provided
    if (userId) {
      const customPersonas = await this.loadCustomPersonas(userId);
      const customPersona = customPersonas.find((p) => p.id === personaId);

      if (customPersona) {
        return customPersona;
      }
    }

    return null;
  }

  /**
   * Save a custom persona
   */
  async saveCustomPersona(persona: PersonaData, userId: string): Promise<void> {
    const userDir = path.join(this.customPersonasDir, userId);

    // Ensure user directory exists
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const fileName = `${persona.id}.json`;
    const filePath = path.join(userDir, fileName);

    // Add metadata
    const personaWithMetadata = {
      ...persona,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(personaWithMetadata, null, 2));
  }

  /**
   * Update a custom persona
   */
  async updateCustomPersona(
    personaId: string,
    updates: Partial<PersonaData>,
    userId: string
  ): Promise<void> {
    const existingPersona = await this.loadPersona(personaId, userId);

    if (!existingPersona || existingPersona.isDefault) {
      throw new Error("Persona not found or cannot be updated");
    }

    const updatedPersona = {
      ...existingPersona,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveCustomPersona(updatedPersona, userId);
  }

  /**
   * Delete a custom persona
   */
  async deleteCustomPersona(personaId: string, userId: string): Promise<void> {
    const userDir = path.join(this.customPersonasDir, userId);
    const fileName = `${personaId}.json`;
    const filePath = path.join(userDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      throw new Error("Persona not found");
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
    const defaultPersonas = await this.loadDefaultPersonas();
    const customPersonas = userId ? await this.loadCustomPersonas(userId) : [];

    return {
      total: defaultPersonas.length + customPersonas.length,
      default: defaultPersonas.length,
      custom: customPersonas.length,
    };
  }
}
