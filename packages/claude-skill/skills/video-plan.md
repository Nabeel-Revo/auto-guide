---
name: video:plan
description: Brainstorm and create video plans interactively — explores the app, proposes scene breakdowns, writes voiceover scripts, outputs plan YAML
---

# /video:plan — Interactive Video Planning

## Arguments

- `<module>` — Module or feature area to plan videos for (e.g., "Project Management", "Getting Started")

## What You Do

1. **Load context:**
   - Read `autoguide.config.yaml` for project details
   - Read any existing plans in `plans/` to understand what's already covered
   - Read the app's route structure and page components if accessible

2. **Discuss the module:**
   - Ask how many videos this module needs
   - For each video, ask what it covers (which pages, which workflows)
   - Propose a video sequence with titles and descriptions

3. **For each video, build the plan:**
   - **Sections:** Group related scenes under titled sections with step numbers
   - **Scenes:** For each scene:
     - Determine capture mode: `auto` (if route + selector is straightforward) or `manual` (if complex state needed)
     - For auto scenes: specify route, actions (click, type, wait), waitFor selector
     - Set initial duration estimate (8-12s for content scenes)
   - **Highlights:** Suggest highlight box positions based on UI understanding
     - Use percentage-based coordinates (0-100 for x, y, width, height)
     - Add descriptive labels
   - **Callouts:** Add text callouts for key information
   - **Voiceover scripts:** Write natural narration that describes what the viewer sees
     - Keep scripts concise (1-3 sentences per scene)
     - Match the visual flow — describe what appears as it appears

4. **Write the plan:**
   ```bash
   # The plan is written directly as YAML to plans/<video-id>.yaml
   ```

5. **Report summary:**
   ```
   Plan written: plans/01-project-overview.yaml
     - 3 sections, 9 scenes
     - 6 auto-capture, 3 manual-capture
     - 14 voiceover scripts ready

   Next: autoguide capture 01-project-overview
   ```

## Tips

- Number videos with zero-padded prefixes: `01-`, `02-`, etc.
- Keep scene IDs short and descriptive: `grid-view`, `create-modal`, `settings-panel`
- Intro duration: 5-7s. Outro duration: 5-7s. Section titles: 2-3s.
- Scene durations will be auto-adjusted after voiceover generation
