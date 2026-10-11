type Props = {
  url: string | null | undefined;
  /** False for a recipe deleted since it was added: the no-image picture. */
  exists: boolean;
  /** A glyph tile instead of a picture, for a source that is no recipe. */
  glyph?: string;
};

/** A recipe's cover filling its frame, the app's no-image picture without one. */
export default function RecipeCover({ url, exists, glyph }: Readonly<Props>) {
  if (glyph) {
    return (
      <span className="flex size-full items-center justify-center bg-muted text-xl" aria-hidden>
        {glyph}
      </span>
    );
  }
  return (
    <img
      src={(exists && url) || "/no-img.jpg"}
      alt=""
      loading="lazy"
      className="size-full object-cover"
    />
  );
}
