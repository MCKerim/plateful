/** The cover's average colour from a 1 × 1 draw, or null when the canvas is tainted (a cross-origin image without CORS). */
export function averageColor(image: HTMLImageElement): [number, number, number] | null {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return null;
  try {
    context.drawImage(image, 0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  } catch {
    return null;
  }
}

/** A soft wash of the colour that fades into the page background, text always winning. */
export function ambientGradient(color: [number, number, number] | null): string | undefined {
  if (!color) return undefined;
  const [r, g, b] = color;
  return `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.45) 0%, var(--background) 70%)`;
}
