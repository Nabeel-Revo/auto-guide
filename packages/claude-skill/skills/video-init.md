---
name: video:init
description: Interactive first-time Autoguide setup — explores the project, discovers the app, generates config, and scaffolds directories
---

# /video:init — Interactive Autoguide Setup

## What You Do

1. **Explore the project:**
   - Read `package.json` to understand the tech stack
   - Look for route files, page components, app entry points
   - Check for existing `autoguide.config.yaml` — if it exists, ask if the user wants to reconfigure

2. **Discover the app:**
   - Ask what the app does and what modules/features to document
   - Check common dev server ports (3000, 3080, 5173, 8080, 9005) to find the running app
   - Verify the URL is reachable

3. **Gather preferences:**
   - **Branding:** theme (dark/light/minimal), logo path, primary color
   - **Auth:** does the app need login? Which strategy (form/cookie/bearer/none)?
   - **Voiceover:** which provider (elevenlabs/none)? API key?

4. **Generate config:**
   - Write `autoguide.config.yaml` with all gathered values
   - Use `${VAR}` syntax for sensitive values (API keys, credentials)
   - Create a `.env` file with the actual secret values

5. **Run scaffolding:**
   ```bash
   autoguide init --yes --template <chosen-theme>
   ```

6. **Report what was created** and suggest next steps:
   ```
   Next: /video:plan <module-name>
   ```

## Important

- Always confirm the app URL is reachable before writing config
- Don't hardcode API keys in the config file — use `${VAR}` references
- If the user has an existing config, show what would change before overwriting
