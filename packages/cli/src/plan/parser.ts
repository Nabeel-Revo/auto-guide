import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { VideoPlan } from '@autoguide/core';
import { planSchema } from './validator';

export function readPlan(filePath: string): VideoPlan {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Plan file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw);

  const result = planSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Plan validation failed (${filePath}):\n${errors}`);
  }

  return result.data as VideoPlan;
}

export function writePlan(filePath: string, plan: VideoPlan): void {
  const content = yaml.dump(plan, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function listPlans(plansDir: string): string[] {
  if (!fs.existsSync(plansDir)) return [];
  return fs
    .readdirSync(plansDir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => f.replace(/\.(yaml|yml)$/, ''));
}
