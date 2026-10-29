import { describe,expect,it } from "vitest";
import example from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { initialRuntime } from "../schema";
import { createKpopWork } from "./content";
import { defaultKpopProfile } from "./profile";
import { KPOP_ENDINGS, getKpopEnding, observedKpopEvidence, kpopEndingGate, kpopEndingStory } from "./endings";
import { kpopWorldStep } from "./world";

const work=createKpopWork(compileStory(example).work,defaultKpopProfile);
function ready(){
  const s=initialRuntime(work);
  s.variables["kpop-turn"]=16;
  s.variables["kpop-sync"]=true;
  s.visited=["kakao","photos","notes"];
  s.read=["kpop-photos-0","kpop-notes-2"];
  s.clues=["sky","concern"];
  s.ui={...s.ui,"kpop-world":{"seen-evidence":["kpop-photos-0","kpop-notes-2"]}};
  return s;
}
describe("K-pop deliberate phone-return endings",()=>{
  it("requires sync, multiple apps and actually opened evidence, not empty page-turn spam",()=>{
    const s=ready();
    s.visited=["kakao"];
    expect(kpopEndingGate(s).ready).toBe(false);
    s.visited=["kakao","photos","notes"];
    s.read=["kpop-photos-0"];
    expect(observedKpopEvidence(s)).toEqual(["kpop-photos-0"]);
    expect(kpopEndingGate(s).ready).toBe(false);
    s.read.push("kpop-notes-2");
    expect(kpopEndingGate(s).ready).toBe(true);
    s.variables["kpop-sync"]=false;
    expect(kpopEndingGate(s).ready).toBe(false);
  });
  it("saves one ending, never settles twice and stops rumor growth",()=>{
    for(const ending of KPOP_ENDINGS){
      let s=ready();
      s=kpopWorldStep(work,s,"resolve",ending.id,s.read);
      expect(getKpopEnding(s)).toBe(ending.id);
      expect(Number(s.variables["kpop-risk"]||0)).toBe(ending.id==="leak"?1:0);
      const story=kpopEndingStory(ending.id,s,defaultKpopProfile.owner);
      expect(story.paragraphs.length).toBeGreaterThanOrEqual(3);
      expect(story.paragraphs.join("")).not.toContain("已经在一起");
      const after=kpopWorldStep(work,s,"screenshot-leak","player",s.read);
      expect(after.variables["kpop-risk"]).toBe(s.variables["kpop-risk"]);
      expect(after.variables["kpop-ending"]).toBe(ending.id);
    }
  });
  it("does not settle without prerequisites or on an unknown choice",()=>{
    const s=initialRuntime(work);
    expect(getKpopEnding(kpopWorldStep(work,s,"resolve","return",s.read))).toBe(null);
    const permitted=ready();
    expect(getKpopEnding(kpopWorldStep(work,permitted,"resolve","invalid",permitted.read))).toBe(null);
  });
  it("keeps endings uncertain instead of claiming a private relationship as fact",()=>{
    const s=ready();
    const result=kpopEndingStory("return",s,"尹曦雅").paragraphs.join(" ");
    expect(result).toContain("尹曦雅");
    expect(result).not.toContain("已经在一起");
  });
  it("never narrates a cached but unread private clue as observed fact",()=>{
    const s=ready();
    s.clues=["song","sky","concern","object"];
    const withoutVerified=kpopEndingStory("return",s,"尹曦雅").paragraphs.join(" ");
    expect(withoutVerified).not.toContain("钢琴");
    expect(withoutVerified).not.toContain("小物件");
    const withVerified=kpopEndingStory("return",s,"尹曦雅",["sky","concern"]).paragraphs.join(" ");
    expect(withVerified).toContain("相似的天空");
    expect(withVerified).not.toContain("钢琴");
    expect(withVerified).not.toContain("小物件");
  });
  it("remembers earlier public exposure and impersonation in a voluntary return",()=>{
    const s=ready();
    s.variables["kpop-public-actions"]=3;
    s.variables["kpop-suspicion"]=2;
    const text=kpopEndingStory("return",s,"尹曦雅").paragraphs.join(" ");
    expect(text).toContain("公开痕迹不会随着手机归还而消失");
    expect(text).toContain("机主身份回复");
    expect(text).not.toContain("没有把任何一条私人聊天发布");
    const leaked=kpopEndingStory("leak",s,"尹曦雅").paragraphs.join(" ");
    expect(leaked).toContain("又一次");
  });

});
