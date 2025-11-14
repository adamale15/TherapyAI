import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PersonaData } from "@/lib/knowledge-base/services/persona-loader";

export class PersonaGenerator {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey =
      process.env.GEMINI_API_KEY || "AIzaSyAwtycf6ZId6_hs6wFTNbHQzVVtEQC7ijI";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Extract and clean JSON from AI response
   */
  private extractJSON(text: string): string {
    console.log("Raw AI response:", text);
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0];
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0];
    }

    // Additional cleanup for common issues
    jsonText = jsonText.trim();

    // Find the first { and last } to extract JSON object
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    // Try to fix common JSON issues
    jsonText = jsonText
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    console.log("Extracted JSON:", jsonText);
    console.log("JSON length:", jsonText.length);
    console.log("Starts with {:", jsonText.startsWith("{"));
    console.log("Ends with }:", jsonText.endsWith("}"));

    return jsonText;
  }

  /**
   * Try to fix incomplete JSON by adding missing closing braces
   */
  private fixIncompleteJSON(jsonText: string): string {
    let fixed = jsonText.trim();

    // Count opening and closing braces
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;

    console.log(`Open braces: ${openBraces}, Close braces: ${closeBraces}`);

    // If we have more opening braces than closing braces, add the missing ones
    if (openBraces > closeBraces) {
      const missingBraces = openBraces - closeBraces;
      console.log(`Adding ${missingBraces} missing closing braces`);

      // Add missing closing braces
      for (let i = 0; i < missingBraces; i++) {
        fixed += "}";
      }
    }

    // If the JSON doesn't end with a closing brace, add one
    if (!fixed.endsWith("}")) {
      fixed += "}";
    }

    return fixed;
  }

  /**
   * Create a fallback preview when AI returns malformed JSON
   */
  private createFallbackPreview(documentText: string): {
    name: string;
    condition: string;
    difficulty: string;
    description: string;
    personalityTraits: string[];
    speakingPatterns: string[];
  } {
    console.log(
      "Creating fallback preview from document text:",
      documentText.substring(0, 500)
    );

    // Extract basic information from the raw document text
    const text = documentText.toLowerCase();

    // Try to extract name with better patterns
    let name = "Unknown Patient";
    const namePatterns = [
      // Common PDF therapy document patterns - prioritize "Persona:" pattern
      /persona[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:patient|client|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:name|patient|client)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /•\s*(?:name|patient|client|persona)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:case study|therapy case)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:demographics|background)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      // Look for capitalized names in the first few lines
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m,
      // Look for names after common prefixes
      /(?:mr\.|ms\.|mrs\.|dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      // Simple first last name pattern (more flexible)
      /([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})/,
      // Look for names in quotes
      /"([A-Z][a-z]+\s+[A-Z][a-z]+)"/,
      // Look for names in parentheses
      /\(([A-Z][a-z]+\s+[A-Z][a-z]+)\)/,
    ];

    console.log(
      "Trying to extract name from document text:",
      documentText.substring(0, 500)
    );

    // Special check for "Persona:" pattern
    const personaMatch = documentText.match(
      /persona[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    );
    if (personaMatch) {
      console.log("🎯 Found 'Persona:' pattern:", personaMatch);
    }

    for (let i = 0; i < namePatterns.length; i++) {
      const pattern = namePatterns[i];
      const match = documentText.match(pattern);
      console.log(`Pattern ${i + 1} (${pattern}):`, match);
      if (match && match[1]) {
        name = match[1].trim().split("\n")[0].split(".")[0].split("–")[0];
        console.log("✅ Extracted name:", name);
        break;
      }
    }

    if (name === "Unknown Patient") {
      console.log("❌ No name pattern matched. Available text patterns:");
      console.log("First 10 lines:", documentText.split("\n").slice(0, 10));
      console.log(
        "Looking for any capitalized words:",
        documentText.match(/[A-Z][a-z]+/g)?.slice(0, 10)
      );

      // Try to generate a name based on document content
      const capitalizedWords = documentText.match(/[A-Z][a-z]+/g) || [];
      if (capitalizedWords.length >= 2) {
        // Try to find two capitalized words that could be a name
        for (let i = 0; i < capitalizedWords.length - 1; i++) {
          const word1 = capitalizedWords[i];
          const word2 = capitalizedWords[i + 1];
          // Check if these look like names (not common therapy terms)
          const commonTerms = [
            "THERAPY",
            "PATIENT",
            "CLIENT",
            "CASE",
            "STUDY",
            "SESSION",
            "TREATMENT",
            "DIAGNOSIS",
            "ANXIETY",
            "DEPRESSION",
            "TRAUMA",
            "STRESS",
          ];
          if (
            !commonTerms.includes(word1.toUpperCase()) &&
            !commonTerms.includes(word2.toUpperCase())
          ) {
            name = `${word1} ${word2}`;
            console.log("🔄 Generated name from content:", name);
            break;
          }
        }
      }
    }

    // Try to extract condition with better patterns
    let condition = "Mental Health Condition";
    const conditionPatterns = [
      /presenting concerns[:\s]+([^•\n]+)/i,
      /diagnosis[:\s]+([^•\n]+)/i,
      /condition[:\s]+([^•\n]+)/i,
      /anxiety|depression|ptsd|trauma|panic/i,
    ];

    console.log("Trying to extract condition from text");

    for (const pattern of conditionPatterns) {
      const match = documentText.match(pattern);
      console.log(`Condition pattern ${pattern} matched:`, match);
      if (match && match[1]) {
        condition = match[1].trim().split("\n")[0].split(".")[0];
        console.log("Extracted condition:", condition);
        break;
      }
    }

    // If we found anxiety-related content, be more specific
    if (text.includes("anxiety") || text.includes("panic")) {
      condition = "Anxiety Disorder";
    } else if (text.includes("depression")) {
      condition = "Depression";
    } else if (text.includes("trauma") || text.includes("ptsd")) {
      condition = "PTSD";
    }

    // Determine difficulty based on content complexity
    let difficulty = "Beginner";
    if (
      text.includes("complex") ||
      text.includes("severe") ||
      text.includes("trauma") ||
      text.includes("ptsd") ||
      text.includes("chronic")
    ) {
      difficulty = "Advanced";
    } else if (
      text.includes("moderate") ||
      text.includes("recurrent") ||
      text.includes("ongoing")
    ) {
      difficulty = "Intermediate";
    }

    // Extract age if available
    const ageMatch = documentText.match(/age[:\s]+(\d+)/i);
    const age = ageMatch ? ageMatch[1] : "";

    // Create description from presenting concerns or first meaningful content
    let description = "A therapy case for practice.";

    // Try to find presenting concerns section
    const concernsMatch = documentText.match(
      /presenting concerns[:\s]+([^•\n]+)/i
    );
    console.log("Looking for presenting concerns:", concernsMatch);

    if (concernsMatch) {
      description = concernsMatch[1].trim().split("\n")[0];
      console.log(
        "Extracted description from presenting concerns:",
        description
      );
    } else {
      // Fallback to first meaningful sentence
      const sentences = documentText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20 && !s.includes("TherapyAI"));
      if (sentences.length > 0) {
        description = sentences[0].trim() + ".";
        console.log("Extracted description from first sentence:", description);
      }
    }

    // Extract personality traits from content
    const personalityTraits = [];
    if (text.includes("anxious") || text.includes("anxiety"))
      personalityTraits.push("anxious");
    if (text.includes("perfectionist") || text.includes("perfectionism"))
      personalityTraits.push("perfectionist");
    if (text.includes("overwhelmed") || text.includes("overwhelm"))
      personalityTraits.push("overwhelmed");
    if (text.includes("nervous") || text.includes("nervousness"))
      personalityTraits.push("nervous");
    if (text.includes("vulnerable") || text.includes("vulnerability"))
      personalityTraits.push("vulnerable");
    if (text.includes("seeking help") || text.includes("help"))
      personalityTraits.push("seeking help");

    // Default traits if none found
    if (personalityTraits.length === 0) {
      personalityTraits.push("anxious", "seeking help", "vulnerable");
    }

    // Extract speaking patterns from content
    const speakingPatterns = [];
    if (
      text.includes("catastrophic thinking") ||
      text.includes("catastrophic")
    ) {
      speakingPatterns.push("catastrophic thinking");
    }
    if (text.includes("intellectualize") || text.includes("intellectual")) {
      speakingPatterns.push("intellectualizes emotions");
    }
    if (text.includes("minimize") || text.includes("minimizing")) {
      speakingPatterns.push("minimizes problems");
    }
    if (text.includes("perfectionist") || text.includes("perfectionism")) {
      speakingPatterns.push("perfectionist tendencies");
    }

    // Default patterns if none found
    if (speakingPatterns.length === 0) {
      speakingPatterns.push(
        "natural speech",
        "emotional expression",
        "seeking validation"
      );
    }

    const result = {
      name,
      condition,
      difficulty,
      description,
      personalityTraits,
      speakingPatterns,
    };

    console.log("Fallback preview created:", result);
    return result;
  }

  /**
   * Generate a persona from document text
   */
  async generatePersonaFromDocument(
    documentText: string,
    userId: string,
    fileName?: string
  ): Promise<PersonaData> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Analyze this therapy case document and create a structured persona for AI therapy training.
    
    Document content:
    ${documentText}
    
    Please extract and structure the following information:
    1. Basic Info: Name, age, occupation, condition, difficulty level (Beginner/Intermediate/Advanced)
    2. Personality: Key traits, speaking patterns, emotional state, background
    3. Background: Demographics, presenting concerns, clinical notes, session goals, therapeutic considerations
    4. Voice Settings: Appropriate voice characteristics for this persona
    5. System Prompt: A detailed prompt for the AI to roleplay as this persona
    6. Few-shot Examples: Example conversations to guide the AI's responses
    
    NAME EXTRACTION PRIORITY:
    - Look for "Name:", "Patient:", "Client:", "Case Study:", or similar labels
    - Look for capitalized first and last names (e.g., "John Smith", "Maria Garcia")
    - Look for names in the first few lines of the document
    - Look for names after "Mr.", "Ms.", "Mrs.", "Dr." prefixes
    - If no clear name is found, generate a realistic first and last name based on the case details
    
    IMPORTANT GUIDELINES:
    - The persona should be a PATIENT seeking therapy, NOT a therapist
    - Make the speaking patterns natural and human-like
    - Include realistic emotional responses and speech patterns
    - Ensure the difficulty level matches the complexity of the case
    - Create authentic, vulnerable responses that a real patient might give
    
    CRITICAL: Return ONLY a valid JSON object, no additional text, explanations, or markdown formatting.
    
    Return the data in this EXACT JSON format:
    {
      "id": "custom-${userId}-${Date.now()}",
      "name": "Extracted or Generated Name",
      "age": 25,
      "occupation": "Job Title",
      "condition": "Mental Health Condition",
      "difficulty": "Beginner|Intermediate|Advanced",
      "description": "Brief 1-2 sentence description of this persona",
      "personality": {
        "traits": ["trait1", "trait2", "trait3"],
        "speakingPatterns": [
          "Natural speech pattern 1",
          "Natural speech pattern 2",
          "Natural speech pattern 3"
        ],
        "emotionalState": "current emotional state",
        "background": "brief background context"
      },
      "background": {
        "demographics": ["demographic info 1", "demographic info 2"],
        "presentingConcerns": ["concern 1", "concern 2", "concern 3"],
        "clinicalNotes": ["clinical note 1", "clinical note 2"],
        "sessionGoals": ["goal 1", "goal 2", "goal 3"],
        "therapeuticConsiderations": ["consideration 1", "consideration 2"]
      },
      "voiceSettings": {
        "voice": "appropriate voice name",
        "speed": 1.0,
        "pitch": 1.0
      },
      "systemPrompt": "Detailed system prompt for roleplaying as this persona. Include personality traits, speaking patterns, emotional state, and background. Make it natural and human-like.",
      "fewShotExamples": [
        {
          "role": "user",
          "content": "Hello, how are you feeling today?"
        },
        {
          "role": "assistant",
          "content": "Natural response that this persona would give, showing their personality and speaking patterns"
        }
      ]
    }
    `;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });

      const response = await result.response;
      const responseText = response.text().trim();

      // Clean up the response to extract JSON
      const jsonText = this.extractJSON(responseText);
      console.log("Extracted JSON text:", jsonText);

      // Parse the JSON with better error handling
      let personaData: PersonaData;
      try {
        personaData = JSON.parse(jsonText) as PersonaData;
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw response:", responseText);
        console.error("Cleaned JSON:", jsonText);

        // Try to fix incomplete JSON by adding missing closing braces
        try {
          const fixedJson = this.fixIncompleteJSON(jsonText);
          console.log("Trying to fix incomplete JSON:", fixedJson);
          personaData = JSON.parse(fixedJson) as PersonaData;
        } catch (fixError) {
          console.error("Failed to fix JSON:", fixError);
          throw new Error(
            `Invalid JSON response from AI: ${
              parseError instanceof Error
                ? parseError.message
                : "Unknown parse error"
            }`
          );
        }
      }

      // Validate required fields
      this.validatePersonaData(personaData);

      // Add metadata
      personaData.isDefault = false;

      return personaData;
    } catch (error) {
      console.error("Error generating persona:", error);
      throw new Error(
        `Failed to generate persona: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate that the generated persona data has all required fields
   */
  private validatePersonaData(persona: any): void {
    const requiredFields = [
      "id",
      "name",
      "age",
      "occupation",
      "condition",
      "difficulty",
      "description",
      "personality",
      "background",
      "voiceSettings",
      "systemPrompt",
      "fewShotExamples",
    ];

    for (const field of requiredFields) {
      if (!persona[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate difficulty level
    if (
      !["Beginner", "Intermediate", "Advanced"].includes(persona.difficulty)
    ) {
      throw new Error("Invalid difficulty level");
    }

    // Validate personality structure
    if (
      !persona.personality.traits ||
      !Array.isArray(persona.personality.traits)
    ) {
      throw new Error("Invalid personality traits");
    }

    // Validate background structure
    const backgroundFields = [
      "demographics",
      "presentingConcerns",
      "clinicalNotes",
      "sessionGoals",
      "therapeuticConsiderations",
    ];
    for (const field of backgroundFields) {
      if (
        !persona.background[field] ||
        !Array.isArray(persona.background[field])
      ) {
        throw new Error(`Invalid background.${field}`);
      }
    }

    // Validate few-shot examples
    if (
      !Array.isArray(persona.fewShotExamples) ||
      persona.fewShotExamples.length === 0
    ) {
      throw new Error("Invalid few-shot examples");
    }

    for (const example of persona.fewShotExamples) {
      if (!example.role || !example.content) {
        throw new Error("Invalid few-shot example structure");
      }
    }
  }

  /**
   * Generate a preview of the persona without saving
   */
  async generatePersonaPreview(documentText: string): Promise<{
    name: string;
    condition: string;
    difficulty: string;
    description: string;
    personalityTraits: string[];
    speakingPatterns: string[];
  }> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Extract key information from this therapy case document and return ONLY valid JSON.

Document: ${documentText}

Extract:
- Name: Look for "Name:", "Patient:", "Client:", "Persona:", or capitalized first and last names
- Condition: Look for "Presenting Concerns:" or anxiety/panic/depression keywords
- Difficulty: Beginner (simple cases), Intermediate (moderate complexity), Advanced (complex/severe)
- Description: First sentence from "Presenting Concerns" or main issue
- Personality Traits: Extract from content (anxious, perfectionist, overwhelmed, etc.)
- Speaking Patterns: Extract from content (catastrophic thinking, intellectualizes, etc.)

IMPORTANT: Look specifically for patterns like:
- "Persona: [Name]"
- "Name: [Name]"
- "Patient: [Name]"
- "Client: [Name]"
- Any capitalized first and last name combination

Return ONLY this JSON (no other text):
{
  "name": "extracted name",
  "condition": "specific condition",
  "difficulty": "Beginner/Intermediate/Advanced",
  "description": "brief description",
  "personalityTraits": ["trait1", "trait2", "trait3"],
  "speakingPatterns": ["pattern1", "pattern2", "pattern3"]
}`;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 400,
        },
      });

      const response = await result.response;
      const responseText = response.text().trim();

      // Clean up JSON
      const jsonText = this.extractJSON(responseText);
      console.log("Preview JSON text:", jsonText);

      // Parse JSON with better error handling
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Preview JSON Parse Error:", parseError);
        console.error("Raw response:", responseText);
        console.error("Cleaned JSON:", jsonText);

        // Try to create a fallback preview if JSON is completely malformed
        try {
          const fallbackPreview = this.createFallbackPreview(documentText);
          console.log("Using fallback preview:", fallbackPreview);
          return fallbackPreview;
        } catch (fallbackError) {
          console.error("Fallback preview creation failed:", fallbackError);
          throw new Error(
            `Invalid JSON response from AI for preview: ${
              parseError instanceof Error
                ? parseError.message
                : "Unknown parse error"
            }`
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to generate preview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
