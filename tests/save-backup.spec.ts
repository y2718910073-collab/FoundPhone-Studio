import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

test("mobile player exports a compatible save and rejects invalid imports", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await expect(page.getByRole("button", { name: "打开设置", exact: true })).toBeVisible();

  // Wait until the phone writes the initial IndexedDB save.
  await page.waitForFunction(async () => {
    return await new Promise<boolean>((resolve) => {
      const request = indexedDB.open("foundphone-studio");
      request.onerror = () => resolve(false);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("saves", "readonly");
        const saved = transaction.objectStore("saves").getAll();
        saved.onsuccess = () => resolve(saved.result.length > 0);
        saved.onerror = () => resolve(false);
      };
    });
  });

  await page.locator(".runtime-save-manager summary").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出存档" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^foundphone-.*-save\.json$/);

  const data = JSON.parse(readFileSync(await download.path(), "utf8"));
  expect(data.format).toBe("foundphone-save-v1");
  expect(data.workId).toBe(data.state.workId);
  expect(data.revision).toBe(data.state.revision);

  const file = page.locator(".runtime-save-panel input[type=file]");
  await file.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });
  await expect(page.getByRole("status").filter({ hasText: /SyntaxError|Unexpected token|JSON/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "打开设置", exact: true })).toBeVisible();
});
