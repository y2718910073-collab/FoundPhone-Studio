import { describe, expect, it } from "vitest";
import example from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { initialRuntime } from "../schema";
import { createKpopWork } from "./content";
import { defaultKpopProfile } from "./profile";
import { kpopLiveEntries, kpopLiveLength, kpopSyncTimestamp } from "./liveFeed";
import { roommateScenes } from "./roommateScenes";
import { sceneMessages } from "./scenes";
import { kpopWorldStep } from "./world";

const work=createKpopWork(compileStory(example).work,defaultKpopProfile);
const flat=(value:Record<string,import("../schema").Item[]>)=>Object.values(value).flat();

describe("ongoing fictional idol phone",()=>{
  it("supports 150 independent messages for the second group member",()=>{
    expect(roommateScenes.reduce((n,x)=>n+sceneMessages(x).length,0)).toBeGreaterThanOrEqual(150);
    expect(work.data.kakao.filter(x=>x.title==="李玟娥")).toHaveLength(150);
    expect(work.data.kakao.filter(x=>x.title===defaultKpopProfile.crush).length).toBeGreaterThanOrEqual(150);
    expect(new Set(work.data.kakao.filter(x=>x.title==="李玟娥").map(x=>x.id)).size).toBe(150);
  });
  it("waits three in-world days and builds a cluster across multiple real app UIs",()=>{
    expect(kpopLiveEntries(work,15)).toEqual({});
    const first=kpopLiveEntries(work,16,true);
    expect(flat(first)).toHaveLength(4);
    expect(first.kakao.length).toBe(2);
    expect(first.instagram).toHaveLength(1);
    expect(first.notes).toHaveLength(1);
    expect(kpopSyncTimestamp("2026-10-28",16).startsWith("2026-10-31")).toBe(true);
    expect(flat(first).every(x=>x.meta.ko&&x.meta.zh&&x.meta.fiction==="true")).toBe(true);
  });
  it("never rotates the same twelve snippets and has unique source IDs across fifty scenes",()=>{
    expect(kpopLiveLength()).toBeGreaterThanOrEqual(45);
    const sent=[] as import("../schema").Item[];
    for(let turn=18;turn<160;turn+=2)sent.push(...flat(kpopLiveEntries(work,turn)));
    expect(new Set(sent.map(x=>x.id)).size).toBe(sent.length);
    expect(new Set(sent.map(x=>x.body)).size).toBe(sent.length);
    expect(sent.length).toBeGreaterThanOrEqual(45);
    expect(kpopLiveEntries(work,17)).toEqual({});
    expect(kpopLiveEntries(work,158)).toEqual({});
  });
  it("never invents clues until player reads both source and timestamp",()=>{
    let s=initialRuntime(work);
    for(let i=0;i<26;i++)s=kpopWorldStep(work,s,"openApp","notes",s.read);
    const sky=s.messages.kakao?.find(x=>x.meta.trace==="sky");
    expect(sky).toBeDefined();
    expect(s.clues).not.toContain("sky");
    const id=sky!.id;
    const after=kpopWorldStep(work,{...s,read:[...s.read,id]},"read",id,s.read);
    expect(after.clues).toContain("sky");
    const evidence=after.ui?.["kpop-world"]?.["seen-evidence"];
    expect(evidence).toContain(id);
    const repeated=kpopWorldStep(work,after,"read",id,[...s.read,id]);
    expect(repeated.variables["kpop-turn"]).toBe(after.variables["kpop-turn"]);
    expect(repeated.ui?.["kpop-world"]?.["seen-evidence"]).toEqual(evidence);
  });
  it("preserves character aliases across incremental app updates",()=>{
    const custom=createKpopWork(compileStory(example).work,{
      ...defaultKpopProfile,crush:"姜序真",managerName:"韩室长",dormMembers:"郑美罗、韩荷娜",familyName:"우리 엄마"
    });
    const initial=kpopLiveEntries(custom,16,true);
    expect(initial.kakao[0].title).toBe("郑美罗");
    expect(initial.kakao[1].title).toBe("韩室长");
    const crush=kpopLiveEntries(custom,26);
    expect(crush.kakao[0].title).toBe("姜序真");
  });
});
