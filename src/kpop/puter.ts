import { characterGuide, parseAiResponse, type CharacterReply, type ChatTurn } from "./ai";
import type { KpopProfile } from "./profile";

type PuterReply = string | { message?: { content?: unknown }; content?: unknown };
type PuterAPI = { ai: { chat: (
  turns: { role: "system" | "user" | "assistant"; content: string }[],
  options: { model: string; max_tokens: number; normalize: boolean; signal?: AbortSignal },
) => Promise<PuterReply> }};
declare global {
  interface Window { puter?: PuterAPI; }
}
let sdk: Promise<PuterAPI> | null = null;
const sdkUrl="https://js.puter.com/v2/";
/** Loading external code requires an explicit user choice in the setup screen. */
function loadPuter(): Promise<PuterAPI> {
  if(window.puter?.ai?.chat)return Promise.resolve(window.puter);
  if(sdk)return sdk;
  sdk = new Promise<PuterAPI>((resolve,reject)=>{
    const el=document.createElement("script");
    el.src=sdkUrl; el.async=true;
    el.referrerPolicy="no-referrer";
    el.onload=()=>window.puter?.ai?.chat
      ?resolve(window.puter)
      :reject(new Error("Puter SDK 初始化失败，请确认浏览器环境受支持。"));
    el.onerror=()=>reject(new Error("无法载入 Puter AI。请检查网络、地区或浏览器拦截设置。"));
    document.head.append(el);
  }).catch(err=>{sdk=null;throw err;});
  return sdk;
}
function contentText(raw:unknown):string {
  if(typeof raw==="string")return raw;
  if(Array.isArray(raw))return raw.map(x=>contentText(x)).filter(Boolean).join("\n");
  if(raw&&typeof raw==="object"){
    const x=raw as Record<string,unknown>;
    if(typeof x.text==="string")return x.text;
    if(x.content)return contentText(x.content);
  }
  return "";
}
export async function requestPuterReply(
  thread:string,
  history:ChatTurn[],
  profile:KpopProfile,
  persona:string,
  model="gpt-5.4-nano",
  signal?:AbortSignal,
):Promise<CharacterReply>{
  const puter=await loadPuter();
  if(signal?.aborted)throw new DOMException("已取消","AbortError");
  const messages=[
    {role:"system" as const,content:characterGuide(thread,profile,persona)},
    ...history.slice(-40).map(x=>({role:x.role,content:x.content.slice(0,1200)})),
  ];
  const response=await puter.ai.chat(messages,{
    model,max_tokens:280,normalize:true,signal,
  });
  if(signal?.aborted)throw new DOMException("已取消","AbortError");
  const normalized=typeof response==="string"?response:contentText(response?.message?.content??response?.content);
  if(!normalized)throw new Error("Puter AI 没有返回文字。请检查登录状态与可用额度。");
  return parseAiResponse(normalized);
}
