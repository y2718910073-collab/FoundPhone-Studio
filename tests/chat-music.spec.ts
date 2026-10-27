import { test, expect, type Page } from "@playwright/test";
async function openApp(page: Page, name: string) {
  await page.getByRole("button", {name: "打开App Store", exact: true}).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  const row = page.locator(".runtime-library-row").filter({
    has: page.locator(".library-app-title strong", {hasText: name}),
  }).first();
  await row.getByRole("button", {name: "打开", exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
test("fictional contact answers messages and conversation persists", async ({page}) => {
  await page.goto("/");
  await page.getByRole("button", {name:"轻触解锁"}).click();
  await page.getByRole("button", {name:"打开微信", exact:true}).click();
  await page.locator(".wx-chat-row").filter({hasText:"唐夏"}).first().click();
  await page.getByRole("textbox", {name:"输入聊天消息"}).fill("我捡到了予晴的手机");
  await page.getByRole("button", {name:"发送聊天消息"}).click();
  await expect(page.locator(".skin-messages")).toContainText("蓝色票根");
  await expect(page.locator(".skin-messages")).toContainText("我捡到了予晴的手机");
  await page.waitForFunction(async () => new Promise<boolean>((resolve) => {
    const o = indexedDB.open("foundphone-studio");
    o.onerror = () => resolve(false);
    o.onsuccess = () => {
      const tx = o.result.transaction("saves", "readonly");
      const req = tx.objectStore("saves").get("rainy-phone-b17");
      req.onerror = () => resolve(false);
      req.onsuccess = () => resolve(
        (req.result?.state?.ui?.wechat?.["local-chat-messages"] ?? []).some(
          (text: string) => text.includes("蓝色票根"),
        ),
      );
    };
  }));
  await page.reload();
  await page.getByRole("button", {name:"轻触解锁"}).click();
  await page.getByRole("button", {name:"打开微信", exact:true}).click();
  await page.locator(".wx-chat-row").filter({hasText:"唐夏"}).first().click();
  await expect(page.locator(".skin-messages")).toContainText("蓝色票根");
});
test("Spotify playlist has original playable audio and supports navigation", async ({page, request}) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.data.spotify.length).toBeGreaterThanOrEqual(12);
  expect(work.data.netease.length).toBeGreaterThanOrEqual(8);
  await page.goto("/");
  await page.getByRole("button", {name:"轻触解锁"}).click();
  await openApp(page, "Spotify");
  await expect(page.locator(".spotify-tracks > button")).toHaveCount(work.data.spotify.length);
  await page.locator(".spotify-tracks > button").first().click();
  const audio = page.locator(".original-audio-player audio");
  await expect(audio).toBeVisible();
  await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => el.duration), {timeout:20000}).toBeGreaterThan(20);
  await expect(audio).toHaveAttribute("src",/^blob:/);
  await page.getByRole("button",{name:"下一首"}).click();
  await expect(page.locator(".track-player")).toContainText(work.data.spotify[1].title);
  await page.getByRole("button",{name:"上一首"}).click();
  await expect(page.locator(".track-player")).toContainText(work.data.spotify[0].title);
});
