import { describe, expect, it } from "vitest";
import { importErrorKey } from "./recipeImport.api";

describe("importErrorKey", () => {
  it("names the duplicate guard, the caps and everything else apart", () => {
    expect(importErrorKey({ code: "23505", message: "This import was already submitted recently" })).toBe(
      "urlImport.errors.duplicate"
    );
    expect(importErrorKey({ code: "P0001", message: "Import rate limit exceeded; try again later" })).toBe(
      "urlImport.errors.limited"
    );
    expect(importErrorKey(new Error("network down"))).toBe("urlImport.errors.importFailed");
    expect(importErrorKey(null)).toBe("urlImport.errors.importFailed");
  });
});
