import { useEffect, useState } from "react";
import "./chat.css";
import { makeItem, type Item } from "../schema";
import type { SkinProps } from "../AppSkins";
import { useSkinState } from "../skinState";
import { getAiSession, requestAiReply, type CharacterReply, type ChatTurn } from "./ai";
import { requestPuterReply } from "./puter";
import { readKpopProfile, defaultKpopProfile, type KpopProfile, type LanguageMode } from "./profile";
import { fictionCharacter, buildCharacterRules } from "./persona";
import { parseCastNames, parseExtraCouples } from "./content";
import { observationFromRead } from "./observations";

export type LocalKpopMessage = {
  thread: string;
  direction: "out" | "in";
  ko: string;
  zh: string;
  time: string;
  status?: string;
  speaker?: string;
  id?: string;
};
export function parseKpopMessage(raw: string): LocalKpopMessage | null {
  try {
    const x: unknown = JSON.parse(raw);
    if (!x || typeof x !== "object") return null;
    const m = x as Partial<LocalKpopMessage>;
    if (typeof m.thread !== "string" || m.thread.length > 100 ||
      !["out","in"].includes(m.direction || "") ||
      typeof m.ko !== "string" || typeof m.zh !== "string" ||
      typeof m.time !== "string") return null;
    return { thread:m.thread, direction:m.direction!, ko:m.ko.slice(0,500), zh:m.zh.slice(0,500), time:m.time, status:m.status, speaker: typeof m.speaker==="string" ? m.speaker.slice(0,80) : undefined, id: typeof m.id==="string" ? m.id.slice(0,80) : undefined };
  } catch { return null; }
}
export function displayKpopMessage(ko: string, zh: string, mode: LanguageMode): string {
  if (mode === "ko") return ko;
  if (mode === "zh") return zh;
  return ko === zh ? ko : ko + "\n" + zh;
}
export function styleMismatch(thread:string, message:string, managerName:string, crushName:string):boolean {
  const manager=thread===managerName||/실장|经纪|매니저/.test(thread);
  if(manager)return /(^|\s)(야|뭐해|너|반말|ㅋㅋㅋ|꺼져)(\s|$)|给我滚|你个|搞快点/.test(message);
  if(thread===crushName||/雅凛|宿舍|小群|跨团同期群/.test(thread)){
    return /안녕하십니까|귀하께서|존경하는|삼가 인사|谨此致函|尊敬的|贵司|敬启者/.test(message);
  }
  return false;
}
export function offlineKpopReply(thread: string, text: string, count: number, profile: KpopProfile = defaultKpopProfile, speaker = thread): CharacterReply {
  const norm = text.toLowerCase();
  const person = fictionCharacter(profile,thread,speaker);
  const closeness = person.name === profile.crush;
  const isManager = person.relationship.includes("经纪人") || person.relationship.includes("专业工作");
  const isFriend = person.relationship.includes("亲近") || person.relationship.includes("团员");
  const isFamily = person.relationship.includes("母亲");
  if(isFamily) {
    if(/饭|吃|배고|먹|음식/.test(norm)) return {ko:"밥은 꼭 챙겨 먹어. 엄마는 오늘 반찬 만들었어.",zh:"一定记得好好吃饭。妈妈今天做了几样小菜。"};
    if(/晚安|睡|피곤|잘 자/.test(norm)) return {ko:"응, 오늘도 고생 많았지. 푹 자고 내일 연락해.",zh:"嗯，今天也辛苦了。好好睡，明天再联系。"};
    return [
      {ko:"엄마는 잘 지내. 너도 오늘 너무 무리하지 마.",zh:"妈妈挺好的，你今天也别太累。"},
      {ko:"우리 동네 빵집이 새로 열었어. 다음에 같이 가자.",zh:"我们这儿新开了家面包店，下次一起去吧。"},
      {ko:"그랬구나. 네 얘기 좀 더 해 줘. 천천히 답해도 돼.",zh:"原来如此，再跟妈妈讲讲。不用急着回复。"},
    ][count%3];
  }
  if (/练习|舞蹈|무대|연습|彩排|工作|录制/.test(norm)) return isManager ?
    {ko:"네. 일정표에서 확인 후 알려드리겠습니다.",zh:"好的，我确认行程表后再通知您。"} :
    closeness ? {ko:"오늘도 늦게 끝나? 끝나면 쉬어. 답장은 천천히 해도 돼.",zh:"今天也会很晚结束吗？结束就休息吧，不用急着回复。"} :
    {ko:"헉 나도 연습 다녀왔어 ㅠㅠ 오늘은 진짜 쉬자.",zh:"天，我也刚练习完ㅠㅠ今天真的该休息一下了。"};
  if (/吃|饭|夜宵|맛|배고|음식|食物/.test(norm)) return isManager ?
    {ko:"도시락 준비 상황 확인하겠습니다.",zh:"我会确认便当准备情况。"} :
    isFriend ? {ko:"우리 떡볶이 먹자ㅋㅋ 난 어묵 추가할래!",zh:"我们吃炒年糕吧ㅋㅋ我还要加鱼糕！"} :
    {ko:"아직 못 먹었어. 끝나고 따뜻한 거 먹으려고.",zh:"还没吃，打算结束后吃点热乎的。"};
  if (/睡|晚安|졸려|잘 자|累|피곤/.test(norm)) return isManager ?
    {ko:"휴식 시간은 일정표에 반영하겠습니다.",zh:"休息时间会按日程表安排。"} :
    {ko:"오늘 고생했어. 답장 안 해도 되니까 얼른 자 ㅎㅎ",zh:"今天辛苦啦。不用回复也行，快去睡吧ㅎㅎ"};
  if (/喜欢|사랑|恋爱|좋아해|在一起|데이트/.test(norm)) return isManager ?
    {ko:"개인적인 일은 확인드리기 어렵습니다.",zh:"私人事务我不方便确认。"} :
    closeness ? {ko:"갑자기? ㅋㅋ 나 지금 뭐라고 해야 할지 모르겠어. 조금만 생각해 볼게.",zh:"怎么突然说这个ㅋㅋ我一时不知道怎么回，容我想想。"} :
    {ko:"으잉 그걸 왜 나한테 물어ㅋㅋ 너 먼저 말해 봐.",zh:"咦，你干吗问我这个ㅋㅋ你先说说。"};
  if (/你好|在吗|안녕|hi|hello|뭐해|干嘛/.test(norm)) return isManager ?
    {ko:"네. 말씀하세요. 지금 일정 확인 중입니다.",zh:"您好，请说。我正在确认行程。"} :
    isFriend ? {ko:"나 여기! 숙소 가는 길이야 ㅋㅋ 넌 뭐 해?",zh:"我在！正回宿舍ㅋㅋ你干嘛呢？"} :
    {ko:"이제 봤어. 잠깐 대기 중이야. 무슨 일이야?",zh:"刚看到，在短暂待机。怎么啦？"};
  if (/谢谢|고마워|感谢/.test(norm)) return isManager ?
    {ko:"네. 필요하시면 다시 말씀해 주세요.",zh:"好的，有需要请再联系我。"} :
    {ko:"별말을 다 해 ㅎㅎ 오늘 무리하지 마.",zh:"干嘛这么客气ㅎㅎ今天别太拼。"};
  if (isManager) return [
    {ko:"확인해서 다시 공유드리겠습니다.",zh:"我确认后再同步给您。"},
    {ko:"지금은 확답드리기 어렵습니다. 일정 확정 후 말씀드리겠습니다.",zh:"现在还不能确定，日程敲定后再告知您。"},
    {ko:"알겠습니다. 관련 담당자에게 전달하겠습니다.",zh:"明白，我会转告相关负责人。"},
  ][count%3];
  if (isFriend) return [
    {ko:"뭐야ㅋㅋ 좀 더 얘기해 봐. 나 지금 숙소야.",zh:"什么啦ㅋㅋ再说说，我现在在宿舍。"},
    {ko:"헐 진짜? 난 오늘 연습 때문에 아무것도 못 봤어ㅠㅠ",zh:"天啊真的？我今天忙练习什么都没看ㅠㅠ"},
    {ko:"ㅇㅋ 근데 내일 새벽에 나가야 해서 오래 못 있어 ㅎㅎ",zh:"OK，不过明早要很早出门，不能聊太久ㅎㅎ"},
  ][count%3];
  return [
    {ko:"아, 그런 일이 있었구나. 나도 아직 잘 모르겠어. 네 생각은 어때?",zh:"啊，原来是这样。我也还不确定，你怎么想？"},
    {ko:"오늘은 정신없었어. 네 메시지는 이제 봤어. 조금만 더 얘기해 줘.",zh:"今天忙得晕头转向。刚看到你的消息，再跟我说说吧。"},
    {ko:"그 말은 좀 의외다 ㅋㅋ 근데 무슨 뜻인지 궁금해.",zh:"这话有点出乎意料ㅋㅋ不过我挺想知道你什么意思。"},
    {ko:"지금 잠깐 쉬는 중이야. 그 얘기, 나중에 이어서 할래?",zh:"我现在在休息间隙。这个话题等会儿继续聊好吗？"},
  ][count%4];
}

