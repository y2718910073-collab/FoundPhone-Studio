import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { buildChatExchange, decodeChatEntry } from "../fictionChat";
import { useSkinState } from "../skinState";
import { makeItem, type Item } from "../schema";
import { useKpopChat } from "../kpop/chat";
import type { Props } from "./shared";
import "./saved-chat.css";

export function useSavedChat(p: Props, thread = p.thread) {
  const [entries, setEntries] = useSkinState<string[]>(p, "local-chat-messages", []);
  const kpop = useKpopChat({ ...p, thread });
  const local: Item[] = entries.flatMap((raw, index) => {
    const decoded = decodeChatEntry(raw);
    if (!decoded || decoded.thread !== thread) return [];
    return [makeItem({
      id: `user-chat-${p.appId || "app"}-${index}`,
      sender: decoded.incoming ? thread : (p.owner || "我"),
      title: thread,
      body: decoded.text,
      outgoing: !decoded.incoming,
      time: "2026-10-27 " + (p.virtualTime || "22:17"),
    })];
  });
  const send = (body: string) => {
    if (!thread) return;
    if (p.kpopMode) { void kpop.send(body); return; }
    setEntries(buildChatExchange(thread, body, entries));
  };
  return {
    local: p.kpopMode ? kpop.local : local,
    send,
    pending: p.kpopMode && kpop.pending,
    typing: p.kpopMode && kpop.typing,
    isAi: p.kpopMode && kpop.isAi,
    error: p.kpopMode ? kpop.error : "",
  };
}
export function SavedChatComposer({ p, thread }: { p: Props; thread?: string }) {
  const [draft, setDraft] = useState("");
  const chat = useSavedChat(p, thread);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    chat.send(draft);
    setDraft("");
  };
  return <form className="saved-chat-compose" onSubmit={submit}>
    <input aria-label="输入聊天内容" placeholder={p.kpopMode ? "和这位虚构联系人聊天…" : "发消息，联系人会回复…"} maxLength={p.kpopMode ? 500 : 250} value={draft} disabled={chat.pending} onChange={e => setDraft(e.target.value)} />
    <button type="submit" aria-label="发送聊天内容" disabled={!draft.trim() || chat.pending}><Send size={17}/></button>
    {p.kpopMode && <small role="status" className="saved-chat-reply-status">
      {chat.typing ? "正在输入…" : chat.pending ? "已送达 · 等待查看" : chat.isAi ? "AI 回复" : "离线剧情回复"}
      {chat.error ? " · " + chat.error : ""}
    </small>}
  </form>;
}
