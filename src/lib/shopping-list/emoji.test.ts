import { describe, expect, it } from "vitest";
import { shoppingEmoji } from "@/lib/shopping-list/emoji";

describe("shoppingEmoji", () => {
  it("lets the slug win over the name and the aisle", () => {
    expect(shoppingEmoji("tomato", "Klopapier", "household")).toBe("🍅");
  });

  it("fills in from a word in the name for an unknown slug", () => {
    expect(shoppingEmoji(null, "Klopapier 3-lagig", "other")).toBe("🧻");
    expect(shoppingEmoji(null, "Bio-Äpfel", "other")).toBe("🍎");
    expect(shoppingEmoji(null, "Spülmittel", "household")).toBe("🧽");
  });

  it("counts word starts only", () => {
    expect(shoppingEmoji(null, "dark chocolate", "other")).toBe("🍫");
    expect(shoppingEmoji(null, "Eintopf", "other")).toBe("🛒");
    expect(shoppingEmoji(null, "Eis", "frozen")).toBe("🍦");
  });

  it("falls back to the aisle last", () => {
    expect(shoppingEmoji(null, "Zeug", "pets")).toBe("🐾");
    expect(shoppingEmoji(null, "Zeug", "other")).toBe("🛒");
  });
});
