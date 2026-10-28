import { describe,expect,it } from "vitest";
import { defaultKpopProfile } from "./profile";
import { fictionCharacter,buildCharacterRules } from "./persona";
import { characterGuide } from "./ai";

describe("consistent fictional K-pop character voices",()=>{
  const owner=defaultKpopProfile;
  it("keeps manager speech professional even in a friendly context",()=>{
    const manager=fictionCharacter(owner,owner.managerName);
    expect(manager.style).toContain("敬语");
    expect(manager.style).toContain("ㅋㅋ");
    expect(manager.relationship).toContain("经纪人");
    expect(characterGuide(owner.managerName,owner)).toContain("经纪人");
  });
  it("uses the player's own name and role information",()=>{
    const custom={...owner,
      managerName:"韩经纪",familyName:"어머니",crush:"韩甲",
      dormMembers:"韩乙、韩丙",closeFriends:"韩乙",
      extraCouples:"韩丁×韩戊",
    };
    expect(fictionCharacter(custom,"韩经纪").relationship).toContain("经纪人");
    expect(fictionCharacter(custom,"어머니").style).toContain("半语");
    expect(fictionCharacter(custom,"韩甲").style).toContain("克制");
    expect(fictionCharacter(custom,"韩乙").style).toContain("短讯");
    expect(fictionCharacter(custom,"韩丙").style).toContain("短句");
    expect(fictionCharacter(custom,"跨团同期群 · 韩丁 × 韩戊","韩丁").style).toContain("谨慎");
    expect(fictionCharacter(custom,"跨团同期群 · 韩丁 × 韩戊","韩戊").style).toContain("活泼");
    expect(buildCharacterRules(custom,"韩甲")).toContain("不能知道幕后有玩家");
  });
  it("does not reveal the person who found the phone to a virtual contact",()=>{
    const guide=characterGuide(owner.crush,owner);
    expect(guide).toContain("不知道幕后玩家");
    expect(guide).toContain("不会主动揭露");
    expect(guide).toContain("1—3");
    expect(guide).not.toContain("玩家是一名捡到手机的路人，所发的消息实际上冒充了机主");
  });
});
