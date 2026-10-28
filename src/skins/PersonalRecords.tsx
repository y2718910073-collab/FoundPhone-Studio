import { useState, type FormEvent } from "react";
import { CheckCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useSkinState } from "../skinState";
import type { Props } from "./shared";
import "./personal-records.css";

export type PersonalRecord = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  updatedAt: string;
};
export function parsePersonalRecords(raw: string): PersonalRecord[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.slice(0, 200).filter((x): x is PersonalRecord =>
      !!x && typeof x === "object" &&
      typeof x.id === "string" && typeof x.title === "string" &&
      typeof x.detail === "string" && typeof x.completed === "boolean" &&
      typeof x.updatedAt === "string");
  } catch { return []; }
}
export function usePersonalRecords(p: Props, kind: string) {
  const [raw, setRaw] = useSkinState<string>(p, `personal-${kind}`, "[]");
  const entries = parsePersonalRecords(raw);
  const save = (next: PersonalRecord[]) => setRaw(JSON.stringify(next.slice(0, 200)));
  const upsert = (title: string, detail: string, id = "") => {
    const clean = title.trim().slice(0, 100);
    if (!clean) return false;
    const now = new Date().toISOString();
    if (id) save(entries.map(item => item.id === id ? { ...item, title: clean, detail: detail.slice(0, 4000), updatedAt: now } : item));
    else save([{ id: crypto.randomUUID(), title: clean, detail: detail.slice(0, 4000), completed: false, updatedAt: now }, ...entries]);
    return true;
  };
  const remove = (id: string) => save(entries.filter(item => item.id !== id));
  const toggle = (id: string) => save(entries.map(item => item.id === id ? {...item, completed: !item.completed} : item));
  return { entries, upsert, remove, toggle };
}
export function PersonalRecordsPanel({ p, kind, query = "" }: {
  p: Props;
  kind: "notes" | "contacts" | "reminders";
  query?: string;
}) {
  const record = usePersonalRecords(p, kind);
  const [editing, setEditing] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const name = kind === "contacts" ? "联系人" : kind === "notes" ? "备忘录" : "提醒事项";
  const titleLabel = kind === "contacts" ? "联系人姓名" : kind === "notes" ? "备忘录标题" : "提醒内容";
  const detailLabel = kind === "contacts" ? "电话号码或备注" : kind === "notes" ? "备忘录正文" : "补充说明";
  const edit = (id: string) => {
    const found = record.entries.find(x => x.id === id);
    if (!found) return;
    setEditing(id);
    setTitle(found.title);
    setDetail(found.detail);
    setOpen(true);
  };
  const close = () => {setOpen(false); setEditing(""); setTitle(""); setDetail("");};
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (record.upsert(title, detail, editing)) close();
  };
  const entries = record.entries.filter(x => (x.title + x.detail).toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="personal-records-panel" aria-label={`我的${name}`}>
      <header><strong>我创建的{name} · {record.entries.length}</strong>
        <button aria-label={`新增${name}`} onClick={() => {close();setOpen(true);}}><Plus size={16}/> 新增</button>
      </header>
      {open && <form onSubmit={submit} className="personal-records-form">
        <label>{titleLabel}<input required autoFocus maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} aria-label={titleLabel} /></label>
        <label>{detailLabel}<textarea maxLength={4000} rows={kind === "notes" ? 5 : 2} value={detail} onChange={e=>setDetail(e.target.value)} aria-label={detailLabel}/></label>
        <div><button type="submit"><Save size={15}/> {editing ? "保存修改" : "保存"}</button>
          <button type="button" onClick={close}><X size={15}/> 取消</button></div>
      </form>}
      {entries.map(item => <article key={item.id} className="personal-record-row">
        {kind === "reminders" && <button aria-label={`切换完成${item.title}`} aria-pressed={item.completed} onClick={() => record.toggle(item.id)}><CheckCircle size={19} color={item.completed ? "#39a86b" : "#888"}/></button>}
        <div><strong style={{textDecoration:item.completed ? "line-through" : "none"}}>{item.title}</strong><p>{item.detail}</p></div>
        <button aria-label={`编辑${item.title}`} onClick={()=>edit(item.id)}><Pencil size={15}/></button>
        <button aria-label={`删除${item.title}`} onClick={()=>record.remove(item.id)}><Trash2 size={15}/></button>
      </article>)}
      {!entries.length && <p className="personal-empty">还没有你创建的{name}，可以点击“新增”。</p>}
    </section>
  );
}
