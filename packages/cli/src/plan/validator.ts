import { z } from 'zod';

const voiceoverEntrySchema = z.object({
  script: z.string(),
  file: z.string().nullable(),
  duration: z.number().nullable(),
});

const captureActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), selector: z.string() }),
  z.object({ type: z.literal('type'), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal('hover'), selector: z.string() }),
  z.object({ type: z.literal('wait'), ms: z.number() }),
  z.object({ type: z.literal('waitForSelector'), selector: z.string(), timeout: z.number().optional() }),
  z.object({ type: z.literal('scroll'), y: z.number() }),
  z.object({ type: z.literal('select'), selector: z.string(), value: z.string() }),
  z.object({ type: z.literal('press'), key: z.string() }),
  z.object({ type: z.literal('evaluate'), script: z.string() }),
]);

const autoCaptureSchema = z.object({
  mode: z.literal('auto'),
  route: z.string(),
  actions: z.array(captureActionSchema).default([]),
  waitFor: z.string().optional(),
  delay: z.number().optional(),
});

const manualCaptureSchema = z.object({
  mode: z.literal('manual'),
  instructions: z.string(),
});

const sceneCaptureSchema = z.discriminatedUnion('mode', [autoCaptureSchema, manualCaptureSchema]);

const highlightBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().optional(),
  delay: z.number().optional(),
});

const textCalloutSchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  delay: z.number().optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});

const sceneSchema = z.object({
  id: z.string(),
  type: z.literal('screenshot'),
  capture: sceneCaptureSchema,
  screenshot: z.string().nullable(),
  duration: z.number(),
  caption: z.string().optional(),
  highlights: z.array(highlightBoxSchema).default([]),
  callout: textCalloutSchema.optional(),
  voiceover: voiceoverEntrySchema,
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  step: z.string(),
  voiceover: voiceoverEntrySchema,
  scenes: z.array(sceneSchema),
});

const introSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  duration: z.number(),
  voiceover: voiceoverEntrySchema,
});

const outroSchema = z.object({
  nextVideoTitle: z.string().optional(),
  duration: z.number(),
  voiceover: voiceoverEntrySchema,
});

const videoMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  module: z.string(),
  videoNumber: z.number(),
});

const metadataSchema = z.object({
  totalDuration: z.number().nullable(),
  totalFrames: z.number().nullable(),
  screenshotsCaptured: z.number(),
  screenshotsTotal: z.number(),
  voiceoverGenerated: z.number(),
  voiceoverTotal: z.number(),
  lastBuilt: z.string().nullable(),
  lastRendered: z.string().nullable(),
});

export const planSchema = z.object({
  video: videoMetaSchema,
  intro: introSchema,
  sections: z.array(sectionSchema),
  outro: outroSchema,
  metadata: metadataSchema,
});

export type ValidatedPlan = z.infer<typeof planSchema>;
