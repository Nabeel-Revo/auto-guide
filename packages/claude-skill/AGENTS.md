# Autoguide — Claude Code Skills

Video guide generation skills powered by the `@autoguide/cli`.

## Skills

- `/video:init` — Interactive first-time setup (explore project, generate config, scaffold dirs)
- `/video:plan <module>` — Brainstorm and create video plans interactively
- `/video:capture [video-id]` — Run screenshot capture with error recovery
- `/video:voiceover [video-id]` — Generate voiceovers with script review and duration sync
- `/video:build [video-id]` — Generate Remotion compositions from plans
- `/video:render [video-id]` — Render final MP4 videos
- `/video:go [video-id]` — Full pipeline execution
- `/video:status` — Show pipeline status and suggest next actions
- `/video:adjust <video-id>` — Re-sync after manual changes

## Prerequisites

- `@autoguide/cli` must be installed (`npm install -g @autoguide/cli` or available via `npx`)
- For capture: Playwright browsers installed (`npx playwright install chromium`)
- For voiceover: ElevenLabs API key configured
- For render: Remotion project built (`autoguide build` first)
