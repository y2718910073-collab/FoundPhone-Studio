import {describe,it,expect} from "vitest";
import {makeItem} from "../schema";
import {observationFromRead} from "./observations";

const seen=makeItem({
  id:"kpop-crush-7-1",
  title:"柳时恩",
  sender:"柳时恩",
  body:"이 노래 좋더라.\n那首歌挺好听的。",
  time:"2026-10-28 18:27",
  read:true,
  meta:{ko:"이 노래 좋더라.",zh:"那首歌挺好听的。",fiction:"true"},
});
describe("player-side observation fidelity",()=>{
  it("does not hint at an unread song, sky or private relationship",()=>{
    const text=observationFromRead("柳时恩",3,"柳时恩","显微镜粉",[{...seen,read:false}]);
    expect(text).not.toContain("钢琴");
    expect(text).not.toContain("天空");
    expect(text).not.toContain("那首歌");
  });
  it("connects a clue only to a message that the player actually opened",()=>{
    const text=observationFromRead("柳时恩",3,"柳时恩","显微镜粉",[seen]);
    expect(text).toContain("18:27");
    expect(text).toContain("那首歌挺好听的");
    expect(text).toContain("钢琴");
    expect(text).not.toContain("已经在一起");
  });
  it("remains stable when revisiting the same read message",()=>{
    expect(observationFromRead("柳时恩",10,"柳时恩","路人粉",[seen])).toBe(observationFromRead("柳时恩",11,"柳时恩","路人粉",[seen]));
  });
});
