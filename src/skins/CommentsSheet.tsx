import { useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import { useSkinState } from "../skinState";
import "./social-interactions.css";
import type { Item } from "../schema";
import { Avatar, type Props } from "./shared";

/** Offline, locally persisted comments for a fictional social feed item. */
export function CommentsSheet({
  p,
  item,
  onClose,
}: {
  p: Props;
  item: Item;
  onClose: () => void;
}) {
  const [replies, setReplies] = useSkinState<string[]>(p, `comments-${item.id}`, []);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const comments = [
    ...item.comments.map((body, index) => ({
      key: `seed-${index}`,
      sender: `访客${index + 1}`,
      body,
      local: false,
    })),
    ...replies.map((entry, index) => {
      const [sender, ...body] = entry.split("\t");
      return { key: `local-${index}`, sender, body: body.join("\t"), local: true };
    }),
  ];
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const message = replyTo ? `回复 @${replyTo}：${body}` : body;
    // Individual comments are bounded to keep IndexedDB saves small and safe.
    setReplies([...replies.slice(-99), `${p.owner || "我"}\t${message}`]);
    if (p.kpopMode) p.onKpopAction?.("public-comment",item.id);
    setDraft("");
    setReplyTo("");
  };
  return (
    <div className="social-comments-backdrop" onClick={onClose}>
      <section
        className="social-comments-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`评论：${item.title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <strong>{comments.length} 条评论</strong>
          <button type="button" aria-label="关闭评论" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="social-comments-list">
          {comments.length ? comments.map((comment) => (
            <div className="social-comment" key={comment.key}>
              <Avatar name={comment.sender} />
              <div>
                <strong>{comment.sender}{comment.local && <small> · 本机</small>}</strong>
                <p>{comment.body}</p>
                <button type="button" onClick={() => setReplyTo(comment.sender)}>
                  回复
                </button>
              </div>
            </div>
          )) : <p className="social-comments-empty">还没有评论，来发表第一条吧。</p>}
        </div>
        <form className="social-comments-compose" onSubmit={submit}>
          {replyTo && <button type="button" className="social-reply-target" onClick={() => setReplyTo("")}>回复 @{replyTo} ×</button>}
          <div>
            <input
              aria-label="输入评论"
              maxLength={200}
              placeholder={replyTo ? `回复 @${replyTo}…` : "说点什么…"}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" aria-label="发送评论" disabled={!draft.trim()}><Send size={19} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}
