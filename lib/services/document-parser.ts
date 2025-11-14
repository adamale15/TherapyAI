import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export class DocumentParser {
  /**
   * Parse PDF document and extract text
   */
  async parsePDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(
        `Failed to parse PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse Word document and extract text
   */
  async parseWord(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(
        `Failed to parse Word document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse document based on file type
   */
  async parseDocument(filePath: string, fileType: string): Promise<string> {
    const ext = path.extname(fileType).toLowerCase();

    switch (ext) {
      case ".pdf":
        return this.parsePDF(filePath);
      case ".doc":
      case ".docx":
        return this.parseWord(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Clean and preprocess extracted text
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
      .replace(/\s{2,}/g, " ") // Remove excessive spaces
      .trim();
  }

  /**
   * Extract key sections from therapy case document
   */
  extractSections(text: string): {
    demographics?: string;
    presentingConcerns?: string;
    clinicalNotes?: string;
    sessionGoals?: string;
    therapeuticConsiderations?: string;
  } {
    const sections: any = {};

    // Common section headers to look for
    const sectionPatterns = {
      demographics: /(?:demographics?|patient info|client info|background)/i,
      presentingConcerns:
        /(?:presenting concerns?|chief complaint|current issues?|problems?)/i,
      clinicalNotes: /(?:clinical notes?|assessment|observations?|notes?)/i,
      sessionGoals: /(?:goals?|objectives?|treatment goals?|session goals?)/i,
      therapeuticConsiderations:
        /(?:considerations?|recommendations?|therapeutic approach|interventions?)/i,
    };

    const lines = text.split("\n");
    let currentSection = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this line matches a section header
      let matchedSection = "";
      for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(trimmedLine)) {
          // Save previous section if exists
          if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join("\n").trim();
          }

          // Start new section
          currentSection = sectionName;
          currentContent = [];
          matchedSection = sectionName;
          break;
        }
      }

      // If we didn't match a new section header, add content to current section
      if (!matchedSection && currentSection && trimmedLine) {
        currentContent.push(trimmedLine);
      }
    }

    // Save the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
  }

  /**
   * Validate that the document contains therapy-related content
   */
  validateTherapyContent(text: string): {
    isValid: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let confidence = 0;

    // Keywords that suggest therapy/mental health content
    const therapyKeywords = [
      "therapy",
      "therapist",
      "counseling",
      "counselor",
      "psychology",
      "psychologist",
      "mental health",
      "depression",
      "anxiety",
      "ptsd",
      "trauma",
      "stress",
      "session",
      "treatment",
      "intervention",
      "assessment",
      "diagnosis",
      "patient",
      "client",
      "presenting concerns",
      "clinical notes",
    ];

    const textLower = text.toLowerCase();
    const foundKeywords = therapyKeywords.filter((keyword) =>
      textLower.includes(keyword)
    );

    if (foundKeywords.length > 0) {
      confidence += foundKeywords.length * 0.1;
      reasons.push(`Found ${foundKeywords.length} therapy-related keywords`);
    }

    // Check for common therapy document structure
    if (
      textLower.includes("presenting concerns") ||
      textLower.includes("chief complaint")
    ) {
      confidence += 0.2;
      reasons.push("Contains presenting concerns section");
    }

    if (
      textLower.includes("clinical notes") ||
      textLower.includes("assessment")
    ) {
      confidence += 0.2;
      reasons.push("Contains clinical assessment section");
    }

    if (textLower.includes("goals") || textLower.includes("objectives")) {
      confidence += 0.1;
      reasons.push("Contains goals/objectives section");
    }

    // Check minimum length
    if (text.length < 100) {
      confidence -= 0.3;
      reasons.push("Document is too short");
    } else if (text.length > 500) {
      confidence += 0.1;
      reasons.push("Document has sufficient length");
    }

    const isValid = confidence >= 0.3;

    if (!isValid) {
      reasons.push(
        "Document does not appear to contain therapy case information"
      );
    }

    return {
      isValid,
      confidence: Math.max(0, Math.min(1, confidence)),
      reasons,
    };
  }
}
