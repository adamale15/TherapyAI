"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser, useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  Play,
  Users,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Heart,
  Brain,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  GraduationCap,
  Wifi,
  WifiOff,
  ArrowRight,
  ArrowLeft,
  User,
  Calendar,
  Target,
  Shield,
  BookOpen,
  Headphones,
  Settings,
  Send,
  RotateCcw,
  Pause,
  PlayCircle,
  TrendingUp,
  MessageSquare,
  X,
  Plus,
  Upload,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  PanelRight,
} from "lucide-react";
import { elevenLabsService } from "@/lib/services/elevenlabs-service";
import { PersonaUploadModal } from "./PersonaUploadModal";
import { PersonaManagement } from "./PersonaManagement";
import { StudentDashboard } from "./StudentDashboard";
import { PractitionerDashboard } from "./PractitionerDashboard";
import { convexFunctions } from "@/lib/convex/functions";

// Types
interface StickyNote {
  id: string;
  content: string;
  timestamp: number;
  sessionTime: number; // Time in session when note was created
  color: string;
}

interface SessionNote {
  content: string;
  sessionTime: string;
  timestamp: string;
}

interface Persona {
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
}

interface Message {
  id: string;
  sender: "student" | "persona";
  text: string;
  timestamp: number;
  emotionalTone?: string;
  isTyping?: boolean;
}

interface Feedback {
  id: string;
  type: "positive" | "suggestion" | "warning";
  message: string;
  icon: string;
  timestamp: number;
}

interface SessionData {
  startTime: number | null;
  duration: number;
  messages: Message[];
  scores: {
    empathy: number;
    technique: number;
    management: number;
    crisis: number;
  };
  conversationStage: number;
  emotionalState: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Personas data
const personas: Persona[] = [
  {
    id: "sarah",
    name: "Sarah Chen",
    age: 22,
    occupation: "College Senior",
    condition: "Gen. Anxiety",
    difficulty: "Beginner",
    description:
      "A 22-year-old college student experiencing generalized anxiety disorder. Perfect for practicing first-session skills like building rapport and initial assessment.",
    background: {
      demographics: [
        "Name: Sarah Chen",
        "Age: 22",
        "Status: College Senior, Pre-med track",
        "Referral: Self-referred after roommate's suggestion",
      ],
      presentingConcerns: [
        "Panic attacks during MCAT prep",
        "Catastrophic thinking about future",
        "Physical symptoms: racing heart, shortness of breath",
        "Sleep disruption due to worry",
      ],
      clinicalNotes: [
        "No prior therapy experience",
        "High achiever with perfectionist tendencies",
        "Strong family pressure for medical school admission",
        "Symptoms worsened significantly in past 6 months",
      ],
      sessionGoals: [
        "Build therapeutic rapport",
        "Assess anxiety symptoms and triggers",
        "Introduce concept of therapy process",
        "Validate her experience",
      ],
      therapeuticConsiderations: [
        "May be skeptical of therapy effectiveness",
        "Likely to intellectualize emotions",
        'Could minimize problems or rush for "quick fixes"',
        "Watch for: perfectionism, catastrophic thinking patterns",
      ],
    },
    voiceSettings: {
      voice: "verse",
      speed: 0.9,
      pitch: 1.1,
    },
  },
  {
    id: "marcus",
    name: "Marcus Williams",
    age: 35,
    occupation: "Software Engineer",
    condition: "Depression",
    difficulty: "Intermediate",
    description:
      "A 35-year-old software engineer dealing with depression. Good for practicing intermediate therapeutic techniques and managing resistance.",
    background: {
      demographics: [
        "Name: Marcus Williams",
        "Age: 35",
        "Status: Software Engineer, Remote worker",
        "Referral: Employee Assistance Program",
      ],
      presentingConcerns: [
        "Persistent low mood for 8 months",
        "Loss of interest in hobbies",
        "Difficulty concentrating at work",
        "Social withdrawal from friends",
      ],
      clinicalNotes: [
        "Previous therapy experience (2 years ago)",
        "High-functioning depression",
        "Work stress and isolation factors",
        "Some insight into patterns",
      ],
      sessionGoals: [
        "Explore depression triggers",
        "Address work-life balance",
        "Develop coping strategies",
        "Re-engage with support systems",
      ],
      therapeuticConsiderations: [
        "May be resistant to medication discussion",
        "Tech-savvy, might prefer digital tools",
        "Could benefit from behavioral activation",
        "Watch for: all-or-nothing thinking, self-criticism",
      ],
    },
    voiceSettings: {
      voice: "alloy",
      speed: 1.0,
      pitch: 0.9,
    },
  },
  {
    id: "elena",
    name: "Elena Rodriguez",
    age: 28,
    occupation: "Single Mother",
    condition: "PTSD",
    difficulty: "Advanced",
    description:
      "A 28-year-old single mother with PTSD. Advanced case for practicing trauma-informed care and crisis management.",
    background: {
      demographics: [
        "Name: Elena Rodriguez",
        "Age: 28",
        "Status: Single mother, Part-time student",
        "Referral: Court-mandated after incident",
      ],
      presentingConcerns: [
        "Flashbacks and nightmares",
        "Hypervigilance and startle response",
        "Avoidance of trauma reminders",
        "Difficulty trusting others",
      ],
      clinicalNotes: [
        "Trauma occurred 18 months ago",
        "Previous therapy terminated early",
        "Complex trauma history",
        "Strong protective instincts for children",
      ],
      sessionGoals: [
        "Establish safety and trust",
        "Process trauma in controlled manner",
        "Develop grounding techniques",
        "Address parenting concerns",
      ],
      therapeuticConsiderations: [
        "High risk for dissociation",
        "May test boundaries initially",
        "Requires trauma-informed approach",
        "Watch for: retraumatization, crisis escalation",
      ],
    },
    voiceSettings: {
      voice: "nova",
      speed: 0.8,
      pitch: 1.0,
    },
  },
];

const featureTabs = {
  create: {
    label: "Create Session",
    statsTitle: "Total Sessions",
    statsValue: "500+",
    statsSubtitle: "Simulated sessions completed this month",
    description:
      "Practice therapeutic conversations with AI-driven personas and get instant coaching on your delivery.",
    bulletPoints: [
      "Instant session setup with guided prompts",
      "Live rapport + technique scoring",
      "Auto summaries ready for supervision",
    ],
    gradient: "from-[#6366f1] to-[#8b5cf6]",
  },
  optimize: {
    label: "Content Optimization",
    statsTitle: "Avg. Rapport Score",
    statsValue: "92%",
    statsSubtitle: "Based on the last 50 student sessions",
    description:
      "Refine transcripts, notes, and lesson plans with AI-assisted edits that highlight empathy and clarity.",
    bulletPoints: [
      "Suggests evidence-based phrasing",
      "Highlights blind spots in reflections",
      "Exports polished notes for portfolios",
    ],
    gradient: "from-[#f97316] to-[#f43f5e]",
  },
  distribute: {
    label: "Distribute",
    statsTitle: "Resources Shared",
    statsValue: "1.2K",
    statsSubtitle: "Handouts sent across training cohorts",
    description:
      "Share curated skill-builders, crisis playbooks, and client worksheets straight from your dashboard.",
    bulletPoints: [
      "One-click sharing to cohorts",
      "Version control for faculty edits",
      "Track engagement + completion",
    ],
    gradient: "from-[#06b6d4] to-[#3b82f6]",
  },
} as const;

type FeatureTabKey = keyof typeof featureTabs;

// Main component
const VeshApp: React.FC = () => {
  // Clerk authentication
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const clerk = useClerk();
  const router = useRouter();

  // Debug: Log user metadata changes
  useEffect(() => {
    if (user && isLoaded) {
      console.log("User metadata:", {
        userType: user.publicMetadata?.userType,
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [user?.publicMetadata?.userType, user?.id, isLoaded]);

  // State management
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sessionData, setSessionData] = useState<SessionData>({
    startTime: null,
    duration: 0,
    messages: [],
    scores: { empathy: 0, technique: 0, management: 0, crisis: 0 },
    conversationStage: 1,
    emotionalState: "neutral",
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback[]>([]);
  const [rapportLevel, setRapportLevel] = useState(3);
  const [textInput, setTextInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionLength, setSelectedSessionLength] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [rapportChange, setRapportChange] = useState<number | null>(null);
  const [showLearnMore, setShowLearnMore] = useState<boolean>(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
interface SessionSummary {
  persona: string;
  duration: number;
  totalMessages: number;
  studentMessages: number;
  personaMessages: number;
  avgRapport: string;
  engagementScore: number;
  feedback: {
    positive: number;
    suggestions: number;
    errors: number;
    total: number;
  };
  stickyNotes: {
    content: string;
    sessionTime: string;
    timestamp: string;
  }[];
  timestamp: string;
}

  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [emotionalState, setEmotionalState] = useState("anxious");
  const [engagementLevel, setEngagementLevel] = useState(2);
  const [sessionPhase, setSessionPhase] = useState("opening");
  const [activeFeatureTab, setActiveFeatureTab] =
    useState<FeatureTabKey>("create");

  // Persona management state
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [showPersonaManagement, setShowPersonaManagement] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Get userId from Clerk user
  const userId = user?.id || "default-user";
  const convexPersonas = useQuery(convexFunctions.personas.listForUser, {
    ownerClerkId: user?.id,
  });

  // Sticky notes state
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showStickyNotes, setShowStickyNotes] = useState(false);

  // User type dropdown state
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
  // Derived from Clerk
  const isSignedIn = !!user && isLoaded;
  const currentUser = user
    ? {
        type:
          (user.publicMetadata?.userType as "student" | "practitioner") ||
          "student",
        email: user.primaryEmailAddress?.emailAddress || "",
        loginTime: user.lastSignInAt?.getTime() || Date.now(),
        userId: user.id,
      }
    : null;

  const activeFeature = featureTabs[activeFeatureTab];

  const requireAuthForStep = (targetStep: Step) => {
    if (targetStep !== 1 && !isSignedIn) {
      // Redirect to Clerk sign-in page
      router.push("/sign-in");
      return false;
    }
    return true;
  };

  const goToStep = (targetStep: Step) => {
    if (!requireAuthForStep(targetStep)) return;
    setCurrentStep(targetStep);
  };

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserTypeDropdown(false);
      }
    };

    if (showUserTypeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserTypeDropdown]);

  // Handle user type selection after sign-in and refresh metadata
  useEffect(() => {
    if (user && isLoaded) {
      // Check if we're coming from the set-user-type redirect
      const urlParams = new URLSearchParams(window.location.search);
      const userTypeSet = urlParams.get("userTypeSet");

      if (userTypeSet === "true") {
        // Reload user to get updated metadata
        user
          .reload()
          .then(() => {
            // Remove the query parameter
            window.history.replaceState({}, "", window.location.pathname);
          })
          .catch((err) => {
            console.error("Error reloading user after userType set:", err);
          });
      }

      // If user doesn't have a userType set, they need to select one
      if (!user.publicMetadata?.userType) {
        // This will be handled by the UI - user can select from dropdown
      }
    }
  }, [user, isLoaded]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        console.log("Loading voices...");
        const voices = speechSynthesis.getVoices();
        console.log("Initial voices count:", voices.length);

        if (voices.length > 0) {
          setAvailableVoices(voices);
          console.log(
            "Voices loaded immediately:",
            voices.map((v) => v.name)
          );
        } else {
          console.log("No voices found, trying multiple approaches...");

          // Try multiple approaches to load voices
          const tryLoadVoices = () => {
            const loadedVoices = speechSynthesis.getVoices();
            if (loadedVoices.length > 0) {
              setAvailableVoices(loadedVoices);
              console.log(
                "Voices loaded:",
                loadedVoices.map((v) => v.name)
              );
              return true;
            }
            return false;
          };

          // Try immediately
          if (tryLoadVoices()) return;

          // Try after a short delay
          setTimeout(() => {
            if (tryLoadVoices()) return;

            // Try triggering voice loading
            const utterance = new SpeechSynthesisUtterance("");
            utterance.volume = 0;
            speechSynthesis.speak(utterance);
            speechSynthesis.cancel();

            // Try again after triggering
            setTimeout(() => {
              if (tryLoadVoices()) return;

              // Last resort - wait for voiceschanged event
              const handleVoicesChanged = () => {
                const loadedVoices = speechSynthesis.getVoices();
                console.log(
                  "Voices changed event fired, count:",
                  loadedVoices.length
                );
                setAvailableVoices(loadedVoices);
                console.log(
                  "Voices loaded after event:",
                  loadedVoices.map((v) => v.name)
                );
              };

              speechSynthesis.addEventListener(
                "voiceschanged",
                handleVoicesChanged,
                { once: true }
              );
            }, 200);
          }, 100);
        }
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(loadVoices, 100);

    return () => clearTimeout(timer);
  }, []);

  // Load personas from Convex with bundled defaults as a first-run fallback.
  useEffect(() => {
    const nextPersonas =
      convexPersonas && convexPersonas.length > 0 ? convexPersonas : personas;

    setAllPersonas(nextPersonas as Persona[]);
    if (!selectedPersona && nextPersonas.length > 0) {
      setSelectedPersona(nextPersonas[0] as Persona);
    }
  }, [convexPersonas, selectedPersona]);

  const handlePersonaUpload = (newPersona: any) => {
    setAllPersonas((prev) => [...prev, newPersona]);
    setShowUploadModal(false);
    // Optionally select the new persona
    setSelectedPersona(newPersona);
  };

  const handlePersonaSelect = (persona: any) => {
    setSelectedPersona(persona);
    setShowPersonaManagement(false);
    goToStep(3);
  };

  // Server-Sent Events (SSE) connection
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      // Close existing connection if it exists
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      try {
        setConnectionStatus("connecting");
        const streamUrl = buildApiUrl(
          `/api/chat/stream?sessionId=${sessionIdRef.current}`
        );
        console.log("Connecting to SSE:", streamUrl);
        const eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setWsConnected(true);
          setConnectionStatus("connected");
          console.log("SSE connected");
          // Clear any pending reconnection
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Ignore ping messages
            if (data.type === "ping") return;
            handleWebSocketMessage(data);
          } catch (error) {
            console.error("Error parsing SSE message:", error);
          }
        };

        eventSource.onerror = (event) => {
          setConnectionStatus("error");
          // SSE error events don't have useful error info, just log the event type
          console.warn("SSE connection error, attempting to reconnect...");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }

          // Reconnect after a delay
          reconnectTimeout = setTimeout(() => {
            console.log("Attempting to reconnect SSE...");
            connectSSE();
          }, 3000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        setConnectionStatus("error");
        console.error("Failed to connect to SSE:", error);
        // Retry after error
        reconnectTimeout = setTimeout(() => {
          connectSSE();
        }, 3000);
      }
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Timer for session duration and countdown
  useEffect(() => {
    if (sessionData.startTime && currentStep === 5) {
      timerRef.current = setInterval(() => {
        const duration = Math.floor(
          (Date.now() - sessionData.startTime!) / 1000
        );
        setSessionDuration(duration);

        // Calculate time remaining
        const remaining = selectedSessionLength * 60 - duration;
        setTimeRemaining(Math.max(0, remaining));

        // Auto-end session when time is up
        if (remaining <= 0) {
          stopSpeech(); // Stop any ongoing speech

          // Generate and show session summary
          const summary = generateSessionSummary();
          setSessionSummary(summary);
          setShowSessionSummary(true);

          // Don't reset immediately, let user see summary first
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setSessionDuration(0);
      setTimeRemaining(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionData.startTime, currentStep, selectedSessionLength]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log("Speech recognition cleanup completed");
        }
      }
      // Stop any ongoing speech
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Chat message handler (for SSE and HTTP responses)
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "ready":
        console.log("Chat ready");
        break;
      case "persona_say":
        if (data.who === "thera") {
          const aiMessage: Message = {
            id: Date.now().toString(),
            sender: "persona",
            text: data.text,
            timestamp: Date.now(),
            emotionalTone: "empathetic",
          };
          setSessionData((prev) => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
          }));
          speakText(data.text);
        }
        break;
      case "error":
        console.error("Server error:", data.message);
        break;
    }
  };

  // Text-to-speech with ElevenLabs and fallback
  const speakText = async (text: string) => {
    // Stop any current speech
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(true);

    console.log("Speaking text:", text);

    // VOICE MAPPING
    const voiceMap: Record<string, string> = {
      "Sarah Chen": "EXAVITQu4vr4xnSDxMaL", // Bella
      "Marcus Williams": "ErXwobaYiN019PkySvjV", // Antoni
      "Elena Rodriguez": "21m00Tcm4TlvDq8ikWAM", // Rachel
    };

    const voiceId = selectedPersona ? voiceMap[selectedPersona.name] : null;

    // Try ElevenLabs first if we have a voice ID
    if (voiceId) {
      try {
        console.log(`Attempting ElevenLabs TTS for ${selectedPersona?.name} (Voice ID: ${voiceId})`);
        const stream = await elevenLabsService.streamAudio(text, voiceId);
        
        if (stream) {
          await elevenLabsService.playAudio(stream);
          setIsSpeaking(false);
          return;
        } else {
          console.warn("ElevenLabs stream was null, falling back to browser TTS");
        }
      } catch (error) {
        console.error("ElevenLabs TTS failed, falling back to browser TTS:", error);
      }
    }

    // Fallback to Browser TTS
    if ("speechSynthesis" in window) {
      console.log("Using browser TTS fallback");
      
      // Use available voices from state
      if (availableVoices.length === 0) {
        console.log("Voices not loaded yet, waiting...");
        // Trigger voice loading if not already done
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          processVoiceSelection(voices, text);
        } else {
          speechSynthesis.addEventListener(
            "voiceschanged",
            () => {
              const loadedVoices = speechSynthesis.getVoices();
              setAvailableVoices(loadedVoices);
              processVoiceSelection(loadedVoices, text);
            },
            { once: true }
          );
        }
        return;
      }

      processVoiceSelection(availableVoices, text);
    } else {
      setIsSpeaking(false);
    }
  };

