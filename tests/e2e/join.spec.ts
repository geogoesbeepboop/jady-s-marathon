import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { E2E_SLUG, TOKENS_FILE } from "./global-setup";

// Read lazily: the file is written by global setup, which runs after test files are collected.
const token = (person: string) => (JSON.parse(readFileSync(TOKENS_FILE, "utf8")) as Record<string, string>)[person];

test("a runner opens their link and sees only their schedule", async ({ page }) => {
  await page.goto(`/join/${token("rae")}`);
  await expect(page.getByRole("heading", { name: "Hi Rae" })).toBeVisible();

  await page.getByRole("button", { name: "Open my weekend" }).click();
  await expect(page).toHaveURL(new RegExp(`/${E2E_SLUG}$`));

  const titles = page.getByTestId("agenda-item").getByRole("heading");
  await expect(titles).toHaveText(["Shakeout run", "Team dinner", "Race starts"]);
  await expect(page.getByText("Runners only")).toBeVisible();
  await expect(page.getByText("Sunday, Nov 1")).toBeVisible();
  await expect(page.getByText("8:00 AM").last()).toBeVisible(); // race start, local time after DST ends

  await page.reload();
  await expect(titles).toHaveCount(3);
});

test("a supporter sees the cheer crew's items instead", async ({ page }) => {
  await page.goto(`/join/${token("sam")}`);
  await page.getByRole("button", { name: "Open my weekend" }).click();
  await expect(page.getByTestId("agenda-item").getByRole("heading")).toHaveText([
    "Make cheer signs",
    "Team dinner",
    "Race starts",
  ]);
});

test("a link still works when the phone holds a session for a deleted user", async ({ page }) => {
  await page.goto(`/join/${token("rae")}`);
  await page.getByRole("button", { name: "Open my weekend" }).click();
  await expect(page).toHaveURL(new RegExp(`/${E2E_SLUG}$`));

  // The browser keeps a still-signed JWT for a user that no longer exists (anonymous-user
  // cleanup, a database reset). The join must recover instead of blaming the link.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: devices } = await admin
    .from("person_devices")
    .select("auth_user_id, person:people!inner(key, event:events!inner(slug))")
    .eq("person.key", "rae")
    .eq("person.event.slug", E2E_SLUG);
  for (const device of devices ?? []) await admin.auth.admin.deleteUser(device.auth_user_id);

  await page.goto(`/join/${token("sam")}`);
  await page.getByRole("button", { name: "Open my weekend" }).click();
  await expect(page).toHaveURL(new RegExp(`/${E2E_SLUG}$`));
  await expect(page.getByRole("heading", { name: "Make cheer signs" })).toBeVisible();
});

test("someone without a link sees no schedule", async ({ page }) => {
  await page.goto(`/${E2E_SLUG}`);
  await expect(page.getByRole("heading", { name: "Open your personal link" })).toBeVisible();
  await expect(page.getByTestId("agenda-item")).toHaveCount(0);
});

test("a broken link explains itself", async ({ page }) => {
  await page.goto("/join/not-a-real-token");
  await expect(page.getByRole("heading", { name: "This link doesn't work" })).toBeVisible();
});
