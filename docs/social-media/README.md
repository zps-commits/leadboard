# Social media pack

Generated from the running application. No image is drawn by a model and
no figure is invented.

| File | What it is |
| --- | --- |
| `assets/` | Real captures of the built app, `npm run shots` |
| `composed/` | Four 1080×1350 images built from them, `npm run social` |
| `linkedin-post-en.md` / `.txt` | The post in English |
| `linkedin-post-pt.md` / `.txt` | The same post in Portuguese |
| `codex-posting-prompt.md` | Instructions for the agent that publishes it |

To regenerate after a change to the app:

```bash
npm run build && npm run start -- --port 5411
npm run db:seed
SHOT_URL=http://localhost:5411 npm run shots
npm run social
```

The screens in these images appear whole — never cropped, never bleeding
off an edge — and the captures are element captures rather than viewport
crops, which cut labels in half and omit whatever is below the fold.