  const processVoiceSelection = (
    voices: SpeechSynthesisVoice[],
    text: string
  ) => {
    // Check if speech synthesis is available
    if (!("speechSynthesis" in window)) {
      console.error("Speech synthesis not supported in this browser");
      setIsSpeaking(false);
      return;
    }

    let voiceToUse = null;

    // PRIORITY 1: Use manually selected voice if available
    if (selectedVoice) {
      voiceToUse = voices.find((voice) => voice.name === selectedVoice);
      console.log("Using manually selected voice:", selectedVoice);
    }

    // PRIORITY 2: If no manual selection, use gender-appropriate voice based on persona
    if (!voiceToUse) {
      const isFemalePersona =
        selectedPersona?.name === "Sarah Chen" ||
        selectedPersona?.name === "Elena Rodriguez";

      if (isFemalePersona) {
        // Prefer female voices for female personas
        voiceToUse =
          voices.find(
            (voice) =>
              voice.name.toLowerCase().includes("samantha") ||
              voice.name.toLowerCase().includes("victoria") ||
              voice.name.toLowerCase().includes("susan") ||
              voice.name.toLowerCase().includes("karen") ||
              voice.name.toLowerCase().includes("linda") ||
              voice.name.toLowerCase().includes("julie") ||
              voice.name.toLowerCase().includes("amy") ||
              voice.name.toLowerCase().includes("lisa") ||
              voice.name.toLowerCase().includes("jennifer") ||
              voice.name.toLowerCase().includes("michelle") ||
              voice.name.toLowerCase().includes("female") ||
              voice.name.toLowerCase().includes("woman") ||
              voice.name.toLowerCase().includes("girl")
          ) ||
          voices.find(
            (voice) =>
              voice.name.includes("Google") &&
              voice.name.toLowerCase().includes("female")
          );
        console.log("Using gender-appropriate female voice for persona");
      } else {
        // Prefer male voices for male personas (Marcus)
        voiceToUse =
          voices.find(
            (voice) =>
              voice.name.toLowerCase().includes("alex") ||
              voice.name.toLowerCase().includes("david") ||
              voice.name.toLowerCase().includes("john") ||
              voice.name.toLowerCase().includes("michael") ||
              voice.name.toLowerCase().includes("robert") ||
              voice.name.toLowerCase().includes("james") ||
              voice.name.toLowerCase().includes("william") ||
              voice.name.toLowerCase().includes("richard") ||
              voice.name.toLowerCase().includes("male") ||
              voice.name.toLowerCase().includes("man") ||
              voice.name.toLowerCase().includes("boy")
          ) ||
          voices.find(
            (voice) =>
              voice.name.includes("Google") &&
              voice.name.toLowerCase().includes("male")
          );
        console.log("Using gender-appropriate male voice for persona");
      }
    }

    // PRIORITY 3: Final fallback to general natural voices
    if (!voiceToUse) {
      voiceToUse =
        voices.find(
          (voice) =>
            voice.name.includes("Google") ||
            voice.name.includes("Microsoft") ||
            voice.name.includes("Natural") ||
            voice.name.includes("Enhanced") ||
            voice.name.includes("Samantha") ||
            voice.name.includes("Alex") ||
            voice.name.includes("Victoria")
        ) || voices[0];
      console.log("Using fallback voice");
    }

    console.log("Selected persona:", selectedPersona?.name);
    console.log("Selected voice:", voiceToUse?.name);

    const utterance = new SpeechSynthesisUtterance(text);

    // Human-like speech settings - dynamic based on emotional state
    let baseRate = 1.0;
    let basePitch = 1.0;

    // Adjust speech characteristics based on emotional state
    if (emotionalState === "anxious") {
      baseRate = 1.1; // Slightly faster when anxious
      basePitch = 1.05; // Slightly higher pitch
    } else if (emotionalState === "depressed") {
      baseRate = 0.9; // Slower when depressed
      basePitch = 0.95; // Slightly lower pitch
    } else if (emotionalState === "angry") {
      baseRate = 1.15; // Faster when angry
      basePitch = 1.1; // Higher pitch
    } else if (emotionalState === "calm") {
      baseRate = 0.95; // Slightly slower when calm
      basePitch = 0.98; // Slightly lower pitch
    }

    utterance.rate = baseRate; // Dynamic speaking rate
    utterance.pitch = basePitch; // Dynamic pitch
    utterance.volume = 0.8; // Good volume for clarity
    utterance.voice = voiceToUse;

    // Process text for more natural speech patterns - preserve full text
    let processedText = text
      .replace(/\./g, ". ") // Add space after periods
      .replace(/,/g, ", ") // Add space after commas
      .replace(/\?/g, "? ") // Add space after questions
      .replace(/!/g, "! ") // Add space after exclamations
      .replace(/:/g, ": ") // Add space after colons
      .replace(/;/g, "; ") // Add space after semicolons
      .replace(/\*([^*]+)\*/g, "") // Remove *actions*
      .replace(/\[([^\]]+)\]/g, "") // Remove [actions]
      .replace(/\s+/g, " ") // Clean up multiple spaces
      .trim();

