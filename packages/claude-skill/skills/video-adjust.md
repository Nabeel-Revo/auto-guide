---
name: video:adjust
description: Re-sync after manual changes — detects changes, re-measures durations, regenerates compositions
---

# /video:adjust — Re-sync After Manual Changes

## Arguments

- `<video-id>` — The video to re-sync

## What You Do

1. **Detect what changed:**
   - Check if any screenshot files were added or replaced
   - Check if any voiceover MP3 files were re-recorded
   - Check if the plan YAML was manually edited
   - Compare file timestamps with plan metadata

2. **Re-measure voiceover durations:**
   - If any VO files changed, the CLI can re-measure their durations
   - This is done by reading each MP3 and extracting its duration
   - Update the plan with new duration values

3. **Auto-adjust scene durations:**
   - If VO duration + buffer > current scene duration, extend the scene
   - Report any duration changes

4. **Regenerate compositions:**
   ```bash
   autoguide build <video-id>
   ```
   - This respects `@autoguide-lock` blocks — manual edits are preserved

5. **Report what changed:**
   ```
   Adjusted: 01-project-overview
     - 2 voiceover durations updated
     - 1 scene extended (grid-view: 8s → 10.2s)
     - Composition regenerated (2880 → 2946 frames)
   ```

## When to Use

- After manually re-recording a voiceover with different timing
- After replacing screenshots with better ones
- After editing the plan YAML by hand
- After any change that might affect scene timing
