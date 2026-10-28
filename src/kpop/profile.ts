export type LanguageMode = "dual" | "ko" | "zh";
export type FanLevel = "路人粉" | "资深粉" | "显微镜粉" | "自定义";
export type KpopProfile = {
  fan: FanLevel;
  language: LanguageMode;
  owner: string;
  crush: string;
  group: string;
  agency: string;
  relationship: string;
  background: string;
  date: string;
  location: string;
  phone: string;
  friends: string;
  extraCouples: string;
};
export const defaultKpopProfile: KpopProfile = {
  fan: "路人粉",
  language: "dual",
  owner: "尹曦雅",
  crush: "柳时恩",
  group: "HAZE",
  agency: "LUMEN Entertainment",
  relationship: "两人正在认真靠近，但谁也不愿草率定义关系",
  background: "回归第二周，连续进行音乐节目事前录制与电台行程",
  date: "2026-10-28",
  location: "首尔某电视台附近的咖啡店",
  phone: "iPhone 16 · 48% 电量 · 未上锁",
  friends: "朴雅凛（同团练习伙伴）、金智秀（经纪人）、妈妈",
  extraCouples: "",
};
const key = "foundphone-kpop-profile-v1";
function safeText(value: unknown, length: number, fallback: string) {
  return typeof value === "string" ? value.trim().slice(0, length) || fallback : fallback;
}
export function normalizeKpopProfile(raw: unknown): KpopProfile {
  const x = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    fan: ["路人粉", "资深粉", "显微镜粉", "自定义"].includes(String(x.fan)) ? x.fan as FanLevel : "路人粉",
    language: ["dual", "ko", "zh"].includes(String(x.language)) ? x.language as LanguageMode : "dual",
    owner: safeText(x.owner, 24, defaultKpopProfile.owner),
    crush: safeText(x.crush, 24, defaultKpopProfile.crush),
    group: safeText(x.group, 48, defaultKpopProfile.group),
    agency: safeText(x.agency, 64, defaultKpopProfile.agency),
    relationship: safeText(x.relationship, 200, defaultKpopProfile.relationship),
    background: safeText(x.background, 200, defaultKpopProfile.background),
    date: typeof x.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.date) ? x.date : defaultKpopProfile.date,
    location: safeText(x.location, 120, defaultKpopProfile.location),
    phone: safeText(x.phone, 100, defaultKpopProfile.phone),
    friends: safeText(x.friends, 400, defaultKpopProfile.friends),
    extraCouples: typeof x.extraCouples === "string" ? x.extraCouples.slice(0, 350) : "",
  };
}
export function saveKpopProfile(profile: KpopProfile) {
  localStorage.setItem(key, JSON.stringify(normalizeKpopProfile(profile)));
}
export function readKpopProfile(): KpopProfile | null {
  try { const value = localStorage.getItem(key); return value ? normalizeKpopProfile(JSON.parse(value)) : null; }
  catch { return null; }
}
export function isKpopWork(workId: string) { return workId.startsWith("kpop-foundphone-"); }
