# Chatbot Design — Ideal / Future State

This document describes the target design for the AI Chef chatbot. It is not yet fully implemented. Use it as the reference for all future chatbot work.

---

## Vision

The AI Chef is a full cooking assistant that can create recipes, answer questions, and edit any recipe in the user's cookbook. The user stays in control through explicit confirmation at every write action. Recipe history makes every edit reversible, so the AI can act freely without risk of permanent data loss.

---

## Core Principles

- **One proposal at a time.** The AI never produces multiple proposals in a single response. One action, one decision.
- **Every decision is explicit.** The input area is replaced by action buttons whenever a proposal is pending. The user cannot continue the conversation without deciding first.
- **Every decision feeds back.** Both saves and dismissals send feedback to the AI. The AI always knows what happened to its proposals.
- **History is the safety net.** Every AI-applied edit is snapshotted before saving. The user can always undo from the recipe page.
- **RAG is read-only.** The AI can look up any cookbook recipe, but retrieval alone does not grant edit permission. Edits require explicit user confirmation via the proposal system.

---

## Recipe Context Banner

A persistent strip below the chat header that shows when a recipe is the current focus of the conversation.

```
┌─────────────────────────────────┐
│ ← AI Chef              [reset]  │
│ 📖 Banana Bread  [×]            │  ← context banner
├─────────────────────────────────┤
```

### How it appears
- Automatically when the user navigates to the chatbot from a recipe page via "Ask AI"
- Automatically when the AI retrieves a recipe via RAG and begins actively working on it (e.g. proposing an edit)

### What it does
- Tells the user which recipe the AI is currently focused on
- Injects the full recipe context (id, title, category, description, servings, ingredients, instructions) into the next message sent to the AI
- Is informational only — it does not gate what the AI is allowed to edit (history handles that)

### Dismissing it
- Tapping **[×]** clears the recipe focus without resetting the chat
- The conversation history is preserved

### Switching recipes mid-conversation
When the user taps "Ask AI" on a different recipe while a banner is already active, a bottom sheet appears:

```
You're already chatting about [Current Recipe]

[ Start fresh with New Recipe ]
[ Continue this conversation ]
```

- **Start fresh** — resets the chat and loads the new recipe into the banner
- **Continue** — keeps all chat history and replaces the banner with the new recipe context; a visual divider is inserted in the chat: `─── Now discussing: New Recipe ───`

### No banner state
When the chatbot is opened directly (not from a recipe page), no banner is shown. The AI can still retrieve and edit any recipe via RAG tools, and the banner will appear automatically if the AI begins working on a specific recipe.

---

## Editable Scope

The AI can edit:
1. **Any recipe in the user's cookbook** — retrieved via RAG tools, confirmed via the proposal system, protected by history snapshots
2. **Recipes created in the current conversation** — proposed by the AI and saved by the user earlier in this session

The previous restriction (banner recipe + session recipes only) is removed once recipe history is in place.

---

## Proposal System

Proposals are the only way the AI writes to the user's data. There are two types: creating a new recipe and editing an existing one.

### Inline proposal card

When the AI calls a recipe tool, a card appears directly inside the assistant's message bubble — no modal dialog.

**New recipe:**
```
┌───────────────────────────────────┐
│  🍝 Creamy Tomato Pasta           │
│  Main dish · 4 servings           │
│  8 ingredients        [expand ˅]  │
└───────────────────────────────────┘
```

**Edit existing recipe:**
```
┌───────────────────────────────────┐
│  Edit: Banana Bread               │
│  ── What changed ──────────────── │
│  • Sugar: 200g → 150g             │
│  • Added: 2 tbsp honey            │
│  • Step 3 rewritten               │
│                    [expand ˅]     │
└───────────────────────────────────┘
```

The diff for edit proposals is computed by comparing the AI's proposed changes against the current recipe data. The expand chevron reveals the full recipe for users who want to review everything before deciding.

### Blocking action bar

Whenever a proposal is pending, the text input area is replaced by the action bar:

**New recipe:**
```
[ Save to Cookbook ]       [ Not for me ]
```

**Edit:**
```
[ Apply Changes ]          [ Keep Original ]
```

The user cannot type or send another message until they act on the proposal. After acting, the input area is restored and the conversation continues.

### Post-decision card state

Once decided, the card in chat history updates to a locked state with no further action buttons:

