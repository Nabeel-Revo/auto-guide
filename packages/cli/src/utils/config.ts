import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import dotenv from 'dotenv';
import type { AutoguideConfig } from '@autoguide/core';
import { logger } from './logger';

// ─── Zod Schema ───

const viewportSchema = z.object({
  width: z.number(),
  height: z.number(),
});

const brandingColorsSchema = z.object({
  primary: z.string(),
  primaryLight: z.string().optional(),
  bgDark: z.string().optional(),
  textWhite: z.string().optional(),
  textMuted: z.string().optional(),
}).optional();

const brandingFontsSchema = z.object({
  heading: z.string(),
  body: z.string(),
}).optional();

const themeOverridesSchema = z.object({
  preset: z.enum(['dark', 'light', 'minimal']).optional(),
  overrides: z.object({
    colors: brandingColorsSchema,
    highlightStyle: z.enum(['glow', 'border', 'fill']).optional(),
  }).optional(),
});

const brandingSchema = z.object({
  logo: z.string().optional(),
  logoLight: z.string().optional(),
  theme: z.union([z.enum(['dark', 'light', 'minimal']), themeOverridesSchema]),
  colors: brandingColorsSchema,
  fonts: brandingFontsSchema,
  highlightStyle: z.enum(['glow', 'border', 'fill']).optional(),
});

const voiceoverSettingsSchema = z.object({
  stability: z.number(),
  similarity_boost: z.number(),
  speed: z.number(),
}).optional();

const voiceoverSchema = z.object({
  provider: z.enum(['elevenlabs', 'openai', 'google', 'none']),
  apiKey: z.string(),
  voiceId: z.string().optional(),
  voice: z.string().optional(),
  model: z.string().optional(),
  mode: z.enum(['auto', 'approval']),
  settings: voiceoverSettingsSchema,
  volume: z.number().optional(),
  buffer: z.number().optional(),
});

const authSchema = z.object({
  strategy: z.enum(['form', 'cookie', 'bearer', 'none']),
  loginUrl: z.string().optional(),
  credentials: z.object({
    username: z.string(),
    password: z.string(),
  }).optional(),
  selectors: z.object({
    username: z.string(),
    password: z.string(),
    submit: z.string(),
  }).optional(),
  waitAfterLogin: z.string().optional(),
  cookies: z.array(z.object({ name: z.string(), value: z.string(), domain: z.string() })).optional(),
  token: z.string().optional(),
}).optional();

const captureSchema = z.object({
  viewport: viewportSchema,
  delay: z.number(),
  auth: authSchema,
});

const outputSchema = z.object({
  fps: z.number(),
  resolution: viewportSchema,
  format: z.enum(['mp4', 'webm']),
  directory: z.string(),
  codec: z.string().optional(),
});

const musicSchema = z.object({
  file: z.string(),
  volume: z.number().optional(),
  fadeIn: z.number().optional(),
  fadeOut: z.number().optional(),
  loop: z.boolean().optional(),
  masterOnly: z.boolean().optional(),
}).optional();

const defaultsSchema = z.object({
  overlap: z.number(),
  intro: z.object({ duration: z.number() }).optional(),
  outro: z.object({
    duration: z.number(),
    websiteUrl: z.string().optional(),
    docsUrl: z.string().optional(),
  }).optional(),
  sectionTitle: z.object({ duration: z.number() }).optional(),
  callout: z.object({ size: z.enum(['sm', 'md', 'lg']) }).optional(),
});

export const configSchema = z.object({
  project: z.object({
    name: z.string(),
    url: z.string(),
    description: z.string().optional(),
  }),
  branding: brandingSchema,
  voiceover: voiceoverSchema,
  capture: captureSchema,
  output: outputSchema,
  music: musicSchema,
  defaults: defaultsSchema,
});

// ─── Environment Variable Resolution ───

export function resolveEnvVars(
  value: string,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return env[varName] ?? match;
  });
}

function resolveEnvVarsDeep(obj: unknown, env: Record<string, string | undefined>): unknown {
  if (typeof obj === 'string') return resolveEnvVars(obj, env);
  if (Array.isArray(obj)) return obj.map((item) => resolveEnvVarsDeep(item, env));
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveEnvVarsDeep(val, env);
    }
    return result;
  }
  return obj;
}

// ─── Config Loader ───

export function loadConfig(configPath: string): AutoguideConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const envPath = path.join(path.dirname(configPath), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = yaml.load(raw) as Record<string, unknown>;

  const resolved = resolveEnvVarsDeep(parsed, process.env as Record<string, string | undefined>);

  const result = configSchema.safeParse(resolved);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`autoguide.config.yaml validation failed:\n${errors}`);
  }

  logger.info(`Config loaded from ${configPath}`);
  return result.data as AutoguideConfig;
}
