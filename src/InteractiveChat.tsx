import { useState } from "react";
import { askCharacterAI, aiReady, aiSignedIn, connectCharacterAI } from "./aiCharacter";
import { buildChatExchange, decodeChatEntry } from "./fictionChat";
import { useSkinState } from "./skinState";
import type { SkinProps } from "./AppSkins";
import "./chat-ai.css";

const recent = (entries: string[]) => entries.slice(-96);
const outgoing = (thread: string, text: string) => `${thread}\tout\t${text}`;
const incoming = (thread: string, text: string) => `${thread}\tin\t${text}`;

export function useInteractiveChat(p: SkinProps, thread = p.thread) {
  const [entries, setEntries] = useSkinState<string[]>(p, "local-chat-messages", []);
  const [aiMode, setAiMode] = useSkinState<boolean>(p, "ai-chat-mode", false);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [lastFailed, setLastFailed] = useState<{thread:string;history:string[]} | null>(null);

  const connect = async () => {
    if (connecting) return;
    setError("");
    setConnecting(true);
    try {
      await connectCharacterAI();
      setAiMode(true);
    } catch(e) {
      setError(e instanceof Error ? e.message : "AI 登录没有完成。可以继续使用离线剧情聊天。");
    } finally { setConnecting(false); }
  };
  const disable = () => {setAiMode(false); setError("");setLastFailed(null);};
  const respond = async (target: string, history: string[]) => {
    setBusy(true);
    setError("");
    try {
      const reply = await askCharacterAI(target, history, p.items);
      setEntries(current=>recent([...current,incoming(target,reply)]));
      setLastFailed(null);
      return true;
    } catch(e) {
      setLastFailed({thread:target,history});
      setError(e instanceof Error ? e.message : "服务暂时无法回复，可以重试或改用离线模式。");
      return false;
    } finally {setBusy(false);}
  };
  const send = (body: string): boolean => {
    const cleaned = body.trim().replace(/[\t\r\n]+/g," ").slice(0,250);
    if(!cleaned || !thread || busy || connecting) return false;
    if (!aiMode) {
      setEntries(buildChatExchange(thread,cleaned,entries));
      setError("");
      return true;
    }
    if(!aiReady() || !aiSignedIn()) {
      setError("自由对话需要登录 Puter。请点击下方的连接 AI 按钮。");
      return false;
    }
    const next=recent([...entries,outgoing(thread,cleaned)]);
    setEntries(next);
    void respond(thread,next);
    return true;
  };
  const retry=()=> {
    if(busy || !lastFailed || !aiMode || !aiSignedIn()) return;
    void respond(lastFailed.thread,lastFailed.history);
  };
  return {
    entries, aiMode, busy, connecting, error, connect, disable, retry, send,
    // Only locally saved text is used; nothing goes to Puter until AI is explicitly enabled.
    localFor: (name: string) => entries.map(decodeChatEntry).filter(x=>x?.thread===name),
    signedIn:aiSignedIn(),
    canRetry:Boolean(lastFailed),
  };
}

export type ChatController = ReturnType<typeof useInteractiveChat>;
export function ChatAIBar({chat}:{chat:ChatController}) {
  return <div className="chat-ai-bar" aria-label="AI 自由聊天设置">
    {chat.aiMode ? <>
      <span className="chat-ai-online">✦ AI 自由聊天已开启</span>
      <button type="button" aria-label="切回离线剧情聊天" onClick={chat.disable}>离线聊天</button>
      {chat.busy && <small role="status" className="chat-ai-thinking">角色正在输入…</small>}
    </> : <>
      <span>当前：离线固定回复</span>
      <button type="button" aria-label="连接 AI 自由聊天" disabled={chat.connecting} onClick={()=>void chat.connect()}>
        {chat.connecting ? "连接中…" : "✦ 连接 AI 自由聊天"}
      </button>
      <small>需登录 Puter。开启后会将最近聊天内容和虚构剧情发送至 Puter AI，使用自己的账户额度。</small>
    </>}
    {chat.error && <div className="chat-ai-error" role="alert">
      <span>{chat.error}</span>
      {chat.canRetry && chat.aiMode && <button type="button" aria-label="重试 AI 回复" disabled={chat.busy} onClick={chat.retry}>重试</button>}
      {chat.aiMode && <button type="button" onClick={chat.connect}>重新登录</button>}
    </div>}
  </div>;
}
