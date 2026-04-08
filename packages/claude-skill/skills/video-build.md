---
name: video:build
description: Generate Remotion compositions from video plans — creates .tsx files with scene timing and animations
---

# /video:build — Composition Generation

## Arguments

- `[video-id]` — Optional. Build a specific video. Use `--all` for all.

## What You Do

1. **Run build:**
   ```bash
   autoguide build <video-id>
   ```

2. **Review generated code:**
   - Read the generated `.tsx` file at `src/videos/<video-id>/`
   - Check that all scenes are present and ordered correctly
   - Verify highlight positions and callout text look reasonable
   - Check total frame count and duration

3. **If there are locked blocks (`@autoguide-lock`):**
   - Verify locked blocks still make sense with the current plan
   - If a scene was removed or significantly changed, warn the user that a locked block may be stale
   - The user can remove locks manually if they want fresh generation

4. **Report:**
   ```
   Build complete: src/videos/01-project-overview/ProjectOverview.tsx
     - 3 sections, 9 scenes
     - Total: 2880 frames (96s)
   
   Next: autoguide render <video-id>
   ```

## Tips

- Use `--dry-run` to preview generated code length without writing
- Use `--all` to rebuild all videos after config changes (e.g., theme update)
- After manual edits to generated code, wrap them in `// @autoguide-lock` / `// @autoguide-unlock` to preserve across rebuilds
