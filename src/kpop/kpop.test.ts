import { describe, expect, it } from "vitest";
import base from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { createKpopWork, syncKpopContent } from "./content";
import { parseAiResponse, characterGuide } from "./ai";
import { displayKpopMessage, parseKpopMessage } from "./chat";
import { defaultKpopProfile, normalizeKpopProfile } from "./profile";
import { friendScenes, managerScenes, privateScenes, sceneMessages } from "./scenes";

const baseWork = compileStory(base).work;
const profile = defaultKpopProfile;

describe("fictional K-pop phone", () => {
  it("provides three complete natural Korean-language conversation timelines", () => {
    expect(privateScenes.reduce((n, scene) => n + sceneMessages(scene).length, 0)).toBeGreaterThanOrEqual(150);
    expect(friendScenes.reduce((n, scene) => n + sceneMessages(scene).length, 0)).toBeGreaterThanOrEqual(150);
    expect(managerScenes.reduce((n, scene) => n + sceneMessages(scene).length, 0)).toBeGreaterThanOrEqual(150);
    const generated=createKpopWork(baseWork,profile);
    expect(generated.data.kakao.filter(i=>i.title===profile.crush).length).toBeGreaterThanOrEqual(150);
    expect(generated.data.kakao.filter(i=>i.title==="朴雅凛").length).toBeGreaterThanOrEqual(150);
    expect(generated.data.kakao.filter(i=>i.title.includes("실장님")).length).toBeGreaterThanOrEqual(150);
    expect(generated.apps.length).toBe(49);
    expect(generated.nodes.length).toBe(0);
    expect(generated.data.wechat.length).toBe(0);
    expect(generated.data.kakao.every(i=>i.meta.ko || i.meta.fiction)).toBe(true);
  });
  it("keeps original story unchanged and creates distinct save identities", () => {
    const copy=createKpopWork(baseWork,{...profile,owner:"韩文特别人设"});
    expect(copy.id).not.toBe(baseWork.id);
    expect(copy.phone.owner).toBe("韩文特别人设");
    expect(baseWork.data.wechat.length).toBeGreaterThan(0);
    const changed=createKpopWork(baseWork,{...profile,crush:"不同角色"});
    expect(copy.id).not.toBe(changed.id);
  });
  it("starts without disclosure, syncs new fictional records in separate apps", () => {
    const x=createKpopWork(baseWork,profile);
    expect(x.variables["kpop-sync"]).toBe(false);
    const next=syncKpopContent(x);
    expect(next.kakao.length).toBeGreaterThan(0);
    expect(next.instagram[0].kind).toBe("post");
  });
  it("preserves Korean and Chinese messages independently", () => {
    expect(displayKpopMessage("안녕","你好","dual")).toBe("안녕\n你好");
    expect(displayKpopMessage("안녕","你好","ko")).toBe("안녕");
    expect(displayKpopMessage("안녕","你好","zh")).toBe("你好");
    expect(parseKpopMessage(JSON.stringify({thread:"朴雅凛",direction:"out",ko:"안녕",zh:"你好",time:"2026-10-28 12:00"}))?.direction).toBe("out");
    expect(parseKpopMessage("bad json")).toBeNull();
    expect(normalizeKpopProfile({fan:"无效",language:"none"}).language).toBe("dual");
  });
  it("AI contract demands differentiated persona and a bilingual structured reply", () => {
    expect(characterGuide("金智秀 실장님").includes("敬语")).toBe(true);
    expect(characterGuide("柳时恩").includes("半语")).toBe(true);
    expect(parseAiResponse('{"ko":"네","zh":"是"}')).toEqual({ko:"네",zh:"是"});
    expect(() => parseAiResponse('Not JSON')).toThrow();
  });
});
