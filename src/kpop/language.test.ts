import {describe,expect,it} from "vitest";
import template from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { createKpopWork } from "./content";
import { defaultKpopProfile } from "./profile";
import { PRIVATE_RECORD_TRANSLATIONS,renderKpopItem,localizePrivateRecord } from "./language";
import { parseKpopMessage } from "./chat";

const base=compileStory(template).work;
describe("private content language consistency",()=>{
  it("provides original Korean plus simplified-Chinese translations in all private-record apps",()=>{
    const work=createKpopWork(base,{...defaultKpopProfile,language:"dual"});
    for(const [app,translations] of Object.entries(PRIVATE_RECORD_TRANSLATIONS)){
      expect(work.data[app].length).toBe(translations.length);
      work.data[app].forEach((item,index)=>{
        expect(item.meta.ko).toBe(translations[index][1]);
        expect(item.body).toBe(translations[index][1]+"\n"+item.meta.zh);
        expect(item.title).toContain(translations[index][0]);
        expect(item.title).toContain(item.meta.zhTitle);
      });
    }
  });
  it("supports Korean-only without untranslated Chinese, retaining the source for later mode changes",()=>{
    const korean=createKpopWork(base,{...defaultKpopProfile,language:"ko"});
    for(const [app,translation] of Object.entries(PRIVATE_RECORD_TRANSLATIONS)){
      korean.data[app].forEach((item,index)=>{
        expect(item.body).toBe(translation[index][1]);
        expect(item.title).toBe(translation[index][0]);
        expect(renderKpopItem(item,"zh").body).toBe(item.meta.zh);
        expect(renderKpopItem(item,"dual").body).toBe(item.meta.ko+"\n"+item.meta.zh);
      });
    }
  });
  it("leaves the Mandarin text unchanged in Chinese mode and never affects the original work",()=>{
    const localized=createKpopWork(base,{...defaultKpopProfile,language:"zh"});
    expect(localized.data.notes[0].body).toBe("事前录制、彩排、采访，各时间以经纪人最终版本为准。");
    expect(localized.data.notes[0].title).toBe("复归周提醒");
    expect(base.data.notes).not.toEqual(localized.data.notes);
    const untouched=localized.data.photos[0];
    expect(localizePrivateRecord(untouched,"photos",0,"ko")).toBe(untouched);
  });
  it("renders newly synced Korean+Chinese items without removing a saved message ID",()=>{
    const sample=createKpopWork(base,{...defaultKpopProfile,language:"dual"}).data.notes[0];
    const id=sample.id;
    const item=renderKpopItem(sample,"ko");
    expect(item.id).toBe(id);
    expect(item.meta.zh).toBe(sample.meta.zh);
    expect(item.body).toBe(sample.meta.ko);
  });
});
describe("durable Kakao local message identities",()=>{
  it("preserves per-message stable identities and read/recall metadata",()=>{
    const x={id:"id001",thread:"柳时恩",direction:"out",ko:"안녕",zh:"你好",time:"2026-10-28 12:00",status:"已读"};
    expect(parseKpopMessage(JSON.stringify(x))?.id).toBe(x.id);
    expect(parseKpopMessage(JSON.stringify({...x,status:"已撤回"}))?.status).toBe("已撤回");
    expect(parseKpopMessage('{"id":"invalid"}')).toBeNull();
  });
});
