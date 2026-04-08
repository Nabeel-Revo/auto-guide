# Autoguide

Automated video guide generator for software products. Takes a running web app and produces polished, narrated video walkthroughs using screenshot-based motion graphics.

## The Problem

Creating product video guides is painful. Every video requires:

1. Planning scenes and writing scripts
2. Taking screenshots from the running app (and retaking them every time the UI changes)
3. Building animated compositions in a video framework
4. Generating voiceover audio
5. Syncing audio durations to scene timing
6. Rendering the final video

Each step is manual and error-prone. Timing sync is tedious. A single UI change means re-screenshotting, re-timing, and re-rendering. Teams either spend days on video guides or skip them entirely.

## The Solution

Autoguide turns this into a config-driven, repeatable pipeline:

```
Plan (YAML) → Capture (Playwright) → Voiceover (ElevenLabs) → Build (Remotion) → Render (MP4)
```

A single YAML plan file describes every scene — what to screenshot, what to narrate, where to highlight. The CLI automates the rest. When your UI changes, retake one screenshot and re-render. The narration, timing, and animations update automatically.

### Two Layers

- **`@autoguide/cli`** — Standalone CLI that works in any project. Config-driven, no AI required.
- **`@autoguide/claude-skill`** — Claude Code skills that add AI intelligence for planning, scripting, and error recovery.

## Quick Start

### Install

```bash
npm install -g @autoguide/cli
npx playwright install chromium
```

### Initialize

```bash
cd my-app
autoguide init --template dark
```

This creates `autoguide.config.yaml` and scaffolds the project directories.

### Configure

Edit `autoguide.config.yaml` with your app details:

```yaml
project:
  name: "My App"
  url: "http://localhost:3000"

branding:
  theme: "dark"
  colors:
    primary: "#6366f1"

voiceover:
  provider: "elevenlabs"
  apiKey: "${ELEVENLABS_API_KEY}"
  voiceId: "pNInz6obpgDQGcFmaJgB"
  mode: "auto"
  volume: 0.85
  buffer: 0.8

capture:
  viewport: { width: 1920, height: 1080 }
  delay: 1000
  auth:
    strategy: "form"
    loginUrl: "/login"
    credentials:
      username: "${APP_USER}"
      password: "${APP_PASS}"
    selectors:
      username: "#email"
      password: "#password"
      submit: "button[type='submit']"
    waitAfterLogin: "/dashboard"

output:
  fps: 30
  resolution: { width: 1920, height: 1080 }
  format: "mp4"
  directory: "./output"

defaults:
  overlap: 10
  intro: { duration: 5 }
  outro: { duration: 5 }
  sectionTitle: { duration: 2.5 }
```

Sensitive values use `${VAR}` syntax — resolved from `.env` or system environment.

### Create a Video Plan

```bash
autoguide plan 01-getting-started --module "Getting Started"
```

This creates a scaffold at `plans/01-getting-started.yaml`. Edit it to describe your scenes:

```yaml
video:
  id: "01-getting-started"
  title: "Getting Started"
  module: "Getting Started"
  videoNumber: 1

intro:
  title: "Getting Started"
  subtitle: "Your first steps in the app"
  duration: 5
  voiceover:
    script: "Getting Started. Let's walk through your first steps."
    file: null
    duration: null

sections:
  - id: "dashboard"
    title: "The Dashboard"
    step: "01"
    voiceover:
      script: "The dashboard."
      file: null
      duration: null
    scenes:
      - id: "dashboard-overview"
        type: "screenshot"
        capture:
          mode: "auto"              # Playwright navigates + screenshots automatically
          route: "/dashboard"
          actions: []
          waitFor: "[data-testid='dashboard']"
          delay: 1500
        screenshot: null
        duration: 9
        caption: "Your Dashboard"
        highlights:
          - x: 10
            y: 15
            width: 35
            height: 25
            label: "Quick Stats"
            delay: 40
        callout:
          text: "Everything you need at a glance"
          x: 50
          y: 85
          delay: 100
          size: "md"
          align: "center"
        voiceover:
          script: "The dashboard gives you a complete overview. Key metrics, recent activity, and quick actions are all right here."
          file: null
          duration: null

outro:
  nextVideoTitle: "Creating Your First Project"
  duration: 5
  voiceover:
    script: "That's the basics. Next up — creating your first project."
    file: null
    duration: null

metadata:
  totalDuration: null
  totalFrames: null
  screenshotsCaptured: 0
  screenshotsTotal: 1
  voiceoverGenerated: 0
  voiceoverTotal: 4
  lastBuilt: null
  lastRendered: null
```

### Run the Pipeline

One command does everything:

```bash
autoguide go 01-getting-started
```

Or run stages individually:

```bash
# 1. Capture screenshots (auto-navigates your app via Playwright)
autoguide capture 01-getting-started

# 2. Generate voiceover narration (ElevenLabs TTS)
autoguide voiceover 01-getting-started

# 3. Generate Remotion compositions (.tsx code)
autoguide build --all

# 4. Render final MP4
autoguide render 01-getting-started
```

