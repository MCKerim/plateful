import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Layout from "@/components/layout/Layout";
import Fab from "@/components/general/Fab";
import ShoppingItemCard from "@/components/shoppingList/ShoppingItemCard";
import ShoppingTripHeadline from "@/components/shoppingList/ShoppingTripHeadline";
import ShoppingEmptyState from "@/components/shoppingList/ShoppingEmptyState";
import ShoppingAddSheet from "@/components/shoppingList/ShoppingAddSheet";
import ShoppingItemDetailSheet from "@/components/shoppingList/ShoppingItemDetailSheet";
import ShoppingItemEditSheet from "@/components/shoppingList/ShoppingItemEditSheet";
import ShoppingRecipeSheet from "@/components/shoppingList/ShoppingRecipeSheet";
import ShoppingTripRecipesSheet from "@/components/shoppingList/ShoppingTripRecipesSheet";
import mascotShoppingDone from "@/assets/mascot-shopping-done.webp";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useRecipes } from "@/hooks/cookbook/useRecipes";
import { useShoppingList } from "@/hooks/shopping-list/useShoppingList";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import { useSetOnList } from "@/hooks/shopping-list/useSetOnList";
import { useAddShoppingLine } from "@/hooks/shopping-list/useAddShoppingLine";
import { useDeleteShoppingItem } from "@/hooks/shopping-list/useDeleteShoppingItem";
import { useRemoveRecipeFromShoppingList } from "@/hooks/shopping-list/useRemoveRecipeFromShoppingList";
import { aisleInfo } from "@/lib/shopping-list/aisle";
import type { ShoppingListItem, TypedLine } from "@/lib/shopping-list/item";
import {
  aisleSections,
  isListEmpty,
  previewLine,
  recentlyBought,
  tripRecipes,
} from "@/lib/shopping-list/list";

/** Which sheet is up; one at a time, a recipe opened from the list returns to it. */
type Sheet =
  | { kind: "add" }
  | { kind: "detail"; itemId: string }
  | { kind: "edit"; itemId: string }
  | { kind: "recipes" }
  | { kind: "recipe"; recipeId: string; fromList: boolean };

const HIGHLIGHT_MS = 1500;
const SMOOTH = { type: "spring", duration: 0.3, bounce: 0 } as const;

/**
 * The household's one shared list: what is left grouped by aisle in the order
 * a shop is walked, what was bought last at the bottom to put back.
 */
