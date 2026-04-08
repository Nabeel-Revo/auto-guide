export interface VoiceConfig {
  voiceId: string;
  model: string;
  settings: {
    stability: number;
    similarity_boost: number;
    speed: number;
  };
}

export interface CostEstimate {
  characters: number;
  estimatedCost: number;
}

export interface VoiceoverProvider {
  generateSpeech(text: string, config: VoiceConfig): Promise<Buffer>;
  estimateCost(texts: string[]): CostEstimate;
}
