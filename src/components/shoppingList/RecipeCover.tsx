type Props = {
  url: string | null | undefined;
  /** False for a recipe deleted since it was added: a placeholder instead. */
  exists: boolean;
  placeholder?: string;
};

/** A recipe's cover filling its frame, or a quiet placeholder tile. */
export default function RecipeCover({ url, exists, placeholder = "🍽️" }: Readonly<Props>) {
  if (exists && url) {
    return <img src={url} alt="" loading="lazy" className="size-full object-cover" />;
  }
  return (
    <span className="flex size-full items-center justify-center bg-muted text-xl" aria-hidden>
      {placeholder}
    </span>
  );
}
