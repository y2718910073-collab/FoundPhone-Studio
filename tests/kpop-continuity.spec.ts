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
  await page.goto("/?mode=kpop");
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
  await expect(page.locator(".notes-list button").first()).toContainText("컴백 주간 체크");
  await expect(page.locator(".notes-list button").first()).not.toContainText("复归周提醒");
  await page.locator(".notes-list button").first().click();
  await expect(page.locator(".native-note-paper")).toContainText("사전 녹화");
  await expect(page.locator(".native-note-paper")).not.toContainText("事前录制");
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

test("role AI can be enabled from the existing phone without restarting or discarding the save",async ({page})=>{
  await enterPhone(page,"dual");
  await page.getByRole("button",{name:"打开线索整理"}).click();
  const journal=page.getByRole("dialog",{name:"手机线索整理"});
  await journal.getByRole("button",{name:"角色回复"}).click();
  await expect(journal).toContainText("当前：离线预设剧情");
  await journal.getByText("Puter AI（第三方账号，可能计费）",{exact:true}).click();
  await journal.getByRole("checkbox").check();
  await journal.getByRole("button",{name:"保存 AI 回复设置"}).click();
  await expect(journal).toContainText("当前：Puter AI 自由聊天");
  await journal.getByRole("button",{name:"关闭线索整理"}).click();
  await openApp(page,"KakaoTalk");
  const chat=page.locator(".mymy-kakao");
  await chat.getByRole("button",{name:/柳时恩/}).first().click();
  await expect(chat.getByRole("status")).toContainText("AI 对话");
  await page.getByRole("button",{name:"打开线索整理"}).click();
  const next=page.getByRole("dialog",{name:"手机线索整理"});
  await next.getByRole("button",{name:"角色回复"}).click();
  await next.getByText("离线剧情（不连接网络模型）",{exact:true}).click();
  await next.getByRole("button",{name:"切换到离线剧情"}).click();
  await expect(next).toContainText("当前：离线预设剧情");
  await expect(next).toContainText("没有改变");
});
