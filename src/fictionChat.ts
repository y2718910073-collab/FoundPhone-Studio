/** Fictional, deterministic offline character replies. No external chat API or tracking. */
export function characterReply(thread: string, message: string, turn = 0): string {
  const normalized = message.toLowerCase().replace(/\s+/g, "");
  const is = (re: RegExp) => re.test(normalized);
  const tang = /唐夏|tang/i.test(thread);
  const shen = /沈之遥|之遥|shen/i.test(thread);
  const xu = /徐言|周末摆书|xu/i.test(thread);
  const he = /何主任|主任/i.test(thread);
  const group = /志愿者|小分队|群/i.test(thread);
  const whom = tang ? "唐夏" : shen ? "沈之遥" : xu ? "徐言" : he ? "何主任" : "好友";
  if (is(/你是(谁|什么)|你哪位|谁(在|啊|呀)/)) return `我是${whom}。予晴的手机在你那里吗？先告诉我她现在是否安全。`;
  if (is(/捡(到|了)|手机|失主|予晴|不见|失踪/))
    return tang ? "你找到予晴的手机了？！先别交给自称负责人的人。看看我们的聊天，有张蓝色票根；我会在书屋门口等。" :
      shen ? "手机在你手里？先保护好记录，别删聊天。票根、私人备忘录和B-17交接单能把事情串起来。" :
      he ? "手机先交到我手里，我会处理的。聊天记录不用给别人看。" :
      "你是捡到手机的人？别慌。先把手机交给可信的公共值班点，也可以看看聊天里提到的蓝色票根。";
  if (is(/你好|在吗|hi|hello|喂|有人吗/))
    return tang ? "在！我正在找予晴。你那边安全吗？有看到蓝色票根吗？" :
      shen ? "我在。旧书屋这边出了点事，你可以问我交接单、票根或者日期。" :
      he ? "你好。若拾到手机，请尽快当面移交给我。" :
      "在的！今天书屋忙得有点乱，你想问哪件事？";
  if (is(/票根|蓝色|取件|b-?17/))
    return tang ? "蓝色票根写着 B-17，不是兑奖券。予晴拍了背面放在相册，她说一定要留原图。" :
      shen ? "B-17 对应纸质交接单。照片只是线索，真正能核对的是原始清单。别只看群里转发的版本。" :
      he ? "一张票根解释不了什么，别被流言带偏。" :
      "B-17 就是那张被提到很多次的票根编号。查看相册和文件，也许就能对上。";
  if (is(/密码|口令|0917|几月|日期|解锁|私密/))
    return shen ? "私密备忘录的四位密码是 0917，也就是旧仓库启用那天。她在聊天里留下过线索。" :
      tang ? "我记得是 0917，予晴喜欢用有意义的日期。但别把她的私人内容发布到网上。" :
      he ? "密码我不清楚。那是她的私人笔记。" :
      "0917。线索就在沈之遥的聊天记录里。打开加密备忘录，再查原件。";
  if (is(/书|交换|绘本|少(了|的)|36|12|数量|领用/))
    return shen ? "原始清单记着 36 本，现场却只找到 12 本。不能凭这个就指认谁拿走了书；先保存原件。" :
      xu ? "我数过两次，只剩 12 本。那箱原本登记了 36 本。我真的希望只是搬错地方。" :
      tang ? "我记得那箱绘本应该是 36 本。予晴没有说要找谁算账，只想确认剩下的书去了哪儿。" :
      "交换会原定明天继续，可账面数量有出入，最好先看原始领用单。";
  if (is(/何主任|主任|他是好人|相信谁|谁可疑|谁做的|凶手/))
    return he ? "没有证据就别猜测。我会向大家解释，前提是你把手机交给我。" :
      tang ? "我不敢断言何主任做了什么。但我不赞成单独把手机交给他；找公开登记的值班组更稳妥。" :
      shen ? "先别给人定罪。资料显示记录被修改过，不等于能确定是谁改的。由多人共同核查比较安全。" :
      "现在不能凭片段给任何人定罪。重要的是保留交接单并让多人一起核对。";
  if (is(/在哪|哪里|地点|地址|怎么去|见面|来找|书屋/))
    return tang ? "我在拾光书屋玻璃门外，雨还没停。别去偏僻的后门，我们在公开的失物登记处见。" :
      shen ? "我正去书屋值班区拿原始单据。你最好不要独自去封闭的仓库。" :
      he ? "我在地铁口附近，你可以把手机直接送来。" :
      "书屋的值班区有人在，先往公开登记处去，别进入封闭场所。";
  if (is(/下雨|天气|安全|害怕|危险|报警|警察|救命/))
    return tang ? "先把自己放在安全的地方！别因为手机冒险。你可以联系工作站或当地紧急服务，我们之后再核对。" :
      shen ? "安全比证据重要。如果有人受威胁，立刻向在场工作人员或警方求助，不要单独对峙。" :
      "不用急着替谁解决问题。先确认安全，资料和手机交给可信的工作人员保管就好。";
  if (is(/谢谢|感谢|辛苦|太好了/))
    return tang ? "谢谢你愿意帮忙。等这场雨过去，我请你来书屋喝一杯热可可。" :
      shen ? "不用客气。事情没弄清楚前，保留原始记录最重要。" :
      "别客气。今晚大家都不容易。";
  if (is(/晚安|再见|拜拜|88|睡了/))
    return tang ? "晚安。希望明早我就能见到予晴。" : "晚安，回去的路上注意安全。";
  if (is(/喜欢|爱|恋爱|女朋友|男朋友/))
    return tang ? "予晴老说我爱操心……不谈这个了，我现在更想知道她平安不平安。" :
      "现在大家都在担心予晴。等事情弄清楚了，再聊这些吧。";
  if (group) return [
    "徐言：我刚又对了一遍清单，原记录得保留。",
    "唐夏：先不要在群里猜人。有人找到予晴的手机了吗？",
    "沈之遥：票根 B-17、备忘录日期和交接单，三份信息需要对照。",
    "徐言：如果不知道下一步，先去看相册里的蓝色票根。",
  ][turn % 4];
  const answers = tang ? [
    "我还在等予晴。如果你拿着她的手机，能告诉我你看到什么了吗？",
    "她平常最宝贝那张蓝色票根。你可以先看相册，再来问我。",
    "今晚的事不能只听一个人说。至少要有交接单和第二个人一起核对。",
  ] : shen ? [
    "先核对 B-17 原始交接单。记录和公告可能不一致。",
    "0917 是重要日期，予晴的备忘录里记录了她的核查顺序。",
    "我不想让任何人被冤枉，证据要看原件。",
  ] : he ? [
    "我认为没必要让更多人知道聊天内容。手机交给我就行。",
    "你到底想查什么？请直接告诉我。",
    "这些事情很复杂，最好不要自行处理。",
  ] : [
    "我刚看到消息。你再说说你想找的是哪条线索？",
    "票根 B-17 和原始清单可能有关联，你可以试着核对。",
    "我不知道全部真相，但请别单独冒险。",
  ];
  return answers[turn % answers.length];
}

/** Robust against legacy saves that stored messages as 'thread<TAB>text'. */
export function decodeChatEntry(entry: string) {
  const separator = entry.indexOf("\t");
  if (separator < 0) return null;
  const thread = entry.slice(0, separator);
  const rest = entry.slice(separator + 1);
  if (rest.startsWith("in\t")) return { thread, text: rest.slice(3), incoming: true };
  if (rest.startsWith("out\t")) return { thread, text: rest.slice(4), incoming: false };
  return { thread, text: rest, incoming: false };
}
export function buildChatExchange(thread: string, input: string, previous: string[]) {
  const body = input.replace(/[\t\r\n]/g, " ").trim().slice(0, 250);
  if (!body) return previous;
  const count = previous.filter(x => decodeChatEntry(x)?.thread === thread).length;
  const reply = characterReply(thread, body, count);
  return [...previous.slice(-94), `${thread}\tout\t${body}`, `${thread}\tin\t${reply}`];
}
