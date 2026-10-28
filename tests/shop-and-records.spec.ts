import { test, expect, type Page } from "@playwright/test";

async function openApp(page: Page, name: string) {
  await page.getByRole("button", {name:"打开App Store",exact:true}).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  await page.locator(".runtime-library-row").filter({
    has:page.locator(".library-app-title strong",{hasText:name})
  }).first().getByRole("button",{name:"打开",exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button",{name:"轻触解锁"}).click();
}
test("Taobao cart checks out and tracks its local simulated order",async ({page})=>{
  await start(page);
  await openApp(page,"淘宝");
  await page.getByRole("button",{name:/加入购物车灯芯笔记本/}).click();
  await page.getByRole("button",{name:"购物车 (1)"}).click();
  const cart=page.getByRole("region",{name:"购物车"});
  await expect(cart).toContainText("灯芯笔记本");
  await expect(cart).toContainText("18.00");
  await page.getByRole("button",{name:"模拟下单"}).click();
  await page.getByRole("button",{name:"我的订单 (1)"}).click();
  const orders=page.getByRole("region",{name:"我的模拟订单"});
  await expect(orders).toContainText("已下单");
  await orders.getByRole("button",{name:"推进模拟物流"}).click();
  await expect(orders).toContainText("已发货");
  await orders.getByRole("button",{name:"推进模拟物流"}).click();
  await expect(orders).toContainText("已送达");
  await page.waitForFunction(async ()=>new Promise<boolean>(resolve=>{
    const o=indexedDB.open("foundphone-studio");
    o.onerror=()=>resolve(false);
    o.onsuccess=()=>{
      const tx=o.result.transaction("saves","readonly");
      const read=tx.objectStore("saves").get("rainy-phone-b17");
      read.onerror=()=>resolve(false);
      read.onsuccess=()=>resolve(String(read.result?.state?.ui?.taobao?.["taobao-orders"]||"").includes("已送达"));
    };
  }));
  await page.reload();
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await openApp(page,"淘宝");
  await page.getByRole("button",{name:"我的订单 (1)"}).click();
  await expect(page.getByRole("region",{name:"我的模拟订单"})).toContainText("已送达");
});
test("Food delivery has a working local basket and saved checkout",async ({page})=>{
  await start(page);
  await openApp(page,"外卖");
  await page.getByRole("button",{name:/加入餐车夜间饭团小店/}).click();
  await page.getByRole("button",{name:"餐车 (1)"}).click();
  const cart=page.getByRole("region",{name:"模拟餐车"});
  await expect(cart).toContainText("夜间饭团小店");
  await page.getByRole("button",{name:"模拟下单"}).click();
  await page.getByRole("button",{name:"我的订单 (1)"}).click();
  await expect(page.getByRole("region",{name:"我的模拟订单"})).toContainText("夜间饭团小店");
});
test("Notes create and edit a persistent local entry",async ({page})=>{
  await start(page);
  await openApp(page,"备忘录");
  await page.getByRole("button",{name:"新增备忘录"}).click();
  await page.getByRole("textbox",{name:"备忘录标题"}).fill("我的线索笔记");
  await page.getByRole("textbox",{name:"备忘录正文"}).fill("票根 B-17");
  await page.getByRole("button",{name:"保存",exact:true}).click();
  await expect(page.getByRole("region",{name:"我的备忘录"})).toContainText("我的线索笔记");
  await page.getByRole("button",{name:"编辑我的线索笔记"}).click();
  await page.getByRole("textbox",{name:"备忘录正文"}).fill("票根 B-17 和 0917");
  await page.getByRole("button",{name:"保存修改"}).click();
  await expect(page.getByRole("region",{name:"我的备忘录"})).toContainText("0917");
});