**Saved:**
```
✓ Saved: Creamy Tomato Pasta         [Open →]
```

**Dismissed:**
```
Skipped · Creamy Tomato Pasta
```

The card is now a historical record only. It cannot be re-actioned.

### Feedback to the AI

Both outcomes immediately queue feedback that is prepended to the user's next message:

- Save: `Proposal p_1 accepted. Saved as new recipe (id: {uuid}, title: "Creamy Tomato Pasta").`
- Save edit: `Proposal p_1 accepted. Recipe {uuid} ("Banana Bread") updated.`
- Dismiss: `Proposal p_1 declined by user.`

This ensures the AI always knows the outcome before continuing. Feedback is stored in Redux (not component state) so it survives re-renders.

---

## RAG Tools (Backend)

Two read-only tools available to the AI in the edge function. Both query the household's recipes in Supabase.

### `get_all_recipes`

Returns a lightweight index of all household recipes. Used for discovery queries.

**Returns per recipe:** `id, title, category, description, base_servings`

No ingredients, no instructions. Keeps context size manageable even with large cookbooks.

**Example triggers:**
- "What should I cook tonight?"
- "Which of my recipes uses chicken?"
- "What's the easiest recipe I have?"

### `get_recipe_details(recipeId)`

Returns the full recipe data including ingredients. Called after the AI identifies a specific recipe from the index.

**Returns:** all recipe fields + full ingredients array with group names and sort order

**One at a time, on demand.** The AI calls this only when it needs to deeply inspect or propose changes to a specific recipe.

---

## Recipe History

Every AI-applied edit creates a snapshot before the change is written. Manual edits from the recipe edit page also create snapshots.

### Database schema

```sql
recipe_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    uuid REFERENCES recipes(id) ON DELETE CASCADE,
  household_id uuid,
  snapshot     jsonb NOT NULL,
  source       text CHECK (source IN ('manual', 'ai')),
  created_at   timestamptz DEFAULT now()
)
```

The `snapshot` column is a complete self-contained copy of the recipe at the time of save:

```json
{
  "name": "Banana Bread",
  "description": "...",
  "instructions": "...",
  "category": 3,
  "base_servings": 8,
  "link": "",
  "ingredients": [
    { "raw_text": "200g flour", "group_name": null, "sort_order": 0 },
    { "raw_text": "200g sugar", "group_name": null, "sort_order": 1 }
  ]
}
```

Ingredients are bundled into the snapshot because they live in a separate table — this makes restore a single atomic operation with no complex joins.

### Retention

Keep the last 10 snapshots per recipe. Older ones are deleted automatically.

### Restore flow

1. Read snapshot from `recipe_history`
2. `UPDATE recipes SET name=..., description=...` from snapshot fields
3. `replaceAllIngredients` with the snapshot's ingredients array

Restore is the same operation as a normal recipe update — no special code path needed.

### History UI on recipe page

A clock/history icon in the recipe page header opens a bottom sheet:

```
┌─────────────────────────────────┐
│ Version History                 │
├─────────────────────────────────┤
│ Just now     · AI edited        │
│ 3 days ago   · You edited       │
│ 1 week ago   · You edited       │
│ 2 weeks ago  · AI edited        │
└─────────────────────────────────┘
```

Tapping a version shows the snapshot and a "Restore this version" button. AI-edited versions are visually tagged so the user can identify AI changes at a glance.

---

## Redux State

All chatbot state lives in Redux. No chatbot-related logic in component state.

```ts
interface ChatbotState {
  messages: ChatMessage[];
  previous_response_id: string | null;
  isTyping: boolean;
  contextRecipeId: string | null;        // recipe in the banner
  pendingFeedback: string[];             // queued for next send (saves + dismissals)
  proposalCounter: number;              // incremented per proposal for unique IDs
  activeProposal: ToolOutputForUI | null; // the current blocking proposal, if any
}
```

### Key changes from current state
- `pendingFeedback` moved from component state to Redux — survives re-renders
- `knownRecipeIds` removed — AI can access all recipes via RAG tools
- `proposalCounter` moved from a ref to Redux
- `activeProposal` new — tracks whether an action bar should be shown

### Proposal status on messages

Each `ToolOutputForUI` carries a `status` field:

```ts
interface ToolOutputForUI {
  proposalId: string;
  toolName: 'propose_recipe' | 'propose_recipe_edit';
  args: { ... };
  status: 'pending' | 'saved' | 'dismissed';
  savedRecipeId?: string; // set after save, used for "Open →" link
}
```

Status is updated in Redux when the user acts. The card re-renders to its locked state automatically.

---

## Backend Edge Function Tools

Four tools available to the AI in `supabase/functions/chatbot/tools.ts`:

| Tool | Type | Description |
|---|---|---|
| `propose_recipe` | write | Propose a new recipe for user approval |
| `propose_recipe_edit` | write | Propose edits to an existing recipe for user approval |
| `get_all_recipes` | read | Fetch index of all household recipes |
| `get_recipe_details` | read | Fetch full recipe + ingredients by ID |

### System prompt rules (additions)

- Call only one write tool per response — never propose two recipes or two edits in a single turn
- Use `get_all_recipes` before `get_recipe_details` unless you already have the recipe ID
- Always wait for `[Proposal Outcomes]` feedback before assuming a proposal was accepted or rejected
- When proposing an edit, always call `get_recipe_details` first to get the current state before proposing changes

---

## Conversation Flows

### Flow 1 — Navigate from recipe page

1. User opens Banana Bread recipe → taps "Ask AI"
2. If no active chat: fresh chat opens, banner shows Banana Bread
3. If active chat for same recipe: resumes without prompt
4. If active chat for different recipe: bottom sheet asks "Start fresh / Continue"
5. User: "make it gluten free"
6. AI calls `get_recipe_details` (already has ID from banner context), then `propose_recipe_edit`
7. Diff card appears in chat, input replaced by action bar
8. User taps "Apply Changes" → history snapshot created → recipe updated → card locks to saved state → feedback queued → input restored
9. AI can now continue: "I've updated the recipe. The main change was replacing plain flour with a 1:1 gluten-free blend..."

### Flow 2 — General chat, no recipe context

1. User opens chatbot directly, no banner
2. User: "suggest a quick weeknight pasta"
3. AI calls `propose_recipe`
4. New recipe card appears, action bar shows "Save to Cookbook / Not for me"
5. User saves → card locks → feedback queued → AI acknowledges
6. User: "actually make it for 6 people"
7. AI calls `propose_recipe_edit` on the just-saved recipe (from feedback, it knows the ID)
8. Diff card shows servings change, action bar appears
9. User applies → done

### Flow 3 — RAG query and edit

1. User: "which of my recipes has the most sugar?"
2. AI calls `get_all_recipes`, then `get_recipe_details` on a few candidates
3. AI responds: "Your Banana Bread has the most sugar at 200g per batch"
4. User: "can you reduce it?"
5. AI calls `propose_recipe_edit` on Banana Bread — diff shows sugar reduction
6. History snapshot created on apply
7. User can restore from recipe page if they change their mind

### Flow 4 — Accidental edit recovery

1. User applies an AI edit they regret
2. Goes to recipe page → taps history icon
3. Sees "AI · 2 min ago" — taps it → "Restore this version"
4. Recipe is back to its previous state
5. No data loss, no anxiety about experimenting with AI edits

---

## Build Order

Each phase is independently shippable.

### Phase 1 — Proposal system redesign
- Inline proposal card (replaces modal dialog)
- Blocking action bar (replaces text input when proposal pending)
- Proposal status in Redux (`pending` / `saved` / `dismissed`)
- Move `pendingFeedback` and `proposalCounter` to Redux
- Symmetric feedback (dismissals send feedback too)
- One proposal per AI response enforced in system prompt

### Phase 2 — Recipe history
- `recipe_history` table in Supabase
- Snapshot written before every AI edit (application-side, before update mutation)
- Snapshot written before every manual edit
- History UI on recipe page (bottom sheet with restore)

### Phase 3 — Full cookbook access
- Drop `knownRecipeIds` restriction
- Remove recipeId whitelist validation from `propose_recipe_edit`
- Any recipe can now be edited (history is the safety net)

### Phase 4 — RAG tools
- `get_all_recipes` tool in edge function
- `get_recipe_details` tool in edge function
- Updated system prompt with RAG usage rules

### Phase 5 — Banner evolution
- Persistent context banner component
- Auto-appears when AI begins working on a specific recipe via RAG
- "Switch recipe" bottom sheet prompt
- Banner becomes informational (not permission gate)