### Check Progress

```bash
autoguide status
```

```
Autoguide Status — My App

Video                | Plan | Capture | Voiceover | Build | Render
─────────────────────┼──────┼─────────┼───────────┼───────┼───────
01-getting-started   | OK   | 1/1     | 4/4       | OK    | OK
02-first-project     | OK   | 0/5     | 0/8       | --    | --

Legend: OK = complete, N/M = progress, -- = not started
```

## How It Works

### The Video Plan YAML

The plan is the single source of truth. Every stage reads from it and writes back to it:

```
Plan created     → scripts written, highlights placed, capture instructions set
                   (file/duration fields are null)

Capture runs     → screenshot paths populated
                   (metadata.screenshotsCaptured updated)

Voiceover runs   → MP3 files generated, durations measured
                   scene durations auto-adjusted (voDuration + buffer)
                   (metadata.voiceoverGenerated updated)

Build runs       → .tsx compositions generated from plan
                   (metadata.totalFrames, lastBuilt updated)

Render runs      → final MP4 produced
                   (metadata.lastRendered updated)
```

### Capture Modes

- **Auto** — Playwright navigates to a route, executes actions (click, type, hover, wait), and takes a screenshot. Handles login automatically.
- **Manual** — Prompts you to set up a complex app state (modals, multi-step forms) and take the screenshot yourself.

### Duration Sync

When voiceover audio is generated, scene durations are auto-adjusted:

```
grid-view: voiceover = 7.82s + 0.8s buffer = 8.62s
           scene duration was 8s → extended to 8.7s
```

You never manually sync timing.

### Lock Blocks

After `autoguide build` generates `.tsx` files, you can manually tweak them. Wrap your edits in lock blocks to preserve them across rebuilds:

```tsx
// @autoguide-lock
<HighlightOverlay delay={40} highlights={[
  { x: 78, y: 12, width: 8, height: 7, label: 'Custom tweak' }
]} />
// @autoguide-unlock
```

### Iteration

UI changed? Retake one screenshot and rebuild:

```bash
autoguide capture 01-getting-started --retake dashboard-overview
autoguide build 01-getting-started
autoguide render 01-getting-started
```

## CLI Reference

| Command | Description |
|---------|-------------|
| `autoguide init` | Initialize project (config + directories + Remotion scaffolding) |
| `autoguide plan <video-id>` | Create or view a video plan |
| `autoguide capture [video-id]` | Capture screenshots (auto + manual) |
| `autoguide voiceover [video-id]` | Generate TTS narration from scripts |
| `autoguide build [video-id]` | Generate Remotion `.tsx` compositions |
| `autoguide render [video-id]` | Render final MP4 video |
| `autoguide go [video-id]` | Run full pipeline end-to-end |
| `autoguide status` | Show pipeline progress for all videos |

Most commands support `--all` to operate on every plan. See `autoguide <command> --help` for all flags.

## Architecture

```
@autoguide/claude-skill  →  @autoguide/cli  →  @autoguide/core  →  remotion
```

| Package | What it does |
|---------|-------------|
| `@autoguide/core` | Remotion components (IntroSlide, ScreenshotScene, HighlightOverlay, TextCallout, SectionTitle, OutroSlide, TransitionWipe), compositions (VideoComposition, MasterComposition), theme system (dark/light/minimal), TypeScript types |
| `@autoguide/cli` | 8 CLI commands, Playwright capture engine, ElevenLabs TTS client, Remotion code generator with lock preservation |
| `@autoguide/claude-skill` | 9 Claude Code `/video:*` skills for AI-assisted video creation |

## Claude Code Skills

If you use [Claude Code](https://claude.ai/claude-code), install the skill pack for conversational video creation:

```
/video:init              — Interactive setup (explores your project, generates config)
/video:plan <module>     — AI-assisted video planning (proposes scenes, writes scripts)
/video:capture [id]      — Capture with error recovery (diagnoses selector failures)
/video:voiceover [id]    — Script review + generation
/video:build [id]        — Build + code review
/video:render [id]       — Render + report
/video:go [id]           — Full pipeline with error handling
/video:status            — Status summary + next action suggestions
/video:adjust <id>       — Re-sync after manual changes
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Video engine | Remotion 4.x |
| Components | React 18, TypeScript 5 |
| Screenshot capture | Playwright |
| Text-to-speech | ElevenLabs API (pluggable) |
| Audio measurement | @remotion/media-parser |
| CLI framework | Commander.js |
| Config/plan format | YAML (js-yaml) |
| Validation | Zod |
| Monorepo | pnpm workspaces |
| Build | tsup (packages), Remotion CLI (video) |

## Documentation

- [Design Specification](docs/specs/2026-04-08-autoguide-design.md)

## License

MIT
