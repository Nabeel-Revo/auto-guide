---
name: video:status
description: Show pipeline status and suggest next actions — displays progress table for all videos
---

# /video:status — Pipeline Status

## What You Do

1. **Run status:**
   ```bash
   autoguide status
   ```

2. **Interpret the table:**
   - `OK` = stage complete
   - `N/M` = partial progress (e.g., 5/9 screenshots captured)
   - `--` = not started
   - `ERR` = plan file has errors

3. **Summarize what needs attention:**
   - Which videos are ready for the next stage?
   - Which videos have failed or incomplete stages?
   - What's the overall progress?

4. **Suggest next action:**
   - If screenshots are missing: "Run `/video:capture <id>` to capture remaining screenshots"
   - If voiceovers aren't generated: "Run `/video:voiceover <id>` to generate narration"
   - If everything is ready: "Run `/video:render --all` to render all videos"
