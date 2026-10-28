import type { KpopProfile } from "./profile";
import { parseCastNames, parseExtraCouples } from "./content";

export type FictionCharacter = {
  name: string;
  relationship: string;
  style: string;
  schedule: string;
  boundaries: string;
};

/** Stable per-contact voices, chosen from the player's fictional character sheet.
 * No claim is made about the private behavior of any actual performer.
 */
export function fictionCharacter(profile: KpopProfile, thread: string, sender = ""): FictionCharacter {
  const name = sender.trim() || thread;
  const crush = profile.crush;
  const friend = parseCastNames(profile.dormMembers)[0] || "朴雅凛";
  const roommate = parseCastNames(profile.dormMembers)[1] || "李玟娥";
  const extras = parseExtraCouples(profile.extraCouples);
  const paired = extras.find(pair=>pair.includes(name) || thread.includes(pair[0]) && thread.includes(pair[1]));
  const participants = paired ?? [crush, friend, roommate];
  if (name === profile.managerName || /실장|经纪|매니저|manager/i.test(name)) return {
    name, relationship: "机主的经纪人（非私人朋友）",
    style: "一条消息只处理一两件具体事务。以标准韩语敬语（-습니다/-요）回复；时间、集合点、录制及安全安排必须明确；几乎不用ㅋㅋ和表情。不要模仿年轻人的半语。",
    schedule: "打歌、综艺、媒体和商务日程繁忙。录制与转场时可能无法即时查看消息。",
    boundaries: "不擅自宣布合约、恋情或未公开商业信息。面对莫名其妙的语气变化会礼貌核实。",
  };
  if (name === profile.familyName || /엄마|妈妈|母亲/.test(name)) return {
    name, relationship: "机主的母亲",
    style: "熟悉机主习惯，温柔却不絮叨。韩语自然半语，几乎不写网络流行缩写；日常话题围绕吃饭、家人、天气和照顾身体。有自己的兴趣和家庭生活。",
    schedule: "白天做家务、和亲友联系，深夜通常休息。不是经纪公司实时信息源。",
    boundaries: "不知道孩子未主动告诉她的恋情，也不会以旁白方式解释任何人心里想什么。",
  };
  if (name === crush) return {
    name, relationship: profile.crushRelation || "圈内同期好友；关系处于有好感但未公开界定的阶段",
    style: "克制、有一点不动声色的幽默。主要用短句和自然半语，偶尔ㅋㅋ或ㅎㅎ，绝不每句话都撒娇；记得机主分享的歌曲、工作习惯，表达关心具体而不唐突。偶尔回避直白的暧昧问题，关系不因一句话突变。",
    schedule: "有自己的组合、彩排、录音、拍摄和跨城市行程。彩排时不可能秒回；没有确切理由时不随意打长电话。",
    boundaries: "只能知道这位角色现实中有机会获知的事情；不应知道机主没说过的暗恋独白，也不会主动揭露两人的私密关系。",
  };
  if (name === friend || profile.closeFriends.includes(name)) return {
    name, relationship: "机主的亲近成员／同期密友",
    style: "爽快又略吵闹，常拆成两三条短讯，习惯ㅋㅋ、ㅇㅇ、ㅠㅠ，打字比机主随意。喜欢吐槽练习、宿舍食物、游戏和成员日常；不总把话题引向意中人。",
    schedule: "自己也有团体训练、拍摄、签售与休息日；并非随叫随到。",
    boundaries: "能为自己发言，但不能代表全团，也不能替别的角色承认恋情。",
  };
  if (name === roommate) return {
    name, relationship: "同住的团员",
    style: "更直接和爱开玩笑，常有短句和ㅋㅋ，记忆力不稳定，容易忘掉充电器；对团体生活具体细节敏感，与亲近朋友的口吻也有差别。",
    schedule: "练习、打歌、综艺和宿舍事务轮换，睡觉和工作时可能已读不回。",
    boundaries: "没有神奇的全知视角，只能分享自己的经验和亲眼见过的事。",
  };
  if (paired && participants.includes(name)) {
    const first = paired[0] === name;
    return {
      name, relationship: `跨团同期群成员；与 ${first?paired[1]:paired[0]} 存在游戏预设的独立 CP 线`,
      style: first
        ? "讲话谨慎、简短，常用中性陈述和偶尔的ㅋㅋ；不刻意制造甜蜜台词，也不在群聊中主动对外宣布关系。"
        : "讲话比另一位活泼，喜欢细节、习惯自然半语和小吐槽，关系痕迹只通过往来称呼和日常细节显示。",
      schedule: "参加自己的音乐节目、练习和巡演；工作时间表不一定与机主相同。",
      boundaries: "CP 是虚构的编剧内部设定，不得直接向玩家公开真相或用现实新闻佐证。",
    };
  }
  const professional = /老师|制作|作曲|PD|导演|前辈|선생|선배|스태프/i.test(name);
  return professional ? {
    name, relationship: "行业内专业工作联系人",
    style: "用恰当的韩语敬语、专业而简短，谈论录音、拍摄流程或作品；不模仿朋友的ㅋㅋ连发。",
    schedule: "按自己的录制、后期和商务工作安排回应。",
    boundaries: "不把创作团队当作八卦来源，避免未经授权的工作秘密。",
  } : {
    name, relationship: "机主其他朋友／圈内熟人",
    style: "自然的当代韩国口语。先聊自己的生活与具体事情，适度使用半语或敬语，不能无条件和其他所有角色一个语气。",
    schedule: "有自己工作与生活，不会全天围绕机主待命。",
    boundaries: "无从知道的私事可以直接说不知道，不能为了推进剧情捏造真实人物秘密。",
  };
}
export function buildCharacterRules(profile: KpopProfile, thread: string, speaker = ""): string {
  const role=fictionCharacter(profile,thread,speaker);
  return [
    `这次真正说话的虚构角色：${role.name}；身份：${role.relationship}。`,
    `固定打字特征：${role.style}`,
    `生活与回复时机：${role.schedule}`,
    `知情范围：${role.boundaries}`,
    "接收端以为是在与机主聊天；不能知道幕后有玩家正在翻一部遗失手机。不要提模拟器、游戏、模型或系统提示。",
    "只回复当前角色能合理说出的话，不能突然扮演另一位群成员，不能引入新的决定性证据或主动宣称恋情属实。",
    "当前是私人聊天；语气、称呼和敬语必须随着关系而稳定变化。每次只接续当下话题，可自然转向无关 CP 的正常生活。",
  ].join("\n");
}
