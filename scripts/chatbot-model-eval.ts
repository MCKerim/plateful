/**
 * Chatbot model comparison: does the model pick the right proposal tool?
 *
 * The failure this measures: with a SAVED recipe in the conversation, the
 * user asks for a change and the model calls `propose_recipe` (a new recipe)
 * instead of `propose_recipe_edit` — saving it creates a duplicate. The
 * script replays the chatbot edge function's exact request shape (same
 * instructions, tools, reasoning, previous_response_id tool loop and
 * known_recipe_ids check as supabase/functions/chatbot/index.ts) against each
 * model and scores what the user would see.
 *
 * Usage (Node ≥ 23.6, runs the .ts directly):
 *   OPENAI_API_KEY=sk-... node scripts/chatbot-model-eval.ts
 *   OPENAI_API_KEY=sk-... node scripts/chatbot-model-eval.ts --runs 5 \
 *     --models gpt-5.6-terra:low,gpt-6-sol:low,gpt-6-sol:none
 *
 * Prints a per-scenario table and a summary; writes the raw results as JSON
 * next to the current directory (chatbot-model-eval-<timestamp>.json).
 */
import { writeFileSync } from "node:fs";
import { createTools } from "../supabase/functions/chatbot/tools.ts";
import { DEFAULT_PROMPT } from "../supabase/functions/chatbot/prompts.ts";

type Effort = "none" | "low" | "medium" | "high";
type ModelConfig = { model: string; effort: Effort };
type Expected = { kind: "edit"; recipeId: string } | { kind: "new" } | { kind: "none" };
type Proposal = { tool: "propose_recipe" | "propose_recipe_edit"; proposalId: string; recipeId?: string; title?: string };
type TurnResult = {
  proposals: Proposal[];
  rejectedEdits: number;
  responseId: string;
  text: string;
  ms: number;
  usage: { input: number; cached: number; output: number };
};

// USD per 1M tokens (input, cached input, output) — OpenAI model pages, 2026-09-23.
const PRICES: Record<string, [number, number, number]> = {
  "gpt-5.6-terra": [2, 0.2, 12],
  "gpt-6-sol": [2, 0.2, 10],
  "gpt-6-luna": [0.1, 0.01, 0.5],
  "gpt-5.6-luna": [0.2, 0.02, 1.2],
};

const args = process.argv.slice(2);
const argValue = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const RUNS = Number(argValue("--runs") ?? 3);
const CONCURRENCY = Number(argValue("--concurrency") ?? 4);
const MODELS: ModelConfig[] = (argValue("--models") ?? "gpt-5.6-terra:low,gpt-6-sol:low,gpt-6-luna:low")
  .split(",")
  .map((spec) => {
    const [model, effort = "low"] = spec.split(":");
    return { model, effort: effort as Effort };
  });

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const BOLOGNESE_ID = "f8259c81-c46b-41c5-83cf-fa4b7c2fd9e5";
const CURRY_ID = "3b1d7e0a-9c2f-4e8b-a6d5-71f0c4e2b9a3";
const SAVED_BANANA_BREAD_ID = "a4c6e8f0-1b3d-4f5a-8c7e-9d0b2f4a6c8e";
const COLLECTIONS = [
  { id: "c1a2b3c4-0000-4000-8000-000000000001", name: "Pasta" },
  { id: "c1a2b3c4-0000-4000-8000-000000000002", name: "Backen" },
  { id: "c1a2b3c4-0000-4000-8000-000000000003", name: "Schnell & einfach" },
];

// Same format as src/page/Chatbot.tsx builds it.
const bologneseContext = `[Recipe Context]
recipeId: ${BOLOGNESE_ID}
title: Spaghetti Bolognese
description: Klassische Bolognese mit langer Schmorzeit.
servings: 4
ingredients:
- 500 g Rinderhackfleisch
- 1 Zwiebel
- 2 Karotten
- 2 Stangen Staudensellerie
- 2 Knoblauchzehen
- 800 g gehackte Tomaten
- 150 ml Rotwein
- 2 EL Olivenöl
- 1 TL Salz
- 400 g Spaghetti
instructions: 1. Gemüse fein würfeln und in Olivenöl anschwitzen.
2. Hackfleisch zugeben und krümelig braten.
3. Mit Rotwein ablöschen, Tomaten zugeben.
4. 90 Minuten bei kleiner Hitze schmoren, salzen.
5. Spaghetti kochen und mit der Soße servieren.
[End Recipe Context]

`;

