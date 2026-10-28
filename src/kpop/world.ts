import { makeItem, type Item, type Runtime, type Work } from "../schema";
import { kpopLiveEntries } from "./liveFeed";

export const RISK_LEVELS = [
  "尚无公开猜测",
  "零星粉丝猜测",
  "韩网论坛和 X 小范围讨论",
  "粉丝考古与营销号转载",
  "身边人员注意到异样",
  "娱乐媒体开始留意",
  "经纪公司开始谨慎关注",
] as const;
export type KpopAction =
  | "openApp" | "read" | "kpopBrowse" | "impersonate"
  | "publish" | "public-comment" | "public-repost" | "screenshot-leak";
export const TRACE_NAMES: Record<string,string> = {
  song: "歌单中反复出现的第三首钢琴曲",
  sky: "相似的雨后天空与拍摄时间",
  concern: "总是具体到休息和饮水的关心",
  routine: "经纪人公开工作行程与私人日常的时间交叠",
  address: "同一地点的不同记录与时间戳",
  object: "细小配饰的重复出现",
  nickname: "称呼和敬语使用习惯的变化",
  daily: "宿舍和团体生活的琐碎习惯",
  extra: "旁支情侣线索：互动异常之处",
};
const PUBLIC_ACTIONS = new Set<KpopAction>([
  "publish","public-comment","public-repost","screenshot-leak",
]);
export const storyPhase = (turn: number) => turn <= 8 ? 1 : turn <= 15 ? 2 : 3;
export function traceFor(item: Item): string {
  if (item.meta.trace) return item.meta.trace;
  const crossApp: Record<string,string> = {
    "kpop-photos-0":"sky","kpop-photos-12":"sky","kpop-instagram-1":"sky",
    "kpop-spotify-0":"song","kpop-files-5":"song",
    "kpop-photos-6":"object","kpop-taobao-2":"object",
    "kpop-notes-2":"concern","kpop-health-0":"concern",
    "kpop-calendar-1":"routine","kpop-files-0":"routine",
    "kpop-contacts-0":"nickname","kpop-phone-0":"routine",
  };
  if (crossApp[item.id]) return crossApp[item.id];
  if (item.id.startsWith("kpop-extra-") && item.meta.cross==="true") return "extra";
  if (item.id.startsWith("kpop-crush-")) {
    const index=Number(item.id.split("-")[2]);
    if ([7,17].includes(index)) return "song";
    if ([2,8,13].includes(index)) return "concern";
    if ([5,7].includes(index)) return "sky";
  }
  return "";
}
function targetItem(work: Work, messages: Runtime["messages"], target: string): Item | undefined {
  for(const items of Object.values(work.data)){
    const item=items.find(i=>i.id===target);
    if(item)return item;
  }
  for(const items of Object.values(messages)){
    const item=items.find(i=>i.id===target);
    if(item)return item;
  }
  return undefined;
}
function newItem(
  app: string, turn: number, offset: number, date: string, sender: string,
  title: string, ko: string, zh: string, folder = "",
): Item {
  const ms=Date.parse(date+"T22:17:00Z")+turn*18*60_000+offset*65_000;
  const time=new Date(ms).toISOString().slice(0,16).replace("T"," ");
  return makeItem({
    id:`kpop-world-${app}-${turn}-${offset}`,time,sender,title,
    body:ko+"\n"+zh,folder,kind:app==="instagram"||app==="twitter"||app==="forum"?"post":"text",
    meta:{ko,zh,fiction:"true",sync:"true"},
  });
}
const audience: [string,string,string][]=[
  ["CP粉","两个人又用了类似的歌单？我先存图，不敢下结论。","这个剪辑我愿意再看三遍ㅋㅋ"],
  ["唯粉","别拿一个巧合说事。请尊重演员／艺人个人边界。","本人从没公开承认，别替他们说话。"],
  ["团粉","回归期大家先把关注点放舞台吧，别影响团体。","安利下新歌和这周的舞台。"],
  ["路人","我只是刷到这条，究竟发生了什么？","同城拍到同一片云不是很正常嘛。"],
  ["理智分析","时间戳可能有时区差，不能凭两张图直接推断。","把事实和猜测分开，别散布个人信息。"],
];
function riskPosts(work:Work,turn:number,stage:number):Item[]{
  const date=work.phone.date||"2026-10-28";
  const title=stage===1?"公开评论区里出现零星猜测"
    :stage===2?"韩网小型讨论串：同一张天空吗？"
    :stage===3?"旧直播与服饰对比贴开始被转发"
    :stage===4?"一位圈内成员提醒大家谨慎发言"
    :stage===5?"娱乐资讯账号注意到粉丝讨论"
    :"工作行程提醒：请注意非公开信息";
  const post=newItem("forum",turn,0,date,"论坛用户",title,
    "팬들 사이에 의견이 나뉘고 있다. 확인된 사실은 없다.",
    "粉丝间观点不一，目前没有任何得到证实的私人关系事实。",
    "讨论");
  post.comments=audience.map(([stance,a,b],i)=>`${stance}: ${(turn+i)%2===0?a:b}`);
  const items:Record<string,Item[]>={
    forum:[post],
    twitter:[newItem("twitter",turn,1,date,"粉丝讨论帐号",title,
      "확실한 증거 없으면 루머 퍼뜨리지 말자.",
      "没有确凿证据就不要扩散流言。","为你推荐")],
  };
  if(stage>=6){
    items.kakao=[newItem("kakao",turn,2,date,String(work.variables["kpop-manager"]||"金智秀 실장님"),String(work.variables["kpop-manager"]||"金智秀 실장님"),
      "이번 주 공개 SNS 일정만 다시 확인 부탁드립니다.",
      "请重新确认本周公开 SNS 的活动安排。","工作")];
  }
  return Object.values(items).flat();
}
function growMessages(current:Record<string,Item[]>, work:Work, turn:number, stage:number, firstSync:boolean):Record<string,Item[]>{
  const out={...current};
  const push=(app:string,records:Item[])=>{
    if(!records.length)return;
    const old=out[app]||[];
    const seen=new Set(old.map(x=>x.id));
    const fresh=records.filter(x=>!seen.has(x.id));
    out[app]=[...old,...fresh].slice(-750);
  };
  for(const [app,entries] of Object.entries(kpopLiveEntries(work,turn,firstSync))) {
    push(app,entries);
  }
  if(turn>16 && turn%5===0){
    const groups=[...new Set((work.data.kakao||[]).map(x=>x.title).filter(x=>x.startsWith("跨团同期群 · ")))];
    groups.forEach((thread,index)=>push("kakao",[
      newItem("kakao",turn,10+index,work.phone.date||"2026-10-28",work.phone.owner,thread,
        "오늘도 수고했어. 공연 끝나면 얘기하자.",
        "今天也辛苦了，演出结束再聊。","新同步"),
    ]));
  }
  if(stage>0) riskPosts(work,turn,stage).forEach(x=>{
    const app=x.id.includes("-twitter-")?"twitter":x.id.includes("-kakao-")?"kakao":"forum";
    push(app,[x]);
  });
  return out;
}
export function kpopWorldStep(work:Work, current:Runtime,kind:KpopAction,target:string,previousRead:string[]=[]):Runtime {
  const s:Runtime={...current,variables:{...current.variables},clues:[...current.clues],notifications:[...current.notifications]};
  const v=s.variables;
  const was=Number(v["kpop-turn"]||0);
  const isRead=kind==="read";
  const pageEvent=kind==="kpopBrowse"||kind==="openApp" && !!target && target!=="appstore"||kind==="read";
  const isNewRead=isRead&&!previousRead.includes(target);
  if(pageEvent && (!isRead||isNewRead)) v["kpop-turn"]=was+1;
  const turn=Number(v["kpop-turn"]||0);
  v["kpop-phase"]=storyPhase(turn);
  if(kind==="impersonate"){
    const count=Number(v["kpop-impersonations"]||0)+1;
    v["kpop-impersonations"]=count;
    // An obvious honorific mismatch is suspicious, but it is never absolute proof.
    const previous=Number(v["kpop-style-errors"]||0);
    const next=previous+(target.includes("::style-anomaly")?1:0);
    v["kpop-style-errors"]=next;
    v["kpop-suspicion"]=Math.min(5,Math.floor(count/4)+next);
    if(target.includes("::style-anomaly"))
      s.notifications.push("KakaoTalk · 对方可能注意到了说话习惯的变化（虚构）");
  }
  if(isRead&&isNewRead){
    const it=targetItem(work,s.messages,target);
    const clue=it && traceFor(it);
    if(clue && !s.clues.includes(clue)) s.clues.push(clue);
    if(clue && it) {
      const previous=s.ui?.["kpop-world"]?.["seen-evidence"];
      const ids=Array.isArray(previous)&&previous.every(x=>typeof x==="string")?previous:[];
      if(!ids.includes(it.id)){
        s.ui={...s.ui,"kpop-world":{
          ...(s.ui?.["kpop-world"]||{}),"seen-evidence":[...ids,it.id].slice(-120),
        }};
      }
    }
  }
  if(PUBLIC_ACTIONS.has(kind)){
    const actions=Number(v["kpop-public-actions"]||0)+1;
    v["kpop-public-actions"]=actions;
    const previous=Number(v["kpop-risk"]||0);
    const evidenceCap=s.clues.length===0 ? Math.min(6,1+Math.floor(actions/6)) : Math.min(6,3+Math.floor(s.clues.length/2)+Math.floor(actions/12));
    const targetRisk=Math.min(6,Math.floor((actions+1)/2),evidenceCap,previous+1);
    if(targetRisk>previous){
      v["kpop-risk"]=targetRisk;
      s.notifications.push(`公开评论出现新讨论 · ${RISK_LEVELS[targetRisk]}（虚构舆情）`);
      s.messages=growMessages(s.messages,work,turn,targetRisk,false);
    }
  }
  const firstSync=turn>15 && v["kpop-sync"]!==true;
  if(firstSync){
    v["kpop-sync"]=true;
    s.notifications.push("三天后 · 新手机开始同步，旧设备收到新消息和快拍（虚构设定）");
  }
  if(turn>15 && (firstSync || pageEvent && turn%2===0)){
    const stage=Number(v["kpop-risk"]||0);
    s.messages=growMessages(s.messages,work,turn,0,firstSync);
    if(stage>=5&&turn%6===0){
      const now=Number(v["kpop-media-attention"]||0);
      v["kpop-media-attention"]=now+1;
    }
  }
  if(turn>0&&turn%7===0&&turn!==was&&pageEvent)
    s.notifications.push("行程提醒 · 记得翻翻手机里新出现的日常记录（虚构）");
  return s;
}
export function kpopSuggestions(runtime:Runtime): {app:string;label:string;why:string}[] {
  const seen=new Set(runtime.visited);
  const all=[
    {app:"kakao",label:"翻 KakaoTalk",why:"从成员、家人、经纪人的日常留言中寻找习惯"},
    {app:"instagram",label:"查看 Instagram",why:"比较公开发帖和快拍中的时间、物件"},
    {app:"photos",label:"打开相册",why:"检查一张照片里真正出现了什么"},
    {app:"notes",label:"阅读备忘录",why:"从未公开的工作和生活记录中寻找线索"},
    {app:"calendar",label:"查看行程表",why:"比对录制、转场及休息时间"},
    {app:"spotify",label:"翻歌单",why:"看看反复提到的第三首歌"},
    {app:"forum",label:"看看公开讨论",why:"公共观点不是关系真相"},
  ];
  const unseen=all.filter(x=>!seen.has(x.app));
  return [...unseen,...all.filter(x=>seen.has(x.app))].slice(0,4);
}
