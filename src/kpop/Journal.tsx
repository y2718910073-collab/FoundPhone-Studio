import { useState } from "react";
import { BookOpen, Camera, ChevronRight, ShieldAlert, X } from "lucide-react";
import type { Runtime, Work, Item } from "../schema";
import { traceFor } from "./world";
import { readKpopProfile } from "./profile";
import { renderKpopItem } from "./language";
import { RISK_LEVELS, TRACE_NAMES, kpopSuggestions, storyPhase } from "./world";
import type { KpopAction } from "./world";
import { KpopAiSettingsPanel } from "./AiSettingsPanel";
import { getKpopEnding, kpopEndingGate, kpopEndingStory, KPOP_ENDINGS, type KpopEndingId } from "./endings";
import "./journal.css";

export function KpopJournal({runtime,work,openApp,onAction}:{
  runtime:Runtime;
  work:Work;
  openApp:(id:string)=>void;
  onAction:(kind:KpopAction,target:string)=>void;
}) {
  const [visible,setVisible]=useState(false);
  const [tab,setTab]=useState<"navigate"|"clues"|"world"|"ai"|"ending">("navigate");
  const [pendingEnding,setPendingEnding]=useState<KpopEndingId|null>(null);
  const [confirm,setConfirm]=useState(false);
  const turns=Number(runtime.variables["kpop-turn"]||0);
  const phase=storyPhase(turns);
  const risk=Number(runtime.variables["kpop-risk"]||0);
  const sync=runtime.variables["kpop-sync"]===true;
  const suggestions=kpopSuggestions(runtime);
  const completed=getKpopEnding(runtime);
  const endingGate=kpopEndingGate(runtime);
  const endingResult=completed ? kpopEndingStory(completed,runtime,work.phone.owner) : null;
  const rawEvidence=runtime.ui?.["kpop-world"]?.["seen-evidence"];
  const evidenceIds=Array.isArray(rawEvidence)&&rawEvidence.every(x=>typeof x==="string") ? rawEvidence:[];
  const archive=Object.entries(work.data).flatMap(([app,items])=>items.map(i=>({app,item:i})))
    .concat(Object.entries(runtime.messages).flatMap(([app,items])=>items.map(i=>({app,item:i}))));
  const evidence=archive.filter(x=>evidenceIds.includes(x.item.id)&&!!traceFor(x.item))
    .sort((a,b)=>a.item.time.localeCompare(b.item.time));
  const language=readKpopProfile()?.language||"dual";
  const visibleEvidence=(trace:string)=>evidence.filter(x=>traceFor(x.item)===trace);
  const excerpt=(i:Item)=>renderKpopItem(i,language).body.slice(0,190);
  const appNames:Record<string,string>={kakao:"KakaoTalk",instagram:"Instagram",photos:"相册",spotify:"Spotify",notes:"备忘录",files:"文件",calendar:"日历",contacts:"通讯录",twitter:"X",taobao:"购物",health:"健康"};

  const go=(app:string)=>{
    setVisible(false);
    openApp(app);
  };
  return <>
    <button type="button" className="kpop-journal-handle" aria-label="打开线索整理" onClick={()=>setVisible(true)}>
      <BookOpen size={15}/> 线索
      {runtime.clues.length>0&&<span>{runtime.clues.length}</span>}
    </button>
    {visible&&<div className="kpop-journal-shade">
      <section className="kpop-journal" aria-label="手机线索整理" role="dialog" aria-modal="true">
        <header>
          <div><small>虚构韩娱手机 · 玩家视角</small><h2>你翻到了第 {turns} 页</h2></div>
          <button aria-label="关闭线索整理" onClick={()=>setVisible(false)}><X size={20}/></button>
        </header>
        <div className="kpop-phase">
          <b>{phase===1?"阶段一 · 刚开始好奇":phase===2?"阶段二 · 线索渐渐连起来":"阶段三 · 旧机同步"}</b>
          <span>{sync?"新机同步开启，旧机中继续出现新的记录":"目前只有遗失前的手机记录"}</span>
        </div>
        <nav aria-label="线索页面">
          <button className={tab==="navigate"?"selected":""} onClick={()=>setTab("navigate")}>你现在可以</button>
          <button className={tab==="clues"?"selected":""} onClick={()=>setTab("clues")}>已知线索</button>
          <button className={tab==="world"?"selected":""} onClick={()=>setTab("world")}>舆论与行动</button>
          <button className={tab==="ai"?"selected":""} onClick={()=>setTab("ai")}>角色回复</button>
          <button className={tab==="ending"?"selected":""} onClick={()=>setTab("ending")}>{completed?"结局":"尾声"}</button>
        </nav>
        <div className="kpop-journal-scroll">
          {tab==="navigate"&&<>
            <p>由你决定下一页看什么。游戏不会替你自动打开其他 App。</p>
            {suggestions.map(x=><button className="kpop-journal-choice" key={x.app} onClick={()=>go(x.app)}>
              <div><b>{x.label}</b><small>{x.why}</small></div><ChevronRight size={17}/>
            </button>)}
            {sync&&<div className="kpop-sync-hint">
              <b>查看新同步的内容</b>
              <p>本机可能继续收到 KakaoTalk、Instagram、备忘录、日历等更新，更新频率取决于虚构行程。</p>
              <button onClick={()=>go("kakao")}>查看 KakaoTalk 新消息</button>
              <button onClick={()=>go("instagram")}>查看 Instagram 更新</button>
            </div>}
            <p>向上翻聊天记录可以找旧内容。相同记录再次打开不会凭空改写。</p>
          </>}
          {tab==="clues"&&<>
            <p>这里只整理你在手机里实际点开并读到的痕迹，不会直接宣布任何关系真相。</p>
            {runtime.clues.filter(x=>TRACE_NAMES[x]).length===0
              ? <p className="kpop-quiet">目前还没有记录到可以互相对照的细节。去看几段聊天、照片或备忘录吧。</p>
              :runtime.clues.filter(x=>TRACE_NAMES[x]).map(x=><div className="kpop-clue" key={x}>
                <b>{TRACE_NAMES[x]}</b>
                <span>这是你记下的观察，不是实锤。已读来源 {visibleEvidence(x).length} 条。</span>
                {visibleEvidence(x).map(({app,item})=><button type="button" className="kpop-evidence-record" key={item.id} onClick={()=>go(app)}>
                  <strong>{appNames[app]||app} · {item.time}</strong>
                  <span>{excerpt(item)}</span>
                  <small>重新打开此 App 核对 <ChevronRight size={12}/></small>
                </button>)}
              </div>)}
            <small>已阅内容：{runtime.read.length} 条 · 浏览的 App：{runtime.visited.length} 个</small>
          </>}
          {tab==="ai"&&<KpopAiSettingsPanel/>}
          {tab==="ending"&&<section className="kpop-ending-section">
            {endingResult ? <>
              <small>平行世界 · 故事分支已存档</small>
              <h3>{endingResult.title}</h3>
              {endingResult.paragraphs.map((paragraph,i)=><p key={i}>{paragraph}</p>)}
              <div className="kpop-ending-done">可以继续回看手机记录，但这个结局之后不再推进时间或改变舆论。</div>
            </> : <>
              <h3>该把手机交还给谁？</h3>
              <p>你只是拾到手机的旁观者。越往后翻，越明白私人片段并不能证明别人的关系。</p>
              {!endingGate.ready&&<p className="kpop-ending-locked">{endingGate.reason}</p>}
              {endingGate.ready&&<p className="kpop-ending-ready">{endingGate.reason}</p>}
              {KPOP_ENDINGS.map(choice=><button type="button" key={choice.id}
                className={"kpop-ending-option"+(pendingEnding===choice.id?" chosen":"")}
                disabled={!endingGate.ready}
                onClick={()=>setPendingEnding(choice.id)}>
                <strong>{choice.title}</strong>
                <span>{choice.preview}</span>
                <small>{choice.impact}</small>
              </button>)}
              {pendingEnding&&endingGate.ready&&<div className="kpop-ending-confirm">
                <p>确定选择「{KPOP_ENDINGS.find(x=>x.id===pendingEnding)?.title}」吗？该决定会写入当前本地存档，不会向现实网络发送数据。</p>
                <button onClick={()=>{onAction("resolve",pendingEnding);setPendingEnding(null);}}>确认这个结局</button>
                <button onClick={()=>setPendingEnding(null)}>再想一想</button>
              </div>}
            </>}
          </section>}
          {tab==="world"&&<>
            <p>公开讨论只来自你在手机里看得到的帖子。没有现实中的媒体爆料或真实艺人私生活信息。</p>
            <div className="kpop-risk-stage"><ShieldAlert size={20}/><div><b>外界关注：{RISK_LEVELS[risk] || RISK_LEVELS[0]}</b><small>阶段 {risk}/6，舆论不会自动跳级</small></div></div>
            {risk>0&&<button className="kpop-journal-choice" onClick={()=>go("forum")}><div><b>打开论坛查看各方评论</b><small>CP粉、唯粉、团粉、路人和理智分析党各有立场</small></div><ChevronRight size={16}/></button>}
            <p>你可以选择一项有风险的模拟行为，但不会真的向互联网发布任何照片。</p>
            {completed?<p className="kpop-ending-locked">故事已经收束，公开风险不再增加。</p>:!confirm?<button className="kpop-risk-choice" onClick={()=>setConfirm(true)}><Camera size={16}/> 模拟公开一张截图（高风险）</button>:
              <div className="kpop-risk-confirm"><p>确认模拟把一张截图外流到虚构社交网络？可能推动背景舆论；不会复制或上传你的实际数据。</p><button onClick={()=>{onAction("screenshot-leak","player");setConfirm(false);}}>确认剧情操作</button><button onClick={()=>setConfirm(false)}>取消</button></div>}
            <small>主动在模拟社交平台发帖、发表评论，也会逐步影响舆论；冒充机主聊天会影响对方的疑心，但不会自动变成新闻。</small>
          </>}
        </div>
      </section>
    </div>}
  </>;
}