const curryContext = `[Recipe Context]
recipeId: ${CURRY_ID}
title: Chicken Curry
description: A quick weeknight coconut curry.
servings: 2
ingredients:
- 400 g chicken thighs
- 1 onion
- 2 tbsp curry paste
- 400 ml coconut milk
- 1 tbsp soy sauce
- 150 g basmati rice
instructions: 1. Fry the onion, add curry paste.
2. Add chicken, then coconut milk and soy sauce; simmer 20 minutes.
3. Serve with rice.
[End Recipe Context]

`;

type Scenario = {
  id: string;
  note: string;
  knownIds: string[];
  // Earlier turns run for real (previous_response_id chain). `afterSetup`
  // turns the setup's proposals into the [Proposal Outcomes] line the app
  // would prepend once the user taps save; null = the user did not save.
  setup?: { message: string; expect: Expected; afterSetup: ((p: Proposal) => { outcome: string; knownId: string }) | null }[];
  message: string;
  expect: Expected;
};

const SCENARIOS: Scenario[] = [
  {
    id: "ctx-vegetarian",
    note: "saved recipe open, change requested",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Mach das bitte vegetarisch",
    expect: { kind: "edit", recipeId: BOLOGNESE_ID },
  },
  {
    id: "ctx-servings",
    note: "saved recipe open, scale",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Kannst du das für 6 Personen umrechnen?",
    expect: { kind: "edit", recipeId: BOLOGNESE_ID },
  },
  {
    id: "ctx-missing-ingredient",
    note: "saved recipe open, swap an ingredient",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Ich hab keinen Rotwein da, pass das bitte an",
    expect: { kind: "edit", recipeId: BOLOGNESE_ID },
  },
  {
    id: "ctx-quicker",
    note: "saved recipe open, vague improvement",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Geht das auch schneller? Ich hab nur 30 Minuten",
    expect: { kind: "edit", recipeId: BOLOGNESE_ID },
  },
  {
    id: "ctx-english-glutenfree",
    note: "saved recipe open, English",
    knownIds: [CURRY_ID],
    message: curryContext + "Can you make this gluten-free?",
    expect: { kind: "edit", recipeId: CURRY_ID },
  },
  {
    id: "ctx-keep-original",
    note: "saved recipe open, explicitly wants a separate recipe",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Mach mir daraus eine vegane Variante als eigenes Rezept, das Original will ich behalten",
    expect: { kind: "new" },
  },
  {
    id: "ctx-side-dish",
    note: "saved recipe open, asks for a different dish",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Was passt als Salat dazu? Gib mir ein Rezept",
    expect: { kind: "new" },
  },
  {
    id: "ctx-question",
    note: "saved recipe open, pure question",
    knownIds: [BOLOGNESE_ID],
    message: bologneseContext + "Wie lange kann ich die Soße im Kühlschrank aufbewahren?",
    expect: { kind: "none" },
  },
  {
    id: "fresh-new",
    note: "no context",
    knownIds: [],
    message: "Gib mir ein Rezept für Bananenbrot",
    expect: { kind: "new" },
  },
  {
    id: "saved-then-change",
    note: "proposal saved as new recipe, then a change",
    knownIds: [],
    setup: [
      {
        message: "Gib mir ein Rezept für Bananenbrot",
        expect: { kind: "new" },
        afterSetup: (p) => ({
          outcome: `Proposal ${p.proposalId} accepted. Saved as new recipe (id: ${SAVED_BANANA_BREAD_ID}, title: "${p.title}").`,
          knownId: SAVED_BANANA_BREAD_ID,
        }),
      },
    ],
    message: "Mach es bitte mit weniger Zucker",
    expect: { kind: "edit", recipeId: SAVED_BANANA_BREAD_ID },
  },
  {
    id: "saved-then-two-changes",
    note: "saved, then change + a follow-up change",
    knownIds: [],
    setup: [
      {
        message: "Gib mir ein Rezept für Bananenbrot",
        expect: { kind: "new" },
        afterSetup: (p) => ({
          outcome: `Proposal ${p.proposalId} accepted. Saved as new recipe (id: ${SAVED_BANANA_BREAD_ID}, title: "${p.title}").`,
          knownId: SAVED_BANANA_BREAD_ID,
        }),
      },
      {
        message: "Mach es bitte mit weniger Zucker",
        expect: { kind: "edit", recipeId: SAVED_BANANA_BREAD_ID },
        afterSetup: (p) => ({
          outcome: `Proposal ${p.proposalId} accepted. Recipe ${SAVED_BANANA_BREAD_ID} ("${p.title ?? "Bananenbrot"}") updated.`,
          knownId: SAVED_BANANA_BREAD_ID,
        }),
      },
    ],
    message: "Und jetzt noch mit Walnüssen",
    expect: { kind: "edit", recipeId: SAVED_BANANA_BREAD_ID },
  },
  {
    id: "ctx-edited-then-change",
    note: "saved recipe edited once, then another change",
    knownIds: [BOLOGNESE_ID],
    setup: [
      {
        message: bologneseContext + "Mach das bitte vegetarisch",
        expect: { kind: "edit", recipeId: BOLOGNESE_ID },
        afterSetup: (p) => ({
          outcome: `Proposal ${p.proposalId} accepted. Recipe ${BOLOGNESE_ID} ("Spaghetti Bolognese") updated.`,
          knownId: BOLOGNESE_ID,
        }),
      },
    ],
    message: "Und jetzt bitte etwas schärfer",
    expect: { kind: "edit", recipeId: BOLOGNESE_ID },
  },
  {
    id: "unsaved-then-change",
    note: "proposal NOT saved, then a change → propose_recipe again is correct",
    knownIds: [],
    setup: [{ message: "Gib mir ein Rezept für Bananenbrot", expect: { kind: "new" }, afterSetup: null }],
    message: "Mach es bitte mit weniger Zucker",
    expect: { kind: "new" },
  },
];

