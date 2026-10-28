import { validateWork, type Work } from "../schema";

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
function hashId(x: string) {
  let hash = 2166136261;
  for (let i = 0; i < x.length; i++) hash = Math.imul(hash ^ x.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}
export function personalizeKpopWork(template: Work, profile: KpopProfile): Work {
  const substitutions: [string, string][] = [
    ["尹曦雅", profile.owner], ["柳时恩", profile.crush],
    ["HAZE", profile.group], ["LUMEN Entertainment", profile.agency],
  ];
  let json = JSON.stringify(template);
  for (const [from, to] of substitutions) json = json.replaceAll(from, to.replaceAll("\\", "\\\\").replaceAll('"', '\\"'));
  const clone: Work = JSON.parse(json);
  clone.phone.owner = profile.owner;
  clone.phone.date = profile.date;
  clone.description = "虚构韩娱手机故事。所有人物关系、私信与事件均属平行世界创作，并非现实爆料。";
  // Separate identities save to separate IndexedDB keys.
  clone.id = "kpop-foundphone-" + hashId(JSON.stringify([profile.owner, profile.crush, profile.group, profile.agency, profile.date]));
  clone.variables = { ...clone.variables, "kpop-fan": profile.fan, "kpop-lang": profile.language };
  return validateWork(clone);
}
