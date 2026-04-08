---
name: video:render
description: Render final MP4 videos using Remotion — invokes remotion render and reports output
---

# /video:render — Video Rendering

## Arguments

- `[video-id]` — Optional. Render a specific video. Use `--all` for all.

## What You Do

1. **Run render:**
   ```bash
   autoguide render <video-id>
   ```

2. **Monitor output:**
   - The Remotion CLI shows a progress bar
   - Report the final file location and size when done

3. **If render fails:**
   - Check for common issues:
     - Missing screenshots (run `autoguide capture` first)
     - Missing voiceover files (run `autoguide voiceover` first)
     - Composition not built (run `autoguide build` first)
     - Missing fonts or assets
   - Suggest the fix and re-run

4. **Report:**
   ```
   Rendered: output/01-project-overview.mp4 (24.3 MB)
   ```

## Tips

- Rendering is CPU-intensive — suggest `--concurrency` flag for faster renders on multi-core machines
- Lower `--quality` number = better quality but larger file
- Default CRF 18 is a good balance of quality and size
