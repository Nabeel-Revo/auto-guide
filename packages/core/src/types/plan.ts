// packages/core/src/types/plan.ts

export interface VoiceoverEntry {
  script: string;
  file: string | null;
  duration: number | null;
}

export type CaptureAction =
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; text: string }
  | { type: 'hover'; selector: string }
  | { type: 'wait'; ms: number }
  | { type: 'waitForSelector'; selector: string; timeout?: number }
  | { type: 'scroll'; y: number }
  | { type: 'select'; selector: string; value: string }
  | { type: 'press'; key: string }
  | { type: 'evaluate'; script: string };

export interface AutoCapture {
  mode: 'auto';
  route: string;
  actions: CaptureAction[];
  waitFor?: string;
  delay?: number;
}

export interface ManualCapture {
  mode: 'manual';
  instructions: string;
}

export type SceneCapture = AutoCapture | ManualCapture;

export interface HighlightBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  delay?: number;
}

export interface TextCalloutConfig {
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
}

export interface Scene {
  id: string;
  type: 'screenshot';
  capture: SceneCapture;
  screenshot: string | null;
  duration: number;
  caption?: string;
  highlights: HighlightBox[];
  callout?: TextCalloutConfig;
  voiceover: VoiceoverEntry;
}

export interface SceneSection {
  id: string;
  title: string;
  subtitle?: string;
  step: string;
  voiceover: VoiceoverEntry;
  scenes: Scene[];
}

export interface IntroConfig {
  title: string;
  subtitle?: string;
  duration: number;
  voiceover: VoiceoverEntry;
}

export interface OutroConfig {
  nextVideoTitle?: string;
  duration: number;
  voiceover: VoiceoverEntry;
}

export interface VideoMeta {
  id: string;
  title: string;
  module: string;
  videoNumber: number;
}

export interface PlanMetadata {
  totalDuration: number | null;
  totalFrames: number | null;
  screenshotsCaptured: number;
  screenshotsTotal: number;
  voiceoverGenerated: number;
  voiceoverTotal: number;
  lastBuilt: string | null;
  lastRendered: string | null;
}

export interface VideoPlan {
  video: VideoMeta;
  intro: IntroConfig;
  sections: SceneSection[];
  outro: OutroConfig;
  metadata: PlanMetadata;
}
