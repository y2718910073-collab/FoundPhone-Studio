import {expect,test,type Page} from "@playwright/test";

async function enterPhone(page:Page,mode:"dual"|"ko"|"zh"="dual",puter=false){
  if(puter){
    await page.addInitScript(()=>{
      const mock={ai:{chat:async(turns:{role:string;content:string}[])=>{
        await new Promise(resolve=>setTimeout(resolve,900));
        const text=turns.at(-1)?.content||"";
        const answer=text.includes("第一条")?"第一条已收到":"第二条已收到";
        return {message:{content:JSON.stringify({ko:"응. 읽었어 ㅎㅎ",zh:answer})}};
      }}};
      (window as unknown as {puter:unknown}).puter=mock;
    });
  }
  await page.goto("/?mode=kpop&new=1");
  if(mode==="ko")await page.getByText("仅韩文",{exact:true}).click();
  if(mode==="zh")await page.getByText("直接以简体中文呈现",{exact:true}).click();
  await page.getByRole("button",{name:/生成手机档案/}).click();
  if(puter){
    await page.getByText("Puter AI 自由聊天（需登录）",{exact:true}).click();
    await page.getByRole("checkbox").check();
  }
  await page.getByRole("button",{name:/打开手机/}).click();
  await page.getByRole("button",{name:"轻触解锁"}).click();
}
async function openApp(page:Page,name:string) {
  await page.getByRole("button",{name:"打开App Store",exact:true}).click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  await page.locator(".runtime-library-row").filter({
    has:page.locator(".library-app-title strong",{hasText:name}),
  }).first().getByRole("button",{name:"打开",exact:true}).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS("transform","none");
}
test("Korean-only applies to private notes and calendar, not just Kakao",async ({page})=>{
  await enterPhone(page,"ko");
  await openApp(page,"备忘录");
  await expect(page.locator(".catalog-row").first()).toContainText("컴백 주간 체크");
  await expect(page.locator(".catalog-row").first()).not.toContainText("复归周提醒");
  await page.locator(".catalog-row").first().click();
  await expect(page.locator(".detail-content")).toContainText("사전 녹화");
  await expect(page.locator(".detail-content")).not.toContainText("事前录制");
});
test("delayed AI replies land in correct threads even after navigating between two chats",async ({page})=>{
  await enterPhone(page,"dual",true);
  await openApp(page,"KakaoTalk");
  const chat=page.locator(".mymy-kakao");
  await chat.getByRole("button",{name:/柳时恩/}).first().click();
  await chat.getByRole("textbox",{name:"KKT消息"}).fill("这是第一条，请记住。");
  await chat.getByRole("button",{name:"发送KKT消息"}).click();
  await chat.getByRole("button",{name:"返回"}).first().click();
  await chat.getByRole("button",{name:/朴雅凛/}).first().click();
  await chat.getByRole("textbox",{name:"KKT消息"}).fill("这是第二条，请记住。");
  await chat.getByRole("button",{name:"发送KKT消息"}).click();
  await expect(chat).toContainText("第二条已收到",{timeout:15000});
  await chat.getByRole("button",{name:"返回"}).first().click();
  await chat.getByRole("button",{name:/柳时恩/}).first().click();
  await expect(chat).toContainText("第一条已收到",{timeout:15000});
  await page.reload();
  await page.getByRole("button",{name:"轻触解锁"}).click();
  await openApp(page,"KakaoTalk");
  await page.locator(".mymy-kakao").getByRole("button",{name:/朴雅凛/}).first().click();
  await expect(page.locator(".mymy-kakao")).toContainText("第二条已收到",{timeout:10000});
});
