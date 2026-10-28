import type { KpopProfile } from "./profile";
import { defaultKpopProfile } from "./profile";

export type AiSessionConfig = { endpoint: string; model: string; apiKey: string };
let aiSession: AiSessionConfig | null = null;

/** Keys live in process memory only. Never put these in the story, logs or browser save. */
export function setAiSession(config: AiSessionConfig | null) {
  aiSession = config ? { ...config } : null;
}
export function getAiSession() { return aiSession; }
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
  const isCrush = thread.includes(profile.crush);
  const isManager = /经理|经纪|실장|매니저|智秀/.test(thread);
  const isMom = /妈妈|엄마/.test(thread);
  const isGroup = /宿舍|line|小群|团|그룹|단톡/.test(thread);
  const temperament = isCrush
    ? "你是对方的亲密圈内朋友，表达克制但会开细微玩笑，习惯半语，偶尔ㅋㅋ；不会一上来就确认关系。"
    : isManager
      ? "你是工作专业、句式精炼的经纪人，只谈行程与日常工作，使用符合情境的敬语，不透露未经核实的公司机密。"
      : isMom
        ? "你是关心孩子作息的母亲，口吻自然、生活化，不反复谈娱乐圈八卦。"
        : isGroup
          ? "你是宿舍或同期好友群中的一位同龄朋友，擅长琐碎玩笑、练习吐槽与团体生活，句式不拘谨。"
          : "你是有自己生活安排和情绪起伏的朋友，回应自然，有时会拒绝回答不方便的问题。";
  return [
    "你在扮演一部虚构手机里的聊天人物。所有内容都是平行世界创作，不是任何现实艺人的私生活事实。",
    `机主：${profile.owner}；意中人：${profile.crush}；团体：${profile.group}；公司：${profile.agency}。`,
    `当前情况：${profile.background}。角色关系的写作基调（不要对玩家宣布真相）：${profile.relationship}。`,
    `当前会话：${thread}。`,
    persona ? `该角色的既定特征：${persona.slice(0,500)}。` : "",
    temperament,
    "注意：玩家是一名捡到手机的路人，所发的消息实际上冒充了机主。可察觉口吻异常，但不能一条消息就识破或制造确定爆料。",
    "结合会话中最近40轮的实际上下文回应最新一条话。只回复人物此刻会打出的自然短信，不要旁白，不要把任何猜测当作事实；不必每条都提CP、票根或剧情。",
    "要保留韩语长幼敬语／半语习惯、亲疏距离；如果玩家问到不存在的事实，不要捏造现实细节。",
    "严格输出 JSON 对象：{\"ko\":\"自然韩文聊天回复\",\"zh\":\"准确的简体中文翻译\"}。不得有Markdown代码块。每项1至3短句，总长度不超过200字。",
  ].filter(Boolean).join("\n");
}
export function parseAiResponse(text: string): CharacterReply {
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
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
  config: AiSessionConfig,
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
