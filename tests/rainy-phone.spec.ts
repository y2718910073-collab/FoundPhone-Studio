import { test, expect } from "@playwright/test";

test("public game starts the rainy-night story and reveals an unlockable clue", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.id).toBe("rainy-phone-b17");
  expect(work.apps.filter((a: { installed: boolean }) => a.installed)).toHaveLength(49);
  expect(work.nodes.filter((n: { type: string }) => n.type === "ending")).toHaveLength(3);
  expect(work.data.photos.find((i: { id: string }) => i.id === "photo-ticket").hidden).toBe(true);

  await page.goto("/");
  await expect(page).toHaveTitle(/雨夜捡手机/);
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  await expect(page.locator(".wx-chat-row").filter({ hasText: "唐夏" }).first()).toBeVisible();
  await page.locator(".wx-chat-row").filter({ hasText: "唐夏" }).first().click();
  await page.getByRole("button", {
    name: "如果捡到这部手机的人看见这些字：先看看那张蓝色票根。不要急着交给第一个来认领的人。",
    exact: true,
  }).click();
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page.getByRole("button", { name: "打开相册", exact: true }).click();
  await expect(page.getByRole("button", { name: "查看蓝色取件单 · B-17" })).toBeVisible();
});

test("opt-in performance overlay samples animation frames and stays off normally", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("fps-monitor")).toHaveCount(0);
  await page.goto("/?fps=1");
  await expect(page.getByTestId("fps-monitor")).toBeVisible();
  await expect(page.getByTestId("fps-monitor")).toContainText(/\d+ FPS/, {
    timeout: 10000,
  });
  await expect(page.getByRole("button", { name: "轻触解锁" })).toBeVisible();
});
