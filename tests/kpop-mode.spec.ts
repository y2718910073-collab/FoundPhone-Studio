import { expect, test, type Page } from "@playwright/test";
async function start(page: Page) {
  await page.goto("/?mode=kpop");
  await expect(page.getByText("韩娱捡手机 · 平行世界")).toBeVisible();
  await page.getByRole("button",{name:/生成手机档案/}).click();
  await expect(page.getByRole("heading",{name:"手机档案"})).toBeVisible();
  await page.getByRole("button",{name:/打开手机/}).click();
  await page.getByRole("button",{name:"轻触解锁"}).click();
}
async function openKakao(page: Page) {
  await page.getByRole("button",{name:"打开App Store",exact:true}).click();
  await page.getByPlaceholder("搜索全部App").fill("KakaoTalk");
  await page.locator(".runtime-library-row").filter({
    has:page.locator(".library-app-title strong",{hasText:"KakaoTalk"}),
  }).first().getByRole("button",{name:"打开",exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
test("K-pop setup launches its own virtual phone and 150+ bilingual messages",async ({page})=>{
  await start(page);
  await openKakao(page);
  const chat = page.locator(".mymy-kakao");
  await expect(chat).toHaveAttribute("data-kpop","true");
  await chat.getByRole("button",{name:/柳时恩/}).first().click();
  await expect(chat.locator(".kzm")).toHaveCount(200);
  await expect(chat.locator(".kzbub").first()).toContainText("오늘 사전녹화");
  await expect(chat.locator(".kzbub").first()).toContainText("今天预录");
  await expect(chat.getByRole("status")).toContainText("离线剧情回复");
  await chat.getByRole("textbox",{name:"KKT消息"}).fill("你好，在吗");
  await chat.getByRole("button",{name:"发送KKT消息"}).click();
  await expect(chat.locator(".kzm")).toHaveCount(202,{timeout:15000});
  await expect(chat.locator(".kzbub").last()).toContainText("现在");
});
test("K-pop scene preserves source language mode and original rainy story",async ({page})=>{
  await page.goto("/?mode=kpop");
  await page.getByText("仅韩文", {exact:true}).click();
  await page.getByRole("button",{name:/生成手机档案/}).click();
  await page.getByRole("button",{name:/打开手机/}).click();
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await openKakao(page);
  const chat=page.locator(".mymy-kakao");
  await chat.getByRole("button",{name:/柳时恩/}).first().click();
  await expect(chat.locator(".kzbub").first()).toContainText("오늘 사전녹화");
  await expect(chat.locator(".kzbub").first()).not.toContainText("今天预录");
  await page.goto("/");
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await page.getByRole("button",{name:"打开微信",exact:true}).click();
  await expect(page.locator(".wx-ui")).toBeVisible();
});
test("fifteen phone views enable fictional sync and newly received messages",async ({page})=>{
  await start(page);
  await openKakao(page);
  const chat=page.locator(".mymy-kakao");
  for(let i=0;i<14;i++){
    await chat.getByRole("button",{name:/柳时恩/}).first().click();
    await chat.getByRole("button",{name:"返回"}).first().click();
  }
  await chat.getByRole("button",{name:/朴雅凛/}).first().click();
  await expect(chat.getByRole("status")).toContainText("新机同步开启");
  await expect(chat).toContainText("今天练习会晚一点");
});
