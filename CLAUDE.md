# CLAUDE.md

## Project Overview

Autoguide is an automated video guide generator for software products. It produces polished, narrated video walkthroughs using screenshot-based motion graphics.

**Two layers:**
- `@autoguide/core` — Remotion components, theme system, TypeScript types
- `@autoguide/cli` — 5-stage pipeline (Plan > Capture > Voiceover > Build > Render) with Playwright + ElevenLabs
- `@autoguide/claude-skill` — Claude Code skills that orchestrate the CLI with AI intelligence

## Design Spec

Full design specification is in `docs/specs/2026-04-08-autoguide-design.md`. Read this before starting any implementation work.

## Architecture

```
@autoguide/claude-skill  →  @autoguide/cli  →  @autoguide/core  →  remotion, playwright, elevenlabs
```

### Monorepo Structure (pnpm workspaces)

```
packages/
  core/          # Remotion components + theme + types
  cli/           # CLI commands + Playwright + ElevenLabs client + code generator
  claude-skill/  # Claude Code skill definitions
templates/       # Starter templates (dark, light, minimal)
examples/        # Real-world examples
```

## Key Concepts

- **Video Plan YAML** (`plans/*.yaml`) — single source of truth for each video. All stages read/write it.
- **5-stage pipeline:** Plan > Capture > Voiceover > Build > Render
- **Hybrid capture:** Playwright auto-captures simple pages, flags complex states for manual screenshots
- **Per-scene voiceovers:** One MP3 per scene, durations auto-measured, scene timing auto-adjusted
- **Code generation:** Plan YAML > Remotion .tsx via templates. `@autoguide-lock` preserves manual edits.
- **Theming:** Dark/Light/Minimal presets with custom overrides via config

## Tech Stack

- Remotion 4.x, React 18, TypeScript 5
- Playwright (screenshots), ElevenLabs API (TTS)
- Commander.js (CLI), Zod (validation), js-yaml (config)
- pnpm workspaces, tsup (package builds)

## Origin

This project was born from manually building video guides for ZenDash HRM (`D:\1. Projects\@ Repos\hrm\video-guides/`). That project serves as the real-world reference implementation and will be the first project migrated to autoguide once built.

## Commands (planned)

```bash
autoguide init                    # Interactive setup, generates config
autoguide plan <video-id>         # Create/edit video plan
autoguide capture [video-id]      # Screenshot capture (auto + manual)
autoguide voiceover [video-id]    # Generate TTS audio from scripts
autoguide build [video-id]        # Generate Remotion .tsx from plan
autoguide render [video-id]       # Render final MP4
autoguide go [video-id]           # Full pipeline end-to-end
autoguide status                  # Show pipeline progress
```
