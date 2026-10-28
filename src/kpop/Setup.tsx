import { useState } from "react";
import { Music2, ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { defaultKpopProfile, normalizeKpopProfile, readKpopProfile, saveKpopProfile, type KpopProfile, type LanguageMode, type FanLevel } from "./profile";
import { setAiSession } from "./ai";
import "./setup.css";

export function KpopSetup({ onStart }: { onStart: (p: KpopProfile) => void }) {
  const [draft, setDraft] = useState<KpopProfile>(()=>readKpopProfile()||defaultKpopProfile);
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [agree, setAgree] = useState(false);
  const [aiMode, setAiMode] = useState<"offline" | "puter" | "custom">("offline");
  const [error, setError] = useState("");
  const set = (key: keyof KpopProfile, value: string) => setDraft(prev => ({ ...prev, [key]: value }));
  const enter = () => {
    if (aiMode==="puter") {
      if(!agree){setError("请先同意第三方 Puter AI 处理虚构聊天；Puter 账户有使用额度，超额可能产生费用。");return;}
      setAiSession({provider:"puter",model:"gpt-5.4-nano"});
    } else if (aiMode==="custom") {
      if (!endpoint || !apiKey || !model || !agree) {
        setError("若使用在线 AI，请完整填写服务地址、模型、凭证，并同意向该服务发送虚构聊天文本；否则清空这些字段使用离线预设回复。");
        return;
      }
      try {
        const url = new URL(endpoint);
        if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("必须使用 HTTPS 地址。");
      } catch {setError("AI 地址格式无效，需使用兼容聊天接口的 HTTPS 地址。");return;}
      setAiSession({ endpoint, model, apiKey });
    } else setAiSession(null);
    const profile = normalizeKpopProfile(draft);
    saveKpopProfile(profile);
    onStart(profile);
  };
  return <div className="kpop-setup-shell">
    <section className="kpop-setup-card">
      <header><Music2 size={24}/><div><strong>韩娱捡手机 · 平行世界</strong><p>从一部遗失的手机开始认识一个人</p></div></header>
      {step === "edit" ? <>
        <p className="kpop-setup-fict"><ShieldCheck size={16}/> 所有人物私信、CP关系和后续情节均为虚构，不代表现实艺人的实际私生活。</p>
        <fieldset><legend>① 你的粉圈资历</legend>
          {(["路人粉","资深粉","显微镜粉","自定义"] as FanLevel[]).map(f=><label className="kpop-choice" key={f}><input type="radio" name="fan" checked={draft.fan===f} onChange={()=>set("fan",f)}/>{f}</label>)}
        </fieldset>
        <fieldset><legend>② 消息语言模式</legend>
          {([["dual","韩文＋简体中文翻译"],["ko","仅韩文"],["zh","简体中文（韩式口语）"]] as [LanguageMode,string][]).map(([v,t])=><label className="kpop-choice" key={v}><input type="radio" name="lang" checked={draft.language===v} onChange={()=>set("language",v)}/>{t}</label>)}
        </fieldset>
        <fieldset className="kpop-profile-fields"><legend>③ 手机与 CP 设定</legend>
          <label>机主姓名／艺名<input aria-label="机主姓名" maxLength={24} value={draft.owner} onChange={e=>set("owner",e.target.value)}/></label>
          <label>意中人姓名／艺名<input aria-label="意中人姓名" maxLength={24} value={draft.crush} onChange={e=>set("crush",e.target.value)}/></label>
          <label>所属团体<input aria-label="团体" maxLength={48} value={draft.group} onChange={e=>set("group",e.target.value)}/></label>
          <label>经纪公司<input aria-label="公司" maxLength={64} value={draft.agency} onChange={e=>set("agency",e.target.value)}/></label>
          <label>两人关系基调（只供剧情推演）<textarea aria-label="关系基调" rows={2} maxLength={200} value={draft.relationship} onChange={e=>set("relationship",e.target.value)}/></label>
          <label>当前活动／行程节点<textarea aria-label="行程节点" rows={2} maxLength={200} value={draft.background} onChange={e=>set("background",e.target.value)}/></label>
          <label>联系人与群聊名单<textarea aria-label="联系人名单" rows={2} maxLength={400} value={draft.friends} onChange={e=>set("friends",e.target.value)}/></label>
          <label>额外 CP 线索（可留空）<input aria-label="额外CP" maxLength={350} value={draft.extraCouples} onChange={e=>set("extraCouples",e.target.value)}/></label>
          <label>团内定位／主舞／主唱等<input aria-label="团内定位／主舞／主唱等" maxLength={350} value={draft.ownerPosition} onChange={e=>set("ownerPosition",e.target.value)}/></label>
          <label>出道年份<input aria-label="出道年份" maxLength={350} value={draft.debutYear} onChange={e=>set("debutYear",e.target.value)}/></label>
          <label>公众形象与真实打字习惯<textarea aria-label="公众形象与真实打字习惯" rows={2} maxLength={350} value={draft.publicImage} onChange={e=>set("publicImage",e.target.value)}/></label>
          <label>两人身份关系<input aria-label="两人身份关系" maxLength={350} value={draft.crushRelation} onChange={e=>set("crushRelation",e.target.value)}/></label>
          <label>公众对两人关系的印象<textarea aria-label="公众对两人关系的印象" rows={2} maxLength={350} value={draft.publicImpression} onChange={e=>set("publicImpression",e.target.value)}/></label>
          <label>最亲密的朋友（逗号分隔）<input aria-label="最亲密的朋友（逗号分隔）" maxLength={350} value={draft.closeFriends} onChange={e=>set("closeFriends",e.target.value)}/></label>
          <label>同团小群成员（逗号分隔）<input aria-label="同团小群成员（逗号分隔）" maxLength={350} value={draft.dormMembers} onChange={e=>set("dormMembers",e.target.value)}/></label>
          <label>跨团／同期好友名单（可留空）<textarea aria-label="跨团／同期好友名单（可留空）" rows={2} maxLength={350} value={draft.crossFriends} onChange={e=>set("crossFriends",e.target.value)}/></label>
          <label>家人备注名<input aria-label="家人备注名" maxLength={350} value={draft.familyName} onChange={e=>set("familyName",e.target.value)}/></label>
          <label>经纪人备注名<input aria-label="经纪人备注名" maxLength={350} value={draft.managerName} onChange={e=>set("managerName",e.target.value)}/></label>
          <label>前公司、练习生／选秀／前团经历<textarea aria-label="前公司、练习生／选秀／前团经历" rows={2} maxLength={350} value={draft.previousCareer} onChange={e=>set("previousCareer",e.target.value)}/></label>
          <label>想加入的前辈／制作人／演员<textarea aria-label="想加入的前辈／制作人／演员" rows={2} maxLength={350} value={draft.guests} onChange={e=>set("guests",e.target.value)}/></label>
          <label>捡到手机的日期<input aria-label="游戏日期" type="date" value={draft.date} onChange={e=>set("date",e.target.value)}/></label>
          <label>捡到的地点<input aria-label="捡到地点" maxLength={120} value={draft.location} onChange={e=>set("location",e.target.value)}/></label>
          <label>手机机型与电量<input aria-label="手机信息" maxLength={100} value={draft.phone} onChange={e=>set("phone",e.target.value)}/></label>
        </fieldset>
        <button className="kpop-setup-primary" onClick={()=>setStep("review")}>生成手机档案 <ChevronRight size={18}/></button>
      </> : <>
        <button className="kpop-back" onClick={()=>setStep("edit")}><ChevronLeft size={16}/> 修改档案</button>
        <h2>手机档案</h2>
        <dl>{([["粉圈资历",draft.fan],["消息语言",draft.language==="dual"?"韩文＋简中":draft.language==="ko"?"仅韩文":"简中"],["机主",draft.owner],["意中人",draft.crush],["团体",draft.group],["公司",draft.agency],["活动",draft.background],["日期",draft.date],["地点",draft.location],["手机",draft.phone],["联系人",draft.friends],["额外CP",draft.extraCouples||"无"],["出道年份",draft.debutYear],["团内定位",draft.ownerPosition],["公众形象",draft.publicImage],["两人身份关系",draft.crushRelation],["成员名单",draft.dormMembers],["前公司经历",draft.previousCareer||"未设定"]] as string[][]).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <details className="kpop-ai-config" open><summary>角色回复方式：离线剧情／Puter AI／自己的模型</summary>
          <p>想让角色自然理解任意话题，请选择真正的 AI。Puter 不用开发者 API 密钥，但要登录外部账户；有免费月度额度，超出可能计费。离线模式只有预设剧情回复。</p>
          <div className="kpop-ai-mode">
            <label><input type="radio" name="ai-mode" checked={aiMode==="offline"} onChange={()=>setAiMode("offline")}/>离线剧情（不连接 AI）</label>
            <label><input type="radio" name="ai-mode" checked={aiMode==="puter"} onChange={()=>setAiMode("puter")}/>Puter AI 自由聊天（需登录）</label>
            <label><input type="radio" name="ai-mode" checked={aiMode==="custom"} onChange={()=>setAiMode("custom")}/>使用自己的 AI 服务</label>
          </div>
          {aiMode==="puter"&&<p>第一次发送消息时才连接 Puter。该服务可能要求登录；聊天由该平台处理，使用额度和计费以其账户规则为准。</p>}
          {aiMode==="custom"&&<>
          <label>AI 聊天服务端点<input aria-label="AI服务地址" type="url" placeholder="https://your-proxy.example/v1/chat/completions" value={endpoint} onChange={e=>setEndpoint(e.target.value)}/></label>
          <label>模型 ID<input aria-label="AI模型" placeholder="你的模型名称" value={model} onChange={e=>setModel(e.target.value)}/></label>
          <label>会话专用 API 凭证<input aria-label="AI凭证" type="password" autoComplete="off" value={apiKey} onChange={e=>setApiKey(e.target.value)}/></label>
          <small>提供商需允许 CORS。不要填写公共共享密钥，也不要使用未受信任的网站。</small></>}
          {aiMode!=="offline"&&<label className="kpop-consent"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/>我同意：虚构角色设定与聊天将发送给选定的第三方 AI；Puter 账户用量可能收费，自己填写的 API 凭证只存本次页面内存。</label>}
        </details>
        {error && <p className="kpop-error" role="alert">{error}</p>}
        <button className="kpop-setup-primary" onClick={enter}>打开手机 <ChevronRight size={18}/></button>
      </>}
      <footer>原创虚构韩娱生活模拟 · 无现实爆料 · 不保证实际第三方 App 的服务</footer>
    </section>
  </div>;
}
