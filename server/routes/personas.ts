import express from "express";
import path from "path";
import fs from "fs";
import { upload, cleanupFile, getFileType } from "../services/file-upload";
import { DocumentParser } from "../services/document-parser";
import { PersonaGenerator } from "../services/persona-generator";
import { PersonaLoader } from "../knowledge-base/services/persona-loader";

const router = express.Router();
const personaLoader = new PersonaLoader();
const documentParser = new DocumentParser();
const personaGenerator = new PersonaGenerator();

// Get all personas (default + custom for user)
router.get("/all/:userId?", async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const personas = await personaLoader.loadAllPersonas(userId);
    res.json({ success: true, personas });
  } catch (error) {
    console.error("Error loading personas:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load personas",
    });
  }
});

// Get default personas only
router.get("/default", async (req: express.Request, res: express.Response) => {
  try {
    const personas = await personaLoader.loadDefaultPersonas();
    res.json({ success: true, personas });
  } catch (error) {
    console.error("Error loading default personas:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load default personas",
    });
  }
});

// Get custom personas for a user
router.get("/custom/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const personas = await personaLoader.loadCustomPersonas(userId);
    res.json({ success: true, personas });
  } catch (error) {
    console.error("Error loading custom personas:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load custom personas",
    });
  }
});

// Get specific persona
router.get("/:personaId/:userId?", async (req: express.Request, res: express.Response) => {
  try {
    const { personaId, userId } = req.params;
    const persona = await personaLoader.loadPersona(personaId, userId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: "Persona not found",
      });
    }

    res.json({ success: true, persona });
  } catch (error) {
    console.error("Error loading persona:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load persona",
    });
  }
});

// Upload and create custom persona
router.post("/upload", upload.single("personaFile"), async (req: express.Request, res: express.Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const { userId, fileName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    uploadedFilePath = file.path;

    // Parse the document
    console.log("Parsing document:", file.originalname);
    const documentText = await documentParser.parseDocument(
      file.path,
      file.originalname
    );
    const cleanedText = documentParser.cleanText(documentText);

    // Validate that it's therapy-related content
    const validation = documentParser.validateTherapyContent(cleanedText);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Document does not appear to contain therapy case information",
        validation: validation,
      });
    }

    // Generate persona from document
    console.log("Generating persona from document...");
    const personaData = await personaGenerator.generatePersonaFromDocument(
      cleanedText,
      userId,
      fileName || file.originalname
    );

    // Save the persona
    console.log("Saving persona:", personaData.name);
    await personaLoader.saveCustomPersona(personaData, userId);

    res.json({
      success: true,
      persona: personaData,
      validation: validation,
    });
  } catch (error) {
    console.error("Error creating persona:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create persona",
    });
  } finally {
    // Clean up uploaded file
    if (uploadedFilePath) {
      cleanupFile(uploadedFilePath);
    }
  }
});

// Generate preview without saving
router.post("/preview", upload.single("personaFile"), async (req: express.Request, res: express.Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    uploadedFilePath = file.path;

    // Parse the document
    console.log("Parsing document:", file.originalname, "Type:", file.mimetype);
    const documentText = await documentParser.parseDocument(
      file.path,
      file.originalname
    );
    console.log("Document text length:", documentText.length);
    const cleanedText = documentParser.cleanText(documentText);
    console.log("Cleaned text length:", cleanedText.length);

    // Validate content
    const validation = documentParser.validateTherapyContent(cleanedText);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Document does not appear to contain therapy case information",
        validation: validation,
      });
    }

    // Generate preview
    console.log("Generating preview for document...");
    const preview = await personaGenerator.generatePersonaPreview(cleanedText);
    console.log("Preview generated successfully:", preview);

    res.json({
      success: true,
      preview,
      validation: validation,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate preview",
    });
  } finally {
    // Clean up uploaded file
    if (uploadedFilePath) {
      cleanupFile(uploadedFilePath);
    }
  }
});

// Update custom persona
router.put("/:personaId/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const { personaId, userId } = req.params;
    const updates = req.body;

    await personaLoader.updateCustomPersona(personaId, updates, userId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating persona:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update persona",
    });
  }
});

// Delete custom persona
router.delete("/:personaId/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const { personaId, userId } = req.params;

    await personaLoader.deleteCustomPersona(personaId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting persona:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete persona",
    });
  }
});

// Get persona statistics
router.get("/stats/:userId?", async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const stats = await personaLoader.getPersonaStats(userId);

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get statistics",
    });
  }
});

export default router;
