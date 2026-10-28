import {expect,test,type Page} from "@playwright/test";
async function start(page:Page){
  await page.goto("/?mode=kpop&new=1");
  await page.getByRole("button",{name:/生成手机档案/}).click();
  await page.getByRole("button",{name:/打开手机/}).click();
  await page.getByRole("button",{name:"轻触解锁"}).click();
}
async function open(page:Page,name:string){
  await page.getByRole("button",{name:"打开App Store",exact:true}).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  await page.locator(".runtime-library-row").filter({
    has:page.locator(".library-app-title strong",{hasText:name}),
  }).first().getByRole("button",{name:"打开",exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
test("K-pop Telegram uses actual reply system instead of the rainy-phone keyword bot",async({page})=>{
  await start(page);
  await open(page,"Telegram");
  await page.locator(".catalog-chat").first().click();
  await page.getByRole("textbox",{name:"输入聊天内容"}).fill("你好，在吗");
  await page.getByRole("button",{name:"发送聊天内容"}).click();
  await expect(page.getByRole("status")).toContainText("离线剧情回复");
  await expect(page.locator(".catalog-bubbles")).toContainText("刚看到",{timeout:15000});
  await expect(page.locator(".catalog-bubbles")).toContainText("你好，在吗");
});
test("K-pop QQ and WhatsApp both preserve the same character-reply contract",async({page})=>{
  await start(page);
  await open(page,"QQ");
  await page.locator(".catalog-chat").first().click();
  await page.getByRole("textbox",{name:"输入聊天内容"}).fill("你好");
  await page.getByRole("button",{name:"发送聊天内容"}).click();
  await expect(page.locator(".qq-thread-messages")).toContainText("刚看到",{timeout:15000});
  await page.getByRole("button",{name:"返回桌面",exact:true}).click();
  await open(page,"WhatsApp");
  await page.locator(".wa-chat-row").first().click();
  await page.getByRole("textbox",{name:"输入聊天内容"}).fill("你好");
  await page.getByRole("button",{name:"发送聊天内容"}).click();
  await expect(page.locator(".skin-messages")).toContainText("刚看到",{timeout:15000});
});
