---
name: video:go
description: Full pipeline execution — runs all stages in sequence with intelligent error handling
---

# /video:go — Full Pipeline

## Arguments

- `[video-id]` — Optional. Run pipeline for a specific video. Use `--all` for all.

## What You Do

1. **Check current status:**
   ```bash
   autoguide status
   ```
   - Determine which stages are already complete
   - Skip completed stages unless the user wants to redo them

2. **Run the pipeline:**
   ```bash
   autoguide go <video-id>
   ```
   Or with skips for already-completed stages:
   ```bash
   autoguide go <video-id> --skip-capture --skip-voiceover
   ```

3. **Handle errors at each stage:**
   - If capture fails: diagnose and fix (see `/video:capture`)
   - If voiceover fails: check API key and provider config
   - If build fails: check plan validity
   - If render fails: check for missing assets

4. **Handle manual inputs:**
   - If there are manual capture scenes, guide the user through them
   - If voiceover is in approval mode, review scripts with the user

5. **Report final status:**
   ```
   Pipeline complete!
   Output: output/01-project-overview.mp4
   ```

## Tips

- Use `--from <stage>` to resume from a specific stage after fixing an error
- Use `--skip-render` to just build compositions without rendering (faster iteration)
