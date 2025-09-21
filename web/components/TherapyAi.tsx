"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

// Types
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

// Main component
const TherapyAI: React.FC = () => {
  // State management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
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
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [rapportChange, setRapportChange] = useState<number | null>(null);
  const [showLearnMore, setShowLearnMore] = useState<boolean>(false);
  const [showSessionSummary, setShowSessionSummary] = useState<boolean>(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        setConnectionStatus("connecting");
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
          setWsConnected(true);
          setConnectionStatus("connected");
          console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };

        ws.onclose = () => {
          setWsConnected(false);
          setConnectionStatus("disconnected");
          console.log("WebSocket disconnected");
        };

        ws.onerror = (error) => {
          setConnectionStatus("error");
          console.error("WebSocket error:", error);
        };

        wsRef.current = ws;
      } catch (error) {
        setConnectionStatus("error");
        console.error("Failed to connect to WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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

  // WebSocket message handler
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "ready":
        console.log("WebSocket ready");
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

  // Text-to-speech with more human-like settings
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      // Stop any current speech
      speechSynthesis.cancel();

      // Get available voices
      let voices = speechSynthesis.getVoices();

      // If no voices loaded, wait for them
      if (voices.length === 0) {
        console.log("Voices not loaded yet, waiting...");
        speechSynthesis.addEventListener(
          "voiceschanged",
          () => {
            voices = speechSynthesis.getVoices();
            console.log(
              "Voices loaded:",
              voices.map((v) => v.name)
            );
            processVoiceSelection(voices, text);
          },
          { once: true }
        );
        return;
      }

      console.log(
        "Available voices:",
        voices.map((v) => v.name)
      );
      processVoiceSelection(voices, text);
    }
  };

  const processVoiceSelection = (
    voices: SpeechSynthesisVoice[],
    text: string
  ) => {
    // Always prioritize gender-appropriate voice selection based on persona
    let voiceToUse = null;

    // Check if current persona is female and select appropriate voice
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
    }

    // If no gender-specific voice found, try the manually selected voice
    if (!voiceToUse && selectedVoice) {
      voiceToUse = voices.find((voice) => voice.name === selectedVoice);
    }

    // Final fallback to general natural voices
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
    }

    console.log("Selected persona:", selectedPersona?.name);
    console.log("Is female persona:", isFemalePersona);
    console.log("Selected voice:", voiceToUse?.name);

    const utterance = new SpeechSynthesisUtterance(text);

    // More human-like settings
    utterance.rate = 0.85; // Slightly slower for more natural speech
    utterance.pitch = 1.1; // Slightly higher pitch for warmth
    utterance.volume = 0.9; // Higher volume for clarity
    utterance.voice = voiceToUse;

    // Add pauses for more natural speech
    utterance.text = text
      .replace(/\./g, ". ") // Add space after periods
      .replace(/,/g, ", ") // Add space after commas
      .replace(/\?/g, "? ") // Add space after questions
      .replace(/!/g, "! ") // Add space after exclamations
      .replace(/\*([^*]+)\*/g, " $1 ") // Handle *actions* like *sigh*
      .replace(/\s+/g, " ") // Clean up multiple spaces
      .trim();

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  // Stop speech function
  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
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
    // Ensure voices are loaded before testing
    if (speechSynthesis.getVoices().length === 0) {
      // Voices not loaded yet, wait for them
      speechSynthesis.addEventListener(
        "voiceschanged",
        () => {
          const testText =
            "Hello there. I'm here to help you practice your therapeutic skills in a safe, supportive environment. Take your time, and remember, this is a space where you can learn and grow.";
          speakText(testText);
        },
        { once: true }
      );
    } else {
      const testText =
        "Hello there. I'm here to help you practice your therapeutic skills in a safe, supportive environment. Take your time, and remember, this is a space where you can learn and grow.";
      speakText(testText);
    }
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

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "text_input",
          text: text.trim(),
        })
      );
    } else {
      // Demo mode - generate persona-specific response
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
            marcusResponses[Math.floor(Math.random() * marcusResponses.length)];
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
    }

    setTextInput("");
  };

  // Generate user feedback based on their message
  const generateUserFeedback = (userMessage: string) => {
    const feedbacks: Feedback[] = [];

    // Analyze user message for therapeutic techniques
    const message = userMessage.toLowerCase();

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
    setSessionData((prev) => ({
      ...prev,
      startTime: Date.now(),
      duration: 0,
    }));
    setSessionDuration(0);
    setTimeRemaining(selectedSessionLength * 60);
    setCurrentStep(5);

    // Send persona to backend
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      selectedPersona
    ) {
      wsRef.current.send(
        JSON.stringify({
          type: "set_persona",
          persona: selectedPersona.id,
        })
      );
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

    // Calculate average rapport level
    const avgRapport = rapportLevel;

    // Count different types of feedback
    const positiveFeedback = currentFeedback.filter(
      (f) => f.type === "positive"
    ).length;
    const suggestions = currentFeedback.filter(
      (f) => f.type === "suggestion"
    ).length;
    const warnings = currentFeedback.filter((f) => f.type === "warning").length;

    // If no real session data, add some sample data for testing
    const isTestMode = totalMessages === 0 || sessionDurationMinutes === 0;

    const finalTotalMessages = isTestMode
      ? Math.floor(Math.random() * 20) + 10
      : totalMessages;
    const finalStudentMessages = isTestMode
      ? Math.floor(finalTotalMessages * 0.6)
      : studentMessages;
    const finalPersonaMessages = isTestMode
      ? finalTotalMessages - finalStudentMessages
      : personaMessages;
    const finalDuration = isTestMode
      ? Math.floor(Math.random() * 20) + 5
      : sessionDurationMinutes;
    const finalRapport = isTestMode ? Math.random() * 6 + 4 : avgRapport; // 4-10 range
    const finalPositive = isTestMode
      ? Math.floor(Math.random() * 5) + 2
      : positiveFeedback;
    const finalSuggestions = isTestMode
      ? Math.floor(Math.random() * 8) + 3
      : suggestions;
    const finalWarnings = isTestMode ? Math.floor(Math.random() * 3) : warnings;

    // Calculate engagement score based on message count and rapport
    const engagementScore = Math.min(
      10,
      Math.round(
        (finalStudentMessages / Math.max(1, finalDuration)) * 2 +
          finalRapport / 2
      )
    );

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
      timestamp: new Date().toLocaleString(),
    };
  };

  // Generate and download PDF of conversation log
  const downloadConversationPDF = () => {
    if (!sessionSummary) return;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TherapyAI Session Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #667eea; margin-bottom: 10px; }
          .session-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .session-info h2 { color: #495057; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
          .info-label { font-weight: bold; color: #6c757d; }
          .info-value { color: #212529; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
          .metric-title { font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 10px; }
          .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .metric-bar { background: #e9ecef; height: 8px; border-radius: 4px; margin: 10px 0; }
          .metric-fill { height: 100%; border-radius: 4px; }
          .conversation { margin-top: 30px; }
          .conversation h2 { color: #495057; margin-bottom: 20px; }
          .message { margin-bottom: 15px; padding: 15px; border-radius: 8px; }
          .message.student { background: #e3f2fd; border-left: 4px solid #2196f3; }
          .message.persona { background: #f3e5f5; border-left: 4px solid #9c27b0; }
          .message-header { font-weight: bold; margin-bottom: 5px; }
          .message-time { font-size: 12px; color: #6c757d; }
          .message-text { margin-top: 5px; }
          .feedback-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .feedback-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; }
          .feedback-item { padding: 15px; }
          .feedback-count { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .feedback-label { font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TherapyAI Session Report</h1>
          <p>Generated on ${sessionSummary.timestamp}</p>
        </div>

        <div class="session-info">
          <h2>Session Overview</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Patient:</span>
              <span class="info-value">${sessionSummary.persona}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duration:</span>
              <span class="info-value">${sessionSummary.duration} minutes</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Messages:</span>
              <span class="info-value">${sessionSummary.totalMessages}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Your Messages:</span>
              <span class="info-value">${sessionSummary.studentMessages}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Patient Messages:</span>
              <span class="info-value">${sessionSummary.personaMessages}</span>
            </div>
          </div>
        </div>

        <div class="metrics">
          <div class="metric-card">
            <div class="metric-title">Rapport Level</div>
            <div class="metric-value" style="color: ${
              parseFloat(sessionSummary.avgRapport) >= 7
                ? "#28a745"
                : parseFloat(sessionSummary.avgRapport) >= 4
                ? "#ffc107"
                : "#dc3545"
            }">${sessionSummary.avgRapport}/10</div>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${
                (parseFloat(sessionSummary.avgRapport) / 10) * 100
              }%; background: ${
      parseFloat(sessionSummary.avgRapport) >= 7
        ? "#28a745"
        : parseFloat(sessionSummary.avgRapport) >= 4
        ? "#ffc107"
        : "#dc3545"
    };"></div>
            </div>
            <p style="font-size: 14px; color: #6c757d; margin: 0;">
              ${
                parseFloat(sessionSummary.avgRapport) >= 7
                  ? "Excellent rapport building!"
                  : parseFloat(sessionSummary.avgRapport) >= 4
                  ? "Good progress with rapport"
                  : "Keep working on building trust and connection"
              }
            </p>
          </div>
          <div class="metric-card">
            <div class="metric-title">Engagement Score</div>
            <div class="metric-value" style="color: ${
              sessionSummary.engagementScore >= 8
                ? "#28a745"
                : sessionSummary.engagementScore >= 6
                ? "#ffc107"
                : "#dc3545"
            }">${sessionSummary.engagementScore}/10</div>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${
                (sessionSummary.engagementScore / 10) * 100
              }%; background: ${
      sessionSummary.engagementScore >= 8
        ? "#28a745"
        : sessionSummary.engagementScore >= 6
        ? "#ffc107"
        : "#dc3545"
    };"></div>
            </div>
            <p style="font-size: 14px; color: #6c757d; margin: 0;">Based on message frequency and rapport building</p>
          </div>
        </div>

        <div class="feedback-summary">
          <h2>Coaching Feedback Summary</h2>
          <div class="feedback-grid">
            <div class="feedback-item">
              <div class="feedback-count" style="color: #28a745;">${
                sessionSummary.feedback.positive
              }</div>
              <div class="feedback-label">Positive Points</div>
            </div>
            <div class="feedback-item">
              <div class="feedback-count" style="color: #ffc107;">${
                sessionSummary.feedback.suggestions
              }</div>
              <div class="feedback-label">Suggestions</div>
            </div>
            <div class="feedback-item">
              <div class="feedback-count" style="color: #dc3545;">${
                sessionSummary.feedback.errors
              }</div>
              <div class="feedback-label">Areas to Improve</div>
            </div>
          </div>
        </div>

        <div class="conversation">
          <h2>Conversation Log</h2>
          ${sessionData.messages
            .map(
              (msg) => `
            <div class="message ${msg.sender}">
              <div class="message-header">
                ${msg.sender === "student" ? "You" : sessionSummary.persona}
                <span class="message-time">${new Date(
                  msg.timestamp
                ).toLocaleTimeString()}</span>
              </div>
              <div class="message-text">${msg.text}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TherapyAI_Session_${sessionSummary.persona.replace(
      " ",
      "_"
    )}_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    setCurrentStep(1);
    setSelectedPersona(null);
  };

  // Render based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Hero background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>

            {/* Floating geometric elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
              {/* Header */}
              <header className="px-6 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold">TherapyAI</span>
                  </div>
                  <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                    Sign In
                  </button>
                </div>
              </header>

              {/* Main content */}
              <main className="flex-1 flex items-center justify-center px-6">
                <div className="max-w-4xl w-full text-center">
                  <div className="mb-8">
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                      The best therapy training
                      <br />
                      <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        for AI.
                      </span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                      Practice therapeutic skills in a safe environment. Memory
                      - that's dynamic, works like the human brain, and scales
                      without breaking bank.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center space-x-8 mb-12">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">500+</div>
                      <div className="text-sm text-gray-400">
                        Students Training
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-600"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">98%</div>
                      <div className="text-sm text-gray-400">Success Rate</div>
                    </div>
                    <div className="w-px h-8 bg-gray-600"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">24/7</div>
                      <div className="text-sm text-gray-400">Available</div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                    >
                      <span className="relative z-10 flex items-center">
                        Start Training Session
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                    </button>
                    <button
                      onClick={() => setShowLearnMore(true)}
                      className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg font-semibold text-white hover:bg-white/20 transition-all duration-300"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </main>

              {/* Footer */}
              <footer className="px-6 py-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
                  © 2025 TherapyAI. All rights reserved.
                </div>
              </footer>
            </div>

            {/* Learn More Modal */}
            {showLearnMore && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-bold text-white">
                        About TherapyAI
                      </h2>
                      <button
                        onClick={() => setShowLearnMore(false)}
                        className="text-gray-400 hover:text-white transition-colors"
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
                      {/* What is TherapyAI */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <Brain className="w-6 h-6 mr-3 text-purple-400" />
                          What is TherapyAI?
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                          TherapyAI is an advanced training platform designed to
                          help psychology students and mental health
                          professionals practice therapeutic skills in a safe,
                          controlled environment. Our AI-powered personas
                          simulate real patient interactions, allowing you to
                          develop essential counseling techniques without the
                          pressure of real-world consequences.
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
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                                <MessageCircle className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">
                                  Realistic Conversations
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  Practice with AI personas that respond
                                  authentically to your therapeutic techniques.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                                <Heart className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">
                                  Live Feedback
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  Get real-time coaching tips and rapport level
                                  indicators during sessions.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                                <Mic className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">
                                  Voice Interaction
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  Practice both text and voice-based therapeutic
                                  conversations.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                                <Users className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">
                                  Multiple Personas
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  Practice with different patient types and
                                  difficulty levels.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                                <Shield className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">
                                  Safe Environment
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  Learn from mistakes without affecting real
                                  patients.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                                <GraduationCap className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">
                                  Educational Focus
                                </h4>
                                <p className="text-gray-400 text-sm">
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
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                              1
                            </div>
                            <p className="text-gray-300">
                              Select a patient persona with different difficulty
                              levels and conditions
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                              2
                            </div>
                            <p className="text-gray-300">
                              Review the case background and therapeutic
                              considerations
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                              3
                            </div>
                            <p className="text-gray-300">
                              Practice therapeutic conversations with real-time
                              feedback
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
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
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-2">
                              Build Confidence
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Practice therapeutic techniques in a low-pressure
                              environment before working with real clients.
                            </p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-2">
                              Learn from Mistakes
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Make errors and learn from them without any
                              real-world consequences or client impact.
                            </p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-2">
                              Track Progress
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Monitor your therapeutic skills development with
                              real-time feedback and rapport tracking.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-8 pt-6 border-t border-gray-800">
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() => {
                            setShowLearnMore(false);
                            setCurrentStep(2);
                          }}
                          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                        >
                          Start Training Now
                        </button>
                        <button
                          onClick={() => setShowLearnMore(false)}
                          className="px-8 py-3 bg-gray-800 border border-gray-700 rounded-lg font-semibold text-white hover:bg-gray-700 transition-colors"
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
                <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                      <div className="bg-gray-800/50 rounded-lg p-6">
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
                        <div className="bg-gray-800/50 rounded-lg p-6">
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
                        <div className="bg-gray-800/50 rounded-lg p-6">
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
                      <div className="bg-gray-800/50 rounded-lg p-6">
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
                    <div className="mt-8 pt-6 border-t border-gray-800">
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={downloadConversationPDF}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center"
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
                            setCurrentStep(2);
                          }}
                          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                        >
                          Practice Again
                        </button>
                        <button
                          onClick={closeSessionSummary}
                          className="px-8 py-3 bg-gray-800 border border-gray-700 rounded-lg font-semibold text-white hover:bg-gray-700 transition-colors"
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
          <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="px-6 py-6 border-b border-gray-800">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">TherapyAI</span>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>
            </header>

            <main className="px-6 py-12">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Choose Your Training Case
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Select a persona to practice with different difficulty
                    levels. Each case offers unique challenges to enhance your
                    therapeutic skills.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {personas.map((persona, index) => (
                    <div
                      key={persona.id}
                      className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:transform hover:scale-105"
                      onClick={() => {
                        setSelectedPersona(persona);
                        setCurrentStep(3);
                      }}
                    >
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {persona.name}
                        </h3>
                        <p className="text-gray-400 text-lg">
                          {persona.age}, {persona.occupation}
                        </p>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-400">
                            Condition:
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {persona.condition}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-400">
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

                      <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                        {persona.description}
                      </p>

                      <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
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
          <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="px-6 py-6 border-b border-gray-800">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">TherapyAI</span>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>
            </header>

            <main className="px-6 py-12">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Case Background - {selectedPersona?.name}
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Review the patient information before starting your session
                  </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 mb-8">
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
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Selection
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center"
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
          <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="px-6 py-6 border-b border-gray-800">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">TherapyAI</span>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
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
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Voice Session Setup
                  </h1>
                  <p className="text-xl text-gray-300">
                    Configure your session settings and test audio
                  </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
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
                            className="flex items-center p-3 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
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
                              className="w-4 h-4 text-purple-500 border-gray-600 focus:ring-purple-500 bg-gray-800"
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
                              className={`w-full px-4 py-3 rounded-lg text-sm flex items-center justify-center transition-all duration-300 ${
                                isListening
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
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
                              <div className="text-xs text-gray-400 italic bg-gray-800 p-2 rounded">
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
                            <select
                              value={selectedVoice || ""}
                              onChange={(e) =>
                                setSelectedVoice(e.target.value || null)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-500 focus:border-transparent"
                            >
                              <option value="">Auto-select best voice</option>
                              {typeof window !== "undefined" &&
                                speechSynthesis
                                  .getVoices()
                                  .map((voice, index) => (
                                    <option key={index} value={voice.name}>
                                      {voice.name} ({voice.lang})
                                    </option>
                                  ))}
                            </select>
                            <button
                              onClick={testAIVoice}
                              className="text-therapy-600 hover:text-therapy-700 text-sm font-medium"
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
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                  >
                    BEGIN THERAPY SESSION
                  </button>
                </div>
              </div>
            </main>
          </div>
        );

      case 5:
        return (
          <div className="min-h-screen bg-black text-white">
            <div className="h-screen flex flex-col">
              {/* Header */}
              <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <h1 className="text-xl font-bold text-white">
                        THERAPY SESSION - {selectedPersona?.name}
                      </h1>
                    </div>
                    <div className="flex items-center text-gray-300 bg-gray-800 px-4 py-2 rounded-lg">
                      <Clock className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="font-mono font-semibold">
                        Time Remaining: {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm px-3 py-2 rounded-lg transition-all duration-300">
                      {wsConnected ? (
                        <div className="flex items-center text-green-400 bg-green-500/20 border border-green-500/30">
                          <Wifi className="w-4 h-4 mr-2 animate-pulse" />
                          <span className="font-semibold">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-400 bg-red-500/20 border border-red-500/30">
                          <WifiOff className="w-4 h-4 mr-2" />
                          <span className="font-semibold">Demo Mode</span>
                        </div>
                      )}
                    </div>
                    {isSpeaking && (
                      <button
                        onClick={stopSpeech}
                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transform transition-all duration-300 hover:scale-105 animate-pulse"
                        title="Stop speaking"
                      >
                        <VolumeX className="w-4 h-4 mr-2" />
                        Stop Voice
                      </button>
                    )}
                    <button
                      onClick={() => {
                        console.log("Test session end button clicked");
                        // Test session ending
                        stopSpeech(); // Stop any ongoing speech
                        const summary = generateSessionSummary();
                        console.log("Generated summary:", summary);
                        setSessionSummary(summary);
                        setShowSessionSummary(true);
                        console.log(
                          "Session summary modal should now be visible"
                        );
                        // Don't reset session immediately, let user see summary first
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-300 hover:scale-110"
                      title="Test session end"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                    <button
                      onClick={resetSession}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-300 hover:scale-110"
                      title="Reset session"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex">
                {/* Main Session Area */}
                <div className="flex-1 flex flex-col">
                  {/* Session Status */}
                  <div className="bg-gradient-to-r from-therapy-50 to-blue-50 border-b border-therapy-200 px-6 py-4">
                    <div className="text-center">
                      <div className="inline-flex items-center px-6 py-2 bg-white rounded-full shadow-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                        <h2 className="text-lg font-bold text-therapy-800">
                          SESSION IN PROGRESS
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Log */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
                    <div className="max-w-4xl mx-auto">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <MessageCircle className="w-6 h-6 mr-3 text-therapy-600" />
                        CONVERSATION LOG
                      </h3>
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-h-96 overflow-y-auto conversation-log shadow-xl border border-white/20">
                        {sessionData.messages.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-therapy-100 to-therapy-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageCircle className="w-8 h-8 text-therapy-600" />
                            </div>
                            <p className="text-gray-500 text-lg font-medium">
                              No messages yet. Start the conversation!
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                              Use the voice button or type your message below
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sessionData.messages.map((message, index) => (
                              <div
                                key={message.id}
                                className={`transform transition-all duration-500 animate-slide-up ${
                                  message.sender === "student" ? "ml-8" : "mr-8"
                                }`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                              >
                                <div
                                  className={`flex items-start space-x-3 p-4 rounded-2xl shadow-sm ${
                                    message.sender === "student"
                                      ? "bg-gradient-to-r from-therapy-500 to-therapy-600 text-white"
                                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                      message.sender === "student"
                                        ? "bg-white/20 text-white"
                                        : "bg-therapy-500 text-white"
                                    }`}
                                  >
                                    {message.sender === "student"
                                      ? "S"
                                      : selectedPersona?.name.charAt(0) || "A"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-xs font-mono opacity-70">
                                        {formatTime(
                                          Math.floor(
                                            (message.timestamp -
                                              (sessionData.startTime || 0)) /
                                              1000
                                          )
                                        )}
                                      </span>
                                      <span className="text-xs font-semibold">
                                        {message.sender === "student"
                                          ? "STUDENT"
                                          : selectedPersona?.name.toUpperCase() ||
                                            "AI"}
                                      </span>
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                      {message.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-white to-gray-50">
                    <div className="max-w-4xl mx-auto">
                      {/* Speech Recognition Status */}
                      {isListening && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg animate-slide-down">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="animate-pulse w-4 h-4 bg-blue-500 rounded-full"></div>
                              <div className="absolute inset-0 animate-ping w-4 h-4 bg-blue-400 rounded-full opacity-75"></div>
                            </div>
                            <span className="text-blue-700 font-semibold ml-3">
                              Listening...
                            </span>
                            {currentTranscript && (
                              <span className="ml-3 text-blue-600 italic bg-white/50 px-3 py-1 rounded-full">
                                "{currentTranscript}"
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && sendMessage(textInput)
                            }
                            placeholder="Type your message here or use voice..."
                            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-therapy-300 focus:border-therapy-500 transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
                          />
                        </div>

                        {/* Voice Input Button */}
                        <button
                          onClick={startListening}
                          className={`group px-6 py-4 rounded-2xl flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                            isListening
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse"
                              : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                          }`}
                          title={
                            isListening
                              ? "Click to stop listening"
                              : "Click to start speaking"
                          }
                        >
                          {isListening ? (
                            <MicOff className="w-5 h-5 mr-2" />
                          ) : (
                            <Mic className="w-5 h-5 mr-2" />
                          )}
                          <span className="font-semibold">
                            {isListening ? "Stop" : "Speak"}
                          </span>
                        </button>

                        {/* Send Button */}
                        <button
                          onClick={() => sendMessage(textInput)}
                          disabled={!textInput.trim()}
                          className="group px-8 py-4 bg-gradient-to-r from-therapy-600 to-therapy-700 text-white rounded-2xl hover:from-therapy-700 hover:to-therapy-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
                        >
                          <Send className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:translate-x-1" />
                          <span className="font-semibold">Send</span>
                        </button>
                      </div>

                      {/* Voice Instructions */}
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                          <span className="text-sm text-gray-600 font-medium">
                            💡 Click "Speak" to start voice input, then click
                            "Send" or press Enter to submit
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Feedback Panel */}
                <div className="w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 p-6 overflow-y-auto shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-therapy-500 to-therapy-700 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">F</span>
                    </div>
                    REAL-TIME FEEDBACK
                  </h3>

                  {/* Patient Metrics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      PATIENT METRICS
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Current Emotional State</span>
                          <span className="text-blue-600">Anxious 😰</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-gray-700">
                            Rapport Level
                          </span>
                          <div className="flex items-center">
                            <span
                              className={`font-bold ${
                                rapportLevel >= 7
                                  ? "text-green-600"
                                  : rapportLevel >= 4
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {rapportLevel.toFixed(1)}/10
                            </span>
                            {rapportChange !== null && (
                              <span
                                className={`ml-2 text-xs font-bold animate-pulse ${
                                  rapportChange > 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {rapportChange > 0 ? "+" : ""}
                                {rapportChange.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div
                            className={`h-3 rounded-full transition-all duration-700 ease-out ${
                              rapportLevel >= 7
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : rapportLevel >= 4
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                : "bg-gradient-to-r from-red-400 to-red-600"
                            }`}
                            style={{ width: `${(rapportLevel / 10) * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 text-center">
                          {rapportLevel >= 7
                            ? "Excellent rapport!"
                            : rapportLevel >= 4
                            ? "Good progress"
                            : "Keep building trust"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Coaching Tips */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
                      LIVE COACHING TIPS
                    </h4>
                    <div className="space-y-3">
                      {currentFeedback.map((feedback) => (
                        <div
                          key={feedback.id}
                          className={`p-3 rounded-lg ${
                            feedback.type === "positive"
                              ? "bg-green-50 border-l-4 border-green-400"
                              : feedback.type === "suggestion"
                              ? "bg-yellow-50 border-l-4 border-yellow-400"
                              : "bg-red-50 border-l-4 border-red-400"
                          }`}
                        >
                          <div className="flex items-start">
                            {feedback.icon === "CheckCircle" && (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                            )}
                            {feedback.icon === "MessageCircle" && (
                              <MessageCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" />
                            )}
                            {feedback.icon === "Clock" && (
                              <Clock className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                            )}
                            <span className="text-sm text-gray-700">
                              {feedback.message}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

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
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800">
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
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
                <div className="bg-gray-800/50 rounded-lg p-6">
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
                <div className="bg-gray-800/50 rounded-lg p-6">
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
              <div className="bg-gray-800/50 rounded-lg p-6 mt-6">
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

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={downloadConversationPDF}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center"
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
                      setCurrentStep(2);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    Practice Again
                  </button>
                  <button
                    onClick={closeSessionSummary}
                    className="px-8 py-3 bg-gray-800 border border-gray-700 rounded-lg font-semibold text-white hover:bg-gray-700 transition-colors"
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
};

export default TherapyAI;
