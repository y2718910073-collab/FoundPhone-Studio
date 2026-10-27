import { test, expect, type Page } from "@playwright/test";
async function launch(page: Page, app: string) {
  await page.getByRole("button", { name: "打开" + app, exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform", "none");
}
async function home(page: Page) {
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
}
test("Douyin swipes and persists a player comment after reload", async ({ page, request }) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.data.douyin.length).toBeGreaterThanOrEqual(10);
  expect(work.data.tiktok.length).toBeGreaterThanOrEqual(10);
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await launch(page, "抖音");
  const feed = page.locator(".douyin-ui .vertical-feed");
  await expect(feed.locator(".vertical-video")).toHaveCount(work.data.douyin.length);
  await page.getByRole("button", { name: /下一条/ }).click();
  await expect.poll(() => feed.evaluate((el) => el.scrollTop)).toBeGreaterThan(10);
  await page.getByRole("button", { name: /评论志愿者的一天/ }).click();
  await page.getByRole("textbox", { name: "输入评论" }).fill("我也想参加书屋活动");
  await page.getByRole("button", { name: "发送评论" }).click();
  await expect(page.getByRole("dialog", { name: /评论：志愿者的一天/ })).toContainText("我也想参加书屋活动");
  await page.waitForFunction(async () => await new Promise<boolean>((resolve) => {
    const open = indexedDB.open("foundphone-studio");
    open.onerror = () => resolve(false);
    open.onsuccess = () => {
      const txn = open.result.transaction("saves", "readonly");
      const read = txn.objectStore("saves").get("rainy-phone-b17");
      read.onerror = () => resolve(false);
      read.onsuccess = () => resolve(
        (read.result?.state?.ui?.douyin?.["comments-douyin-promo"] ?? []).some(
          (s: string) => s.includes("我也想参加书屋活动"),
        ),
      );
    };
  }));
  await page.reload();
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await launch(page, "抖音");
  await page.getByRole("button", { name: /评论志愿者的一天/ }).click();
  await expect(page.getByRole("dialog", { name: /评论：志愿者的一天/ })).toContainText("我也想参加书屋活动");
  await page.getByRole("button", { name: "关闭评论" }).click();
  await home(page);
  await launch(page, "TikTok");
  await expect(page.locator(".tiktok-ui .vertical-video")).toHaveCount(work.data.tiktok.length);
  await page.getByRole("button", { name: /下一条/ }).click();
  await expect.poll(() => page.locator(".tiktok-ui .vertical-feed").evaluate((el) => el.scrollTop)).toBeGreaterThan(10);
});
test("social apps can comment, and WeChat can send own offline message", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await launch(page, "微博");
  await page.getByRole("button", { name: /评论拾光书屋周末活动/ }).click();
  await page.getByRole("textbox", { name: "输入评论" }).fill("周末见！");
  await page.getByRole("button", { name: "发送评论" }).click();
  await expect(page.getByRole("dialog")).toContainText("周末见！");
  await page.getByRole("button", { name: "关闭评论" }).click();
  await home(page);
  await launch(page, "小红书");
  await page.getByRole("button", { name: /评论周末旧书交换会/ }).click();
  await page.getByRole("textbox", { name: "输入评论" }).fill("我想带一本漫画");
  await page.getByRole("button", { name: "发送评论" }).click();
  await expect(page.getByRole("dialog")).toContainText("我想带一本漫画");
  await page.getByRole("button", { name: "关闭评论" }).click();
  await home(page);
  await launch(page, "微信");
  await page.locator(".wx-chat-row").filter({ hasText: "唐夏" }).first().click();
  await page.getByRole("textbox", { name: "输入聊天消息" }).fill("我拿到手机了，先核对资料");
  await page.getByRole("button", { name: "发送聊天消息" }).click();
  await expect(page.locator(".skin-messages")).toContainText("我拿到手机了，先核对资料");
});
