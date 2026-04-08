import type { VoiceoverProvider, VoiceConfig, CostEstimate } from './types';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
const COST_PER_CHAR = 0.0003;

export class ElevenLabsProvider implements VoiceoverProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSpeech(text: string, config: VoiceConfig): Promise<Buffer> {
    const url = `${ELEVENLABS_API}/text-to-speech/${config.voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: config.model,
        voice_settings: {
          stability: config.settings.stability,
          similarity_boost: config.settings.similarity_boost,
          speed: config.settings.speed,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  estimateCost(texts: string[]): CostEstimate {
    const characters = texts.reduce((sum, t) => sum + t.length, 0);
    return {
      characters,
      estimatedCost: characters * COST_PER_CHAR,
    };
  }
}
