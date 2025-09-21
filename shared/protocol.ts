export type ClientMsg =
  | { type: "join"; roomId: string }
  | { type: "pitch-meta"; text: string } // optional preface
  | { type: "audio"; chunk: ArrayBuffer } // raw PCM/Opus
  | { type: "vad"; speaking: boolean }; // client VAD hint

export type Persona = "vc" | "cto" | "customer" | "moderator";

export type ServerMsg =
  | { type: "ready" }
  | { type: "partial_stt"; text: string } // live captions
  | { type: "final_stt"; text: string }
  | { type: "persona_think"; who: Persona; text: string } // optional thoughts
  | { type: "persona_say"; who: Persona; text: string } // final line
  | { type: "audio_out"; who: Persona; chunk: ArrayBuffer; mime: string } // TTS stream
  | { type: "verdict"; json: any }
  | { type: "error"; message: string };
