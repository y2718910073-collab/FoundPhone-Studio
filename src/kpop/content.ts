import { makeItem, validateWork, type Item, type Work } from "../schema";
import type { KpopProfile } from "./profile";
import { privateScenes, friendScenes, managerScenes, sceneMessages } from "./scenes";

function dateOffset(date: string, days: number) {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function item(id: string, title: string, body: string, date: string, sender: string, folder = "", meta: Record<string,string> = {}, kind: Item["kind"] = "text"): Item {
  return makeItem({id,title,body,sender,folder,meta,kind,time:date});
}
type Speaker = { name: string; code: string };
function timeline(name: string, owner: string, scenes: string[], date: string, speaker: Speaker, folder = ""): Item[] {
  let all: Item[] = [];
  scenes.forEach((scene, sceneIndex) => {
    const lines = sceneMessages(scene);
    const stamp = dateOffset(date, -4 + Math.floor(sceneIndex / 6));
    const hour = 9 + (sceneIndex % 6) * 2;
    lines.forEach((m,n)=>{
      const sender = m.who==="o" ? owner : speaker.name;
      const time = stamp + " " + String(hour).padStart(2,"0") + ":" + String(4+n*3).padStart(2,"0");
      all.push(item(`kpop-${speaker.code}-${sceneIndex}-${n}`,name,m.ko+"\n"+m.zh,time,sender,folder,{
        ko:m.ko,zh:m.zh,fiction:"true",
      }));
      all[all.length-1].outgoing = m.who==="o";
    });
  });
  return all;
}
function records(app: string, names: [string,string,string?][], owner: string, date: string, kind: Item["kind"]="text") {
  return names.map(([title,body,folder],i)=>item(`kpop-${app}-${i}`,title,body,date+" "+String(8+i%12).padStart(2,"0")+":"+String(i*7%60).padStart(2,"0"),owner,folder||"",{fiction:"true"},kind));
}
export function createKpopWork(original: Work, profile: KpopProfile): Work {
  // Original player mechanics, 49 registered apps and data shape remain unchanged.
  const w: Work = structuredClone(original);
  w.id = `kpop-foundphone-${stableHash([profile.owner,profile.crush,profile.group,profile.agency,profile.date].join("|"))}`;
  w.title = "韩娱捡手机 · " + profile.owner;
  w.description = "平行世界虚构作品。所有人物关系、私信、公司信息和行程只是游戏设定，并非有关现实艺人的报道。";
  w.phone = {...w.phone,owner:profile.owner,date:profile.date,time:"22:17",passcode:"",battery:48,theme:"dark",network:"5G"};
  w.mode = "explore";
  w.nodes = [];
  w.variables = {"kpop-mode":true,"kpop-turn":0,"kpop-sync":false};
  w.data = Object.fromEntries(w.apps.map(app=>[app.id,[] as Item[]]));
  const d=w.data, stamp=profile.date, name=profile.owner;
  d.kakao=[
    ...timeline(profile.crush,name,privateScenes,stamp,{name:profile.crush,code:"crush"},"私信"),
    ...timeline("朴雅凛",name,friendScenes,stamp,{name:"朴雅凛",code:"friend"},"宿舍"),
    ...timeline("金智秀 실장님",name,managerScenes,stamp,{name:"金智秀 실장님",code:"manager"},"工作"),
  ];
  const family = [
    ["엄마","내일 아침에도 일찍 나가니?","明天又要一大早出门吗？"],
    ["owner","응. 이번 주는 컴백 활동이라.","嗯，这周是回归活动。"],
    ["엄마","밥은 꼭 챙겨 먹어.","一定要好好吃饭。"],
    ["owner","걱정 마. 도시락 준비됐어.","别担心，准备了便当。"],
    ["엄마","무대는 TV로 볼게.","我会看电视上的舞台。"],
    ["owner","응. 너무 늦게 자지 마.","好，你也别熬太晚。"],
  ];
  d.kakao.push(...family.map(([who,ko,zh],i)=>{
    const message=item("kpop-family-"+i,"엄마",ko+"\n"+zh,stamp+" 20:"+String(i*5).padStart(2,"0"),who==="owner"?name:"엄마","家人",{ko,zh,fiction:"true"});
    message.outgoing=who==="owner";return message;
  }));
  // A small group with different voices: no universally identical NPC cadence.
  const groupLines: [string,string,string][]=[
    ["朴雅凛","내일 5시 40분 맞지?","明天5:40集合对吧？"],
    ["尹曦雅","응. 늦으면 안 돼.","嗯，千万别迟到。"],
    ["李玟娥","나 알람 세 개 맞췄어ㅋㅋ","我设了三个闹钟ㅋㅋ"],
    ["朴雅凛","누가 내 충전기 봤어 ㅠㅠ","谁看到我的充电器了ㅠㅠ"],
    ["尹曦雅","현관 바구니.","玄关篮子里。"],
    ["李玟娥","와 우리 숙소 CCTV 수준ㅋㅋ","哇我们宿舍有人肉监控ㅋㅋ"],
    ["朴雅凛","내일 도시락 메뉴 뭔지 알아?","知道明天便当是什么吗？"],
    ["李玟娥","닭고기래!","说是鸡肉！"],
    ["尹曦雅","채소도 먹어.","蔬菜也要吃。"],
    ["朴雅凛","언니 잔소리 모드 시작ㅋㅋ","姐姐唠叨模式启动ㅋㅋ"],
    ["李玟娥","스케줄표 다시 올려둘게요.","我再发一次行程表。"],
    ["朴雅凛","고마워, 확인했어.","谢谢，确认了。"],
  ];
  d.kakao.push(...groupLines.map(([who,ko,zh],i)=>{
    const person=who==="尹曦雅"?name:who;
    const result=item("kpop-group-"+i,profile.group+" 宿舍小群",ko+"\n"+zh,stamp+" 21:"+String(i*4).padStart(2,"0"),person,"群聊",{ko,zh,fiction:"true"});
    result.outgoing=who==="尹曦雅";return result;
  }));
  d.contacts=records("contacts",[[profile.crush,"同业朋友 · 录制时段常静音"],["朴雅凛","团体成员 · 同住宿舍"],["金智秀 실장님","经纪人 · 行程确认"],["엄마","家人"],["李玟娥","团体成员 · 群聊"],["录音室","工作号码"],["造型师","服装与造型"],["舞蹈老师","舞台走位"]],name,stamp);
  d.notes=records("notes",[
    ["复归周提醒","事前录制、彩排、采访，各时间以经纪人最终版本为准。"],
    ["试着写的歌","第二段主旋律需要留白。手机录音里还有未完成的哼唱。"],
    ["今天读到的句子","有时候静静等候不等于没有在意。"],
    ["随身清单","润唇膏、入耳、充电宝、护照、鞋垫。"],
    ["演唱会后想做的事","睡到自然醒。看电影。吃没有时间限制的一顿饭。"],
    ["发给自己的话","演出做到最好就可以，不必对所有评论逐字回应。"],
    ["签售会备忘","记得认真向留下长信的人表达谢意。"],
    ["歌词备份","还没想好歌名。暂时只有两个和弦进程。"],
  ],name,stamp,"note");
  d.photos=records("photos",[
    ["练习室窗外","17:42。从练习室看出去的天空，窗框边有一只蓝色小贴纸。"],
    ["化妆桌","录制前的水杯、台本和开到一半的润唇膏。"],
    ["便利店的伞","灰色雨伞挂在门口，照片里只能看到一小段背影。"],
    ["排练地板","鞋底的胶带记号，编号不是公开舞台的机位。"],
    ["换场的夜灯","音乐节目后台走廊，灯全都没关。"],
    ["礼物角落","粉丝寄来的信，信封没有拍到姓名。"],
    ["书的封底","第二次翻到同一页，夹着空白便签。"],
    ["电台耳机","墙上的挂钩有两副耳机。"],
    ["宿舍冰箱","半袋饼干、饮料和过期日提醒。"],
    ["录音室的琴键","钢琴上有没写完的乐谱。"],
    ["路灯的影子","回程车窗，23:18。"],
    ["一张没发布的自拍","镜头偏了，背后有训练室的门。"],
    ["雨后的天空","与另一位朋友发在公开账号里的云色相似，或许只是同一场雨。"],
    ["工作证背面","镜头里看不到个人身份号码。"],
  ],name,stamp,"image");
  d.calendar=records("calendar",[
    ["音乐节目事前录制","05:40集合，07:10预录，11:00彩排。"],
    ["舞蹈训练","14:00—17:30 · 练习室 B。"],
    ["电台直播","18:30 检查话筒，19:00开始。"],
    ["粉丝签售会","活动日程按主办方公开通知。"],
    ["广告画报拍摄","09:00 化妆，11:30开拍。"],
    ["海外演出准备","护照和托运行李检查。"],
    ["经纪公司例会","讨论下一周工作日程。"],
    ["组合练习","检查队形、录影回看。"],
    ["休息日","行程空白。不约任何正式工作。"],
  ],name,stamp,"event");
  d.files=records("files",[
    ["舞台走位_v3.pdf","排练顺序与镜头信息。禁止外部传播。"],
    ["外景拍摄注意事项","雨天走位请穿防滑鞋。"],
    ["音源录制计划","第二段副歌补录时间待确认。"],
    ["电台节目问题清单","只包含已公开活动、作品与音乐制作问题。"],
    ["行程联络备份","经纪人协助协调录影与活动时间。"],
    ["个人随手歌单.txt","第三首是没有人声的钢琴曲。"],
    ["酒店入住安排","海外活动住宿流程，隐去房间号。"],
  ],name,stamp,"file");
  d.instagram=records("instagram",[
    ["练习室傍晚","下班前五分钟的窗景。#컴백 #연습실","动态"],
    [profile.crush+" · 公开动态","晚间练习室外的云。两张照片没有可核验的同框信息。","动态"],
    ["回归舞台花絮","发型师帮忙整理衣领，台上台下都是工作。","动态"],
    ["密友快拍 · 便利店","没公开的零食包装，文字：아직 연습중（还在练习）。","Story"],
    ["组合官方","本周预录时间以主办方为准。","动态"],
    ["化妆台上的贴纸","旧相机滤镜，配文：그냥 오늘（普通的一天）。","动态"],
    ["宿舍的晚饭","今天还是吃了炒年糕。","Story"],
    ["彩排结束","后台走廊里的灯光。","动态"],
    ["乐谱一角","没有公开完整内容。","Story"],
  ],name,stamp,"post");
  d.twitter=records("twitter",[
    ["公开回归日程","团体官方账号发布下周音乐节目出席时间。"],
    ["粉丝的舞台观后感","今天主唱发挥很稳，和编舞很配。"],
    ["国际粉评论","The live vocals today were seriously good."],
    ["路人留言","看完整舞台之后想听音源了。"],
    ["团队提醒","具体录制安排以节目组公告为准。"],
  ],name,stamp,"post");
  d.threads=records("threads",[
    ["练习后的夜宵","连续几天工作以后，最想吃热汤。"],
    ["会员投票","你们更喜欢晚霞还是夜景？"],
    ["看到好看的书","分享了读书时夹的便签。"],
    ["走位练习心得","有时候慢半拍比抢拍更难。"],
  ],name,stamp,"post");
  d.spotify=records("spotify",[
    ["After Stage · Piano","原创模拟曲目，演出之后听的无歌词钢琴配乐。","歌单"],
    ["Late Walk","夜晚通勤时的原创氛围音乐。","歌单"],
    ["Window 17:42","练习室窗边的安静电子氛围。","歌单"],
    ["Second Verse","未完成的原创旋律草稿。","歌单"],
  ],name,stamp,"audio");
  d.netease=records("netease",[
    ["回归周歌单","适合夜间排练后的原创模拟曲目。","歌单"],
    ["出租车后座","安静的无歌词音乐。","歌单"],
    ["练习室夜色","虚构手机个人收藏。","歌单"],
  ],name,stamp,"audio");
  d.music=records("music",[
    ["钢琴曲第三首","此前分享的静静的无歌词旋律。","歌单"],
    ["新曲 demo","一段没有完成的旋律草稿。","歌单"],
  ],name,stamp,"audio");
  d.messages=records("messages",[
    ["公司通知","明日集合时间05:40，车辆分组另行通知。","收件箱"],
    ["电台制作组","已收到问题清单，感谢合作。","收件箱"],
    ["个人提醒","今天的耳返记得放进收纳盒。","收件箱"],
  ],name,stamp);
  d.phone=records("phone",[
    ["金智秀 실장님","08:10 通话 3分12秒 · 行程确认。"],
    ["엄마","20:42 未接来电。"],
    ["造型师","16:15 通话 45秒。"],
  ],name,stamp,"call");
  d.mail=records("mail",[
    ["舞台分镜确认","From: 制作组 · 已共享舞台镜头流程。","收件箱"],
    ["巡演交通安排","From: 经纪部门 · 时间以最后通知为准。","收件箱"],
    ["录音室更新","From: 制作人 · 下次补录时间待确定。","收件箱"],
  ],name,stamp);
  d.weibo=records("weibo",[
    ["新舞台公开","中文粉丝分享舞台截图和表演评论。","全部"],
    ["练习室花絮","今天又是努力的一天！","全部"],
    ["海外巡演应援","等待官方公布更多场次信息。","全部"],
  ],name,stamp,"post");
  d.redbook=records("redbook",[
    ["练习室包里有什么","贴布、耳返、耳塞和润唇膏。","发现"],
    ["演唱会穿搭笔记","温差大时记得带薄外套。","发现"],
    ["深夜便利店","包装很漂亮但有一点太甜。","发现"],
  ],name,stamp,"post");
  d.reddit=records("reddit",[
    ["r/kpop · Weekly stages","Discuss this week's live stages and choreography."],
    ["r/kpop · Radio performances","A fan thread about the live vocal arrangement."],
  ],name,stamp,"post");
  d.forum=records("forum",[
    ["theqoo · 이번 주 무대 좋았다","이번 주 무대 라이브 안정적이었음.（本周舞台现场很稳）"],
    ["instiz · 무대 의상 어땠어","오늘 무대 의상 얘기하는 글.（讨论今天舞台服装）"],
  ],name,stamp,"post");
  d.wallet=records("wallet",[["便利店","¥ 28.50 · 排练后的零食"],["机场快线","¥ 56.00 · 交通支出"],["书店","¥ 93.00 · 图书购买"]],name,stamp);
  d.taobao=records("taobao",[["便携充电宝","经常忘记充电器，备一只更方便。","商品"],["黑色发圈","练习室常备用品。","商品"],["防滑鞋垫","彩排移动时常用。","商品"]],name,stamp);
  d.delivery=records("delivery",[["夜宵汤饭","结束训练后适合吃点热食。","商家"],["低辣炒年糕","宿舍成员最常点的夜宵。","商家"]],name,stamp);
  d.bilibili=records("bilibili",[["虚构团体舞蹈练习幕后","原创虚构文字回顾，并非真实 MV 的搬运。","推荐"]],name,stamp,"post");
  d.youtube=records("youtube",[["回归期练习 Vlog","虚构文字视频档案，未获得真实艺人视频授权。","视频"]],name,stamp,"post");
  d.netflix=records("netflix",[["宿舍最近想看的悬疑剧","虚构的追剧清单条目，不是平台正版内容。","片单"]],name,stamp,"post");
  d.douyin=records("douyin",[["练习室下班","没有真人影像的虚构短视频档案。"]],name,stamp,"post");
  d.tiktok=records("tiktok",[["舞蹈挑战彩排","只记录虚构行程，没有任何现实艺人的私人影像。"]],name,stamp,"post");
  d.snapchat=records("snapchat",[["练习结束的路灯","仅密友可见的快拍记录。"]],name,stamp,"post");
  d.facebook=records("facebook",[["团体公开演出资讯","以官方公开活动为主题的虚构粉丝页面。"]],name,stamp,"post");
  d.pinterest=records("pinterest",[["舞台造型灵感板","深灰、银色和墨蓝色。"]],name,stamp,"post");
  d.alipay=records("alipay",[["便利店交易","模拟支付记录，不是真实消费。"]],name,stamp);
  d.health=records("health",[["睡眠记录","回归周睡眠时间较短。"],["活动时间","练习日活动时间明显增加。"]],name,stamp);
  d.reminders=records("reminders",[["耳返消毒","录制结束后清洁耳返。"],["带上护照","巡演出发前检查。"]],name,stamp);
  d.clock=records("clock",[["05:00 起床提醒","事前录制日。"]],name,stamp);
  d.weather=records("weather",[["首尔","这是一条剧情中的示意天气记录，并非实时预报。"]],name,stamp);
  d.maps=records("maps",[["练习室周边","剧情背景地点，未提供真实私人住址。"]],name,stamp);
  d.camera=records("camera",[["拍照权限","仅由用户主动授权后才能使用设备相机。"]],name,stamp);
  d.find=records("find",[["我的设备","旧手机的虚构同步状态。"]],name,stamp);
  d.safari=records("safari",[["音乐节目公开节目表","可通过浏览器搜索公开活动资料。"]],name,stamp);
  d.line=records("line",[["同期好友","记得在日本活动时把转机时间对一下。"]],name,stamp);
  d.telegram=records("telegram",[["跨国音乐朋友","下次有机会再交换练习心得。"]],name,stamp);
  d.messenger=records("messenger",[["行程合作方","邮件确认后再安排拍摄时间。"]],name,stamp);
  d.qq=records("qq",[["海外活动筹备群","行程表以经纪人最新邮件为准。"]],name,stamp);
  d.discord=records("discord",[["游戏小队","等录制结束再上线打两局。","general"]],name,stamp);
  d.whatsapp=records("whatsapp",[["海外巡演协调","Please check the travel time before rehearsal."]],name,stamp);
  // App Store and native utilities retain built-in working UI.
  return validateWork(w);
}
function stableHash(s:string) {
  let n=2166136261;
  for (let i=0;i<s.length;i++) n=Math.imul(n^s.charCodeAt(i),16777619);
  return (n>>>0).toString(36);
}
export function syncKpopContent(w:Work) {
  const date=w.phone.date||"2026-10-28";
  const owner=w.phone.owner;
  return {
    kakao:[
      item("kpop-sync-kakao-1","朴雅凛","언니 오늘 연습 조금 늦어!\n姐，今天练习会晚一点！",date+" 22:24","朴雅凛","宿舍",{ko:"언니 오늘 연습 조금 늦어!",zh:"姐，今天练习会晚一点！",fiction:"true"}),
      item("kpop-sync-kakao-2","金智秀 실장님","내일 차량 탑승 시간 다시 안내드리겠습니다.\n明天的上车时间会再通知您。",date+" 22:27","金智秀 실장님","工作",{ko:"내일 차량 탑승 시간 다시 안내드리겠습니다.",zh:"明天的上车时间会再通知您。",fiction:"true"}),
    ],
    instagram:[item("kpop-sync-instagram-1","新同步快拍","练习结束，雨还没停。",date+" 22:30",owner,"Story",{fiction:"true"},"post")],
    notes:[item("kpop-sync-note-1","新日程记录","明天预录车程提前十五分钟。",date+" 22:32",owner,"日程",{fiction:"true"},"note")],
  };
}
