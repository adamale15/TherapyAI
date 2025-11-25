"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, User, Calendar, AlertCircle } from "lucide-react";
import { PersonaUploadModal } from "./PersonaUploadModal";

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

interface PersonaManagementProps {
  userId?: string;
  onPersonaSelect?: (persona: PersonaData) => void;
  selectedPersonaId?: string;
}

export const PersonaManagement: React.FC<PersonaManagementProps> = ({
  userId = "default-user",
  onPersonaSelect,
  selectedPersonaId,
}) => {
  const [personas, setPersonas] = useState<PersonaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build API URL helper
  const getApiBaseUrl = () => {
    // In browser, always use relative URLs (Next.js handles this automatically)
    if (typeof window !== "undefined") {
      // Only use env URL if it's explicitly set and valid
      const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
      if (envUrl && envUrl !== "undefined" && envUrl !== "") {
        return envUrl.replace(/\/$/, "");
      }
      // Otherwise, use relative URLs (empty string means relative)
      return "";
    }
    // Server-side: use env URL or empty for relative
    const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (envUrl && envUrl !== "undefined" && envUrl !== "") {
      return envUrl.replace(/\/$/, "");
    }
    return "";
  };

  const buildApiUrl = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const baseUrl = getApiBaseUrl();
    
    // If baseUrl is empty or invalid, use relative URL
    if (!baseUrl || baseUrl === "undefined") {
      return normalizedPath;
    }
    
    return `${baseUrl}${normalizedPath}`;
  };

  useEffect(() => {
    loadPersonas();
  }, [userId]);

  const loadPersonas = async () => {
    // Skip API call if userId is invalid
    if (!userId || userId === "default-user" || userId === "undefined") {
      console.log("PersonaManagement: Using empty personas for default user");
      setPersonas([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = buildApiUrl(`/api/personas/all/${userId}`);
      console.log("PersonaManagement: Loading personas from:", apiUrl);
      
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success && result.personas && Array.isArray(result.personas)) {
        setPersonas(result.personas || []);
      } else {
        // No error message - just use empty array
        console.warn("PersonaManagement: No personas returned from API");
        setPersonas([]);
      }
    } catch (error: any) {
      // Silently handle errors - don't show error message
      if (error?.name === "AbortError") {
        console.warn("PersonaManagement: Loading timed out");
      } else {
        console.warn("PersonaManagement: Error loading personas:", error?.message || error);
      }
      setPersonas([]);
      // Don't set error state - just show empty state
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaUpload = (newPersona: PersonaData) => {
    setPersonas((prev) => [...prev, newPersona]);
    setShowUploadModal(false);
  };

  const handleDeletePersona = async (personaId: string) => {
    if (!confirm("Are you sure you want to delete this persona?")) return;

    try {
      setDeletingId(personaId);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || ""
        }/api/personas/${personaId}/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== personaId));
      } else {
        setError("Failed to delete persona");
      }
    } catch (error) {
      setError("Failed to delete persona");
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Persona Management</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Custom Persona</span>
        </button>
      </div>

      {error && error !== "Failed to load personas" && (
        <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className={`group relative bg-[#1a1a1a] border rounded-2xl p-5 hover:border-purple-500/50 transition-all duration-300 flex flex-col ${
              selectedPersonaId === persona.id
                ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                : "border-gray-800"
            }`}
          >
            {/* Header */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20">
                <User className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-0.5">
                {persona.name}
              </h3>
              <p className="text-gray-400 text-xs">
                {persona.age}, {persona.occupation}
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Condition:</span>
                <span className="text-xs font-medium text-white px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-700">
                  {persona.condition}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Difficulty:</span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    persona.difficulty === "Beginner"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : persona.difficulty === "Intermediate"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {persona.difficulty}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-xs leading-relaxed mb-6 flex-grow line-clamp-4">
              {persona.description}
            </p>

            {/* Select Button */}
            <button
              onClick={() => onPersonaSelect?.(persona)}
              className="w-full py-2.5 bg-[#6366f1] hover:bg-[#5558e6] text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 mb-4 uppercase tracking-wide"
            >
              Select {persona.name.split(" ")[0]}
            </button>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-auto pt-3 border-t border-gray-800">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(persona.createdAt)}</span>
              </div>
              {persona.isDefault && (
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-medium">
                  Default
                </span>
              )}
            </div>

            {/* Actions (Edit/Delete) - Only for non-default */}
            {!persona.isDefault && (
              <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("Edit functionality coming soon!");
                  }}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePersona(persona.id);
                  }}
                  disabled={deletingId === persona.id}
                  className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {personas.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            No personas found
          </h3>
          <p className="text-gray-500 mb-6">
            Upload a document to create your first custom persona
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upload Document
          </button>
        </div>
      )}

      <PersonaUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handlePersonaUpload}
        userId={userId}
      />
    </div>
  );
};
