type Props = {
  src: string;
  /** Sizing utilities for the bowl itself, e.g. `w-[160px]`. */
  className?: string;
  /** Adds the contact shadow. Only the sign-in hero grounds the bowl. */
  grounded?: boolean;
};

/**
 * The Plateful mascot with the neutral contact shadow that grounds the ceramic.
 * Purely decorative everywhere it appears: no alt text, no interaction, hidden
 * from assistive tech. `docs/brand/03-in-app-mascot-use.md` in the iOS repo
 * governs which bowl state belongs on which screen, and at what width.
 */
export default function MascotBowl({ src, className, grounded = false }: Readonly<Props>) {
  return (
    <div className="relative">
      {/* Neutral and appearance-aware, never the legacy orange pool. */}
      {grounded && (
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-[10px] w-[60%] -translate-x-1/2 translate-y-1/2 rounded-[50%] bg-black/15 blur-[6px] dark:bg-white/10"
        />
      )}

      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        className={`relative object-contain ${className ?? ""}`}
      />
    </div>
  );
}
