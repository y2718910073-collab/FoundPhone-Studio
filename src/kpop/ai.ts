import type { KpopProfile } from "./profile";
import { defaultKpopProfile } from "./profile";
import { buildCharacterRules } from "./persona";

export type AiSessionConfig = { provider?: "custom"; endpoint: string; model: string; apiKey: string } | { provider: "puter"; model: string };
let aiSession: AiSessionConfig | null = null;

/** Keys live in process memory only. Never put these in the story, logs or browser save. */
export function setAiSession(config: AiSessionConfig | null) {
  aiSession = config ? { ...config } : null;
  if(config?.provider==="puter")localStorage.setItem("foundphone-kpop-ai-choice","puter");
  else localStorage.removeItem("foundphone-kpop-ai-choice");
  if(typeof window!=="undefined")window.dispatchEvent(new Event("foundphone:kpop-ai-changed"));
}
export function getAiSession() {
  if(aiSession)return aiSession;
  try {return localStorage.getItem("foundphone-kpop-ai-choice")==="puter" ? {provider:"puter" as const,model:"gpt-5.4-nano"} : null;}
  catch{return null;}
}
function validEndpoint(raw: string): string {
  const url = new URL(raw);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
    throw new Error("AI 服务地址必须使用 HTTPS（本机 localhost 除外）。");
  if (url.username || url.password || url.hash)
    throw new Error("服务地址不能包含账号、密码或片段。");
  return url.toString();
}
export type ChatTurn = { role: "user" | "assistant"; content: string };
export type CharacterReply = { ko: string; zh: string };
export function characterGuide(thread: string, profile: KpopProfile = defaultKpopProfile, persona = "") {
  const temperament = buildCharacterRules(profile,thread);
  return [
    "你在扮演一部虚构手机里的聊天人物。所有内容都是平行世界创作，不是任何现实艺人的私生活事实。",
    `机主：${profile.owner}；意中人：${profile.crush}；团体：${profile.group}；公司：${profile.agency}。`,
    `机主定位：${profile.ownerPosition}；出道年份：${profile.debutYear}；形象和打字习惯：${profile.publicImage}。`,
    `与意中人的身份关系：${profile.crushRelation}；公开印象：${profile.publicImpression}；同团人员：${profile.dormMembers}；经纪人：${profile.managerName}。`,
    `其他圈内朋友：${profile.crossFriends||"未指定"}；前公司经历：${profile.previousCareer||"未指定"}。`,
    `当前情况：${profile.background}。角色关系的写作基调（不要对玩家宣布真相）：${profile.relationship}。`,
    `当前会话：${thread}。`,
    persona ? `该角色的既定特征：${persona.slice(0,500)}。` : "",
    temperament,
    "这是一段虚构角色之间的私人聊天。接收端应自然地把发言者看作机主，不知道幕后玩家正在翻看手机。若出现非常明显的称呼或敬语异常，可以疑惑，但不能凭空识破。",
    "结合会话中最近40轮的上下文回应最后一条消息；认真理解玩家说的内容，不机械重复固定词。只输出此时该角色会发的短信，不写旁白、不剧透、不宣布关系；可以转移话题、回答不知道或礼貌拒绝。保持 1—3 句自然聊天，不要反复强调 CP。",
    "要保留韩语长幼敬语／半语习惯、亲疏距离；如果玩家问到不存在的事实，不要捏造现实细节。",
    "严格输出 JSON 对象：{\"ko\":\"自然韩文聊天回复\",\"zh\":\"准确的简体中文翻译\"}。不得有Markdown代码块。每项1至3短句，总长度不超过200字。",
  ].filter(Boolean).join("\n");
}
export function parseAiResponse(text: string): CharacterReply {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parse = (x: string) => {
    const obj: unknown = JSON.parse(x);
    if (!obj || typeof obj !== "object") throw new Error("AI 返回内容不是对象。");
    const y = obj as Record<string, unknown>;
    if (typeof y.ko !== "string" || typeof y.zh !== "string" || !y.ko.trim() || !y.zh.trim())
      throw new Error("AI 没有同时返回韩文和翻译。");
    return { ko: y.ko.trim().slice(0, 400), zh: y.zh.trim().slice(0, 400) };
  };
  try { return parse(cleaned); }
  catch {
    const left = cleaned.indexOf("{"), right = cleaned.lastIndexOf("}");
    if (left >= 0 && right > left) return parse(cleaned.slice(left, right + 1));
    throw new Error("AI 回复格式不正确，请检查模型是否支持 JSON 指令。");
  }
}
export async function requestAiReply(
  config: Extract<AiSessionConfig,{endpoint:string}>,
  thread: string,
  history: ChatTurn[],
  profile: KpopProfile,
  persona: string,
  signal?: AbortSignal,
): Promise<CharacterReply> {
  const endpoint = validEndpoint(config.endpoint);
  if (!config.model.trim() || !config.apiKey.trim()) throw new Error("需要填写模型和 API 凭证。");
  const capped = history.slice(-40).map(turn => ({
    role: turn.role,
    content: turn.content.slice(0, 1200),
  }));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model.slice(0, 100),
      messages: [
        { role: "system", content: characterGuide(thread, profile, persona) },
        ...capped,
      ],
      temperature: 0.8,
      max_tokens: 260,
    }),
    signal,
  });
  if (!response.ok) throw new Error(`AI 服务返回 HTTP ${response.status}，请检查 API 服务或权限。`);
  const raw: unknown = await response.json();
  const data = raw as { choices?: { message?: { content?: string } }[] };
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型没有返回可显示的聊天内容。");
  return parseAiResponse(content);
}
