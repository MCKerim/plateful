import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

type Row = Record<string, unknown>;

function shoppingRow(overrides: Row): Row {
  return {
    id: "row-1",
    name: "Jalapeño",
    name_custom: false,
    note: null,
    quantity_value: 7,
    quantity_display: null,
    unit: null,
    ingredient_slug: "jalapeno",
    category: "produce",
    on_list: true,
    added_at: "2026-11-10T10:00:00Z",
    bought_at: null,
    bought_count: 0,
    sources: [],
    created_at: "2026-11-10T10:00:00Z",
    ...overrides,
  };
}

/**
 * Serves one list row and keeps what the app writes to it, in order: the
 * edit RPC's body (answered with the renamed row, as the server would), a
 * plain PATCH, a DELETE. Registered after setupAuth, so it wins over the
 * fixture's empty list.
 */
async function serveRow(page: Page, initial: Row) {
  const row = { ...initial };
  const writes: { rpc: Row[]; patch: Row[]; order: string[] } = { rpc: [], patch: [], order: [] };
  await page.route("**/rest/v1/shopping_list_items?*", async (route) => {
    const method = route.request().method();
    if (method === "DELETE") {
      writes.order.push("delete");
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    if (method === "PATCH") {
      const body = route.request().postDataJSON() as Row;
      writes.patch.push(body);
      writes.order.push("patch");
      Object.assign(row, body);
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([row]),
    });
  });
  await page.route("**/rest/v1/rpc/update_shopping_list_item", async (route) => {
    const body = route.request().postDataJSON() as Row;
    writes.rpc.push(body);
    Object.assign(row, { name: body.p_name, name_custom: body.p_name !== row.name });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([row]),
    });
    writes.order.push("rename answered");
  });
  return { row, writes };
}

test.describe("Shopping List", () => {
  test("a card shows its note; the details show each recipe line as written", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });
    await serveRow(
      page,
      shoppingRow({
        note: "the big jar",
        sources: [
          {
            kind: "recipe",
            added_at: "2026-11-10T10:00:00Z",
            recipe_id: "recipe-gone",
            recipe_name: "Nachos",
            name: "Jalapeño",
            raw_text: "3 Jalapeño, in Ringen",
            quantity_value: 3,
          },
          {
            kind: "manual",
            added_at: "2026-11-10T11:00:00Z",
            name: "Peperoni grün",
            quantity_value: 4,
          },
        ],
      })
    );

    await page.goto("/shopping");
    await expect(page.getByText("Jalapeño", { exact: true })).toBeVisible();
    await expect(page.getByText("the big jar")).toBeVisible();
    // The card shows title, amount and note only; the lines live in the details.
    await expect(page.getByText("3 Jalapeño, in Ringen")).toBeHidden();

    await page.getByRole("button", { name: "Details" }).click();
    const details = page.getByRole("dialog");
    await expect(details.getByText("Nachos")).toBeVisible();
    await expect(details.getByText("3 Jalapeño, in Ringen")).toBeVisible();
    await expect(details.getByText("Peperoni grün")).toBeVisible();
  });

  test("the edit sheet renames through the edit RPC and saves the note as a plain update", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });
    const { writes } = await serveRow(
      page,
      shoppingRow({ name: "Äpfel", ingredient_slug: "apple" })
    );

    await page.goto("/shopping");
    await page.getByRole("button", { name: "Details" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Edit" }).click();
    const sheet = page.getByRole("dialog", { name: "Edit item" });
    await sheet.getByLabel("Name").fill("Gala-Äpfel");
    await sheet.getByLabel("Note").fill("  organic  ");
    await sheet.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => writes.patch).toEqual([{ note: "organic" }]);
    // The note goes after the edit's answer, which carries the stored note.
    expect(writes.order).toEqual(["rename answered", "patch"]);
    expect(writes.rpc).toEqual([
      expect.objectContaining({ p_id: "row-1", p_name: "Gala-Äpfel", p_language: "en" }),
    ]);
    // The rename never touched the note: only the plain update wrote it.
    expect(writes.rpc[0]).not.toHaveProperty("p_note");

    // Back in the details, which read the row live.
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Gala-Äpfel" })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Gala-Äpfel", { exact: true })).toBeVisible();
    await expect(page.getByText("organic", { exact: true })).toBeVisible();

    // The note survives a reload: it comes back from the row, not from memory.
    await page.reload();
    await expect(page.getByText("organic", { exact: true })).toBeVisible();
    await expect(page.getByText("Gala-Äpfel", { exact: true })).toBeVisible();
  });

  test("taking an add back never deletes a row the household already had", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });
    // Bought before; the server knows "Gurke" is this cucumber row, this
    // device does not (its dictionary is empty here).
    const { row, writes } = await serveRow(
      page,
      shoppingRow({
        id: "row-old",
        name: "Salatgurken",
        ingredient_slug: "cucumber",
        on_list: false,
        bought_at: "2026-11-09T10:00:00Z",
        bought_count: 3,
      })
    );
    const added: Row[] = [];
    await page.route("**/rest/v1/rpc/add_shopping_list_item", async (route) => {
      added.push(route.request().postDataJSON() as Row);
      Object.assign(row, {
        name: "Gurke",
        on_list: true,
        sources: [{ kind: "manual", name: "Gurke", added_at: "2026-11-15T10:00:00Z" }],
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([row]),
      });
    });

    await page.goto("/shopping");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("textbox").fill("Gurke");
    await sheet.getByRole("textbox").press("Enter");

    await expect
      .poll(() => added)
      .toEqual([expect.objectContaining({ p_name: "Gurke", p_language: "en" })]);
    const card = sheet.getByRole("button", { name: /Gurke/ }).first();
    await expect(sheet.getByText("Added", { exact: true })).toBeVisible();
    await expect(sheet.getByText("Added. Tap to remove.")).toBeHidden();
    await card.click();
    await page.waitForTimeout(300);
    expect(writes.order).not.toContain("delete");
  });

  test("recently bought folds away and stays folded after a reload", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });
    // Registered after setupAuth, so it wins over the fixture's empty list.
    await page.route("**/rest/v1/shopping_list_items?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "bought-1",
            name: "Milk",
            quantity_value: null,
            quantity_display: null,
            unit: null,
            ingredient_slug: null,
            category: null,
            on_list: false,
            added_at: "2026-10-01T10:00:00Z",
            bought_at: "2026-10-02T10:00:00Z",
            bought_count: 1,
            sources: [],
            created_at: "2026-10-01T10:00:00Z",
          },
        ]),
      })
    );

    await page.goto("/shopping");
    const header = page.getByRole("button", { name: "Recently bought" });
    await expect(header).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Milk")).toBeVisible();

    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Milk")).toBeHidden();

    await page.reload();
    await expect(page.getByRole("button", { name: "Recently bought" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    await expect(page.getByText("Milk")).toBeHidden();
  });
});
