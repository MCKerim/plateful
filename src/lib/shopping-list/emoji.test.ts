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

  // Backpapier under the toilet roll read as Klopapier (2026-11-08).
  it("shows the roll for toilet paper and kitchen roll only", () => {
    expect(shoppingEmoji("baking-paper", "Backpapier", "household")).toBe("📜");
    expect(shoppingEmoji(null, "Backpapier", "other")).toBe("📜");
    expect(shoppingEmoji("aluminum-foil", "Alufolie", "household")).toBe("🧹");
    expect(shoppingEmoji("toilet-paper", "Toilettenpapier", "household")).toBe("🧻");
  });

  it("falls back to the aisle last", () => {
    expect(shoppingEmoji(null, "Zeug", "pets")).toBe("🐾");
    expect(shoppingEmoji(null, "Zeug", "other")).toBe("🛒");
  });
});
