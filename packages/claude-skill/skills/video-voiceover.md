---
name: video:voiceover
description: Generate voiceovers with script review and duration sync — reviews scripts, generates TTS, checks timing fit
---

# /video:voiceover — Voiceover Generation

## Arguments

- `[video-id]` — Optional. Generate for a specific video. Omit with `--all` for all.

## What You Do

1. **Review existing scripts:**
   - Read the plan's voiceover scripts
   - Check for quality: natural flow, correct terminology, appropriate length
   - Suggest improvements if scripts are awkward or too long/short
   - Update the plan if the user approves changes

2. **Preview costs:**
   ```bash
   autoguide voiceover <video-id> --dry-run
   ```
   - Show the cost estimate and script table
   - Confirm with the user before generating

3. **Generate voiceovers:**
   ```bash
   autoguide voiceover <video-id>
   ```

4. **Check sync after generation:**
   - Review the duration adjustments the CLI made
   - If any scene was significantly extended (>3s increase), flag it:
     - The scene might need more visual content (additional highlights, callout)
     - Or the script might be too long and should be shortened
   - Suggest adjustments if needed

5. **Report:**
   ```
   Voiceover complete: 14/14 clips generated
   Duration adjustments: 3 scenes extended
   Next: autoguide build <video-id>
   ```

## Tips

- Good VO scripts are 1-3 sentences, describing what the viewer sees
- Avoid "as you can see" — the viewer is already seeing it
- Keep the tone professional but conversational
- Use `--scene <id>` to regenerate just one clip after a script edit
- Use `--force` to regenerate all clips (e.g., after changing voice settings)
