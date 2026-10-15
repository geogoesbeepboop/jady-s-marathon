import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { E2E_SLUG, TOKENS_FILE } from "./global-setup";

const token = (person: string) => (JSON.parse(readFileSync(TOKENS_FILE, "utf8")) as Record<string, string>)[person];

async function join(page: Page, person: string) {
  await page.goto(`/join/${token(person)}`);
  await page.getByRole("button", { name: "Open my weekend" }).click();
  await expect(page).toHaveURL(new RegExp(`/${E2E_SLUG}$`));
}

test.describe.configure({ mode: "serial" }); // the claim test and the offline test share Sam

test("a supporter plans race day and claims a cheer spot", async ({ page }) => {
  await join(page, "sam");
  await page.getByRole("link", { name: "Race day" }).click();
  await expect(page).toHaveURL(new RegExp(`/${E2E_SLUG}/race$`));

  await expect(page.getByTestId("runner")).toContainText("Bib 1234");
  const spots = page.getByTestId("cheer-spot");
  await expect(spots.getByRole("heading")).toHaveText(["Bridge corner", "Park loop"]);
  // Rae crosses the start at 8:10 and runs 10:00/mi, so mile 8 is about 9:30.
  await expect(spots.first().getByTestId("pass")).toHaveText(/^Mile 8\s*Rae ~9:30 AM\s*Watch 9:2\d/);
  await expect(spots.nth(1).getByTestId("pass")).toHaveCount(2); // the park loop is passed twice

  const bridge = spots.first();
  await bridge.getByRole("button", { name: "I'll be here" }).click();
  await expect(bridge).toContainText("Here: Sam");
  await bridge.getByRole("button", { name: "You're here · undo" }).click();
  await expect(bridge).toContainText("Nobody here yet");
});

test("a runner sees the plan but not the claim buttons", async ({ page }) => {
  await join(page, "rae");
  await page.goto(`/${E2E_SLUG}/race`);
  await expect(page.getByTestId("cheer-spot")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "I'll be here" })).toHaveCount(0);
});

test("race day still opens with no signal", async ({ page, context }) => {
  await join(page, "sam");
  // The service worker saves both tabs, including the race page Sam hasn't opened yet.
  await expect(page.locator("html[data-offline-ready=true]")).toBeAttached({ timeout: 20_000 });
  await expect(page.getByText("Saved on this phone")).toBeVisible();

  const wentOffline = Date.now();
  await context.setOffline(true);

  await page.goto(`/${E2E_SLUG}/race`);
  await expect(page.getByTestId("cheer-spot")).toHaveCount(2);
  await expect(page.getByText("No signal: showing the copy saved on this phone.")).toBeVisible();
  const renderedAt = await page.getByTestId("rendered-at").getAttribute("data-at");
  expect(Date.parse(renderedAt!)).toBeLessThan(wentOffline); // the saved copy, not a fresh render

  await page.getByRole("link", { name: "Schedule" }).click();
  await expect(page.getByTestId("agenda-item").first()).toBeVisible();

  await context.setOffline(false);
});