    console.log("Original text length:", text.length);
    console.log("Processed text length:", processedText.length);

    utterance.text = processedText;

    utterance.onstart = () => {
      console.log("Speech started");
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log("Speech ended");
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", {
        type: event?.type || "unknown",
        error: event?.error || "unknown error",
        charIndex: event?.charIndex || 0,
        charLength: event?.charLength || 0,
        elapsedTime: event?.elapsedTime || 0,
        name: event?.name || "SpeechSynthesisError",
        utterance: utterance.text.substring(0, 100) + "...",
        fullEvent: event,
      });
      setIsSpeaking(false);
    };

    console.log("Final text to speak:", utterance.text);
    console.log(
      "Speech settings - Rate:",
      utterance.rate,
      "Pitch:",
      utterance.pitch,
      "Volume:",
      utterance.volume
    );

    // If text is very long, split it into chunks to ensure full speech
    if (processedText.length > 1000) {
      console.log("Text is long, splitting into chunks");
      const chunks = processedText.match(/.{1,1000}(?:\s|$)/g) || [
        processedText,
      ];
      let currentChunk = 0;

      const speakChunk = () => {
        if (currentChunk < chunks.length) {
          const chunkUtterance = new SpeechSynthesisUtterance(
            chunks[currentChunk]
          );
          chunkUtterance.rate = utterance.rate;
          chunkUtterance.pitch = utterance.pitch;
          chunkUtterance.volume = utterance.volume;
          chunkUtterance.voice = utterance.voice;

          chunkUtterance.onend = () => {
            currentChunk++;
            if (currentChunk < chunks.length) {
              setTimeout(speakChunk, 100); // Small delay between chunks
            } else {
              console.log("All chunks spoken");
              setIsSpeaking(false);
            }
          };

          chunkUtterance.onerror = (event) => {
            console.error("Chunk speech error:", {
              type: event?.type || "unknown",
              error: event?.error || "unknown error",
              chunk: currentChunk + 1,
              totalChunks: chunks.length,
              utterance: chunks[currentChunk]?.substring(0, 50) + "...",
              fullEvent: event,
            });
            setIsSpeaking(false);
          };

          console.log(
            `Speaking chunk ${currentChunk + 1}/${chunks.length}:`,
            chunks[currentChunk]
          );
          try {
            speechSynthesis.speak(chunkUtterance);
          } catch (error) {
            console.error("Error speaking chunk:", error);
            setIsSpeaking(false);
          }
        }
      };

      speakChunk();
    } else {
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error speaking utterance:", error);
        setIsSpeaking(false);
      }
    }
  };

  // Stop speech function
  const stopSpeech = () => {
    console.log("Stopping speech...");
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    // Also stop ElevenLabs audio if playing
    elevenLabsService.stop();
    setIsSpeaking(false);
  };

  // Speech recognition functions
  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Speech recognition not supported in this browser. Please use text input."
      );
      return;
    }

    // If already listening, stop it
    if (isListening) {
      stopListening();
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true; // Changed to continuous for click-to-start
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript);

      // Update text input with interim results
      if (interimTranscript) {
        setTextInput(interimTranscript);
      }

      // If we have final results, update the text input
      if (finalTranscript) {
        setTextInput(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      // Handle different types of speech recognition errors
      if (event.error === "aborted") {
        // User manually stopped or interrupted - this is normal, don't log as error
        console.log("Speech recognition stopped by user");
      } else if (event.error === "no-speech") {
        console.log("No speech detected, please try again");
      } else if (event.error === "audio-capture") {
        console.error("Microphone not accessible, please check permissions");
      } else if (event.error === "not-allowed") {
        console.error(
          "Microphone permission denied, please allow microphone access"
        );
      } else {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
      setCurrentTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("Speech recognition already stopped");
      }
      setIsListening(false);
      setCurrentTranscript("");
    }
  };

  // Test AI voice
  const testAIVoice = () => {
    const testText =
      "Hello there. I'm here to help you practice your therapeutic skills in a safe, supportive environment. Take your time, and remember, this is a space where you can learn and grow.";

    console.log("Testing voice with selectedVoice:", selectedVoice);
    speakText(testText);
  };

  // Send message
  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    // Stop listening when sending message
    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "student",
      text: text.trim(),
      timestamp: Date.now(),
      emotionalTone: "neutral",
    };

    setSessionData((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    // Generate immediate feedback for user message
    generateUserFeedback(text.trim());

    // Send message via HTTP POST
    fetch(buildApiUrl("/api/chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionIdRef.current,
      },
      body: JSON.stringify({
        type: "text_input",
        text: text.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Handle echo response
        if (data.type === "final_stt") {
          // User message echo (already added to UI)
        }
        // Handle reply
        if (data.reply) {
          // Update dynamic state if available
          if (data.reply.state) {
            const { emotionalState, rapportLevel, engagementLevel, feedback } = data.reply.state;
            
            if (emotionalState) setEmotionalState(emotionalState);
            if (rapportLevel) setRapportLevel(rapportLevel);
            if (engagementLevel) setEngagementLevel(engagementLevel);
            
            // Add AI feedback
            if (feedback && Array.isArray(feedback) && feedback.length > 0) {
              const newFeedbacks: Feedback[] = feedback.map((msg: string, index: number) => ({
                id: `ai-feedback-${Date.now()}-${index}`,
                type: "suggestion",
                message: `Coach: ${msg}`,
                icon: "Lightbulb",
                timestamp: Date.now(),
              }));
              setCurrentFeedback((prev) => [...prev, ...newFeedbacks].slice(-8));
            }
          }

          handleWebSocketMessage(data.reply);
        }
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        setConnectionStatus("error");
        // Fallback to demo mode if API fails
        setTimeout(() => {
          let response = "";

          if (selectedPersona?.id === "sarah") {
            const sarahResponses = [
              "Um... hi. I'm honestly pretty nervous about this whole thing. I've never done therapy before.",
              "I don't know... I'm not really sure why I'm here. My roommate said I should try this.",
              "I've been having these weird episodes where my heart starts racing and I can't breathe.",
              "I keep thinking about failing my MCAT and disappointing my parents. It's all I think about.",
              "I can't sleep anymore. I just lie there worrying about everything.",
              "I feel like I'm going crazy. Is that normal?",
              "I don't know what's wrong with me. I used to be able to handle things.",
              "I'm scared. I don't know what to do.",
              "I keep having these thoughts that I'm not good enough.",
              "I feel like I'm falling apart.",
              "I don't want to be here but I don't know where else to go.",
              "I'm sorry, I'm probably wasting your time.",
              "I don't know how to explain what I'm feeling.",
              "I feel like I'm drowning.",
              "I can't stop worrying about everything.",
              "I feel like I'm failing at everything.",
              "I don't know who I am anymore.",
              "I feel lost.",
              "I'm scared I'm going to mess up my life.",
              "I don't know what to do anymore.",
            ];
            response =
              sarahResponses[Math.floor(Math.random() * sarahResponses.length)];
          } else if (selectedPersona?.id === "marcus") {
            const marcusResponses = [
              "I've been feeling pretty down lately. Work has been overwhelming and I just don't have the energy for anything.",
              "I used to enjoy coding, but now it just feels like a chore. I can't seem to find joy in anything anymore.",
              "I've been isolating myself from friends. I know I should reach out, but I just don't have the motivation.",
              "I had therapy before, a couple years ago. It helped some, but I'm in a different place now.",
              "I work from home mostly, which I thought would be great, but it's actually made me feel more alone.",
              "I keep thinking about what's the point of it all. I'm just going through the motions.",
              "I know I should probably be doing more to help myself, but I feel stuck.",
              "Sometimes I wonder if this is just how life is supposed to be, you know? Just existing.",
              "I wake up every day and just... exist. I go through the motions but I don't feel anything.",
              "I used to have hobbies, things I enjoyed. Now I just sit and stare at my computer screen.",
              "I know I'm depressed, but I don't know how to get out of this hole I'm in.",
            ];
            response =
              marcusResponses[
                Math.floor(Math.random() * marcusResponses.length)
              ];
          } else if (selectedPersona?.id === "elena") {
            const elenaResponses = [
              "I'm here because I have to be. The court said I need to do this, but I'm not sure it's going to help.",
              "I have nightmares almost every night. I wake up sweating and my heart is pounding.",
              "I'm always on edge, waiting for something bad to happen. I can't relax anymore.",
              "I have two kids to take care of, but sometimes I feel like I'm not a good mother.",
              "I don't trust people easily anymore. It's hard for me to open up to anyone.",
              "I keep reliving what happened. It's like I'm stuck in that moment and can't move forward.",
              "I try to be strong for my children, but I'm falling apart inside.",
              "I've tried therapy before, but I left early. I wasn't ready to talk about everything.",
              "I don't want to be here, but I have to be. For my kids.",
              "Every loud noise makes me jump. I can't even watch TV with my children anymore.",
              "I feel like I'm failing them. They need a mother who's not broken.",
            ];
            response =
              elenaResponses[Math.floor(Math.random() * elenaResponses.length)];
          } else {
            // Fallback generic response
            response = "I'm not sure what to say. This is all new to me.";
          }

          const aiMessage: Message = {
            id: Date.now().toString(),
            sender: "persona",
            text: response,
            timestamp: Date.now(),
            emotionalTone: "empathetic",
          };

          setSessionData((prev) => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
          }));

          speakText(response);
          generateRealTimeFeedback(response);
        }, 1500);
      });

    setTextInput("");
  };

  // Generate user feedback based on their message
  const generateUserFeedback = (userMessage: string) => {
    const feedbacks: Feedback[] = [];

    // Analyze user message for therapeutic techniques
    const message = userMessage.toLowerCase();

    // Update emotional state based on conversation
    if (
      message.includes("anxious") ||
      message.includes("worried") ||
      message.includes("scared") ||
      message.includes("nervous")
    ) {
      setEmotionalState("anxious");
    } else if (
      message.includes("sad") ||
      message.includes("depressed") ||
      message.includes("hopeless") ||
      message.includes("down")
    ) {
      setEmotionalState("depressed");
    } else if (
      message.includes("angry") ||
      message.includes("frustrated") ||
      message.includes("mad") ||
      message.includes("upset")
    ) {
      setEmotionalState("angry");
    } else if (
      message.includes("calm") ||
      message.includes("better") ||
      message.includes("relaxed") ||
      message.includes("peaceful")
    ) {
      setEmotionalState("calm");
    }

    // Update session phase based on conversation length
    const messageCount = sessionData.messages.length;
    if (messageCount < 3) {
      setSessionPhase("opening");
    } else if (messageCount < 8) {
      setSessionPhase("exploration");
    } else if (messageCount < 15) {
      setSessionPhase("working");
    } else {
      setSessionPhase("closing");
    }

    // Update engagement level based on message length
    if (userMessage.length > 50) {
      setEngagementLevel(Math.min(5, engagementLevel + 1));
    } else if (userMessage.length < 10) {
      setEngagementLevel(Math.max(1, engagementLevel - 1));
    }

    // Check for empathy indicators
    if (
      message.includes("understand") ||
      message.includes("feel") ||
      message.includes("hear") ||
      message.includes("i can see") ||
      message.includes("that sounds")
    ) {
      feedbacks.push({
        id: Date.now().toString(),
        type: "positive",
        message: "Great: You're showing empathy and validation!",
        icon: "CheckCircle",
        timestamp: Date.now(),
      });
    }

    // Check for open-ended questions
    if (
      message.includes("?") &&
      (message.includes("how") ||
        message.includes("what") ||
        message.includes("tell me") ||
        message.includes("can you describe") ||
        message.includes("what's it like"))
    ) {
      feedbacks.push({
        id: (Date.now() + 1).toString(),
        type: "positive",
        message: "Excellent: Open-ended question encourages deeper sharing.",
        icon: "CheckCircle",
        timestamp: Date.now(),
      });
    }

    // Check for closed questions
    if (
      message.includes("?") &&
      (message.includes("are you") ||
        message.includes("do you") ||
        message.includes("is it") ||
        message.includes("did you") ||
        message.includes("have you"))
    ) {
      feedbacks.push({
        id: (Date.now() + 2).toString(),
        type: "suggestion",
        message:
          "Suggestion: Try open-ended questions like 'How does that feel?' instead of 'Are you okay?'",
        icon: "MessageCircle",
        timestamp: Date.now(),
      });
    }

    // Check for judgmental language
    if (
      message.includes("should") ||
      message.includes("must") ||
      message.includes("need to") ||
      message.includes("you have to")
    ) {
      feedbacks.push({
        id: (Date.now() + 3).toString(),
        type: "suggestion",
        message:
          "Suggestion: Avoid 'should' statements - try 'I wonder if...' or 'What if...'",
        icon: "MessageCircle",
        timestamp: Date.now(),
      });
    }

    // Check for advice giving
    if (
      message.includes("you should") ||
      message.includes("try this") ||
      message.includes("do this") ||
      message.includes("i think you should")
    ) {
      feedbacks.push({
        id: (Date.now() + 4).toString(),
        type: "suggestion",
        message:
          "Suggestion: Instead of giving advice, explore their thoughts: 'What do you think might help?'",
        icon: "MessageCircle",
        timestamp: Date.now(),
      });
    }

    // Check for reflective listening
    if (
      message.includes("it sounds like") ||
      message.includes("i'm hearing") ||
      message.includes("it seems like") ||
      message.includes("what i'm understanding")
    ) {
      feedbacks.push({
        id: (Date.now() + 5).toString(),
        type: "positive",
        message: "Excellent: You're using reflective listening techniques!",
        icon: "CheckCircle",
        timestamp: Date.now(),
      });
    }

    // Check for validation
    if (
      message.includes("that makes sense") ||
      message.includes("i can understand") ||
      message.includes("that's understandable") ||
      message.includes("i see why")
    ) {
      feedbacks.push({
        id: (Date.now() + 6).toString(),
        type: "positive",
        message: "Great: You're validating their experience!",
        icon: "CheckCircle",
        timestamp: Date.now(),
      });
    }

    // Check for premature problem-solving
    if (
      message.includes("have you tried") ||
      message.includes("why don't you") ||
      message.includes("you could") ||
      message.includes("maybe you should")
    ) {
      feedbacks.push({
        id: (Date.now() + 7).toString(),
        type: "suggestion",
        message:
          "Suggestion: Focus on understanding first before problem-solving. Ask 'What's that like for you?'",
        icon: "MessageCircle",
        timestamp: Date.now(),
      });
    }

    // Always add at least one feedback if none generated
    if (feedbacks.length === 0) {
      feedbacks.push({
        id: Date.now().toString(),
        type: "suggestion",
        message: "Tip: Try asking an open-ended question to encourage sharing.",
        icon: "Lightbulb",
        timestamp: Date.now(),
      });
    }

    // Update rapport level based on message quality
    updateRapportLevel(userMessage);

    // Always add feedback to the panel
    setCurrentFeedback((prev) => [...prev, ...feedbacks].slice(-8));
  };

  // Update rapport level based on message quality
  const updateRapportLevel = (message: string) => {
    const msg = message.toLowerCase();
    let rapportChange = 0;

    // Positive indicators (higher impact)
    if (
      msg.includes("understand") ||
      msg.includes("feel") ||
      msg.includes("hear") ||
      msg.includes("i can see") ||
      msg.includes("that sounds")
    ) {
      rapportChange += 0.5;
    }
    if (
      msg.includes("?") &&
      (msg.includes("how") ||
        msg.includes("what") ||
        msg.includes("tell me") ||
        msg.includes("can you describe"))
    ) {
      rapportChange += 0.4;
    }
    if (
      msg.includes("it sounds like") ||
      msg.includes("i'm hearing") ||
      msg.includes("it seems like") ||
      msg.includes("what i'm understanding")
    ) {
      rapportChange += 0.6; // Reflective listening is very good
    }
    if (
      msg.includes("that makes sense") ||
      msg.includes("i can understand") ||
      msg.includes("that's understandable") ||
      msg.includes("i see why")
    ) {
      rapportChange += 0.4; // Validation is good
    }
    if (msg.includes("thank you") || msg.includes("appreciate")) {
      rapportChange += 0.2;
    }

    // Negative indicators (higher impact)
    if (
      msg.includes("should") ||
      msg.includes("must") ||
      msg.includes("need to")
    ) {
      rapportChange -= 0.3;
    }
    if (
      msg.includes("you should") ||
      msg.includes("try this") ||
      msg.includes("do this") ||
      msg.includes("i think you should")
    ) {
      rapportChange -= 0.4; // Advice giving is not good
    }
    if (msg.includes("no") && msg.includes("but")) {
      rapportChange -= 0.2;
    }
    if (
      msg.includes("have you tried") ||
      msg.includes("why don't you") ||
      msg.includes("you could") ||
      msg.includes("maybe you should")
    ) {
      rapportChange -= 0.3; // Premature problem-solving
    }

    // Update rapport level with animation
    setRapportLevel((prev) => {
      const newLevel = Math.max(0, Math.min(10, prev + rapportChange));
      console.log(
        `Rapport level: ${prev.toFixed(1)} → ${newLevel.toFixed(1)} (${
          rapportChange > 0 ? "+" : ""
        }${rapportChange.toFixed(1)})`
      );

      // Show change indicator
      if (rapportChange !== 0) {
        setRapportChange(rapportChange);
        setTimeout(() => setRapportChange(null), 2000);
      }

      return newLevel;
    });
  };

  // Generate real-time feedback
  const generateRealTimeFeedback = (aiResponse: string) => {
    const feedbacks: Feedback[] = [
      {
        id: Date.now().toString(),
        type: "positive",
        message: "Good: Warm, welcoming tone detected.",
        icon: "CheckCircle",
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        type: "suggestion",
        message: "Suggestion: Patient seems nervous - try speaking 10% slower.",
        icon: "MessageCircle",
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 2).toString(),
        type: "suggestion",
        message:
          "Your pace: 145 WPM (Recommended: 120-130 WPM for anxious patients)",
        icon: "Clock",
        timestamp: Date.now(),
      },
    ];

    setCurrentFeedback((prev) => [...prev, ...feedbacks].slice(-5));
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Start session
  const startSession = () => {
    if (!requireAuthForStep(5)) return;
    setSessionData((prev) => ({
      ...prev,
      startTime: Date.now(),
      duration: 0,
    }));
    setSessionDuration(0);
    setTimeRemaining(selectedSessionLength * 60);
    goToStep(5);

    // Send persona to backend
    if (selectedPersona) {
      fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionIdRef.current,
        },
        body: JSON.stringify({
          type: "set_persona",
          persona: selectedPersona.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.type === "info") {
            handleWebSocketMessage(data);
          }
        })
        .catch((error) => {
          console.error("Error setting persona:", error);
        });
    }

    // Add initial feedback
    const initialFeedback: Feedback[] = [
      {
        id: Date.now().toString(),
        type: "suggestion",
        message: "Welcome! Start with a warm greeting and open-ended question.",
        icon: "Lightbulb",
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        type: "suggestion",
        message:
          "Tip: Use reflective listening - 'It sounds like you're feeling...'",
        icon: "MessageCircle",
        timestamp: Date.now(),
      },
    ];
    setCurrentFeedback(initialFeedback);
  };

  // Download conversation as PDF
  const downloadConversationPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241); // Indigo color
      doc.text("Therapy Session Report", 20, 20);
      
      // Session Info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Persona: ${selectedPersona?.name || "Unknown"}`, 20, 36);
      doc.text(`Duration: ${formatTime(sessionDuration)}`, 20, 42);
      
      // Metrics
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 48, 190, 48);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Session Metrics", 20, 58);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Emotional State: ${emotionalState}`, 20, 66);
      doc.text(`Rapport Level: ${rapportLevel}/10`, 80, 66);
      doc.text(`Engagement Level: ${engagementLevel}/5`, 140, 66);
      
      doc.line(20, 72, 190, 72);
      
      // Conversation Log
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Conversation Log", 20, 82);
      
      let yPos = 92;
      const pageHeight = doc.internal.pageSize.height;
      
      sessionData.messages.forEach((msg) => {
        // Check if new page is needed
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        const isStudent = msg.sender === "student";
        const senderName = isStudent ? "Therapist (You)" : selectedPersona?.name || "Patient";
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isStudent ? 99 : 236, isStudent ? 102 : 72, isStudent ? 241 : 153); // Indigo for student, Pink for persona
        doc.text(`${senderName}:`, 20, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        const textLines = doc.splitTextToSize(msg.text, 170);
        doc.text(textLines, 20, yPos + 5);
        
        yPos += 5 + (textLines.length * 5) + 5;
      });
      
      // Save PDF
      doc.save(`therapy-session-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate report. Please try again.");
    }
  };



  // Generate session summary
  const generateSessionSummary = () => {
    const totalMessages = sessionData.messages.length;
    const studentMessages = sessionData.messages.filter(
      (msg) => msg.sender === "student"
    ).length;
    const personaMessages = sessionData.messages.filter(
      (msg) => msg.sender === "persona"
    ).length;
    const sessionDurationMinutes = Math.floor(sessionDuration / 60); // Convert to minutes
    const finalDuration = sessionDurationMinutes || 0;

    // Calculate rapport level based on actual conversation
    const calculateRapportFromConversation = () => {
      if (totalMessages === 0) return 3.0; // Default starting point

      let rapportScore = 3.0; // Start at neutral

      // Analyze student messages for rapport-building techniques
      const studentMessages = sessionData.messages.filter(
        (msg) => msg.sender === "student"
      );

      studentMessages.forEach((msg) => {
        const text = msg.text.toLowerCase();

        // Positive rapport indicators
        if (text.includes("i understand") || text.includes("i hear you"))
          rapportScore += 0.5;
        if (text.includes("that makes sense") || text.includes("i can see"))
          rapportScore += 0.3;
        if (text.includes("thank you") || text.includes("i appreciate"))
          rapportScore += 0.2;
        if (text.includes("how are you") || text.includes("how do you feel"))
          rapportScore += 0.4;
        if (text.includes("tell me more") || text.includes("can you explain"))
          rapportScore += 0.3;
        if (
          text.includes("i'm sorry") ||
          text.includes("that sounds difficult")
        )
          rapportScore += 0.4;

        // Reflective listening indicators
        if (text.includes("it sounds like") || text.includes("i'm hearing"))
          rapportScore += 0.6;
        if (
          text.includes("what i'm understanding") ||
          text.includes("so you're saying")
        )
          rapportScore += 0.5;

        // Validation indicators
        if (
          text.includes("that's understandable") ||
          text.includes("anyone would feel")
        )
          rapportScore += 0.4;
        if (
          text.includes("your feelings are valid") ||
          text.includes("it's okay to feel")
        )
          rapportScore += 0.5;

        // Open-ended questions
        if (
          text.includes("what") ||
          text.includes("how") ||
          text.includes("tell me")
        )
          rapportScore += 0.2;

        // Negative indicators (reduce rapport)
        if (text.includes("you should") || text.includes("you need to"))
          rapportScore -= 0.3;
        if (text.includes("that's wrong") || text.includes("you're wrong"))
          rapportScore -= 0.5;
        if (
          text.includes("just") &&
          (text.includes("stop") || text.includes("get over"))
        )
          rapportScore -= 0.4;
      });

      // Factor in message frequency (more engagement = higher rapport potential)
      const messageFrequency = totalMessages / Math.max(1, finalDuration || 1);
      if (messageFrequency > 2) rapportScore += 0.5; // High engagement
      else if (messageFrequency > 1) rapportScore += 0.2; // Moderate engagement

      // Cap between 1.0 and 10.0
      return Math.max(1.0, Math.min(10.0, rapportScore));
    };

    const avgRapport = calculateRapportFromConversation();

    // Count different types of feedback from actual conversation analysis
    const analyzeConversationForFeedback = () => {
      let positiveCount = 0;
      let suggestionCount = 0;
      let warningCount = 0;

      const studentMessages = sessionData.messages.filter(
        (msg) => msg.sender === "student"
      );

      studentMessages.forEach((msg) => {
        const text = msg.text.toLowerCase();

        // Count positive techniques
        if (text.includes("it sounds like") || text.includes("i'm hearing"))
          positiveCount++;
        if (
          text.includes("that makes sense") ||
          text.includes("i can understand")
        )
          positiveCount++;
        if (text.includes("how are you") || text.includes("how do you feel"))
          positiveCount++;
        if (text.includes("tell me more") || text.includes("can you explain"))
          positiveCount++;
        if (text.includes("i understand") || text.includes("i hear you"))
          positiveCount++;

        // Count suggestions needed
        if (text.includes("you should") || text.includes("you need to"))
          suggestionCount++;
        if (text.includes("try this") || text.includes("do this"))
          suggestionCount++;
        if (text.includes("i think you should")) suggestionCount++;
        if (
          text.includes("just") &&
          (text.includes("stop") || text.includes("get over"))
        )
          suggestionCount++;

        // Count warnings
        if (text.includes("that's wrong") || text.includes("you're wrong"))
          warningCount++;
        if (text.includes("you're being") && text.includes("dramatic"))
          warningCount++;
        if (text.includes("it's not that bad") || text.includes("get over it"))
          warningCount++;
      });

      return { positiveCount, suggestionCount, warningCount };
    };

    const conversationAnalysis = analyzeConversationForFeedback();

    // Use actual feedback counts from conversation analysis
    const positiveFeedback = conversationAnalysis.positiveCount;
    const suggestions = conversationAnalysis.suggestionCount;
    const warnings = conversationAnalysis.warningCount;

    // Use actual session data, with minimal fallbacks only when absolutely necessary
    const finalTotalMessages = totalMessages || 0;
    const finalStudentMessages = studentMessages || 0;
    const finalPersonaMessages = personaMessages || 0;
    const finalRapport = avgRapport || 3.0; // Default to 3.0 if no data
    const finalPositive = positiveFeedback || 0;
    const finalSuggestions = suggestions || 0;
    const finalWarnings = warnings || 0;

    // Calculate engagement score based on actual conversation metrics
    const calculateEngagementScore = () => {
      if (totalMessages === 0) return 0;

      let engagementScore = 0;

      // Base score from message frequency (0-4 points)
      const messageFrequency =
        finalStudentMessages / Math.max(1, finalDuration || 1);
      if (messageFrequency >= 2) engagementScore += 4; // Very high engagement
      else if (messageFrequency >= 1.5) engagementScore += 3; // High engagement
      else if (messageFrequency >= 1)
        engagementScore += 2; // Moderate engagement
      else if (messageFrequency >= 0.5) engagementScore += 1; // Low engagement

      // Rapport factor (0-3 points)
      if (avgRapport >= 8) engagementScore += 3;
      else if (avgRapport >= 6) engagementScore += 2;
      else if (avgRapport >= 4) engagementScore += 1;

      // Conversation depth factor (0-2 points)
      const avgMessageLength =
        finalStudentMessages > 0
          ? sessionData.messages
              .filter((msg) => msg.sender === "student")
              .reduce((sum, msg) => sum + msg.text.length, 0) /
            finalStudentMessages
          : 0;

      if (avgMessageLength >= 100) engagementScore += 2; // Detailed responses
      else if (avgMessageLength >= 50) engagementScore += 1; // Moderate responses

      // Question asking factor (0-1 point)
      const questionCount = sessionData.messages
        .filter((msg) => msg.sender === "student")
        .filter((msg) => msg.text.includes("?")).length;

      if (questionCount >= 3) engagementScore += 1; // Good question asking

      return Math.min(10, Math.max(0, engagementScore));
    };

    const engagementScore = calculateEngagementScore();

    return {
      persona: selectedPersona?.name || "Sarah Chen",
      duration: finalDuration,
      totalMessages: finalTotalMessages,
      studentMessages: finalStudentMessages,
      personaMessages: finalPersonaMessages,
      avgRapport: finalRapport.toFixed(1),
      engagementScore,
      feedback: {
        positive: finalPositive,
        suggestions: finalSuggestions,
        errors: finalWarnings,
        total: finalPositive + finalSuggestions + finalWarnings,
      },
      stickyNotes: stickyNotes.map((note) => ({
        content: note.content,
        sessionTime: formatSessionTime(note.sessionTime),
        timestamp: new Date(note.timestamp).toLocaleTimeString(),
      })),
      timestamp: new Date().toLocaleString(),
    };
  };

  // Close session summary and reset
  const closeSessionSummary = () => {
    setShowSessionSummary(false);
    setSessionSummary(null);
    resetSession();
  };

  // Reset session
  const resetSession = () => {
    // Stop any ongoing speech
    stopSpeech();

    // Reset server session
    fetch(buildApiUrl("/api/chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionIdRef.current,
      },
      body: JSON.stringify({
        type: "reset",
      }),
    }).catch((error) => {
      console.error("Error resetting session:", error);
    });

    setSessionData({
      startTime: null,
      duration: 0,
      messages: [],
      scores: { empathy: 0, technique: 0, management: 0, crisis: 0 },
      conversationStage: 1,
      emotionalState: "neutral",
    });
    setCurrentFeedback([]);
    setRapportLevel(3);
    setTextInput("");
    goToStep(1);
    setSelectedPersona(null);
    setStickyNotes([]); // Clear sticky notes on reset
  };

  // Sticky notes functions
  const addStickyNote = () => {
    if (newNote.trim()) {
      const note: StickyNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        timestamp: Date.now(),
        sessionTime: sessionDuration,
        color: getRandomColor(),
      };
      setStickyNotes((prev) => [...prev, note]);
      setNewNote("");
    }
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const getRandomColor = () => {
    const colors = [
      "bg-yellow-200 border-yellow-300",
      "bg-pink-200 border-pink-300",
      "bg-blue-200 border-blue-300",
      "bg-green-200 border-green-300",
      "bg-purple-200 border-purple-300",
      "bg-orange-200 border-orange-300",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Authentication is now handled by Clerk - no custom login functions needed

  const handleSignOut = async () => {
    // Sign out using Clerk
    await signOut();

    // Reset app state
    goToStep(1);
    setSelectedPersona(null);
    setSessionData({
      startTime: null,
      duration: 0,
      messages: [],
      scores: { empathy: 0, technique: 0, management: 0, crisis: 0 },
      conversationStage: 1,
      emotionalState: "neutral",
    });
    setStickyNotes([]);

    console.log("User signed out successfully");
  };

  // Render based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="min-h-screen text-white relative overflow-x-hidden">
            {/* Fixed Background Image */}
            <div 
              className="fixed inset-0 z-0"
              style={{
                backgroundImage: `url('/Vesh.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute inset-0 bg-black/60"></div> {/* Increased opacity for better text visibility */}
            </div>

            <div className="relative z-10 flex flex-col">
              {/* Hero Section - Full Screen */}
              <div className="min-h-screen flex flex-col">
                {/* Header */}
                <header className="px-6 py-6">
                  <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                    <button
                      onClick={() => goToStep(1)}
                      className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xl font-bold text-white">Vesh</span>
                    </button>
                    {isSignedIn ? (
                      // Signed in - show user info and sign out
                      <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <div
                          className={`flex items-center space-x-2 ${
                            currentUser?.type === "student" ||
                            currentUser?.type === "practitioner"
                              ? "cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors"
                              : ""
                          }`}
                          onClick={async () => {
                            // Refresh user metadata before navigating
                            if (user) {
                              try {
                                await user.reload();
                              } catch (err) {
                                console.error("Error refreshing user:", err);
                              }
                            }

                            if (currentUser?.type === "student") {
                              goToStep(6);
                            } else if (currentUser?.type === "practitioner") {
                              goToStep(7);
                            }
                          }}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              currentUser?.type === "student"
                                ? "bg-purple-500/20 border border-purple-500/30"
                                : "bg-blue-500/20 border border-blue-500/30"
                            }`}
                          >
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-sm">
                            <div className="text-white font-medium">
                              {currentUser?.email}
                            </div>
                            <div
                              className={`text-xs ${
                                currentUser?.type === "student"
                                  ? "text-purple-300"
                                  : "text-blue-300"
                              }`}
                            >
                              {currentUser?.type === "student"
                                ? "Student"
                                : "Practitioner"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="px-4 py-2 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-colors flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() =>
                            setShowUserTypeDropdown(!showUserTypeDropdown)
                          }
                          className="relative overflow-hidden flex items-center space-x-2 px-3 py-2 rounded-full text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg shadow-black/10 group hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.7)]"
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <User className="w-5 h-5 text-gray-200 group-hover:text-white transition-colors relative z-10" />
                          <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-300 relative z-10 ${showUserTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <div
                          className={`absolute right-0 mt-2 w-80 origin-top-right z-50 ${
                            showUserTypeDropdown
                              ? "block"
                              : "hidden"
                          }`}
                        >
                          <div className="bg-[#1a1a1a] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden p-3">
                            <div className="space-y-2">
                              <button
                                onClick={() => {
                                  setShowUserTypeDropdown(false);
                                  router.push("/sign-up?userType=student");
                                }}
                                className="w-full px-4 py-4 text-left text-white flex items-center rounded-xl hover:bg-gradient-to-r hover:from-[#8b5cf6]/20 hover:to-transparent border border-transparent hover:border-[#8b5cf6]/30 transition-all duration-300 group relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-[#8b5cf6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="w-12 h-12 rounded-2xl border-2 border-[#8b5cf6] flex items-center justify-center mr-4 shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] group-hover:scale-110 transition-all duration-300 bg-[#8b5cf6]/10 relative z-10">
                                  <GraduationCap className="w-6 h-6 text-[#a78bfa] group-hover:text-white transition-colors" />
                                </div>
                                <div className="relative z-10">
                                  <div className="font-bold text-lg mb-0.5 group-hover:text-[#a78bfa] transition-colors">Student</div>
                                  <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    Practice therapy skills
                                  </div>
                                </div>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setShowUserTypeDropdown(false);
                                  router.push("/sign-up?userType=practitioner");
                                }}
                                className="w-full px-4 py-4 text-left text-white flex items-center rounded-xl hover:bg-gradient-to-r hover:from-[#3b82f6]/20 hover:to-transparent border border-transparent hover:border-[#3b82f6]/30 transition-all duration-300 group relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-[#3b82f6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="w-12 h-12 rounded-2xl border-2 border-[#3b82f6] flex items-center justify-center mr-4 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-all duration-300 bg-[#3b82f6]/10 relative z-10">
                                  <Shield className="w-6 h-6 text-[#60a5fa] group-hover:text-white transition-colors" />
                                </div>
                                <div className="relative z-10">
                                  <div className="font-bold text-lg mb-0.5 group-hover:text-[#60a5fa] transition-colors">
                                    Practitioner
                                  </div>
                                  <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    Professional training
                                  </div>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                {/* Hero Content */}
                <div className="flex-1 flex items-center px-6">
                  <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12">
                    <div className="text-left">
                      <div className="mb-8">
                        <p className="text-sm text-gray-300 mb-2 font-medium tracking-wide uppercase">
                          Trusted by 35,000+ people
                        </p>
                      </div>
                      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
                        Managing your therapy training
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">with AI.</span>
                      </h1>
                      <p className="text-xl text-gray-100 mb-8 max-w-xl leading-relaxed drop-shadow-md font-bold">
                        An advanced training platform that uses AI to automate
                        various aspects of therapeutic practice, skill
                        development, and real-time feedback.
                      </p>
                      <button
                        onClick={() => {
                          if (isSignedIn) {
                            goToStep(2);
                          } else {
                            router.push("/sign-up?userType=student");
                          }
                        }}
                        className="group relative px-8 py-4 text-lg font-bold text-white rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] hover:scale-105 transition-all duration-300 ease-out overflow-hidden border border-white/10"
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center">
                          {isSignedIn ? "Start Session" : "Get started for free"}
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </div>
                    {/* Right side empty to show background */}
                    <div></div>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Learn More Modal */}
            {showLearnMore && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-bold text-white">
                        About Vesh
                      </h2>
                      <button
                        onClick={() => setShowLearnMore(false)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2a2a2a] rounded-xl"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-8">
                      {/* What is Vesh */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <Brain className="w-6 h-6 mr-3 text-purple-400" />
                          What is Vesh?
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                          Vesh is an advanced training platform designed to help
                          psychology students and mental health professionals
                          practice therapeutic skills in a safe, controlled
                          environment. Our AI-powered personas simulate real
                          patient interactions, allowing you to develop
                          essential counseling techniques without the pressure
                          of real-world consequences.
                        </p>
                      </div>

                      {/* Key Features */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <Target className="w-6 h-6 mr-3 text-purple-400" />
                          Key Features
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="card-modern flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <MessageCircle className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-2">
                                  Realistic Conversations
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  Practice with AI personas that respond
                                  authentically to your therapeutic techniques.
                                </p>
                              </div>
                            </div>
                            <div className="card-modern flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <Heart className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-2">
                                  Live Feedback
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  Get real-time coaching tips and rapport level
                                  indicators during sessions.
                                </p>
                              </div>
                            </div>
                            <div className="card-modern flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <Mic className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-2">
                                  Voice Interaction
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  Practice both text and voice-based therapeutic
                                  conversations.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="card-modern flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-2">
                                  Multiple Personas
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  Practice with different patient types and
                                  difficulty levels.
                                </p>
                              </div>
                            </div>
                            <div className="card-modern flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <Shield className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-2">
                                  Safe Environment
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  Learn from mistakes without affecting real
                                  patients.
                                </p>
                              </div>
                            </div>
                            <div className="card-modern flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                <GraduationCap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-2">
                                  Educational Focus
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  Designed specifically for psychology students
                                  and professionals.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* How It Works */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <Play className="w-6 h-6 mr-3 text-purple-400" />
                          How It Works
                        </h3>
                        <div className="space-y-4">
                          <div className="card-modern flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0">
                              1
                            </div>
                            <p className="text-gray-300">
                              Select a patient persona with different difficulty
                              levels and conditions
                            </p>
                          </div>
                          <div className="card-modern flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0">
                              2
                            </div>
                            <p className="text-gray-300">
                              Review the case background and therapeutic
                              considerations
                            </p>
                          </div>
                          <div className="card-modern flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0">
                              3
                            </div>
                            <p className="text-gray-300">
                              Practice therapeutic conversations with real-time
                              feedback
                            </p>
                          </div>
                          <div className="card-modern flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0">
                              4
                            </div>
                            <p className="text-gray-300">
                              Receive coaching tips and track your rapport
                              building skills
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <CheckCircle className="w-6 h-6 mr-3 text-purple-400" />
                          Benefits for Students
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="card-modern">
                            <h4 className="font-semibold text-white mb-3">
                              Build Confidence
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              Practice therapeutic techniques in a low-pressure
                              environment before working with real clients.
                            </p>
                          </div>
                          <div className="card-modern">
                            <h4 className="font-semibold text-white mb-3">
                              Learn from Mistakes
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              Make errors and learn from them without any
                              real-world consequences or client impact.
                            </p>
                          </div>
                          <div className="card-modern">
                            <h4 className="font-semibold text-white mb-3">
                              Track Progress
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              Monitor your therapeutic skills development with
                              real-time feedback and rapport tracking.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() => {
                            setShowLearnMore(false);
                            goToStep(2);
                          }}
                          className="btn-primary-modern px-8 py-3"
                        >
                          Start Training Now
                        </button>
                        <button
                          onClick={() => setShowLearnMore(false)}
                          className="btn-secondary-modern px-8 py-3"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Session Summary Modal */}
            {showSessionSummary && sessionSummary && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-[#1a1a1a] border border-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Session Complete!
                      </h2>
                      <p className="text-gray-300">
                        Great work on your therapeutic practice session
                      </p>
                    </div>

                    {/* Summary Content */}
                    <div className="space-y-8">
                      {/* Session Overview */}
                      <div className="card-modern">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <Clock className="w-5 h-5 mr-3 text-purple-400" />
                          Session Overview
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Patient:</span>
                              <span className="text-white font-semibold">
                                {sessionSummary.persona}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white font-semibold">
                                {sessionSummary.duration} minutes
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Total Messages:
                              </span>
                              <span className="text-white font-semibold">
                                {sessionSummary.totalMessages}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Your Messages:
                              </span>
                              <span className="text-white font-semibold">
                                {sessionSummary.studentMessages}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Patient Messages:
                              </span>
                              <span className="text-white font-semibold">
                                {sessionSummary.personaMessages}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Completed:</span>
                              <span className="text-white font-semibold">
                                {sessionSummary.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Rapport Level */}
                        <div className="card-modern">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Heart className="w-5 h-5 mr-3 text-purple-400" />
                            Rapport Building
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">
                                Final Rapport Level:
                              </span>
                              <span
                                className={`text-2xl font-bold ${
                                  parseFloat(sessionSummary.avgRapport) >= 7
                                    ? "text-green-400"
                                    : parseFloat(sessionSummary.avgRapport) >= 4
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                {sessionSummary.avgRapport}/10
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  parseFloat(sessionSummary.avgRapport) >= 7
                                    ? "bg-gradient-to-r from-green-400 to-green-600"
                                    : parseFloat(sessionSummary.avgRapport) >= 4
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    : "bg-gradient-to-r from-red-400 to-red-600"
                                }`}
                                style={{
                                  width: `${
                                    (parseFloat(sessionSummary.avgRapport) /
                                      10) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-400">
                              {parseFloat(sessionSummary.avgRapport) >= 7
                                ? "Excellent rapport building!"
                                : parseFloat(sessionSummary.avgRapport) >= 4
                                ? "Good progress with rapport"
                                : "Keep working on building trust and connection"}
                            </p>
                          </div>
                        </div>

                        {/* Engagement Score */}
                        <div className="card-modern">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <MessageCircle className="w-5 h-5 mr-3 text-purple-400" />
                            Engagement Score
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">
                                Overall Engagement:
                              </span>
                              <span
                                className={`text-2xl font-bold ${
                                  sessionSummary.engagementScore >= 8
                                    ? "text-green-400"
                                    : sessionSummary.engagementScore >= 6
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                {sessionSummary.engagementScore}/10
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  sessionSummary.engagementScore >= 8
                                    ? "bg-gradient-to-r from-green-400 to-green-600"
                                    : sessionSummary.engagementScore >= 6
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    : "bg-gradient-to-r from-red-400 to-red-600"
                                }`}
                                style={{
                                  width: `${
                                    (sessionSummary.engagementScore / 10) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-400">
                              Based on message frequency and rapport building
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Feedback Summary */}
                      <div className="card-modern">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-3 text-purple-400" />
                          Coaching Feedback Summary
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="text-2xl font-bold text-green-400">
                              {sessionSummary.feedback.positive}
                            </div>
                            <div className="text-sm text-gray-400">
                              Positive Points
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Lightbulb className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div className="text-2xl font-bold text-yellow-400">
                              {sessionSummary.feedback.suggestions}
                            </div>
                            <div className="text-sm text-gray-400">
                              Suggestions
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="text-2xl font-bold text-red-400">
                              {sessionSummary.feedback.errors}
                            </div>
                            <div className="text-sm text-gray-400">
                              Areas to Improve
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={downloadConversationPDF}
                          className="btn-primary-modern flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download Report
                        </button>
                        <button
                          onClick={() => {
                            closeSessionSummary();
                            goToStep(2);
                          }}
                          className="btn-primary-modern"
                        >
                          Practice Again
                        </button>
                        <button
                          onClick={closeSessionSummary}
                          className="btn-secondary-modern"
                        >
                          Return Home
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="min-h-screen bg-black/60 backdrop-blur-xl text-white">
            {/* Header */}
            <header className="px-6 py-6 border-b border-[#1a1a1a]">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <button
                  onClick={() => goToStep(1)}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Vesh</span>
                </button>
                <div className="flex items-center space-x-4">
                  {isSignedIn && (
                    <div
                      className={`flex items-center space-x-2 ${
                        currentUser?.type === "student"
                          ? "cursor-pointer hover:bg-[#2a2a2a]/50 p-2 rounded-xl transition-colors"
                          : currentUser?.type === "practitioner"
                          ? "cursor-pointer hover:bg-[#2a2a2a]/50 p-2 rounded-xl transition-colors"
                          : ""
                      }`}
                      onClick={() => {
                        if (currentUser?.type === "student") {
                          goToStep(6);
                        } else if (currentUser?.type === "practitioner") {
                          goToStep(7);
                        }
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          currentUser?.type === "student"
                            ? "bg-purple-500/20 border border-purple-500/30"
                            : "bg-blue-500/20 border border-blue-500/30"
                        }`}
                      >
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-sm">
                        <div className="text-white font-medium">
                          {currentUser?.email}
                        </div>
                        <div
                          className={`text-xs ${
                            currentUser?.type === "student"
                              ? "text-purple-300"
                              : "text-blue-300"
                          }`}
                        >
                          {currentUser?.type === "student"
                            ? "Student"
                            : "Practitioner"}
                        </div>
                      </div>
                    </div>
                  )}
                  {isSignedIn && (
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </header>

            <main className="px-6 py-12">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Choose Your Training Case
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                    Select a persona to practice with different difficulty
                    levels. Each case offers unique challenges to enhance your
                    therapeutic skills.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    {isSignedIn && currentUser?.type === "student" && (
                      <button
                        onClick={() => goToStep(6)}
                        className="btn-primary-modern flex items-center"
                      >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        <span>Dashboard</span>
                      </button>
                    )}
                    {isSignedIn && currentUser?.type === "practitioner" && (
                      <button
                        onClick={() => goToStep(7)}
                        className="btn-primary-modern flex items-center"
                      >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        <span>Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowPersonaManagement(true)}
                      className="btn-secondary-modern flex items-center"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      <span>Manage Personas</span>
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn-primary-modern flex items-center"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      <span>Upload Custom</span>
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {allPersonas.map((persona, index) => (
                    <div
                      key={persona.id}
                      className="card-feature cursor-pointer flex flex-col"
                      onClick={() => {
                        setSelectedPersona(persona);
                        goToStep(3);
                      }}
                    >
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {persona.name}
                        </h3>
                        <p className="text-gray-400 text-lg">
                          {persona.age}, {persona.occupation}
                        </p>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-400 min-w-[80px]">
                            Condition:
                          </span>
                          <span className="text-sm font-semibold text-white px-3 py-1 rounded-full bg-gray-700/50 border border-gray-600">
                            {persona.condition}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-400 min-w-[80px]">
                            Difficulty:
                          </span>
                          <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              persona.difficulty === "Beginner"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : persona.difficulty === "Intermediate"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {persona.difficulty}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 mb-6 leading-relaxed flex-grow">
                        {persona.description}
                      </p>

                      <button className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-300 mt-auto">
                        SELECT {persona.name.split(" ")[0].toUpperCase()}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        );

      case 3:
        return (
          <div className="min-h-screen bg-black/60 backdrop-blur-xl text-white">
            {/* Header */}
            <header className="px-6 py-6 border-b border-[#1a1a1a]">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <button
                  onClick={() => goToStep(1)}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Vesh</span>
                </button>
              </div>
            </header>

            <main className="px-6 py-12">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Case Background - {selectedPersona?.name}
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Review the patient information before starting your session
                  </p>
                </div>

                <div className="card-feature mb-8">
                  <div className="space-y-6">
                    {selectedPersona &&
                      Object.entries(selectedPersona.background).map(
                        ([section, items]) => (
                          <div
                            key={section}
                            className="border-l-4 border-purple-500 pl-6"
                          >
                            <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                              {section.replace(/([A-Z])/g, " $1").trim()}:
                            </h3>
                            <ul className="space-y-2">
                              {items.map((item, index) => (
                                <li
                                  key={index}
                                  className="text-gray-300 flex items-start"
                                >
                                  <span className="text-purple-400 mr-3 mt-1">
                                    •
                                  </span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => goToStep(2)}
                    className="px-6 py-3 bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl text-white hover:bg-[#3a3a3a] transition-colors flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Selection
                  </button>
                  <button
                    onClick={() => goToStep(4)}
                    className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl text-white hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-300 flex items-center"
                  >
                    Continue to Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </main>
          </div>
        );

      case 4:
        return (
          <div className="min-h-screen bg-black/60 backdrop-blur-xl text-white">
            {/* Header */}
            <header className="px-6 py-6 border-b border-[#1a1a1a]">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Vesh</span>
                </div>
                <button
                  onClick={() => goToStep(3)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>
            </header>

            <main className="px-6 py-12">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Voice Session Setup
                  </h1>
                  <p className="text-xl text-gray-300">
                    Configure your session settings and test audio
                  </p>
                </div>

                <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl p-8">
                  <div className="space-y-8">
                    {/* Session Length */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-purple-400" />
                        SESSION LENGTH
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            duration: 1,
                            label: "1 minute (Test Session)",
                          },
                          {
                            duration: 15,
                            label: "15 minutes (Quick Practice)",
                          },
                          {
                            duration: 25,
                            label: "25 minutes (Standard Session)",
                            selected: true,
                          },
                          { duration: 45, label: "45 minutes (Full Session)" },
                        ].map((option) => (
                          <label
                            key={option.duration}
                            className="flex items-center p-3 rounded-xl border border-[#2a2a2a] hover:border-purple-500/50 transition-colors cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="sessionLength"
                              value={option.duration}
                              checked={
                                selectedSessionLength === option.duration
                              }
                              onChange={() =>
                                setSelectedSessionLength(option.duration)
                              }
                              className="w-4 h-4 text-purple-500 border-gray-600 focus:ring-purple-500 bg-[#2a2a2a]"
                            />
                            <span className="ml-3 text-gray-300">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Audio Check */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Headphones className="w-5 h-5 mr-2 text-purple-400" />
                        AUDIO CHECK
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center mb-3">
                            <Mic className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">
                              Microphone Test
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
                                <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
                              </div>
                              <span className="text-sm text-green-400 font-medium">
                                Good Signal
                              </span>
                            </div>
                            <button
                              onClick={startListening}
                              className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-center transition-all duration-300 ${
                                isListening
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:from-[#4f46e5] hover:to-[#7c3aed]"
                              }`}
                            >
                              {isListening ? (
                                <>
                                  <MicOff className="w-4 h-4 mr-2" />
                                  Click to Stop
                                </>
                              ) : (
                                <>
                                  <Mic className="w-4 h-4 mr-2" />
                                  Click to Test Voice
                                </>
                              )}
                            </button>
                            {currentTranscript && (
                              <div className="text-xs text-gray-400 italic bg-[#2a2a2a] p-2 rounded">
                                Heard: "{currentTranscript}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-2">
                            <Volume2 className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Speaker Test
                            </span>
                          </div>
                          <div className="space-y-2">
                            <button
                              onClick={testAIVoice}
                              className="text-therapy-600 hover:text-therapy-700 text-sm font-medium w-full text-left"
                            >
                              [Test AI Voice] ← Click to hear
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Tips */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-purple-400" />
                        SESSION TIPS
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-3 mt-1">•</span>
                          Speak naturally - the AI will respond to your tone
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-3 mt-1">•</span>
                          Use therapeutic techniques you've learned in class
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-3 mt-1">•</span>
                          Remember: This is a safe space to make mistakes
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-3 mt-1">•</span>
                          You'll receive real-time feedback during conversation
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={startSession}
                    className="px-8 py-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl text-white font-semibold text-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-300 transform hover:scale-105"
                  >
                    BEGIN THERAPY SESSION
                  </button>
                </div>
              </div>
            </main>
          </div>
        );

      case 5:
        // Active Therapy Session
        return (
          <div className="h-screen overflow-hidden bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 z-20 shrink-0">
              <div className="flex items-center justify-between max-w-[1920px] mx-auto w-full">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center group cursor-default">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-500">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white tracking-tight">
                        Therapy Session
                      </h1>
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        with {selectedPersona?.name}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <Clock className="w-4 h-4 mr-2 text-indigo-400" />
                    <span className="font-mono font-medium text-indigo-100">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-sm px-3 py-2 rounded-xl transition-all duration-300">
                    {wsConnected ? (
                      <div className="flex items-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                        <Wifi className="w-3.5 h-3.5 mr-2" />
                        <span className="font-medium text-xs uppercase tracking-wider">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                        <WifiOff className="w-3.5 h-3.5 mr-2" />
                        <span className="font-medium text-xs uppercase tracking-wider">Offline</span>
                      </div>
                    )}
                  </div>
                  
                  {isSpeaking && (
                    <button
                      onClick={stopSpeech}
                      className="flex items-center px-4 py-2 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl transition-all duration-300 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 backdrop-blur-sm"
                    >
                      <VolumeX className="w-4 h-4 mr-2" />
                      <span className="font-medium">Stop Voice</span>
                    </button>
                  )}

                  <div className="h-8 w-px bg-white/10 mx-2"></div>

                  <button
                    onClick={() => {
                      stopSpeech();
                      const summary = generateSessionSummary();
                      setSessionSummary(summary);
                      setShowSessionSummary(true);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-200 flex items-center group"
                  >
                    <Pause className="w-4 h-4 mr-2 group-hover:text-indigo-400 transition-colors" />
                    End Session
                  </button>
                  
                  <button
                    onClick={resetSession}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    title="Reset session"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      showSidebar
                        ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                    title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
                  >
                    <PanelRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area - Flex container that handles the layout */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Left Side: Chat Area */}
              <div className="flex-1 flex flex-col relative min-w-0">
                
                {/* Session Status Pill - Floating */}
                <div className="absolute top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full shadow-xl flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-bold text-emerald-100 tracking-widest uppercase">Live Session</span>
                  </div>
                </div>

                {/* Conversation Log - Scrollable Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pt-20 pb-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {sessionData.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl shadow-indigo-500/10">
                          <MessageCircle className="w-10 h-10 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-white">Ready to listen</h3>
                          <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                            This is a safe space. Feel free to speak openly about whatever is on your mind.
                          </p>
                        </div>
                      </div>
                    ) : (
                      sessionData.messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "student" ? "justify-end" : "justify-start"} animate-slide-up`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className={`flex max-w-[85%] md:max-w-[75%] ${message.sender === "student" ? "flex-row-reverse" : "flex-row"} items-end gap-3`}>
                            
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                              message.sender === "student" 
                                ? "bg-indigo-600 text-white" 
                                : "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
                            }`}>
                              {message.sender === "student" ? "You" : selectedPersona?.name.charAt(0)}
                            </div>

                            {/* Message Bubble */}
                            <div className={`group relative p-5 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg ${
                              message.sender === "student"
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-white/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-bl-none"
                            }`}>
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                              <span className={`text-[10px] absolute bottom-2 ${message.sender === "student" ? "left-2 text-indigo-200" : "right-2 text-gray-400"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                {formatTime(Math.floor((message.timestamp - (sessionData.startTime || 0)) / 1000))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {/* Spacer for scrolling */}
                    <div className="h-4"></div>
                  </div>
                </div>

                {/* Input Area - Floating Glass Bar */}
                <div className="p-6 z-20 shrink-0">
                  <div className="max-w-4xl mx-auto">
                    {/* Speech Status */}
                    {isListening && (
                      <div className="mb-4 flex justify-center">
                        <div className="bg-indigo-900/80 backdrop-blur-md border border-indigo-500/30 px-6 py-2 rounded-full flex items-center space-x-3 shadow-lg animate-pulse">
                          <div className="flex space-x-1">
                            <div className="w-1 h-4 bg-indigo-400 rounded-full animate-wave"></div>
                            <div className="w-1 h-6 bg-indigo-400 rounded-full animate-wave delay-75"></div>
                            <div className="w-1 h-3 bg-indigo-400 rounded-full animate-wave delay-150"></div>
                          </div>
                          <span className="text-indigo-200 font-medium text-sm">Listening...</span>
                          {currentTranscript && (
                            <span className="text-white/80 text-sm border-l border-white/10 pl-3 ml-1">
                              "{currentTranscript}"
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Input Bar */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl flex items-end gap-2 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:bg-black/50 focus-within:shadow-indigo-500/10">
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`p-4 rounded-2xl transition-all duration-300 shrink-0 ${
                          isListening
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                            : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                        }`}
                      >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>

                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(textInput);
                          }
                        }}
                        placeholder="Type your message or press the mic to speak..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none py-4 max-h-32 min-h-[56px] custom-scrollbar"
                        rows={1}
                      />

                      <button
                        onClick={() => sendMessage(textInput)}
                        disabled={!textInput.trim()}
                        className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 shrink-0"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="text-center mt-3">
                      <p className="text-xs text-gray-500 font-medium">
                        Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-sans">Enter</kbd> to send
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Collapsible */}
              <div
                className={`${
                  showSidebar ? "w-96 translate-x-0 opacity-100" : "w-0 translate-x-20 opacity-0"
                } bg-black/20 backdrop-blur-xl border-l border-white/5 transition-all duration-500 ease-out flex flex-col overflow-hidden shrink-0`}
              >
                <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
                  
                  {/* Sidebar Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Session Insights</h3>
                  </div>

                  {/* Patient Metrics Card */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-5 hover:bg-white/10 transition-colors duration-300">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                      <Heart className="w-3.5 h-3.5 mr-2 text-rose-400" />
                      Patient State
                    </h4>

                    {/* Emotional State */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Emotion</span>
                        <span className={`font-medium ${
                          emotionalState === "anxious" ? "text-amber-400" :
                          emotionalState === "depressed" ? "text-blue-400" :
                          emotionalState === "calm" ? "text-emerald-400" : "text-gray-200"
                        }`}>
                          {emotionalState.charAt(0).toUpperCase() + emotionalState.slice(1)}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${
                          emotionalState === "anxious" ? "bg-amber-400" :
                          emotionalState === "depressed" ? "bg-blue-400" :
                          emotionalState === "calm" ? "bg-emerald-400" : "bg-gray-400"
                        } w-3/4`}></div>
                      </div>
                    </div>

                    {/* Rapport Level */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Rapport</span>
                        <span className="font-medium text-white">{rapportLevel.toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                          style={{ width: `${(rapportLevel / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Session Phase Card */}
                  <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-2xl p-5">
                    <div className="flex items-center mb-3">
                      <Clock className="w-4 h-4 mr-2 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Current Phase</span>
                    </div>
                    <div className="text-lg font-semibold text-white capitalize">
                      {sessionPhase}
                    </div>
                    <p className="text-xs text-indigo-300/70 mt-1">
                      {sessionPhase === "opening" ? "Establishing connection and safety." :
                       sessionPhase === "exploration" ? "Exploring core issues and patterns." :
                       "Working towards resolution."}
                    </p>
                  </div>

                  {/* Live Coaching Tips */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                      <Lightbulb className="w-3.5 h-3.5 mr-2 text-amber-400" />
                      Live Suggestions
                    </h4>
                    
                    {currentFeedback.length === 0 ? (
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-gray-500 text-sm">Listening for coaching opportunities...</p>
                      </div>
                    ) : (
                      currentFeedback.map((feedback) => (
                        <div
                          key={feedback.id}
                          className={`rounded-xl p-4 border-l-2 ${
                            feedback.type === "positive"
                              ? "bg-emerald-500/10 border-emerald-500"
                              : "bg-amber-500/10 border-amber-500"
                          } animate-fade-in`}
                        >
                          <p className="text-sm text-gray-200 leading-relaxed">{feedback.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Sticky Notes */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <MessageSquare className="w-3.5 h-3.5 mr-2 text-purple-400" />
                        Notes
                      </h4>
                      <button
                        onClick={() => setShowStickyNotes(!showStickyNotes)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-medium uppercase tracking-wider"
                      >
                        {showStickyNotes ? "Hide" : "Show"}
                      </button>
                    </div>

                    {showStickyNotes && (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && addStickyNote()}
                            placeholder="Add note..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          />
                          <button
                            onClick={addStickyNote}
                            disabled={!newNote.trim()}
                            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {stickyNotes.map((note) => (
                            <div key={note.id} className={`p-3 rounded-xl bg-white/5 border-l-2 ${note.color} group relative`}>
                              <p className="text-sm text-gray-300">{note.content}</p>
                              <button
                                onClick={() => deleteStickyNote(note.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        // Student Dashboard
        if (isSignedIn && currentUser?.type === "student") {
          return (
            <StudentDashboard
              user={currentUser}
              onStartSession={() => goToStep(2)}
              onManagePersonas={() => setShowPersonaManagement(true)}
              onBackToHome={() => goToStep(1)}
            />
          );
        }
        return null;

      case 7:
        // Practitioner Dashboard
        if (isSignedIn && currentUser?.type === "practitioner") {
          return (
            <PractitionerDashboard
              user={currentUser}
              onStartSession={() => goToStep(2)}
              onManagePersonas={() => setShowPersonaManagement(true)}
              onBackToHome={() => goToStep(1)}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {renderStep()}

      {/* Session Summary Modal */}
      {showSessionSummary && sessionSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1a1a1a]">
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Session Complete!
                </h2>
                <p className="text-gray-400 text-lg">
                  Great work! Here's your performance summary.
                </p>
              </div>

              {/* Session Overview */}
              <div className="bg-[#2a2a2a]/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Session Overview
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Patient:</span>
                    <span className="text-white font-semibold">
                      {sessionSummary.persona}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-semibold">
                      {sessionSummary.duration} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Messages:</span>
                    <span className="text-white font-semibold">
                      {sessionSummary.totalMessages}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white font-semibold">
                      {sessionSummary.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Rapport Level */}
                <div className="bg-[#2a2a2a]/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-3 text-purple-400" />
                    Rapport Building
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        Final Rapport Level:
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          parseFloat(sessionSummary.avgRapport) >= 7
                            ? "text-green-400"
                            : parseFloat(sessionSummary.avgRapport) >= 4
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {sessionSummary.avgRapport}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${
                          parseFloat(sessionSummary.avgRapport) >= 7
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : parseFloat(sessionSummary.avgRapport) >= 4
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{
                          width: `${
                            (parseFloat(sessionSummary.avgRapport) / 10) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400">
                      {parseFloat(sessionSummary.avgRapport) >= 7
                        ? "Excellent rapport building!"
                        : parseFloat(sessionSummary.avgRapport) >= 4
                        ? "Good progress with rapport"
                        : "Keep working on building trust and connection"}
                    </p>
                  </div>
                </div>

                {/* Engagement Score */}
                <div className="bg-[#2a2a2a]/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-3 text-blue-400" />
                    Engagement Score
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Overall Score:</span>
                      <span
                        className={`text-2xl font-bold ${
                          sessionSummary.engagementScore >= 8
                            ? "text-green-400"
                            : sessionSummary.engagementScore >= 6
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {sessionSummary.engagementScore}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${
                          sessionSummary.engagementScore >= 8
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : sessionSummary.engagementScore >= 6
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{
                          width: `${
                            (sessionSummary.engagementScore / 10) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Based on message frequency and rapport building
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Summary */}
              <div className="bg-[#2a2a2a]/50 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-3 text-cyan-400" />
                  Coaching Feedback Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {sessionSummary.feedback.positive}
                    </div>
                    <div className="text-sm text-gray-400">Positive Points</div>
                  </div>
                  <div className="p-4">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">
                      {sessionSummary.feedback.suggestions}
                    </div>
                    <div className="text-sm text-gray-400">Suggestions</div>
                  </div>
                  <div className="p-4">
                    <div className="text-2xl font-bold text-red-400 mb-1">
                      {sessionSummary.feedback.errors}
                    </div>
                    <div className="text-sm text-gray-400">
                      Areas to Improve
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Notes */}
              {sessionSummary.stickyNotes &&
                sessionSummary.stickyNotes.length > 0 && (
                  <div className="bg-[#2a2a2a]/50 rounded-xl p-6 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-3 text-purple-400" />
                      Session Notes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessionSummary.stickyNotes.map(
                        (note: SessionNote, index: number) => (
                          <div
                            key={index}
                            className="bg-gray-700/50 rounded-xl p-4 border-l-4 border-purple-500"
                          >
                            <p className="text-gray-200 text-sm mb-2">
                              {note.content}
                            </p>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Session Time: {note.sessionTime}</span>
                              <span>{note.timestamp}</span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={downloadConversationPDF}
                    className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] rounded-xl font-semibold text-white hover:from-[#2563eb] hover:to-[#0891b2] transition-all duration-300 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Report
                  </button>
                  <button
                    onClick={() => {
                      closeSessionSummary();
                      goToStep(2);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-xl font-semibold text-white hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-300"
                  >
                    Practice Again
                  </button>
                  <button
                    onClick={closeSessionSummary}
                    className="px-8 py-3 bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl font-semibold text-white hover:bg-[#3a3a3a] transition-colors"
                  >
                    Return Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persona Management Modal */}
      {showPersonaManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Persona Management
              </h2>
              <button
                onClick={() => setShowPersonaManagement(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <PersonaManagement
              userId={userId}
              onPersonaSelect={handlePersonaSelect}
              selectedPersonaId={selectedPersona?.id}
            />
          </div>
        </div>
      )}

      {/* Persona Upload Modal */}
      <PersonaUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handlePersonaUpload}
        userId={userId}
      />

      {/* Login is now handled by Clerk - use /sign-in and /sign-up pages */}
    </div>
  );
};

export default VeshApp;
