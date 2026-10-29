import type { Runtime } from "../schema";

/** All endings are fictional, explicit player decisions; they never prove a private relationship. */
export type KpopEndingId="return"|"contact"|"leak";
export const KPOP_ENDINGS: ReadonlyArray<{id:KpopEndingId;title:string;preview:string;impact:string}>=[
  {id:"return",title:"把手机交给失物招领处",preview:"停止翻看，交给正规的失物招领处，不留存聊天和照片。",impact:"私事仍属于机主；你不会得到一份关系真相。"},
  {id:"contact",title:"只联系公开的失物招领渠道",preview:"向经纪公司公开的联络渠道报告失物，不发送任何私人截图。",impact:"可能被询问来源，但你选择不透露聊天内容。"},
  {id:"leak",title:"把看到的截图匿名公开",preview:"仅在虚构故事中，把一张私人截图发到模拟讨论区。",impact:"外界关注会升高；推测依旧不等于事实。"},
];
export function getKpopEnding(runtime:Runtime):KpopEndingId|null {
  const value=runtime.variables["kpop-ending"];
  return KPOP_ENDINGS.some(x=>x.id===value)?value as KpopEndingId:null;
}
export function observedKpopEvidence(runtime:Runtime):string[]{
  const raw=runtime.ui?.["kpop-world"]?.["seen-evidence"];
  if(!Array.isArray(raw))return [];
  const read=new Set(runtime.read);
  return [...new Set(raw.filter((id):id is string=>typeof id==="string"&&read.has(id)))];
}
export function kpopEndingGate(runtime:Runtime):{ready:boolean;reason:string}{
  if(getKpopEnding(runtime))return {ready:false,reason:"已经抵达一个尾声；可以回顾档案，不会重复结算。"};
  if(Number(runtime.variables["kpop-turn"]||0)<16||runtime.variables["kpop-sync"]!==true)
    return {ready:false,reason:"先继续探索手机。第 16 页之后，新机同步才会开启。"};
  if(new Set(runtime.visited).size<3)
    return {ready:false,reason:"至少浏览 3 个不同 App，再决定如何处理手机。"};
  if(observedKpopEvidence(runtime).length<2)
    return {ready:false,reason:"至少实际点开 2 条带线索的记录。只看会话列表不算阅读证据。"};
  return {ready:true,reason:"你已看到足够多的片段。如何处理手机，由你决定。"};
}
export function kpopEndingStory(id:KpopEndingId,runtime:Runtime,owner:string):{title:string;paragraphs:string[]}{
  const hints:Record<string,string>={
    song:"一段被反复提起的旋律",sky:"两张相似的天空",concern:"几句过分细致的关心",
    routine:"交叠的日程",object:"重复出现的小物件",nickname:"微妙变化的称呼",
    daily:"宿舍里平凡的琐事",extra:"另一些似近似远的关系",address:"重合的地点",
  };
  const clues=observedKpopEvidence(runtime).length
    ? runtime.clues.filter(x=>hints[x]).slice(0,3).map(x=>hints[x]):[];
  const detail=clues.length?clues.join("、"):"那些你确实翻过的日常记录";
  const preface="你曾看见"+detail+"。它们互相照应，却从没构成一份可以替别人宣布的恋爱证明。";
  if(id==="return")return {
    title:"尾声 · 归还",
    paragraphs:[
      preface,
      "你关上了"+owner+"的聊天窗口，把这部手机交到正规的失物招领处。你没有拍下任何一页，也没有向任何人解释你看过的故事。",
      "失物招领的登记簿翻过了一页。之后有没有人来取，手机之外的你不知道。某些故事，原本就不需要一个旁观者来替它写结局。",
    ],
  };
  if(id==="contact")return {
    title:"尾声 · 留一条消息",
    paragraphs:[
      preface,
      "你只使用公开的官方失物招领渠道，留下发现时间和交接地点，没有提供截图，也没有念出任何私人称呼。对面简单回复：会安排人员核实。",
      "这或许并不是最快的归还方式。可是你把可以说的事情和不属于你的秘密分开了。那两个人究竟如何相处，仍留在他们自己的生活里。",
    ],
  };
  return {
    title:"尾声 · 被看见的代价",
    paragraphs:[
      preface,
      "你还是把一张私人截图放进了模拟讨论区。有人质疑截图的来源，有人忙着考据，也有人提醒别再扩散。帖子的热度开始超过它所能证明的事实。",
      "在这部纯虚构的手机里，消息通知越来越响；而屏幕之外，那些被议论的人没有机会告诉旁观者自己愿意被看见多少。你得到了讨论，却依然没有得到真相。",
    ],
  };
}
