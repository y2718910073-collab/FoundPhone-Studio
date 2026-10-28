import { itemSchema, makeItem, type Item } from "../schema";

export function parseLocalPosts(raw: unknown): Item[] {
  if (typeof raw !== "string" || raw.length > 250000) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50).flatMap(entry => {
      const item = itemSchema.safeParse(entry);
      return item.success && item.data.kind === "post" ? [item.data] : [];
    });
  } catch { return []; }
}
export function createLocalPost(name: string, title: string, body: string, folder = "动态"): Item {
  return makeItem({
    id: crypto.randomUUID(),
    title: title.trim().slice(0, 120),
    body: body.trim().slice(0, 4000),
    sender: name || "我",
    folder,
    kind: "post",
    time: new Date().toISOString().slice(0, 16).replace("T", " "),
    comments: [],
    likes: 0,
  });
}
export function localFeedFolder(appId: string): string {
  if (appId === "reddit") return "首页";
  if (appId === "snapchat") return "快拍";
  if (appId === "pinterest") return "手作";
  if (appId === "redbook") return "发现";
  if (appId === "weibo") return "全部";
  if (appId === "threads") return "为你推荐";
  if (appId === "twitter") return "为你推荐";
  if (appId === "forum") return "社区";
  return "动态";
}
