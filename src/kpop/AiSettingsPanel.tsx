import {useState} from "react";
import {Bot,ShieldCheck,ShieldAlert} from "lucide-react";
import {getAiSession,setAiSession} from "./ai";

type Provider = "offline"|"puter"|"custom";
function currentProvider():Provider {
  const session=getAiSession();
  return !session?"offline":session.provider==="puter"?"puter":"custom";
}
export function KpopAiSettingsPanel(){
  const [provider,setProvider]=useState<Provider>(currentProvider);
  const [choice,setChoice]=useState<Provider>(currentProvider);
  const [endpoint,setEndpoint]=useState("");
  const [model,setModel]=useState("");
  const [apiKey,setApiKey]=useState("");
  const [consent,setConsent]=useState(false);
  const [status,setStatus]=useState("");
  const apply=()=>{
    if(choice==="offline"){
      setAiSession(null);
      setProvider("offline");
      setStatus("已切回离线剧情回复。你的聊天历史和故事进度没有改变。");
      return;
    }
    if(!consent){setStatus("请先同意把虚构聊天内容发送给你选择的第三方服务。");return;}
    if(choice==="puter"){
      setAiSession({provider:"puter",model:"gpt-5.4-nano"});
      setProvider("puter");
      setStatus("已选择 Puter AI。下一条新消息会尝试使用你的 Puter 账户；可能需要登录，消耗额度也可能收费。");
      return;
    }
    if(!endpoint.trim()||!model.trim()||!apiKey.trim()){
      setStatus("需要完整填写 HTTPS 端点、模型名称与访问凭证。");
      return;
    }
    try{
      const url=new URL(endpoint);
      const local=["localhost","127.0.0.1"].includes(url.hostname);
      if(url.protocol!=="https:"&&!(url.protocol==="http:"&&local))
        throw new Error("地址必须采用 HTTPS，本机 localhost 除外。");
      if(url.username||url.password||url.hash)throw new Error("地址不能包含账号、密码或 URL 片段。");
      setAiSession({provider:"custom",endpoint:url.toString(),model:model.trim(),apiKey});
      setProvider("custom");
      setApiKey("");
      setStatus("已连接自定义模型配置。密钥仅保存在当前页面的内存；刷新后需重新填写。");
    }catch(e){
      setStatus(e instanceof Error?e.message:"AI 服务地址无效。");
    }
  };
  return <section className="kpop-ai-in-game" aria-label="角色回复方式设置">
    <h3><Bot size={18}/> 角色回复方式</h3>
    <p>不用重开游戏即可切换回复方式。改动只影响之后发送的消息，已经保存的聊天记录不会重写。</p>
    <div className="kpop-current-ai"><ShieldCheck size={15}/> 当前：{provider==="offline"?"离线预设剧情":provider==="puter"?"Puter AI 自由聊天":"自定义在线 AI"}</div>
    <fieldset>
      <legend>下一条新消息使用</legend>
      <label><input type="radio" name="kpop-in-game-ai" checked={choice==="offline"} onChange={()=>{setChoice("offline");setStatus("");}}/>离线剧情（不连接网络模型）</label>
      <label><input type="radio" name="kpop-in-game-ai" checked={choice==="puter"} onChange={()=>{setChoice("puter");setStatus("");}}/>Puter AI（第三方账号，可能计费）</label>
      <label><input type="radio" name="kpop-in-game-ai" checked={choice==="custom"} onChange={()=>{setChoice("custom");setStatus("");}}/>使用我的 OpenAI 兼容 API</label>
    </fieldset>
    {choice==="custom"&&<div className="kpop-ai-fields">
      <label>HTTPS 服务端点<input aria-label="游戏内 AI 服务端点" type="url" placeholder="https://your-proxy.example/v1/chat/completions" value={endpoint} onChange={e=>setEndpoint(e.target.value)}/></label>
      <label>模型 ID<input aria-label="游戏内 AI 模型" value={model} onChange={e=>setModel(e.target.value)}/></label>
      <label>API 凭证<input aria-label="游戏内 AI 凭证" type="password" autoComplete="off" value={apiKey} onChange={e=>setApiKey(e.target.value)}/></label>
    </div>}
    {choice!=="offline"&&<label className="kpop-ai-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>我知晓角色档案及相关虚构聊天会发送给第三方模型；Puter 使用额可能产生费用，使用自己的 API 可能由提供商计费。</label>}
    <button className="kpop-apply-ai" onClick={apply}>{choice==="offline"?"切换到离线剧情":"保存 AI 回复设置"}</button>
    {!!status&&<p role="status" className="kpop-ai-feedback">{status}</p>}
    <p className="kpop-ai-notice"><ShieldAlert size={13}/>本项目不会替你支付 AI 费用，也不会把真实艺人的私人信息接入模型。Puter 登录和额度由其服务提供。</p>
  </section>;
}
