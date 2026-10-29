import { describe, expect, it } from "vitest";
import example from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { initialRuntime, makeItem } from "../schema";
import { createKpopWork } from "./content";
import { defaultKpopProfile } from "./profile";
import { crossAppEchoes, readKpopArchive, verifiedReadTraces } from "./readerArchive";

const work=createKpopWork(compileStory(example).work,defaultKpopProfile);
const start=()=>initialRuntime(work);
describe("K-pop seen-only archive and cross-App evidence",()=>{
  it("does not reveal a single unread item even if its trace is obvious",()=>{
    const s=start();
    s.clues=["sky","song","concern"];
    expect(readKpopArchive(work,s)).toEqual([]);
    expect(crossAppEchoes(readKpopArchive(work,s))).toEqual([]);
    expect(verifiedReadTraces(readKpopArchive(work,s))).toEqual([]);
  });
  it("requires two separately opened records from different Apps before claiming an echo",()=>{
    const s=start();
    s.read=["kpop-photos-0","kpop-photos-12"];
    let records=readKpopArchive(work,s);
    expect(records.map(x=>x.item.id)).toHaveLength(2);
    expect(crossAppEchoes(records)).toEqual([]);
    s.read.push("kpop-instagram-1");
    records=readKpopArchive(work,s);
    expect(crossAppEchoes(records)).toHaveLength(1);
    expect(crossAppEchoes(records)[0].trace).toBe("sky");
    expect(crossAppEchoes(records)[0].appCount).toBe(2);
    expect(new Set(crossAppEchoes(records)[0].sources.map(x=>x.app))).toEqual(new Set(["photos","instagram"]));
  });
  it("does not guess unseen timestamps, and preserves known records in chronological order",()=>{
    const s=start();
    s.read=["kpop-files-5","kpop-spotify-0"];
    const records=readKpopArchive(work,s);
    expect(records).toHaveLength(2);
    expect(crossAppEchoes(records)[0].trace).toBe("song");
    expect(records.every(x=>x.item.time.length>=10)).toBe(true);
    expect(records[0].item.time.localeCompare(records[1].item.time)).toBeGreaterThanOrEqual(0);
  });
  it("shows new synced records only after a real read and never duplicates a record",()=>{
    const s=start();
    const synced=makeItem({id:"kpop-world-photos-99-0",title:"新同步照片",body:"只是一小张照片。",time:"2026-11-02 20:10",meta:{trace:"object"}});
    s.messages.photos=[synced];
    expect(readKpopArchive(work,s).some(x=>x.item.id===synced.id)).toBe(false);
    s.read=[synced.id];
    expect(verifiedReadTraces(readKpopArchive(work,s))).toEqual(["object"]);
    s.messages.photos.push(synced);
    expect(readKpopArchive(work,s).filter(x=>x.item.id===synced.id)).toHaveLength(1);
  });
});
