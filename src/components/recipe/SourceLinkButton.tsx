import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sourceBrandGlyph } from "@/lib/sourceBrand";

/**
 * The recipe's original source as a small grey chip, like the native app's
 * `SourceLinkButton`: the source's glyph (or a globe) and "Open original".
 */
export default function SourceLinkButton({ link }: Readonly<{ link: string }>) {
  const { t } = useTranslation();
  const glyph = sourceBrandGlyph(link);

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      aria-label={t("recipe.openOriginalRecipe")}
      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"
    >
      {glyph ? (
        // A mask, so the glyph takes the text colour like the native template
        // image; prefixed too, unprefixed `mask` needs WebView 120+. Quoted:
        // Vite inlines the SVG as a data URL with quotes in it.
        <span
          aria-hidden
          className="size-5 shrink-0 bg-current"
          style={{
            WebkitMask: `url("${glyph}") center / contain no-repeat`,
            mask: `url("${glyph}") center / contain no-repeat`,
          }}
        />
      ) : (
        <Globe className="size-5 shrink-0" />
      )}
      {t("recipe.openOriginal")}
    </a>
  );
}
