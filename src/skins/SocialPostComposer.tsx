import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useSkinState } from "../skinState";
import type { Props } from "./shared";
import { createLocalPost, localFeedFolder, parseLocalPosts } from "./localContent";
import "./social-authoring.css";

export function SocialPostComposer({ p }: { p: Props }) {
  const [raw, setRaw] = useSkinState<string>(p, "local-posts", "[]");
  const posts = parseLocalPosts(raw);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const previous = posts.find(x=>x.id===editing);
    const post = createLocalPost(p.owner || "我", title, body, localFeedFolder(p.appId || ""));
    if (previous) post.id = previous.id;
    setRaw(JSON.stringify((editing ? posts.map(x=>x.id===editing?post:x) : [post,...posts]).slice(0,50)));
    setTitle("");setBody("");setEditing("");setOpen(false);
  };
  const edit = (id: string) => {
    const found=posts.find(x=>x.id===id);
    if (!found) return;
    setEditing(id);setTitle(found.title);setBody(found.body);setOpen(true);
  };
  if (p.creator) return null;
  return <section className="social-post-composer" aria-label="我发布的动态">
    <div className="social-post-toolbar">
      <button onClick={()=>{setOpen(!open);setEditing("");setTitle("");setBody("");}} aria-label="发布新动态"><Plus size={15}/> 发动态</button>
      <span>我的动态 {posts.length}</span>
    </div>
    {open && <form onSubmit={save}>
      <input autoFocus required aria-label="动态标题" placeholder="这条动态的标题" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/>
      <textarea required aria-label="动态正文" placeholder="写下你想分享的故事…" maxLength={4000} rows={4} value={body} onChange={e=>setBody(e.target.value)}/>
      <div><button type="submit">{editing?"保存修改":"发布到本机动态"}</button><button type="button" onClick={()=>setOpen(false)}><X size={14}/>取消</button></div>
    </form>}
    {posts.length>0 && <details className="social-my-posts">
      <summary>管理我发布的 {posts.length} 条动态</summary>
      {posts.map(item=><article key={item.id}>
        <div><strong>{item.title}</strong><p>{item.body}</p></div>
        <button aria-label={`编辑动态${item.title}`} onClick={()=>edit(item.id)}><Pencil size={15}/></button>
        <button aria-label={`删除动态${item.title}`} onClick={()=>setRaw(JSON.stringify(posts.filter(x=>x.id!==item.id)))}><Trash2 size={15}/></button>
      </article>)}
    </details>}
  </section>;
}
