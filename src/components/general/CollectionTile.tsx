import { motion } from "motion/react";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/redux/hooks";
import { setCollectionSelection } from "@/redux/slices/filterAndSortingSlice";
import { resolveCollectionColor } from "@/lib/collectionColorPalette";

type Props = {
  id: string | "all";
  name: string;
  colorKey?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function CollectionTile({
  id,
  name,
  colorKey,
  onEdit,
  onDelete,
}: Readonly<Props>) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const isAllRecipes = id === "all";
  const canManage = Boolean(onEdit || onDelete);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const colorStyle = colorKey || isAllRecipes
    ? ({
        "--collection-light": colorKey
          ? resolveCollectionColor(colorKey, "light")
          : "#929292",
        "--collection-dark": colorKey
          ? resolveCollectionColor(colorKey, "dark")
          : "#989898",
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!canManage || (event.pointerType === "mouse" && event.button !== 0)) return;

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = true;
      setManageMenuOpen(true);
      longPressTimerRef.current = null;
    }, 500);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const pointerStart = pointerStartRef.current;
    if (!pointerStart) return;

    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 10) {
      clearLongPressTimer();
    }
  }

  function handlePointerEnd() {
    clearLongPressTimer();
    pointerStartRef.current = null;
  }

  function handleTileClick() {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    dispatch(setCollectionSelection(id));
  }

  return (
    <div className="relative h-[132px] w-full max-w-[169px] mx-auto" style={colorStyle}>
      <motion.button
        type="button"
        className="relative h-full w-full select-none [-webkit-touch-callout:none]"
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={handleTileClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => {
          if (!canManage) return;
          event.preventDefault();
          setManageMenuOpen(true);
        }}
        onKeyDown={(event) => {
          if (!canManage || (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))) {
            return;
          }
          event.preventDefault();
          setManageMenuOpen(true);
        }}
      >
        <div className="absolute inset-0">
          <svg
            viewBox="0 0 169 132"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M0 8C0 3.58172 3.58172 0 8 0H46.4866C48.8931 0 51.1718 1.0833 52.691 2.94964L60.099 12.0504C61.6182 13.9167 63.8968 15 66.3033 15H161C165.418 15 169 18.5817 169 23V124C169 128.418 165.418 132 161 132H8C3.58172 132 0 128.418 0 124V8Z"
              className={
                colorKey || isAllRecipes
                  ? "fill-[var(--collection-light)] opacity-70 dark:fill-[var(--collection-dark)]"
                  : "fill-muted-foreground/50"
              }
            />
          </svg>
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 h-[106px] flex items-center justify-center rounded-lg ${
            colorKey || isAllRecipes
              ? "bg-[var(--collection-light)] dark:bg-[var(--collection-dark)]"
              : "bg-muted-foreground"
          }`}
        >
          <p className="first-font text-background z-20 break-words text-center text-xl px-3 line-clamp-3">
            {name}
          </p>
        </div>
      </motion.button>

      {canManage && (
        <div
          role="menu"
          className={
            "absolute right-2 top-7 z-20 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md " +
            (manageMenuOpen ? "" : "hidden")
          }
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
              onClick={() => {
                setManageMenuOpen(false);
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              {t("collections.edit")}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-accent focus:text-destructive"
                onClick={() => {
                  setManageMenuOpen(false);
                  onDelete();
                }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {t("common.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
