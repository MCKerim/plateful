import { useEffect, useState } from "react";
import { averageColor } from "@/lib/cooking/ambientColor";

/** The cover's average colour once it has loaded; null without a cover or when it cannot be read. */
export function useAmbientColor(url: string | null | undefined): [number, number, number] | null {
  const [color, setColor] = useState<{ url: string; value: [number, number, number] | null } | null>(null);

  useEffect(() => {
    if (!url) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setColor({ url, value: averageColor(image) });
    image.onerror = () => setColor({ url, value: null });
    image.src = url;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [url]);

  return url && color?.url === url ? color.value : null;
}
