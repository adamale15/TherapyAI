
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor(apiKey?: string) {
    // Browser playback goes through /api/elevenlabs; the server owns the key.
    this.apiKey = apiKey || "";
    
    if (!this.apiKey) {
      console.warn("ElevenLabs API key is missing. TTS will not work.");
    }
  }

  /**
   * Stream audio from ElevenLabs API
   * @param text The text to convert to speech
   * @param voiceId The ID of the voice to use
   * @returns A ReadableStream of the audio data
   */
  /**
   * Stream audio from ElevenLabs API via internal proxy
   * @param text The text to convert to speech
   * @param voiceId The ID of the voice to use
   * @returns A ReadableStream of the audio data
   */
  async streamAudio(text: string, voiceId: string): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const response = await fetch("/api/elevenlabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("ElevenLabs proxy error:", response.status, errorData);
        throw new Error(`ElevenLabs proxy error: ${response.status}`);
      }

      return response.body;
    } catch (error) {
      console.error("Error streaming audio from ElevenLabs:", error);
      return null;
    }
  }

  /**
   * Get available voices
   */
  async getVoices() {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error("Error fetching voices:", error);
      return [];
    }
  }

  /**
   * Play audio from a stream
   * @param stream The audio stream
   */
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Play audio from a stream
   * @param stream The audio stream
   */
  async playAudio(stream: ReadableStream<Uint8Array>): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      const response = new Response(stream);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(url);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          reject(e);
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      throw error;
    }
  }

  /**
   * Stop currently playing audio
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

// Singleton instance
export const elevenLabsService = new ElevenLabsService();
