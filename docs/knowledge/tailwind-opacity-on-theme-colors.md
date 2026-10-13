# Opacity modifiers on theme colors produce no CSS

**Fact (checked 2026-10-13, Tailwind 3.4.17):** `tailwind.config.js` defines every theme color as a bare CSS variable (`primary: "var(--primary)"`, `muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" }` and so on), and `src/index.css` sets those variables to hex values. Tailwind 3 can't split a `var()` into channels, so it emits **nothing** for an opacity modifier on these colors. `text-foreground/70`, `bg-accent/50`, `bg-destructive/5` and `hover:bg-primary/80` make no rule at all, the build gives no warning, and the element keeps whatever color it had without the class.

**How it was found:** the meal-type chip needed muted text with enough contrast (`text-muted-foreground` on `bg-muted` is 2.49:1 in light mode, below the 4.5:1 that WCAG AA needs for 11px text). The obvious `text-foreground/70` (5.94:1 on paper) produced no CSS. Probe:

```bash
echo '<span class="text-foreground/70 bg-accent/50 bg-accent"></span>' > /tmp/tw.html
printf '@tailwind utilities;\n' > /tmp/tw.css
npx tailwindcss -c tailwind.config.js -i /tmp/tw.css --content /tmp/tw.html
```

Only `.bg-accent` comes out.

**Existing dead classes:** on 2026-10-13, 33 uses in `src` had no effect, among them `bg-accent/50`, `bg-accent/90`, `bg-secondary/80`, `bg-muted/50`, `bg-destructive/5`, `border-destructive/40`, `text-destructive/70` and the shadcn defaults in `src/components/ui/`. To list them, grep for `-(primary|secondary|accent|muted|foreground|background|card|popover|destructive|border|input|ring)(-foreground)?/[0-9]+`. Nothing is broken by them today, because the screens were designed while they did nothing.

**Rule:** pick a token that already has the color you need (the meal-type chip uses `text-foreground`). Don't add `/NN` to a theme color. To make the modifiers work, define the variables as channels (`--muted: 40 9% 88%`) and the colors as `hsl(var(--muted) / <alpha-value>)`. That is one change in `index.css` and `tailwind.config.js`, but every dead class above would then start to show, so it needs a visual pass over those screens.
