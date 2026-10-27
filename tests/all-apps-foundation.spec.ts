import { expect, test, type Page } from "@playwright/test";

async function launch(page: Page, name: string) {
  await page.getByRole("button", { name: "打开App Store", exact: true }).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  const found = page.locator(".runtime-library-row").filter({
    has: page.locator(".library-app-title strong", { hasText: name }),
  }).first();
  await found.getByRole("button", { name: "打开", exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform", "none");
}
test("Netflix-style demo and Bilibili can play attributed open-license videos", async ({ page, request }) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.data.netflix.some((i: {meta: {openVideo?: string}}) => i.meta.openVideo)).toBe(true);
  expect(work.data.bilibili.some((i: {meta: {openVideo?: string}}) => i.meta.openVideo)).toBe(true);
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await launch(page, "Netflix");
  await page.getByRole("button", { name: /播放 \/ 详情/ }).click();
  const video = page.getByRole("dialog").locator("video");
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("src", /^https:\/\//);
  await expect(page.getByRole("dialog")).toContainText("Blender");
  await page.getByRole("button", { name: "关闭视频" }).click();
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await launch(page, "哔哩哔哩");
  await page.locator(".bili-grid > button").first().click();
  await expect(page.getByRole("dialog").locator("video")).toBeVisible();
});
test("phone lets players dial native tel: link without silently making calls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await page.getByRole("button", { name: "打开电话", exact: true }).click();
  await page.getByRole("button", { name: "拨号键盘" }).click();
  for (const digit of "13800138000") {
    await page.locator(".dialer > div").getByRole("button", { name: digit, exact: false }).first().click();
  }
  await expect(page.getByRole("link", { name: /使用系统拨号器拨打/ }))
    .toHaveAttribute("href", "tel:13800138000");
  await expect(page.locator(".dial-native-info")).toContainText("真实电话");
  await expect(page.getByRole("button", { name: "模拟拨号" })).toBeVisible();
});
test("the story contains useful items for formerly empty apps", async ({ request }) => {
  const work = await (await request.get("/work.json")).json();
  for (const app of ["wallet","contacts","health","find","alipay","taobao","delivery","snapchat","telegram","kakao","discord"]) {
    expect(work.data[app]?.length, `Missing content: ${app}`).toBeGreaterThan(0);
  }
  expect(work.apps.length).toBe(49);
});
