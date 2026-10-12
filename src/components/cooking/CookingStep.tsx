import { Fragment } from "react";
import { Check, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { StepToken } from "@/lib/cooking/stepTokens";
import type { ScaledIngredient } from "@/types/ingredient.types";

export type TimerChipState = "idle" | "running" | "finished";

type Props = {
  stepText: string;
  /** The group's name on its first step only. */
  sectionName: string | null;
  /** Empty for a plain step, which renders its text as it is. */
  tokens: StepToken[];
  isCurrent: boolean;
  ingredientsById: ReadonlyMap<string, ScaledIngredient>;
  /** A timer chip's state by the label it starts with; idle when unknown. */
  chipState?: (label: string) => TimerChipState;
  /** A running chip's countdown text, by label. */
  chipCountdown?: (label: string) => string | null;
  onTimerChip?: (seconds: number, label: string, state: TimerChipState) => void;
  onSelect: () => void;
};

/** One mention's words, grouped so a single popover anchors on the whole run. */
type Mention = { mentionIndex: number; ingredientId: string; emoji: string; words: string[]; spaceBefore: boolean };

type Piece = { kind: "token"; token: StepToken } | { kind: "mention"; mention: Mention };

function groupMentions(tokens: StepToken[]): Piece[] {
  const pieces: Piece[] = [];
  for (const token of tokens) {
    const last = pieces[pieces.length - 1];
    if (token.kind === "ingredientWord") {
      if (last?.kind === "mention" && last.mention.mentionIndex === token.mentionIndex) {
        last.mention.words.push(token.text);
      } else {
        pieces.push({
          kind: "mention",
          mention: {
            mentionIndex: token.mentionIndex,
            ingredientId: token.ingredientId,
            emoji: token.emoji,
            words: [token.text],
            spaceBefore: token.spaceBefore,
          },
        });
      }
    } else {
      pieces.push({ kind: "token", token });
    }
  }
  return pieces;
}

/**
 * One step of the feed: the text at one size and weight in both states, so
 * only opacity carries focus (a weight change re-wraps lines). Ingredient
 * mentions are accent prose with the emoji on the first word and a popover
 * with the scaled amount; durations are pill chips that start timers.
 */
export default function CookingStep({
  stepText,
  sectionName,
  tokens,
  isCurrent,
  ingredientsById,
  chipState = () => "idle",
  chipCountdown = () => null,
  onTimerChip,
  onSelect,
}: Readonly<Props>) {
  return (
    <div
      className={cn("transition-opacity duration-200", isCurrent ? "opacity-100" : "opacity-[0.42]")}
      onClick={onSelect}
      aria-current={isCurrent ? "step" : undefined}
    >
      {sectionName && <p className="mb-2 text-sm font-semibold text-muted-foreground">{sectionName}</p>}

      <p className="text-[22px] font-bold leading-snug">
        {tokens.length === 0
          ? stepText
          : groupMentions(tokens).map((piece, index) => (
              <Fragment key={index}>
                {piece.kind === "token" ? renderToken(piece.token) : renderMention(piece.mention)}
              </Fragment>
            ))}
      </p>
    </div>
  );

  function renderToken(token: StepToken) {
    const space = token.spaceBefore ? " " : "";
    if (token.kind === "word") return `${space}${token.text}`;
    if (token.kind !== "timer") return null;
    const state = chipState(token.label);
    const countdown = state === "running" ? chipCountdown(token.label) : null;
    return (
      <>
        {space}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onTimerChip?.(token.seconds, token.label, state);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 align-baseline leading-snug",
            state === "idle"
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-accent bg-accent text-accent-foreground"
          )}
          aria-label={`${token.text}${state === "running" ? ` · ${countdown ?? ""}` : ""}`}
        >
          {state === "finished" ? <Check className="size-5" /> : <Timer className="size-5" />}
          {countdown ?? token.text}
        </button>
      </>
    );
  }

  function renderMention(mention: Mention) {
    const ingredient = ingredientsById.get(mention.ingredientId);
    const text = mention.words.join(" ");
    const space = mention.spaceBefore ? " " : "";
    if (!ingredient) return `${space}${text}`;
    return (
      <>
        {space}
        <Popover>
          <PopoverTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className="cursor-pointer text-accent"
              onClick={(event) => event.stopPropagation()}
            >
              {mention.emoji && <span className="text-[17px] font-semibold">{mention.emoji} </span>}
              {text}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-xs space-y-1" onClick={(event) => event.stopPropagation()}>
            <p className="text-base font-semibold">{ingredient.scaledQuantity.display}</p>
            {ingredient.preparationNote && (
              <p className="text-sm text-muted-foreground">{ingredient.preparationNote}</p>
            )}
          </PopoverContent>
        </Popover>
      </>
    );
  }
}
