import { useState, type FormEvent } from "react";
import { Mail, Pencil, Send, Trash2 } from "lucide-react";
import { useSkinState } from "../skinState";
import type { Props } from "./shared";
import "./local-mail.css";

export type LocalMail = { id:string; to:string; subject:string; body:string; status:"草稿"|"已发送"; updatedAt:string };
export function parseLocalMail(raw: string): LocalMail[] {
  try {
    const list: unknown=JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.slice(0,100).filter((x): x is LocalMail =>
      x!==null&&typeof x==="object"&&typeof x.id==="string"&&typeof x.to==="string"&&typeof x.subject==="string"&&typeof x.body==="string"&&
      (x.status==="草稿"||x.status==="已发送")&&typeof x.updatedAt==="string");
  } catch{return [];}
}
export function LocalMailPanel({p,tab,query}:{p:Props;tab:string;query:string}) {
  const [raw,setRaw]=useSkinState<string>(p,"user-mail","[]");
  const entries=parseLocalMail(raw);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState("");
  const [to,setTo]=useState("");
  const [subject,setSubject]=useState("");
  const [body,setBody]=useState("");
  const [status,setStatus]=useState("");
  const clear=()=>{setOpen(false);setEditing("");setTo("");setSubject("");setBody("");};
  const save=(state:"草稿"|"已发送")=>{
    if (!subject.trim() || (state==="已发送"&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to.trim()))) {
      setStatus(state==="已发送"?"请填写有效收件邮箱地址。":"请填写主题。");return;
    }
    const mail: LocalMail={id:editing||crypto.randomUUID(),to:to.trim().slice(0,150),subject:subject.trim().slice(0,150),body:body.slice(0,10000),status:state,updatedAt:new Date().toISOString()};
    setRaw(JSON.stringify([mail,...entries.filter(x=>x.id!==editing)].slice(0,100)));
    setStatus(state==="已发送"?"邮件已存入本机的模拟发件箱，并未发送给真实收件人。":"草稿已保存。");
    clear();
  };
  const edit=(x:LocalMail)=>{setEditing(x.id);setTo(x.to);setSubject(x.subject);setBody(x.body);setOpen(true);};
  const filtered=entries.filter(x=>(tab==="全部邮件"||x.status===tab)&&[x.to,x.subject,x.body].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <section className="local-mail-panel" aria-label="我的本机邮件">
    <div className="local-mail-toolbar"><strong>我的邮件 · {entries.length}</strong><button onClick={()=>{clear();setOpen(true);}}>＋ 写邮件</button></div>
    {status&&<p role="status">{status}</p>}
    {open&&<form onSubmit={(e:FormEvent)=>{e.preventDefault();save("草稿");}}>
      <label>收件邮箱<input type="email" aria-label="收件邮箱" placeholder="someone@example.com" value={to} onChange={e=>setTo(e.target.value)}/></label>
      <label>主题<input aria-label="邮件主题" required maxLength={150} value={subject} onChange={e=>setSubject(e.target.value)}/></label>
      <label>正文<textarea aria-label="邮件正文" maxLength={10000} rows={5} value={body} onChange={e=>setBody(e.target.value)}/></label>
      <div className="local-mail-actions">
        <button type="submit">保存草稿</button>
        <button type="button" onClick={()=>save("已发送")}><Send size={13}/> 模拟发送</button>
        {to.trim()&&<a href={`mailto:${encodeURIComponent(to.trim().replace(/[\r\n]/g,""))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} aria-label="用系统邮件应用编辑真实邮件"><Mail size={13}/> 系统邮件</a>}
        <button type="button" onClick={clear}>取消</button>
      </div>
    </form>}
    {filtered.map(m=><article className="local-mail-row" key={m.id}>
      <div><strong>{m.subject}</strong><small>发给 {m.to||"未填写"} · {m.status}{m.status==="已发送"?"（模拟）":""}</small><p>{m.body}</p></div>
      <button aria-label={`编辑邮件${m.subject}`} onClick={()=>edit(m)}><Pencil size={14}/></button>
      <button aria-label={`删除邮件${m.subject}`} onClick={()=>setRaw(JSON.stringify(entries.filter(x=>x.id!==m.id)))}><Trash2 size={14}/></button>
    </article>)}
    <small>这台虚构手机不会自动发送真实邮件。点击「系统邮件」只会打开设备上的邮件编辑器，是否发送由你决定。</small>
  </section>;
}
