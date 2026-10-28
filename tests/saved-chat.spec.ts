import { test, expect, type Page } from "@playwright/test";

async function launch(page: Page, name: string) {
  await page.getByRole("button",{name:"打开App Store",exact:true}).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  await page.locator(".runtime-library-row").filter({
    has:page.locator(".library-app-title strong",{hasText:name}),
  }).first().getByRole("button",{name:"打开",exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
async function ready(page: Page) {
  await page.goto("/");
  await page.getByRole("button",{name:"轻触解锁"}).click();
}
test("QQ conversation accepts player messages and gives narrative response",async ({page})=>{
  await ready(page);
  await launch(page,"QQ");
  await page.locator(".catalog-chat").filter({hasText:"周末摆书小分队"}).first().click();
  await page.getByRole("textbox",{name:"输入聊天内容"}).fill("清单里有多少本书？");
  await page.getByRole("button",{name:"发送聊天内容"}).click();
  await expect(page.locator(".qq-thread-messages")).toContainText("清单里有多少本书？");
  await expect(page.locator(".qq-thread-messages")).toContainText("36");
});
test("SMS can send a local message and receive a response",async ({page})=>{
  await ready(page);
  await launch(page,"信息");
  await page.locator(".catalog-chat").first().click();
  await page.getByRole("textbox",{name:"输入聊天内容"}).fill("你好，我捡到手机了");
  await page.getByRole("button",{name:"发送聊天内容"}).click();
  await expect(page.locator(".catalog-bubbles")).toContainText("我捡到手机了");
  await expect(page.locator(".catalog-bubbles")).toContainText("手机");
});
test("Telegram opens chat with a working composer",async ({page})=>{
  await ready(page);
  await launch(page,"Telegram");
  await page.locator(".catalog-chat").first().click();
  await page.getByRole("textbox",{name:"输入聊天内容"}).fill("有人在吗");
  await page.getByRole("button",{name:"发送聊天内容"}).click();
  await expect(page.locator(".telegram-bubbles")).toContainText("有人在吗");
  await expect(page.locator(".telegram-bubbles")).toContainText("在");
});
