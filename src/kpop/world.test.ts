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
import { styleMismatch } from "./chat";

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
    const before=Object.values(s.messages).flat().length;
    s=page(s);
    s=page(s);
    expect(Object.values(s.messages).flat().length).toBeGreaterThan(before);
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
  it("reacts to pronounced typing-style mismatch without claiming automatic discovery",()=>{
    expect(styleMismatch("柳时恩","尊敬的柳先生，谨此致函。","金智秀 실장님","柳时恩")).toBe(true);
    expect(styleMismatch("柳时恩","오늘 뭐해? ㅋㅋ","金智秀 실장님","柳时恩")).toBe(false);
    expect(styleMismatch("金智秀 실장님","야 뭐해","金智秀 실장님","柳时恩")).toBe(true);
    const s=kpopWorldStep(work,start(),"impersonate","柳时恩::style-anomaly",[]);
    expect(s.variables["kpop-style-errors"]).toBe(1);
    expect(s.variables["kpop-risk"]).toBe(0);
  });
  it("can reach every risk tier without skipping any tier or inventing real reports",()=>{
    let state=start();
    const reached=[Number(state.variables["kpop-risk"]||0)];
    for(let i=0;i<40;i++){
      state=kpopWorldStep(work,state,"screenshot-leak","player",state.read);
      const tier=Number(state.variables["kpop-risk"]||0);
      const last=reached.at(-1)||0;
      expect(tier).toBeLessThanOrEqual(last+1);
      if(tier!==last)reached.push(tier);
    }
    expect(reached).toEqual([0,1,2,3,4,5,6]);
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
  it("can reach all six rumor stages only through ordered explicit actions with discovered traces",()=>{
    let s=start();
    s.clues=["song","sky","concern","routine","address","object","nickname","daily"];
    let last=0;
    for(let i=0;i<11;i++){
      s=kpopWorldStep(work,s,"screenshot-leak","fictional-"+i,s.read);
      const level=Number(s.variables["kpop-risk"]||0);
      expect(level-last).toBeLessThanOrEqual(1);
      expect(level).toBeGreaterThanOrEqual(last);
      last=level;
    }
    expect(last).toBe(6);
    expect(s.messages.forum?.some(x=>x.title.includes("公司"))||s.messages.kakao?.some(x=>x.id.startsWith("kpop-world"))).toBe(true);
  });
});
