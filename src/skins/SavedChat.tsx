import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { buildChatExchange, decodeChatEntry } from "../fictionChat";
import { useSkinState } from "../skinState";
import { makeItem, type Item } from "../schema";
import type { Props } from "./shared";
import "./saved-chat.css";

export function useSavedChat(p: Props, thread = p.thread) {
  const [entries, setEntries] = useSkinState<string[]>(p, "local-chat-messages", []);
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
    setEntries(buildChatExchange(thread, body, entries));
  };
  return { local, send };
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
    <input aria-label="输入聊天内容" placeholder="发消息，联系人会回复…" maxLength={250} value={draft} onChange={e => setDraft(e.target.value)} />
    <button type="submit" aria-label="发送聊天内容" disabled={!draft.trim()}><Send size={17}/></button>
  </form>;
}
