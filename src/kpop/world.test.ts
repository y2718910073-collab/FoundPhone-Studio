import { describe,expect,it } from "vitest";
import example from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { initialRuntime } from "../schema";
import { createKpopWork, parseCastNames, parseExtraCouples } from "./content";
import { defaultKpopProfile } from "./profile";
import { kpopWorldStep, RISK_LEVELS, storyPhase, TRACE_NAMES } from "./world";
import { extraScenesOne } from "./extraScenes";
import { extraScenesTwo } from "./extraScenesTwo";
import { dormScenes } from "./dormScenes";
import { familyScenes } from "./familyScenes";
import { sceneMessages } from "./scenes";

const work = createKpopWork(compileStory(example).work,defaultKpopProfile);
const start = () => initialRuntime(work);
const page = (s:ReturnType<typeof start>,target="kakao") =>
  kpopWorldStep(work,s,"openApp",target,s.read);
describe("K-pop reading phase, clues and natural historical archives",()=>{
  it("keeps all core private, family, dorm and manager conversations above 150 messages",()=>{
    for(const name of [defaultKpopProfile.crush,"朴雅凛","李玟娥",defaultKpopProfile.managerName,defaultKpopProfile.familyName]){
      const count=work.data.kakao.filter(x=>x.title===name||x.title===defaultKpopProfile.group+" 宿舍小群" && name==="李玟娥").length;
      expect(count).toBeGreaterThanOrEqual(150);
    }
    expect(dormScenes.reduce((n,x)=>n+sceneMessages(x).length,0)).toBeGreaterThanOrEqual(150);
    expect(familyScenes.reduce((n,x)=>n+sceneMessages(x).length,0)).toBeGreaterThanOrEqual(150);
    expect(extraScenesOne.reduce((n,x)=>n+sceneMessages(x).length,0)).toBeGreaterThanOrEqual(150);
    expect(extraScenesTwo.reduce((n,x)=>n+sceneMessages(x).length,0)).toBeGreaterThanOrEqual(150);
  });
  it("builds up to 2 optional cross-group CP threads with a full 150-line history",()=>{
    const custom=createKpopWork(compileStory(example).work,{...defaultKpopProfile,
      extraCouples:"韩乙×韩丙;韩丁×韩戊",dormMembers:"韩甲、韩庚",managerName:"张室长"});
    expect(custom.data.kakao.filter(x=>x.title.includes("韩乙 × 韩丙")).length).toBeGreaterThanOrEqual(150);
    expect(custom.data.kakao.filter(x=>x.title.includes("韩丁 × 韩戊")).length).toBeGreaterThanOrEqual(150);
    expect(custom.data.kakao.some(x=>x.title==="韩甲")).toBe(true);
    expect(custom.data.kakao.some(x=>x.title==="张室长")).toBe(true);
    expect(custom.data.kakao.filter(x=>x.title===defaultKpopProfile.crush).length).toBeGreaterThanOrEqual(150);
    expect(parseCastNames("甲、乙，甲")).toEqual(["甲","乙"]);
    expect(parseExtraCouples("甲×乙;丙×丁;多余×对象")).toEqual([["甲","乙"],["丙","丁"]]);
  });
  it("advances through 3 phases in order, syncing after turn 15 and then appending a fresh item",()=>{
    let s=start();
    for(let i=1;i<=15;i++){
      s=page(s);
      expect(s.variables["kpop-turn"]).toBe(i);
      expect(s.variables["kpop-phase"]).toBe(storyPhase(i));
      expect(s.variables["kpop-sync"]).toBe(false);
    }
    s=page(s);
    expect(s.variables["kpop-turn"]).toBe(16);
    expect(s.variables["kpop-sync"]).toBe(true);
    expect(s.messages.kakao.length).toBeGreaterThan(0);
    const before=s.messages.kakao.length;
    s=page(s);
    s=page(s);
    expect(s.messages.kakao.length).toBeGreaterThan(before);
    expect(new Set(s.messages.kakao.map(x=>x.id)).size).toBe(s.messages.kakao.length);
  });
  it("does not duplicate a page turn or clue when revisiting the same document",()=>{
    const id=work.data.photos[0].id;
    const base=start();
    const first=kpopWorldStep(work,{...base,read:[id]},"read",id,[]);
    expect(first.variables["kpop-turn"]).toBe(1);
    const second=kpopWorldStep(work,first,"read",id,[id]);
    expect(second.variables["kpop-turn"]).toBe(1);
    expect(second.clues).toEqual(first.clues);
    expect(Object.keys(TRACE_NAMES)).toContain("song");
  });
  it("avoids unearned publicity: suspicion is separate from fictional public actions",()=>{
    let s=start();
    for(let i=0;i<5;i++)s=kpopWorldStep(work,s,"impersonate","朴雅凛",s.read);
    expect(s.variables["kpop-risk"]).toBe(0);
    expect(s.variables["kpop-suspicion"]).toBeGreaterThan(0);
    expect(s.messages.forum).toBeUndefined();
    s=kpopWorldStep(work,s,"publish","post-01",s.read);
    expect(s.variables["kpop-risk"]).toBe(1);
    expect(s.messages.forum?.[0].comments).toHaveLength(5);
    expect(s.messages.forum?.[0].comments.some(x=>x.startsWith("理智分析"))).toBe(true);
    expect(RISK_LEVELS).toHaveLength(7);
  });
});