// ── The chatbot loop, mirrored from supabase/functions/chatbot/index.ts ─────

type OpenAIResponse = {
  id: string;
  output_text?: string;
  output?: { type: string; name?: string; arguments?: string; call_id?: string; content?: { text?: string }[] }[];
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
};

const TOOLS = createTools(COLLECTIONS);

async function createResponse(body: Record<string, unknown>): Promise<OpenAIResponse> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    });
    if (res.ok) return (await res.json()) as OpenAIResponse;
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 500)}`);
  }
}

async function runTurn(
  config: ModelConfig,
  text: string,
  previousResponseId: string | null,
  knownIds: Set<string>,
  counter: { value: number },
): Promise<TurnResult> {
  const base = {
    model: config.model,
    reasoning: { effort: config.effort },
    tools: TOOLS,
    instructions: DEFAULT_PROMPT,
  };
  const usage = { input: 0, cached: 0, output: 0 };
  const addUsage = (r: OpenAIResponse) => {
    usage.input += r.usage?.input_tokens ?? 0;
    usage.cached += r.usage?.input_tokens_details?.cached_tokens ?? 0;
    usage.output += r.usage?.output_tokens ?? 0;
  };
  const started = performance.now();
  let answer = await createResponse({
    ...base,
    previous_response_id: previousResponseId,
    input: [{ role: "user", content: [{ type: "input_text", text }] }],
  });
  addUsage(answer);
  const proposals: Proposal[] = [];
  let rejectedEdits = 0;
  let loopCount = 0;
  let toolOutputs: unknown[] = [];
  do {
    toolOutputs = [];
    for (const item of answer.output ?? []) {
      if (item.type !== "function_call") continue;
      const parsed = JSON.parse(item.arguments ?? "{}");
      counter.value++;
      const proposalId = `p_${counter.value}`;
      if (item.name === "propose_recipe") {
        proposals.push({ tool: "propose_recipe", proposalId, title: parsed.title });
        toolOutputs.push({ type: "function_call_output", call_id: item.call_id, output: `Recipe proposal ${proposalId} shown to user.` });
      } else if (item.name === "propose_recipe_edit") {
        if (!knownIds.has(parsed.recipeId)) {
          counter.value--;
          rejectedEdits++;
          toolOutputs.push({
            type: "function_call_output",
            call_id: item.call_id,
            output: `Error: recipeId ${parsed.recipeId} is not a saved recipe. Valid recipeIds only come from [Recipe Context] or [Proposal Outcomes] blocks. Use propose_recipe instead for unsaved proposals.`,
          });
          continue;
        }
        proposals.push({ tool: "propose_recipe_edit", proposalId, recipeId: parsed.recipeId, title: parsed.title });
        toolOutputs.push({ type: "function_call_output", call_id: item.call_id, output: `Edit proposal ${proposalId} shown to user.` });
      }
    }
    if (toolOutputs.length !== 0) {
      answer = await createResponse({ ...base, previous_response_id: answer.id, input: toolOutputs });
      addUsage(answer);
    }
    loopCount++;
  } while (toolOutputs.length !== 0 && loopCount <= 5);
  return { proposals, rejectedEdits, responseId: answer.id, text: answer.output_text ?? textOf(answer), ms: performance.now() - started, usage };
}

function textOf(response: OpenAIResponse): string {
  return (response.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .map((c) => c.text ?? "")
    .join("");
}

type Verdict = "ok" | "duplicate" | "wrong-id" | "no-proposal" | "unwanted-edit" | "unwanted-proposal" | "multiple";

function judge(expected: Expected, turn: TurnResult): Verdict {
  const edits = turn.proposals.filter((p) => p.tool === "propose_recipe_edit");
  const news = turn.proposals.filter((p) => p.tool === "propose_recipe");
  if (expected.kind === "none") return turn.proposals.length === 0 ? "ok" : "unwanted-proposal";
  if (expected.kind === "new") {
    if (edits.length > 0) return "unwanted-edit";
    if (news.length === 0) return "no-proposal";
    return news.length === 1 ? "ok" : "multiple";
  }
  // The failure we care most about: a change to a saved recipe proposed as a new one.
  if (news.length > 0) return "duplicate";
  if (edits.length === 0) return "no-proposal";
  if (edits.some((e) => e.recipeId !== expected.recipeId)) return "wrong-id";
  return edits.length === 1 ? "ok" : "multiple";
}

type Result = {
  model: string;
  effort: Effort;
  scenario: string;
  run: number;
  verdict: Verdict | "setup-failed" | "error";
  setupVerdict?: Verdict;
  proposals?: Proposal[];
  rejectedEdits?: number;
  ms?: number;
  costUsd?: number;
  text?: string;
  error?: string;
};

function cost(model: string, u: TurnResult["usage"]) {
  const [inp, cached, out] = PRICES[model] ?? [NaN, NaN, NaN];
  return ((u.input - u.cached) * inp + u.cached * cached + u.output * out) / 1e6;
}

async function runScenario(config: ModelConfig, scenario: Scenario, run: number): Promise<Result> {
  const base = { model: config.model, effort: config.effort, scenario: scenario.id, run };
  try {
    const knownIds = new Set(scenario.knownIds);
    const counter = { value: 0 };
    let previous: string | null = null;
    let outcomes: string[] = [];
    for (const step of scenario.setup ?? []) {
      const prefix = outcomes.length ? `[Proposal Outcomes]\n${outcomes.join("\n")}\n[End Proposal Outcomes]\n\n` : "";
      outcomes = [];
      const turn = await runTurn(config, prefix + step.message, previous, knownIds, counter);
      const verdict = judge(step.expect, turn);
      if (verdict !== "ok") return { ...base, verdict: "setup-failed", setupVerdict: verdict, proposals: turn.proposals };
      previous = turn.responseId;
      if (step.afterSetup) {
        const { outcome, knownId } = step.afterSetup(turn.proposals[0]);
        outcomes.push(outcome);
        knownIds.add(knownId);
      }
    }
    const prefix = outcomes.length ? `[Proposal Outcomes]\n${outcomes.join("\n")}\n[End Proposal Outcomes]\n\n` : "";
    const turn = await runTurn(config, prefix + scenario.message, previous, knownIds, counter);
    return {
      ...base,
      verdict: judge(scenario.expect, turn),
      proposals: turn.proposals,
      rejectedEdits: turn.rejectedEdits,
      ms: turn.ms,
      costUsd: cost(config.model, turn.usage),
      text: turn.text,
    };
  } catch (error) {
    return { ...base, verdict: "error", error: String(error) };
  }
}

async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        results[i] = await tasks[i]();
        process.stderr.write(`\r${++done}/${tasks.length}`);
      }
    }),
  );
  process.stderr.write("\n");
  return results;
}

// ── Run + report ────────────────────────────────────────────────────────────

const tasks = MODELS.flatMap((config) =>
  SCENARIOS.flatMap((scenario) => Array.from({ length: RUNS }, (_, run) => () => runScenario(config, scenario, run))),
);
const results = await pool(tasks, CONCURRENCY);

const label = (c: { model: string; effort: string }) => `${c.model}:${c.effort}`;
const labels = MODELS.map(label);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};

console.log(`\n${RUNS} run(s) per scenario. Cell = ok/scored, failures listed.\n`);
const pad = (s: string, n: number) => s.padEnd(n);
const col = Math.max(...labels.map((l) => l.length), 18) + 2;
console.log(pad("scenario", 26) + labels.map((l) => pad(l, col)).join(""));
for (const scenario of SCENARIOS) {
  const cells = MODELS.map((c) => {
    const rs = results.filter((r) => label(r) === label(c) && r.scenario === scenario.id);
    const scored = rs.filter((r) => r.verdict !== "setup-failed" && r.verdict !== "error");
    const ok = scored.filter((r) => r.verdict === "ok").length;
    const other = rs.filter((r) => r.verdict !== "ok").map((r) => (r.verdict === "setup-failed" ? `setup:${r.setupVerdict}` : r.verdict));
    return `${ok}/${scored.length}${other.length ? " " + [...new Set(other)].join(",") : ""}`;
  });
  console.log(pad(scenario.id, 26) + cells.map((c) => pad(c, col)).join(""));
}

console.log("\nSummary");
for (const c of MODELS) {
  const rs = results.filter((r) => label(r) === label(c));
  const scored = rs.filter((r) => r.verdict !== "setup-failed" && r.verdict !== "error");
  const ok = scored.filter((r) => r.verdict === "ok").length;
  const duplicates = scored.filter((r) => r.verdict === "duplicate").length;
  const editScored = scored.filter((r) => SCENARIOS.find((s) => s.id === r.scenario)?.expect.kind === "edit").length;
  const ms = scored.map((r) => r.ms ?? 0);
  const totalCost = scored.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
  console.log(
    `${pad(label(c), col)} correct ${ok}/${scored.length} (${((100 * ok) / Math.max(scored.length, 1)).toFixed(0)}%)` +
      ` · duplicates ${duplicates}/${editScored}` +
      ` · setup failed ${rs.filter((r) => r.verdict === "setup-failed").length}` +
      ` · errors ${rs.filter((r) => r.verdict === "error").length}` +
      ` · median turn ${(median(ms) / 1000).toFixed(1)}s (max ${(Math.max(...ms, 0) / 1000).toFixed(1)}s)` +
      ` · ≈$${((1000 * totalCost) / Math.max(scored.length, 1)).toFixed(2)} per 1000 turns`,
  );
}
const firstError = results.find((r) => r.verdict === "error");
if (firstError) console.log(`\nFirst error: ${firstError.error}`);

const file = `chatbot-model-eval-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ runs: RUNS, models: MODELS, results }, null, 2));
console.log(`\nRaw results: ${file}`);
