"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PersonaLoader {
    constructor() {
        this.personasDir = path_1.default.join(process.cwd(), "knowledge-base", "personas");
        this.customPersonasDir = path_1.default.join(process.cwd(), "knowledge-base", "custom-personas");
        // Ensure custom personas directory exists
        if (!fs_1.default.existsSync(this.customPersonasDir)) {
            fs_1.default.mkdirSync(this.customPersonasDir, { recursive: true });
        }
    }
    /**
     * Load all default personas
     */
    async loadDefaultPersonas() {
        const personas = [];
        try {
            const files = fs_1.default.readdirSync(this.personasDir);
            const jsonFiles = files.filter((file) => file.endsWith(".json"));
            for (const file of jsonFiles) {
                const filePath = path_1.default.join(this.personasDir, file);
                const content = fs_1.default.readFileSync(filePath, "utf-8");
                const persona = JSON.parse(content);
                personas.push(persona);
            }
        }
        catch (error) {
            console.error("Error loading default personas:", error);
        }
        return personas;
    }
    /**
     * Load all custom personas for a specific user
     */
    async loadCustomPersonas(userId) {
        const personas = [];
        try {
            const userDir = path_1.default.join(this.customPersonasDir, userId);
            if (!fs_1.default.existsSync(userDir)) {
                return personas;
            }
            const files = fs_1.default.readdirSync(userDir);
            const jsonFiles = files.filter((file) => file.endsWith(".json"));
            for (const file of jsonFiles) {
                const filePath = path_1.default.join(userDir, file);
                const content = fs_1.default.readFileSync(filePath, "utf-8");
                const persona = JSON.parse(content);
                personas.push(persona);
            }
        }
        catch (error) {
            console.error("Error loading custom personas:", error);
        }
        return personas;
    }
    /**
     * Load all personas (default + custom for user)
     */
    async loadAllPersonas(userId) {
        const defaultPersonas = await this.loadDefaultPersonas();
        const customPersonas = userId ? await this.loadCustomPersonas(userId) : [];
        return [...defaultPersonas, ...customPersonas];
    }
    /**
     * Load a specific persona by ID
     */
    async loadPersona(personaId, userId) {
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
    async saveCustomPersona(persona, userId) {
        const userDir = path_1.default.join(this.customPersonasDir, userId);
        // Ensure user directory exists
        if (!fs_1.default.existsSync(userDir)) {
            fs_1.default.mkdirSync(userDir, { recursive: true });
        }
        const fileName = `${persona.id}.json`;
        const filePath = path_1.default.join(userDir, fileName);
        // Add metadata
        const personaWithMetadata = {
            ...persona,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        fs_1.default.writeFileSync(filePath, JSON.stringify(personaWithMetadata, null, 2));
    }
    /**
     * Update a custom persona
     */
    async updateCustomPersona(personaId, updates, userId) {
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
    async deleteCustomPersona(personaId, userId) {
        const userDir = path_1.default.join(this.customPersonasDir, userId);
        const fileName = `${personaId}.json`;
        const filePath = path_1.default.join(userDir, fileName);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        else {
            throw new Error("Persona not found");
        }
    }
    /**
     * Get persona statistics
     */
    async getPersonaStats(userId) {
        const defaultPersonas = await this.loadDefaultPersonas();
        const customPersonas = userId ? await this.loadCustomPersonas(userId) : [];
        return {
            total: defaultPersonas.length + customPersonas.length,
            default: defaultPersonas.length,
            custom: customPersonas.length,
        };
    }
}
exports.PersonaLoader = PersonaLoader;