export default function ShoppingList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const householdId = useAppSelector(selectHouseholdId);
  const { data: items, isPending } = useShoppingList();
  const { data: dictionary = [] } = useShoppingDictionary();
  const { data: recipes } = useRecipes();
  // A refused add or removal, said above the list until the next one or a tap.
  const [writeFailed, setWriteFailed] = useState(false);
  const setOnList = useSetOnList();
  const addLine = useAddShoppingLine(() => setWriteFailed(true));
  const deleteItem = useDeleteShoppingItem();
  const removeRecipe = useRemoveRecipeFromShoppingList(() => setWriteFailed(true));
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [boughtCollapsed, setBoughtCollapsed] = useState(readBoughtCollapsed);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  const list = useMemo(() => items ?? [], [items]);
  const sections = useMemo(() => aisleSections(list), [list]);
  const trip = useMemo(() => tripRecipes(sections), [sections]);
  const bought = useMemo(() => recentlyBought(list), [list]);
  const coverUrls = useMemo(
    () => new Map((recipes ?? []).map((recipe) => [recipe.id, recipe.imageUrl])),
    [recipes]
  );
  const openCount = sections.reduce((count, section) => count + section.items.length, 0);

  const itemFor = (id: string | undefined) => list.find((item) => item.id === id) ?? null;
  const detailItem = sheet?.kind === "detail" ? itemFor(sheet.itemId) : null;
  const editItem = sheet?.kind === "edit" ? itemFor(sheet.itemId) : null;
  const sheetRecipe =
    sheet?.kind === "recipe" ? (trip.find((recipe) => recipe.id === sheet.recipeId) ?? null) : null;

  if (!householdId) return null;

  function tap(item: ShoppingListItem) {
    if (!householdId) return;
    setOnList.mutate({ householdId, id: item.id, onList: !item.onList });
  }

  function add(line: TypedLine) {
    const existing = previewLine(list, dictionary, line).existing;
    if (existing) setHighlightedId(existing.id);
    setWriteFailed(false);
    addLine(line);
  }

  function openRecipe(recipeId: string) {
    setSheet(null);
    navigate(`/recipe/${recipeId}`);
  }

  function toggleBought() {
    const next = !boughtCollapsed;
    setBoughtCollapsed(next);
    writeBoughtCollapsed(next);
  }

  function section(
    title: string,
    sectionItems: ShoppingListItem[],
    dimmed = false,
    collapse?: { collapsed: boolean; onToggle: () => void }
  ) {
    return (
      <motion.section
        key={title}
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={SMOOTH}
        className="relative flex flex-col gap-2.5"
      >
        {collapse ? (
          <h3 className="font-semibold">
            <button
              type="button"
              aria-expanded={!collapse.collapsed}
              onClick={collapse.onToggle}
              className="flex w-full items-center gap-1 py-1 text-left"
            >
              {title}
              <ChevronDown
                size={18}
                aria-hidden
                className={`transition-transform duration-200 ${collapse.collapsed ? "-rotate-90" : ""}`}
              />
            </button>
          </h3>
        ) : (
          <h3 className="font-semibold">{title}</h3>
        )}
        <AnimatePresence initial={false} mode="popLayout">
          {!collapse?.collapsed &&
            sectionItems.map((item) => (
              // The shared layoutId carries a bought row into its new section.
              <motion.div
                key={item.id}
                layoutId={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={SMOOTH}
              >
                <ShoppingItemCard
                  item={item}
                  dimmed={dimmed}
                  highlighted={highlightedId === item.id}
                  onClick={() => tap(item)}
                  onDetails={() => setSheet({ kind: "detail", itemId: item.id })}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.section>
    );
  }

  const empty = isListEmpty(list);

  return (
    <Layout showHeader={false}>
      {writeFailed && (
        <button
          type="button"
          className="w-full py-1 text-left text-xs text-destructive"
          onClick={() => setWriteFailed(false)}
        >
          {t("shoppingList.writeError")}
        </button>
      )}
      {isPending ? null : empty ? (
        <ShoppingEmptyState onAdd={() => setSheet({ kind: "add" })} />
      ) : (
        <div className="relative flex flex-col gap-6 pb-20">
          {/* The first rows sit in thumb reach, not under the status bar. */}
          <div className="flex min-h-[36dvh] flex-col justify-end">
            {openCount === 0 && (
              <img
                src={mascotShoppingDone}
                alt=""
                className="mx-auto mb-2 w-[195px] -translate-x-[13%]"
              />
            )}
            <ShoppingTripHeadline
              openCount={openCount}
              tripRecipes={trip}
              coverUrls={coverUrls}
              onOpenRecipes={() =>
                setSheet(
                  trip.length === 1
                    ? { kind: "recipe", recipeId: trip[0].id, fromList: false }
                    : { kind: "recipes" }
                )
              }
            />
          </div>
          <MotionConfig reducedMotion="user">
            <AnimatePresence initial={false} mode="popLayout">
              {sections.map(({ aisle, items: aisleItems }) =>
                section(t(aisleInfo(aisle).labelKey), aisleItems)
              )}
              {bought.length > 0 &&
                section(t("shoppingList.recentlyBought"), bought, true, {
                  collapsed: boughtCollapsed,
                  onToggle: toggleBought,
                })}
            </AnimatePresence>
          </MotionConfig>
        </div>
      )}

      {!isPending && !empty && (
        <Fab aria-label={t("shoppingList.add")} onClick={() => setSheet({ kind: "add" })} />
      )}

      <ShoppingAddSheet
        open={sheet?.kind === "add"}
        onOpenChange={(open) => setSheet(open ? { kind: "add" } : null)}
        items={list}
        dictionary={dictionary}
        onAdd={add}
        onPutBack={(id) => setOnList.mutate({ householdId, id, onList: true })}
      />
      <ShoppingItemDetailSheet
        item={detailItem}
        onClose={() => setSheet(null)}
        coverUrls={coverUrls}
        onEdit={(item) => setSheet({ kind: "edit", itemId: item.id })}
        onRemove={(item) => {
          setSheet(null);
          deleteItem.mutate({ householdId, id: item.id });
        }}
        onOpenRecipe={openRecipe}
      />
      <ShoppingItemEditSheet
        householdId={householdId}
        item={editItem}
        items={list}
        onClose={() => setSheet(editItem ? { kind: "detail", itemId: editItem.id } : null)}
      />
      <ShoppingTripRecipesSheet
        open={sheet?.kind === "recipes"}
        onClose={() => setSheet(null)}
        tripRecipes={trip}
        coverUrls={coverUrls}
        onSelect={(recipe) => setSheet({ kind: "recipe", recipeId: recipe.id, fromList: true })}
      />
      <ShoppingRecipeSheet
        recipe={sheetRecipe}
        onClose={() =>
          setSheet(sheet?.kind === "recipe" && sheet.fromList ? { kind: "recipes" } : null)
        }
        coverUrls={coverUrls}
        onOpenRecipe={openRecipe}
        onRemove={(recipe) => {
          setSheet(null);
          setWriteFailed(false);
          removeRecipe(householdId, recipe.id, list);
        }}
      />
    </Layout>
  );
}

// Per device, not per user: a display preference, and in a shared household each person folds it on their own phone.
const BOUGHT_COLLAPSED_KEY = "plateful.shoppingList.boughtCollapsed";

function readBoughtCollapsed(): boolean {
  try {
    return localStorage.getItem(BOUGHT_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeBoughtCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(BOUGHT_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Storage blocked: the fold still works until the page is left.
  }
}
