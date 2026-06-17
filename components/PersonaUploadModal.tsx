"use client";

import React, { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  X,
} from "lucide-react";

interface PersonaData {
  id: string;
  name: string;
  age: number;
  occupation: string;
  condition: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
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
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PersonaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (persona: PersonaData) => void;
  userId?: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
}

export const PersonaUploadModal: React.FC<PersonaUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  userId = "default-user",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "processing">(
    "upload"
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setFile(null);
    setPreview(null);
    setValidation(null);
    setStep("upload");
    setError(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generatePreview = async (selectedFile: File) => {
    setStep("preview");
    setUploading(true);

    const formData = new FormData();
    formData.append("personaFile", selectedFile);

    try {
      const response = await fetch("/api/personas/preview", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setPreview(result.preview);
        setValidation(result.validation);
      } else {
        setError(result.error || "Failed to generate preview");
        setStep("upload");
      }
    } catch {
      setError("Failed to generate preview");
      setStep("upload");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please select a PDF or Word document");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    void generatePreview(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStep("processing");
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("personaFile", file);
    formData.append("userId", userId);
    formData.append("fileName", file.name);

    try {
      const response = await fetch("/api/personas/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        onUpload(result.persona);
        onClose();
        resetModal();
      } else {
        setError(result.error || "Upload failed");
        setStep("preview");
      }
    } catch {
      setError("Upload failed");
      setStep("preview");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(17,17,15,0.68)] p-3 sm:p-4">
      <div className="vesh-card max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-[var(--vesh-paper-soft)] p-4 sm:max-h-[90vh] sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="vesh-kicker text-[var(--vesh-muted)]">
              Create custom persona
            </div>
            <h2 className="mt-1 text-[clamp(1.65rem,9vw,2rem)] font-black uppercase leading-none tracking-[0] text-[var(--vesh-black)] sm:text-3xl">
              Import case file
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="vesh-chip"
            disabled={uploading}
            aria-label="Close upload modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "upload" && (
          <div className="space-y-5">
            <div className="grid min-h-40 place-items-center border-2 border-dashed border-[var(--vesh-coral)] bg-[rgba(255,75,53,0.08)] p-4 text-center sm:min-h-44 sm:p-8">
              <FileText className="mx-auto mb-4 h-12 w-12 text-[var(--vesh-coral)]" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="block cursor-pointer text-lg font-black uppercase text-[var(--vesh-black)]"
              >
                {file ? file.name : "Drop clinical notes here"}
              </label>
              <p className="mt-2 text-sm text-[var(--vesh-muted)]">
                PDF, DOC, or DOCX. Vesh extracts concerns, goals, risk notes,
                and session objectives.
              </p>
            </div>

            {error && (
              <div className="vesh-note vesh-note-red flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-5">
            <div className="vesh-note vesh-note-green flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Document analyzed successfully</span>
            </div>

            <div className="vesh-card p-4 sm:p-5">
              <h3 className="mb-4 text-xl font-black uppercase text-[var(--vesh-black)]">
                Persona preview
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[var(--vesh-muted)]">Name:</span>
                  <span className="ml-2 font-bold text-[var(--vesh-black)]">
                    {preview.name}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--vesh-muted)]">Condition:</span>
                  <span className="ml-2 font-bold text-[var(--vesh-black)]">
                    {preview.condition}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--vesh-muted)]">Difficulty:</span>
                  <span className="vesh-chip ml-2">{preview.difficulty}</span>
                </div>
                <div>
                  <span className="text-[var(--vesh-muted)]">Description:</span>
                  <p className="mt-1 text-[var(--vesh-black)]">
                    {preview.description}
                  </p>
                </div>
                {preview.personalityTraits?.length > 0 && (
                  <div>
                    <span className="text-[var(--vesh-muted)]">
                      Personality traits:
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preview.personalityTraits.map(
                        (trait: string, index: number) => (
                          <span key={index} className="vesh-chip">
                            {trait}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {validation && (
              <div className="vesh-card p-4">
                <h4 className="mb-2 text-sm font-black uppercase text-[var(--vesh-black)]">
                  Content validation
                </h4>
                <div className="text-sm text-[var(--vesh-black)]">
                  <div className="mb-2 flex items-center gap-2">
                    <span>Confidence:</span>
                    <div className="h-3 flex-1 border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper)]">
                      <div
                        className="h-full bg-[var(--vesh-green-bright)] transition-all duration-300"
                        style={{ width: `${validation.confidence * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(validation.confidence * 100)}%</span>
                  </div>
                  <ul className="space-y-1">
                    {validation.reasons.map((reason, index) => (
                      <li key={index} className="text-xs">
                        - {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:flex">
              <button
                onClick={() => setStep("upload")}
                className="vesh-button vesh-button-yellow flex-1"
                disabled={uploading}
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !validation?.isValid}
                className="vesh-button flex-1"
              >
                {uploading ? "Processing..." : "Create persona"}
              </button>
            </div>

            {error && (
              <div className="vesh-note vesh-note-red flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[var(--vesh-coral)]" />
            <h3 className="mb-2 text-lg font-black uppercase text-[var(--vesh-black)]">
              Creating persona
            </h3>
            <p className="text-[var(--vesh-muted)]">
              Please wait while we process your document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
