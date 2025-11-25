
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor(apiKey?: string) {
    // Use provided key or fallback to env var
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
    
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
  async playAudio(stream: ReadableStream<Uint8Array>): Promise<void> {
    try {
      const response = new Response(stream);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      throw error;
    }
  }
}

// Singleton instance
export const elevenLabsService = new ElevenLabsService();
