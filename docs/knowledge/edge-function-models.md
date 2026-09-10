# Edge-function models and reasoning

**Where the OpenAI calls are:** `supabase/functions/chatbot/index.ts` (Responses API via `npm:openai`, tool loop with `propose_recipe` / `propose_recipe_edit`, conversation memory through `previous_response_id`) and `supabase/functions/search/index.ts` (`parseQuery`, Chat Completions with a strict JSON schema, 4 s budget). Nothing else in this repo talks to a model; recipe imports, remix, nutrition and the iOS cooking-mode assistant live in the recipe-extractor.

**Since 2026-09-10:**

- **Chatbot → `gpt-5.6-terra`, `reasoning: { effort: "low" }`** on both `responses.create` calls. Terra (mini tier) because the chatbot is an agentic loop — proposals, edits, remembering what was saved — where gpt-5.4-nano made frequent mistakes (Kerim, 2026-09-10). `low` is deliberate: OpenAI's default for the 5.6 family is `medium`, and unbounded thinking on a small model leaked English planning notes into a German answer in the extractor's Ask route (its `docs/knowledge/ask-no-reasoning.md`). If the chatbot ever shows English notes-to-self inside an answer, drop to `none` — that is the only setting that removes the thinking channel.
- **First call retries once without `previous_response_id`** when OpenAI rejects it. Chatbot state is in-memory Redux (not persisted), so this only matters for tabs open across a deploy or an expired response id — but without it such a tab is stranded with `HTTP 500` until reload.
- **Search parser → `gpt-5.6-luna`, `reasoning_effort: "none"`.** A fixed schema and a 4 s timeout have no use for thinking; a slow parse silently degrades to no chips.
- **No `temperature` on either call.** gpt-5 models reject or ignore it depending on tier; the search comment about "some 5.x tiers reject it" is that lesson.

**Why nano is gone:** the 2026-07-29 migration (`474acdf`) picked gpt-5.4-nano because Luna cost 5× more that day ($1/$6 vs $0.20/$1.25 per 1M tokens). OpenAI cut Luna to $0.20/$1.20 on 2026-07-30, so the split bought nothing. Terra is $2/$12 — about ten times Luna per token, irrelevant at the chatbot's volume.

**Deploying:** there is no Supabase CLI on the Mac; the functions are deployed through the Supabase MCP (`deploy_edge_function`, project `upupcsgufoejppoietiu`, `verify_jwt: true` for both). Chatbot needs all four files (`index.ts`, `tools.ts`, `headers.ts`, `prompts.ts`), search only `index.ts`; neither uses an import map. Pushing the repo does NOT deploy edge functions — Vercel builds the web app only.
