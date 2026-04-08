---
name: video:capture
description: Run screenshot capture with intelligent error recovery — diagnoses failures, suggests fixes, retries
---

# /video:capture — Screenshot Capture with Error Recovery

## Arguments

- `[video-id]` — Optional. Captures for a specific video. Omit with `--all` for all videos.

## What You Do

1. **Run capture:**
   ```bash
   autoguide capture <video-id>
   ```

2. **If any auto-captures fail:**
   - Read the error log at `.autoguide/capture-errors.log`
   - For each failure, diagnose the issue:
     - **Selector not found:** Check if the selector is correct. Read the app's source to find the right selector. Update the plan.
     - **Page not loaded:** Check if the route is correct. Increase delay in the plan.
     - **Element hidden:** May need a click action to reveal it first. Add actions to the plan.
     - **Timeout:** Increase the timeout or add a waitFor selector.
   - Update the plan YAML with fixes
   - Retry failed captures:
     ```bash
     autoguide capture <video-id> --retake <scene-id>
     ```

3. **For manual captures:**
   - Guide the user through each manual screenshot
   - Explain what state the app needs to be in
   - Verify the screenshot was saved to the correct path

4. **Report status:**
   ```
   Capture complete: 9/9 succeeded
   Next: autoguide voiceover <video-id>
   ```

## Flags to Know

- `--auto-only` — Skip manual captures (useful for CI or when manual shots are already taken)
- `--manual-only` — Only prompt for manual captures
- `--headed` — Show the browser window (useful for debugging)
- `--retake <scene-id>` — Re-capture a specific scene
