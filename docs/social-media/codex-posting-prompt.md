# Prompt for the agent that will publish this

Paste the block below into Codex (or whichever agent holds the LinkedIn
session).

---

Publish a LinkedIn post from my account.

**Text:** use `docs/social-media/linkedin-post-en.txt` from
https://github.com/zps-commits/leadboard **verbatim**. Do not rewrite it,
do not add emoji, do not add a hook line, do not change the hashtags. If it
exceeds the character limit, tell me and stop rather than trimming it.

**Images:** attach these four, in this order:
1. `docs/social-media/composed/1-cover.png`
2. `docs/social-media/composed/2-problem.png`
3. `docs/social-media/composed/3-solution.png`
4. `docs/social-media/composed/4-build.png`

**Alt text**, one per image, exactly as written:
1. "Cover: LeadBoard, a small CRM, with a phone showing the pipeline board."
2. "The conflict in the brief: a SQLite file on a serverless host is not
   storage, and the loss is silent."
3. "The running app: the dashboard figures, the leads held in each stage,
   and one column of the pipeline board."
4. "The build: Next.js 16, React 19, TypeScript and Drizzle, with the one
   line that fixed a phone scrolling sideways into blank paper."

**Rules:**
- Do not invent users, clients, revenue or any other metric. The only
  figures allowed are the ones already in the text: 97 tests, five routes,
  four widths, zero accessibility violations.
- Do not describe it as a product in use, and do not suggest anyone put a
  real client list into the hosted demonstration — it has no
  authentication, which the post and the app both say.
- Post once, to my personal profile, with no scheduling.
- Tell me the URL of the published post when it is done.

For a Portuguese audience use `linkedin-post-pt.txt` under the same rules.
