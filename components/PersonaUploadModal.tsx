"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError(null);
        generatePreview(selectedFile);
      } else {
        setError("Please select a PDF or Word document");
        setFile(null);
      }
    }
  };

  const generatePreview = async (file: File) => {
    setStep("preview");
    setUploading(true);

    const formData = new FormData();
    formData.append("personaFile", file);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || ""
        }/api/personas/preview`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setPreview(result.preview);
        setValidation(result.validation);
      } else {
        setError(result.error || "Failed to generate preview");
        setStep("upload");
      }
    } catch (error) {
      setError("Failed to generate preview");
      setStep("upload");
    } finally {
      setUploading(false);
    }
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
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || ""
        }/api/personas/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        onUpload(result.persona);
        onClose();
        resetModal();
      } else {
        setError(result.error || "Upload failed");
        setStep("preview");
      }
    } catch (error) {
      setError("Upload failed");
      setStep("preview");
    } finally {
      setUploading(false);
    }
  };

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

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Upload Custom Persona
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                className="cursor-pointer text-gray-300 hover:text-white transition-colors block"
              >
                {file ? file.name : "Click to select PDF or Word document"}
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Document analyzed successfully</span>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Persona Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white ml-2">{preview.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Condition:</span>
                  <span className="text-white ml-2">{preview.condition}</span>
                </div>
                <div>
                  <span className="text-gray-400">Difficulty:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      preview.difficulty === "Beginner"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : preview.difficulty === "Intermediate"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {preview.difficulty}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Description:</span>
                  <p className="text-white mt-1">{preview.description}</p>
                </div>
                <div>
                  <span className="text-gray-400">Personality Traits:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {preview.personalityTraits?.map(
                      (trait: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs"
                        >
                          {trait}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {validation && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Content Validation
                </h4>
                <div className="text-sm text-gray-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <span>Confidence:</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${validation.confidence * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(validation.confidence * 100)}%</span>
                  </div>
                  <ul className="space-y-1">
                    {validation.reasons.map((reason, index) => (
                      <li key={index} className="text-xs">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={uploading}
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !validation?.isValid}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "Processing..." : "Create Persona"}
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Creating Persona
            </h3>
            <p className="text-gray-400">
              Please wait while we process your document...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
