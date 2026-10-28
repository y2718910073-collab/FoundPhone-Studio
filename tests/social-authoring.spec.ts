import { expect, test } from "@playwright/test";

test("social posts can be created, edited, deleted and saved", async ({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await page.getByRole("button",{name:"打开微博",exact:true}).click();
  await page.getByRole("button",{name:"发布新动态"}).click();
  await page.getByRole("textbox",{name:"动态标题"}).fill("雨夜的书屋");
  await page.getByRole("textbox",{name:"动态正文"}).fill("我发现了 B-17 的旧票根");
  await page.getByRole("button",{name:"发布到本机动态"}).click();
  await expect(page.locator(".weibo-ui .weibo-post")).toContainText(["我发现了 B-17 的旧票根"]);
  await expect(page.getByRole("region",{name:"我发布的动态"})).toContainText("我的动态 1");
  await page.reload();
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await page.getByRole("button",{name:"打开微博",exact:true}).click();
  await expect(page.locator(".weibo-post").filter({hasText:"B-17"})).toBeVisible();
  await page.getByText("管理我发布的 1 条动态").click();
  await page.getByRole("button",{name:"编辑动态雨夜的书屋"}).click();
  await page.getByRole("textbox",{name:"动态正文"}).fill("我又核实了日期 0917");
  await page.getByRole("button",{name:"保存修改"}).click();
  await expect(page.locator(".weibo-post").filter({hasText:"0917"})).toBeVisible();
  await page.getByRole("button",{name:"删除动态雨夜的书屋"}).click();
  await expect(page.getByRole("region",{name:"我发布的动态"})).toContainText("我的动态 0");
});
