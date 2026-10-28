import { expect, test, type Page } from "@playwright/test";

async function launch(page: Page, name: string) {
  await page.getByRole("button",{name:"打开App Store",exact:true}).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  await page.locator(".runtime-library-row").filter({
    has:page.locator(".library-app-title strong",{hasText:name})
  }).first().getByRole("button",{name:"打开",exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
test("mail app creates and saves a draft, with explicit native-mail handoff",async ({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await launch(page,"邮件");
  await page.getByRole("button",{name:"＋ 写邮件"}).click();
  await page.getByRole("textbox",{name:"收件邮箱"}).fill("friend@example.com");
  await page.getByRole("textbox",{name:"邮件主题"}).fill("雨夜计划");
  await page.getByRole("textbox",{name:"邮件正文"}).fill("记得核对票根和账本");
  await expect(page.getByRole("link",{name:"用系统邮件应用编辑真实邮件"})).toHaveAttribute("href",/mailto:/);
  await page.getByRole("button",{name:"保存草稿"}).click();
  await page.getByRole("button",{name:"草稿",exact:true}).first().click();
  await expect(page.getByRole("region",{name:"我的本机邮件"})).toContainText("雨夜计划");
  await page.getByRole("button",{name:"编辑邮件雨夜计划"}).click();
  await page.getByRole("button",{name:"模拟发送"}).click();
  await page.getByRole("button",{name:"已发送",exact:true}).first().click();
  await expect(page.getByRole("region",{name:"我的本机邮件"})).toContainText("已发送（模拟）");
  await page.reload();
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await launch(page,"邮件");
  await page.getByRole("button",{name:"已发送",exact:true}).first().click();
  await expect(page.getByRole("region",{name:"我的本机邮件"})).toContainText("雨夜计划");
});
test("contacts and reminders support user-created records",async ({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await launch(page,"通讯录");
  await page.getByRole("button",{name:"新增联系人"}).click();
  await page.getByRole("textbox",{name:"联系人姓名"}).fill("新的故事联系人");
  await page.getByRole("textbox",{name:"电话号码或备注"}).fill("虚构角色，无真实号码");
  await page.getByRole("button",{name:"保存",exact:true}).click();
  await expect(page.getByRole("region",{name:"我的联系人"})).toContainText("新的故事联系人");
  await page.getByRole("button",{name:"返回桌面",exact:true}).click();
  await launch(page,"提醒事项");
  await page.getByRole("button",{name:"新增提醒事项"}).click();
  await page.getByRole("textbox",{name:"提醒内容"}).fill("检查旧仓库记录");
  await page.getByRole("button",{name:"保存",exact:true}).click();
  await page.getByRole("button",{name:"切换完成检查旧仓库记录"}).click();
  await expect(page.getByRole("button",{name:"切换完成检查旧仓库记录"})).toHaveAttribute("aria-pressed","true");
});
