# Autoguide

Automated video guide generator for software products. Takes a running web app and produces polished, narrated video walkthroughs.

## How It Works

1. **Plan** — define scenes, scripts, and highlights (interactively with Claude or manually in YAML)
2. **Capture** — auto-screenshot via Playwright, with manual fallback for complex states
3. **Voiceover** — generate narration via ElevenLabs API (or other TTS providers)
4. **Build** — generate Remotion compositions from the plan
5. **Render** — produce final MP4 video

## Quick Start

```bash
npm install -g @autoguide/cli
cd my-project
autoguide init
autoguide go 01-getting-started
```

## Documentation

- [Design Specification](docs/specs/2026-04-08-autoguide-design.md)

## Status

**Pre-development** — design spec complete, implementation pending.