/** A shared session-owned queue keeps a response alive when the player navigates
 * away from the chat. The original story save is always read immediately before
 * any edit, so a late reply does not overwrite subsequent actions in other threads. */
type Delivery = { stage:"waiting"|"typing"|"error"; message?:string };
const deliveries=new Map<string,Delivery>();
const controllers=new Map<string,AbortController>();
const subscribers=new Set<()=>void>();
function setDelivery(key:string,value:Delivery|null) {
  if(value)deliveries.set(key,value);else deliveries.delete(key);
  for(const notify of subscribers)notify();
}
export function hasPendingKpopReply(key:string) {
  const state=deliveries.get(key);
  return state?.stage==="waiting"||state?.stage==="typing";
}
export function useKpopChat(p: SkinProps) {
  const [raw,setRaw] = useSkinState<string[]>(p,"kpop-conversations",[]);
  const [revision,setRevision] = useState(0);
  const profile=readKpopProfile();
  const mode=profile?.language||"dual";
  const thread=p.thread;
  const key=(p.workId||"kpop")+"/"+(p.appId||"kakao")+"/"+thread;
  // Hook listeners only affect the visible UI; delivery itself is not coupled to
  // the React component's lifetime or to the currently selected conversation.
  useEffect(()=>{
    const listener=()=>setRevision(n=>n+1);
    subscribers.add(listener);
    window.addEventListener("foundphone:kpop-ai-changed",listener);
    return ()=>{subscribers.delete(listener);window.removeEventListener("foundphone:kpop-ai-changed",listener);};
  },[]);
  void revision;
  const delivery=deliveries.get(key);
  const pending=delivery?.stage==="waiting"||delivery?.stage==="typing";
  const typing=delivery?.stage==="typing";
  const error=delivery?.stage==="error" ? delivery.message||"回复失败。" : "";
  const stored=raw.map(parseKpopMessage).filter((x):x is LocalKpopMessage=>!!x);
  const forThread=stored.filter(x=>x.thread===thread);
  const local:Item[]=forThread.map((entry,index)=>makeItem({
    id:"kpop-chat-"+thread+"-"+(entry.id||index),
    title:thread,
    body:displayKpopMessage(entry.ko,entry.zh,mode),
    time:entry.time,
    sender:entry.direction==="out"?(p.owner||"我"):(entry.speaker||thread),
    outgoing:entry.direction==="out",
    meta:{ko:entry.ko,zh:entry.zh,kpopStatus:entry.status||"",local:"true"},
  }));
  const readCurrent=():string[]=>{
    const value=p.getUi?.("kpop-conversations");
    return Array.isArray(value)&&value.every(x=>typeof x==="string")?value:raw;
  };
  const save=(next:string[])=>{
    if(p.onUi)p.onUi("kpop-conversations",next.slice(-500));
    else setRaw(next.slice(-500));
  };
  const speakerForThread=(conversation:string,n:number):string=>{
    if(conversation.includes("宿舍小群")){
      const names=parseCastNames(profile?.dormMembers||"朴雅凛、李玟娥");
      return names[n%Math.max(1,names.length)]||"朴雅凛";
    }
    const pair=parseExtraCouples(profile?.extraCouples||"").find(x=>conversation.includes(x[0])&&conversation.includes(x[1]));
    if(pair)return pair[n%2];
    return conversation;
  };
  const cancel=()=>controllers.get(key)?.abort();
  const send=async (draft:string)=>{
    const body=draft.trim().slice(0,300);
    if(!body||!thread||hasPendingKpopReply(key))return;
    const stamp=new Date().toISOString().slice(0,16).replace("T"," ");
    const messageId=crypto.randomUUID();
    const unusual=styleMismatch(thread,body,profile?.managerName||"金智秀 실장님",profile?.crush||"柳时恩");
    const outgoing:LocalKpopMessage={id:messageId,thread,direction:"out",ko:body,zh:body,time:stamp,status:"未读"};
    const before=readCurrent();
    const history=before.map(parseKpopMessage).filter((x):x is LocalKpopMessage=>!!x&&x.thread===thread);
    save([...before,JSON.stringify(outgoing)]);
    p.onKpopAction?.("impersonate",unusual?thread+"::style-anomaly":thread);
    const ac=new AbortController();
    controllers.set(key,ac);
    setDelivery(key,{stage:"waiting"});
    const config=getAiSession();
    const watchdog=setTimeout(()=>ac.abort(),35000);
    try {
      await new Promise<void>(resolve=>setTimeout(resolve,config?350:850));
      if(ac.signal.aborted)throw new Error("等待回复已取消或超时。");
      setDelivery(key,{stage:"typing"});
      let answer:CharacterReply;
      const otherSpeaker=speakerForThread(thread,history.length);
      if(config&&profile){
        const archived:ChatTurn[]=p.items.filter(i=>i.title===thread).slice(-34).map(i=>({
          role:i.outgoing?"user":"assistant",
          content:i.meta.ko||i.body,
        }));
        const turns:ChatTurn[]=[
          ...archived,
          ...history.map(x=>({role:x.direction==="out"?"user":"assistant",content:x.ko} as ChatTurn)),
          {role:"user",content:body},
        ];
        const persona=buildCharacterRules(profile,thread,otherSpeaker)+"\n这次发言人："+otherSpeaker+"。群聊只能让这位角色回复，不能同时扮演整个群。"+
          (unusual?"这条消息敬语或说话习惯异常，可以自然感到疑惑，但不能直接认定账户被盗。":"");
        answer=config.provider==="puter"
          ? await requestPuterReply(thread,turns,profile,persona,config.model,ac.signal)
          : await requestAiReply(config,thread,turns,profile,persona,ac.signal);
      } else {
        answer=unusual ? thread===profile?.managerName
          ? {ko:"말씀하신 표현이 평소와 조금 다른데, 확인이 필요하실까요?",zh:"您的措辞和平常有些不同，需要我再确认一下吗？"}
          : {ko:"잠깐, 너 오늘 왜 그렇게 딱딱하게 말해? ㅋㅋ 무슨 일 있어?",zh:"等一下，你今天说话怎么这么正式ㅋㅋ发生什么了？"}
          : offlineKpopReply(thread,body,history.length,profile||defaultKpopProfile,otherSpeaker);
      }
      if(ac.signal.aborted)throw new Error("等待回复已取消或超时。");
      // An acknowledged message can stay unanswered. Do not reveal any unseen motive.
      const acknowledged=readCurrent().map(entry=>{
        const msg=parseKpopMessage(entry);
        return msg?.id===messageId&&msg.direction==="out"&&msg.status!=="已撤回"
          ? JSON.stringify({...msg,status:"已读"}) : entry;
      });
      save(acknowledged);
      const silent=!config && history.length>0 && history.length%13===0;
      if(silent){
        setDelivery(key,{stage:"error",message:"对方已读，暂时没有回复。"});
        return;
      }
      await new Promise<void>(resolve=>setTimeout(resolve,config?900:Math.min(2200,1200+answer.ko.length*35)));
      if(ac.signal.aborted)throw new Error("等待回复已取消或超时。");
      const current=readCurrent();
      const wasRecalled=current.some(entry=>{
        const msg=parseKpopMessage(entry);
        return msg?.id===messageId&&msg.status==="已撤回";
      });
      if(!wasRecalled){
        const response:LocalKpopMessage={
          id:crypto.randomUUID(),thread,direction:"in",speaker:otherSpeaker,
          ko:answer.ko,zh:answer.zh,
          time:new Date().toISOString().slice(0,16).replace("T"," "),
        };
        save([...current,JSON.stringify(response)]);
      }
      setDelivery(key,null);
    }catch(reason){
      setDelivery(key,{stage:"error",message:reason instanceof Error?reason.message:"暂时无法获得回复。"});
    }finally{
      clearTimeout(watchdog);
      controllers.delete(key);
    }
  };
  const retract=(id:string)=>{
    const prefix="kpop-chat-"+thread+"-";
    if(!id.startsWith(prefix))return;
    const token=id.slice(prefix.length);
    let i=-1;
    const current=readCurrent();
    const record=current.map(entry=>{
      const msg=parseKpopMessage(entry);
      if(msg?.thread!==thread)return entry;
      i++;
      if((msg.id||String(i))!==token||msg.direction!=="out")return entry;
      if(hasPendingKpopReply(key))cancel();
      return JSON.stringify({...msg,ko:"삭제된 메시지입니다.",zh:"已删除的消息",status:"已撤回"});
    });
    save(record);
  };
  return {
    local,mode,pending:!!pending,typing:!!typing,error,send,cancel,retract,isAi:!!getAiSession(),
    observation:observationFromRead(thread,p.kpopTurns||1,profile?.crush||"柳时恩",profile?.fan||"路人粉",p.items),
  };
}
