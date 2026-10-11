(function (global) {
  var SBS = global.SBS || {};

  function R(k, r) {
    return { k: k, r: r };
  }
  function S(t) {
    return { t: t };
  }
  function N(key) {
    return { n: key };
  }

  function ctxFromIntent(intent) {
    var hero = { name: "こども", role: "hero", kind: "child" };
    var friend = null;
    var i;
    var list = intent.characters || [];
    for (i = 0; i < list.length; i += 1) {
      if (list[i].role === "hero") hero = list[i];
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i].role !== "hero") {
        friend = list[i];
        break;
      }
    }
    return {
      title: intent.title || "わたしの絵本",
      dedication: intent.dedication || "",
      theme: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.themes, intent.theme, intent.audience)) ||
        (intent.theme && intent.theme.freeText) || "たいせつなこと",
      setting: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.settings, intent.setting, intent.audience)) ||
        (intent.setting && intent.setting.freeText) || "まち",
      audience: intent.audience,
      furigana: !!intent.furigana,
      structure: SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" },
      names: {
        hero: hero.name || "こども",
        friend: friend ? friend.name : ""
      },
      hook: String(
        (intent.audience === "age-2-3" || intent.audience === "age-4-6") && intent.plotHookKana
          ? intent.plotHookKana
          : (intent.plotHook || "")
      ).replace(/\s+/g, " ").trim()
    };
  }

  function p() {
    var parts = [];
    var i;
    for (i = 0; i < arguments.length; i += 1) parts.push(arguments[i]);
    return parts;
  }

  function pickBeats(beats, count) {
    var list = beats || [];
    var want = count || list.length;
    var used = {};
    var out = [];
    var i;
    var idx;
    if (want <= 1) return list.slice(0, Math.max(0, want));
    if (want === list.length) return list.slice();
    for (i = 0; i < want; i += 1) {
      idx = Math.round(i * (list.length - 1) / (want - 1));
      if (want < list.length) {
        while (used[idx] && idx < list.length - 1) idx += 1;
        used[idx] = true;
      }
      out.push(list[idx]);
    }
    out[0] = list[0];
    out[out.length - 1] = list[list.length - 1];
    return out;
  }

  function beatsFor(structure) {
    var commonCover = "cover";
    var map = {
      kishotenketsu: ["cover", "day", "world", "spark", "go", "meet", "hard", "bond", "crisis", "win", "home", "coda"],
      adventure: ["cover", "day", "map", "spark", "go", "meet", "path", "bond", "crisis", "win", "home", "coda"],
      repeat: ["cover", "day", "once", "again", "again2", "again3", "help", "together", "crisis", "win", "home", "coda"],
      problem: ["cover", "day", "notice", "spark", "try", "fail", "think", "help", "crisis", "win", "home", "coda"],
      daily: ["cover", "morning", "world", "noon", "play", "meet", "evening", "bond", "night", "dream", "home", "coda"],
      explain: ["cover", "ask", "world", "look", "try", "meet", "learn", "share", "crisis", "win", "home", "coda"]
    };
    return map[structure] || map.kishotenketsu;
  }

  function ageKey(audience) {
    if (audience === "age-2-3" || audience === "age-4-6" || audience === "age-7-9" || audience === "age-10-12" || audience === "age-13-15" || audience === "with-adults") {
      return audience;
    }
    return "age-4-6";
  }

  function paragraphsFor(beat, ctx) {
    var a = ageKey(ctx.audience);
    var hasF = !!ctx.names.friend;
    if (beat === "cover") {
      return [p(S(ctx.title)), ctx.dedication ? p(S(ctx.dedication)) : p(S(""))];
    }
    var alias = {
      morning: "day",
      map: "world",
      try: "go",
      together: "help",
      bond: "hard"
    };
    var key = alias[beat] || beat;
    var bank = DRAFTS[a] || DRAFTS["age-4-6"];
    var raw;
    if (bank[key]) raw = bank[key](ctx, hasF);
    else if (DRAFTS["age-4-6"][key]) raw = DRAFTS["age-4-6"][key](ctx, hasF);
    else raw = bank.day(ctx, hasF);
    if (ctx.hook && key === "spark") {
      raw = [p(S(ctx.hook))].concat((raw || []).slice(1));
    }
    return applyScript(raw, ctx);
  }

  function applyScript(paragraphs, ctx) {
    var young = ctx.audience === "age-2-3" || ctx.audience === "age-4-6";
    if (ctx.furigana || !young) return paragraphs;
    return (paragraphs || []).map(function (tokens) {
      return (tokens || []).map(function (tok) {
        if (tok && tok.k) return { t: tok.r || tok.k };
        return tok;
      });
    });
  }

  var DRAFTS = {
    "age-2-3": {
      day: function (ctx) {
        return [
          p(R("朝","あさ"), S("だよ。おひさま。"), N("hero"), S("、おきて、にこっ。")),
          p(S(ctx.setting), S("へいくよ。きょうも、いい"), R("一日","いちにち"), S("。"))
        ];
      },
      world: function (ctx) {
        return [
          p(N("hero"), S("、てくてく。"), S(ctx.setting), S("の"), R("道","みち"), S("。")),
          p(S("おはよう。きょうも、いっしょ。ぽかぽか。"))
        ];
      },
      once: function () {
        return [p(N("hero"), S("、てくてく。"), R("歩","ある"), S("くよ。"))];
      },
      again: function () {
        return [p(S("また、てくてく。"), N("hero"), S("、"), R("歩","ある"), S("く。"))];
      },
      again2: function () {
        return [p(S("またまた、てくてく。"))];
      },
      again3: function () {
        return [p(S("てくてくてく。"), R("道","みち"), S("、みえた！"))];
      },
      ask: function () {
        return [p(N("hero"), S("、「なんで？」"))];
      },
      look: function (ctx) {
        return [p(N("hero"), S("、"), S(ctx.setting), S("をみた。わあ。"))];
      },
      notice: function () {
        return [p(S("あれ？"), R("困","こま"), S("った。"))];
      },
      noon: function () {
        return [p(R("昼","ひる"), S("。おなか、ぐう。"), N("hero"), S("、ぺこぺこ。"))];
      },
      play: function () {
        return [p(N("hero"), S("、あそんだ。わあい。ちょっと、へん。"))];
      },
      evening: function (ctx) {
        return [p(S(ctx.setting), S("、あかい。"), R("夕やけ","ゆうやけ"), S("だね。"))];
      },
      night: function () {
        return [p(R("星","ほし"), S("、きれい。"), N("hero"), S("、みた。"))];
      },
      dream: function (ctx) {
        return [p(N("hero"), S("の"), R("夢","ゆめ"), S("。"), S(ctx.theme), S("。"))];
      },
      learn: function (ctx) {
        return [p(S("ああ。"), S(ctx.theme), S("、"), R("大事","だいじ"), S("。"))];
      },
      share: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("、"), N("friend"), S("に、はなした。"))
            : p(N("hero"), S("、こえにだした。"))
        ];
      },
      spark: function () {
        return [
          p(R("空","そら"), S("が、ぐらっ。どん。")),
          p(N("hero"), S("、"), R("足","あし"), S("をとめた。あれ？"))
        ];
      },
      go: function () {
        return [
          p(N("hero"), S("、いくよ。どきどき。")),
          p(S("にげない。いっしょ。"))
        ];
      },
      fail: function () {
        return [
          p(S("つまずいた。てん。おかお、まっか。")),
          p(S("すう。はあ。だいじょうぶ。"))
        ];
      },
      think: function () {
        return [p(S("すう。はあ。"), N("hero"), S("、おちついた。"))];
      },
      path: function () {
        return [p(R("道","みち"), S("、ながい。いっぽ、いっぽ。"))];
      },
      meet: function (ctx, hasF) {
        return [
          hasF
            ? p(N("friend"), S("だ！やあ。"))
            : p(R("風","かぜ"), S("、こんにちは。"))
        ];
      },
      help: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("と"), N("friend"), S("、てをつないだ。"))
            : p(N("hero"), S("、ひとりでも、がんばる。"))
        ];
      },
      hard: function () {
        return [p(R("風","かぜ"), S("、ビュー。"), N("hero"), S("、がまん。"))];
      },
      crisis: function (ctx) {
        return [p(S("こまった。でも、"), S(ctx.theme), S("。だいじょうぶ。"))];
      },
      win: function () {
        return [p(S("できた！"), R("光","ひかり"), S("が、ふわ。にこっ。"))];
      },
      home: function () {
        return [
          p(N("hero"), S("、いつもの"), R("姿","すがた"), S("。"), R("空","そら"), S("が、あおい。")),
          p(S("てをつないで、いくよ。ぽかぽか。"))
        ];
      },
      coda: function (ctx) {
        return [
          p(S(ctx.theme), S("、ここにある。")),
          p(S("おしまい。"))
        ];
      }
    },
    "age-4-6": {
      day: function (ctx) {
        return [
          p(N("hero"), S("は、はれの"), R("朝日","あさひ"), S("をあびておきた。")),
          p(S(ctx.setting), S("へ"), R("行","い"), S("くしたくがはじまって、いつもの"), R("一日","いちにち"), S("がはじまる。"))
        ];
      },
      world: function (ctx) {
        return [
          p(N("hero"), S("が"), S(ctx.setting), S("へむかう"), R("道","みち"), S("なか、みじかなけしきがつつんでいる。")),
          p(S("あいさつをかわして、きょうもいっしょにすすむ。"))
        ];
      },
      once: function () {
        return [p(N("hero"), S("は、いちど"), R("歩","ある"), S("いてみた。てくてく、おもしろい。"))];
      },
      again: function () {
        return [p(S("また"), N("hero"), S("は、てくてく。おや、さっきより"), R("足","あし"), S("がかるい。"))];
      },
      again2: function () {
        return [p(S("そのつぎも、てくてく。"), N("hero"), S("は、くすっとわらった。"))];
      },
      again3: function () {
        return [p(S("なんどもあるくうちに、"), R("道","みち"), S("が、こんにちは、とひらいた。"))];
      },
      ask: function () {
        return [p(N("hero"), S("は、くびをかしげて、「どうして？」ときいた。"))];
      },
      look: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.setting), S("を、じーっとみた。わあ、みつかった。"))];
      },
      notice: function () {
        return [p(S("ところが、"), R("小","ちい"), S("さな"), R("困","こま"), S("りごと。あれれ？"))];
      },
      noon: function () {
        return [p(R("昼","ひる"), S("。"), N("hero"), S("のおなかが、ぐー。ちょっとはずかしい。"))];
      },
      play: function () {
        return [p(N("hero"), S("は、あそんだ。わあい、ととんだら、くつがにげた。"))];
      },
      evening: function (ctx) {
        return [p(R("夕方","ゆうがた"), S("の"), S(ctx.setting), S("は、"), R("色","いろ"), S("をきがえた。きれいだね。"))];
      },
      night: function () {
        return [p(R("夜","よる"), S("。"), N("hero"), S("は、"), R("星","ほし"), S("に"), R("手","て"), S("をふった。おやすみ、と"), R("星","ほし"), S("もまばたき。"))];
      },
      dream: function (ctx) {
        return [p(N("hero"), S("は、"), R("夢","ゆめ"), S("のなかで"), S(ctx.theme), S("を、ぽん、と"), R("思","おも"), S("いだした。"))];
      },
      learn: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.theme), S("が"), R("大事","だいじ"), S("だと、はっ、と"), R("気","き"), S("がついた。"))];
      },
      share: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("は、わかったことを"), N("friend"), S("に、ちょっととくいげに"), R("話","はな"), S("した。"))
            : p(N("hero"), S("は、わかったことを、"), R("空","そら"), S("にむかってはなした。"))
        ];
      },
      spark: function () {
        return [
          p(S("こうさてんの"), R("空","そら"), S("が、きゅうにくらくなる。「ガシャン！」"), R("大","おお"), S("きな"), R("音","おと"), S("。")),
          p(N("hero"), S("は"), R("足","あし"), S("を"), R("止","と"), S("めて"), R("見","み"), S("た。こまりごとが、そこにいた。"))
        ];
      },
      go: function () {
        return [
          p(N("hero"), S("はゆうきを"), R("出","だ"), S("して、げんばへかけよった。まだ"), R("心","こころ"), S("はどきどき。")),
          p(S("「にげよう」ってきこえても、「にげても、だめ」と"), R("足","あし"), S("をすすめた。"))
        ];
      },
      fail: function () {
        return [
          p(S("かっこよくよけるつもりが、"), R("石","いし"), S("につまずいてころんだ。おかおがまっか。")),
          p(S("「すう、はあ。」あせるほど"), R("足","あし"), S("がもつれる。だいじょうぶ、もう"), R("一回","いっかい"), S("。"))
        ];
      },
      think: function () {
        return [p(N("hero"), S("は、すう、はあ。つめたいくうきがむねにとどいて、イライラがきえた。"))];
      },
      path: function () {
        return [p(R("道","みち"), S("はながい。"), N("hero"), S("は、いっぽずつ。かたほうのくつが、さきにいきたいらしい。"))];
      },
      meet: function (ctx, hasF) {
        return [
          hasF
            ? p(S("そこで、"), N("friend"), S("に"), R("会","あ"), S("った。「やっと！」と、ふたりでへんなかお。"))
            : p(N("hero"), S("は、あたらしい"), R("風","かぜ"), S("に"), R("会","あ"), S("った。"), R("風","かぜ"), S("も、はじめまして、とふいた。"))
        ];
      },
      help: function (ctx, hasF) {
        return [
          hasF
            ? p(N("friend"), S("と"), N("hero"), S("は、"), R("手","て"), S("をつないだ。あったかくて、ちょっとくすぐったい。"))
            : p(N("hero"), S("は、じぶんの"), R("力","ちから"), S("を、そっとしんじてみた。"))
        ];
      },
      hard: function (ctx) {
        return [p(S(ctx.setting), S("の"), R("風","かぜ"), S("がつよくなった。"), N("hero"), S("は、かみをふきとばされながら、"), R("心","こころ"), S("をかさねた。"))];
      },
      crisis: function (ctx) {
        return [p(S("いちばんこまったとき、"), N("hero"), S("は「"), S(ctx.theme), S("」を"), R("思","おも"), S("いだした。むねが、ほっとあたたかい。"))];
      },
      win: function () {
        return [p(N("hero"), S("は、"), R("小","ちい"), S("さな"), R("一歩","いっぽ"), S("をふんだ。しっぱいのあとの"), R("一歩","いっぽ"), S("は、なんだかほこらしい。"), R("光","ひかり"), S("がふわっとひろがる。"))];
      },
      home: function () {
        return [
          p(N("hero"), S("は、いつもの"), R("姿","すがた"), S("にもどって、"), R("空","そら"), S("を"), R("見","み"), S("た。せかいは、すこしやさしくみえた。")),
          p(R("手","て"), S("をつないで、いつもの"), R("道","みち"), S("へ。"))
        ];
      },
      coda: function (ctx) {
        return [
          p(S(ctx.theme), S("は、"), N("hero"), S("の"), R("中","なか"), S("に、あたたかくのこった。")),
          p(S("おしまい。"))
        ];
      }
    },
    "age-7-9": {
      day: function (ctx) {
        return [
          p(N("hero"), S("は、はれわたる"), R("空","そら"), S("の"), R("朝日","あさひ"), S("をあびて、おきた。")),
          p(S(ctx.setting), S("へいくしたくがはじまって、いつもの"), R("一日","いちにち"), S("がはじまる。"))
        ];
      },
      world: function (ctx) {
        return [
          p(N("hero"), S("が"), S(ctx.setting), S("へむかう"), R("道","みち"), S("のとちゅう、みじかなけしきが"), R("二人","ふたり"), S("をつつんでいる。")),
          p(S("あいさつをかわしながら、きょうもいっしょにすすむ。"))
        ];
      },
      once: function () {
        return [
          p(N("hero"), S("は、いちど"), R("歩","ある"), S("いてみた。")),
          p(R("足","あし"), S("はまだおそるおそるなのに、"), R("心","こころ"), S("だけが"), R("先","さき"), S("に"), R("走","はし"), S("っていた。"))
        ];
      },
      again: function () {
        return [p(S("また"), N("hero"), S("は"), R("歩","ある"), S("いた。"), R("同","おな"), S("じ"), R("道","みち"), S("なのに、"), R("石","いし"), S("ころの"), R("顔","かお"), S("がちょっとかわって"), R("見","み"), S("えた。"))];
      },
      again2: function () {
        return [p(S("そのつぎも"), R("歩","ある"), S("いた。くりかえすたびに、しっぱいがジョークみたいにかるくなった。"))];
      },
      again3: function () {
        return [p(S("なんどもくりかえすうちに、"), R("道","みち"), S("がひらけた。ああ、そういうことか、と"), N("hero"), S("はうなずいた。"))];
      },
      ask: function () {
        return [p(N("hero"), S("は、ほんとうのことがしりたくて、「どうして？」と"), R("聞","き"), S("いた。"), R("声","こえ"), S("は"), R("小","ちい"), S("さかったけれど、はっきりしていた。"))];
      },
      look: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.setting), S("をよく"), R("見","み"), S("た。"), R("見","み"), S("なれたものほど、なぞがかくれている。"))];
      },
      notice: function () {
        return [p(S("ところが、"), R("小","ちい"), S("さなこまりごとが、ひょいと"), R("顔","かお"), S("を"), R("出","だ"), S("した。こわいというより、しつれいだな、と"), R("思","おも"), S("った。"))];
      },
      noon: function () {
        return [p(R("昼","ひる"), S("になった。"), N("hero"), S("のおなかが、かいぎのように"), R("鳴","な"), S("った。いまはそれどころじゃない、のに。"))];
      },
      play: function () {
        return [p(N("hero"), S("はあそんだ。たのしいのに、どこかそわそわして、わらい"), R("方","かた"), S("がひとつ"), R("多","おお"), S("かった。"))];
      },
      evening: function (ctx) {
        return [p(R("夕方","ゆうがた"), S("の"), S(ctx.setting), S("は、"), R("色","いろ"), S("をかえて、きょうのしゅくだいを"), R("思","おも"), S("い"), R("出","だ"), S("させた。"))];
      },
      night: function () {
        return [p(R("夜","よる"), S("。"), N("hero"), S("は"), R("星","ほし"), S("を"), R("見","み"), S("た。"), R("星","ほし"), S("は"), R("何","なに"), S("も"), R("言","い"), S("わないのに、こたえをいそがさないでくれた。"))];
      },
      dream: function (ctx) {
        return [p(N("hero"), S("はゆめのなかで"), S(ctx.theme), S("を"), R("思","おも"), S("い"), R("出","だ"), S("した。わすれかけていた"), R("言","こと"), S("ばが、ポケットからおちてきたみたいだった。"))];
      },
      learn: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.theme), S("が"), R("大","だい"), S("じだと"), R("気","き"), S("がついた。わかったしゅんかん、かたの"), R("力","ちから"), S("がぬけて、おかしくなった。"))];
      },
      share: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("は、わかったことを"), N("friend"), S("に"), R("話","はな"), S("した。うまく"), R("言","い"), S("えないところは、ふたりでわらってうめた。"))
            : p(N("hero"), S("は、わかったことを"), R("声","こえ"), S("に"), R("出","だ"), S("した。だれにもきこえないのに、ちゃんととどいた"), R("気","き"), S("がした。"))
        ];
      },
      spark: function () {
        return [
          p(N("hero"), S("がこうさてんにさしかかると、"), R("空","そら"), S("がきゅうにくらくなった。「キキッ！　ガシャーン！」"), R("大","おお"), S("きな"), R("音","おと"), S("。")),
          p(N("hero"), S("は"), R("足","あし"), S("を"), R("止","と"), S("めて"), R("見","み"), S("た。こまりごとがあらわれて、いつもの"), R("一日","いちにち"), S("が"), R("止","と"), S("まった。"))
        ];
      },
      go: function () {
        return [
          p(N("hero"), S("はゆうきを"), R("出","だ"), S("してげんばにかけよった。まだ"), R("心","こころ"), S("はドキドキしている。")),
          p(S("「たいへん、にげなきゃ！」ときこえても、「にげてもかいけつしない。いっしょに"), R("行","い"), S("く」と"), R("足","あし"), S("をすすめた。"))
        ];
      },
      fail: function () {
        return [
          p(S("かっこよくよけるつもりが、"), R("道","みち"), S("の"), R("石","いし"), S("につまずいて、はでにころんだ。")),
          p(R("顔","かお"), S("がまっ"), R("赤","あか"), S("になる。あせるほど"), R("足","あし"), S("がもつれる。「すぅ、はぁ。」つめたいくうきがむねにとどくと、イライラがきえていった。"))
        ];
      },
      think: function () {
        return [p(N("hero"), S("はふかくいきをした。あせりをいったんしまって、もういちどあいてを"), R("見","み"), S("た。"))];
      },
      path: function () {
        return [p(R("道","みち"), S("は"), R("長","なが"), S("い。"), N("hero"), S("は"), R("一歩","いっぽ"), S("ずつすすむ。いそぐほど、"), R("石","いし"), S("につまずくてんさいだった。"))];
      },
      meet: function (ctx, hasF) {
        return [
          hasF
            ? p(S("そこで"), N("friend"), S("に"), R("会","あ"), S("った。「"), R("来","き"), S("たの、いま？」と"), R("聞","き"), S("いて、ふたりで"), R("同時","どうじ"), S("にへんな"), R("声","こえ"), S("を"), R("出","だ"), S("した。"))
            : p(N("hero"), S("は、"), R("新","あたら"), S("しい"), R("風","かぜ"), S("に"), R("会","あ"), S("った。"), R("風","かぜ"), S("は"), R("名","な"), S("まえを"), R("言","い"), S("わないのに、みかたくさい。"))
        ];
      },
      help: function (ctx, hasF) {
        return [
          hasF
            ? p(N("friend"), S("と"), N("hero"), S("は"), R("手","て"), S("をかさねた。"), R("力","ちから"), S("を"), R("合","あ"), S("わせると、しっぱいまでわけまえになった。"))
            : p(N("hero"), S("は、じぶんの"), R("力","ちから"), S("をしんじた。ひとり"), R("分","ぶん"), S("でも、ちゃんと"), R("一","いち"), S("ひょうだ。"))
        ];
      },
      hard: function (ctx) {
        return [p(S(ctx.setting), S("の"), R("風","かぜ"), S("が"), R("強","つよ"), S("くなった。"), N("hero"), S("は"), R("心","こころ"), S("をかさねて、ふきとばされないようにわらった。"))];
      },
      crisis: function (ctx) {
        return [
          p(S("いちばんこまったとき、"), N("hero"), S("は「"), S(ctx.theme), S("」を"), R("思","おも"), S("い"), R("出","だ"), S("した。")),
          p(S("おこりにまかせていたときとはちがい、あいてのうごきがよく"), R("見","み"), S("えた。"))
        ];
      },
      win: function () {
        return [
          p(N("hero"), S("は"), R("小","ちい"), S("さな"), R("一歩","いっぽ"), S("をふみだした。"), R("光","ひかり"), S("がひろがり、こまりごとはおだやかになっていく。")),
          p(S("かちせんげんより、たてたことが"), R("先","さき"), S("にうれしかった。"))
        ];
      },
      home: function () {
        return [
          p(N("hero"), S("はいつものすがたにもどり、おだやかな"), R("道","みち"), S("へ"), R("帰","かえ"), S("った。せかいは、すこしやさしく"), R("見","み"), S("えた。")),
          p(R("青空","あおぞら"), S("を"), R("見","み"), S("あげて、"), R("手","て"), S("をつなぎ、いつものばしょへむかった。"))
        ];
      },
      coda: function (ctx) {
        return [
          p(S("「"), S(ctx.theme), S("」は、"), N("hero"), S("の"), R("心","こころ"), S("の"), R("中","なか"), S("にのこった。")),
          p(S("おしまい。"))
        ];
      }
    },
    "age-10-12": {
      day: function (ctx) {
        return [
          p(N("hero"), S("は、晴れわたる"), R("空","そら"), S("の"), R("朝日","あさひ"), S("を浴びて"), R("起","お"), S("きた。")),
          p(S(ctx.setting), S("へ向かう身じたくが始まって、いつもの"), R("一日","いちにち"), S("が始まる。"))
        ];
      },
      world: function (ctx) {
        return [
          p(N("hero"), S("が"), S(ctx.setting), S("へ向かう"), R("道","みち"), S("のとちゅう、身近な景色が"), R("二人","ふたり"), S("をつつんでいる。")),
          p(S("あいさつをかわしながら、今日もいっしょに進む。"))
        ];
      },
      once: function () {
        return [
          p(N("hero"), S("は、一度"), R("歩","ある"), S("いてみた。")),
          p(R("足","あし"), S("はまだおそるおそるなのに、"), R("心","こころ"), S("だけが先に走っていた。"))
        ];
      },
      again: function () {
        return [p(S("また"), N("hero"), S("は歩いた。同じ道なのに、石ころの顔がちょっと変わって見えた。"))];
      },
      again2: function () {
        return [p(S("その次も歩いた。くり返すたびに、失敗がジョークみたいに軽くなった。"))];
      },
      again3: function () {
        return [p(S("何度もくり返すうちに、道が開けた。ああ、そういうことか、と"), N("hero"), S("はうなずいた。"))];
      },
      ask: function () {
        return [p(N("hero"), S("は、本当のことが知りたくて、「どうして？」と聞いた。声は小さかったけれど、はっきりしていた。"))];
      },
      look: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.setting), S("をよく見た。見慣れたものほど、なぞが隠れている。"))];
      },
      notice: function () {
        return [p(S("ところが、小さな困りごとが、ひょいと顔を出した。こわいというより、失礼だな、と思った。"))];
      },
      noon: function () {
        return [p(R("昼","ひる"), S("になった。"), N("hero"), S("の空腹が、会議のように鳴った。いまはそれどころじゃない、のに。"))];
      },
      play: function () {
        return [p(N("hero"), S("は遊んだ。楽しいのに、どこかそわそわして、笑い方がひとつ多かった。"))];
      },
      evening: function (ctx) {
        return [p(R("夕方","ゆうがた"), S("の"), S(ctx.setting), S("は、色を変えて、今日の宿題を思い出させた。"))];
      },
      night: function () {
        return [p(R("夜","よる"), S("。"), N("hero"), S("は星を見た。星は何も言わないのに、答えを急かさないでくれた。"))];
      },
      dream: function (ctx) {
        return [p(N("hero"), S("は夢のなかで"), S(ctx.theme), S("を思い出した。忘れかけていた言葉が、ポケットから落ちてきたみたいだった。"))];
      },
      learn: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.theme), S("が大事だと気がついた。わかったとき、肩の力が抜けて、おかしくなった。"))];
      },
      share: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("は、わかったことを"), N("friend"), S("に話した。うまく言えないところは、ふたりで笑って埋めた。"))
            : p(N("hero"), S("は、わかったことを声に出した。誰にも聞こえないのに、ちゃんと届いた気がした。"))
        ];
      },
      spark: function () {
        return [
          p(N("hero"), S("が交差点にさしかかると、空が急に暗くなった。「キキッ！　ガシャーン！」大きな音。")),
          p(N("hero"), S("は足を止めて見た。困りごとが現れて、いつもの一日が止まった。"))
        ];
      },
      go: function () {
        return [
          p(N("hero"), S("は勇気を出して現場にかけ寄った。まだ心はドキドキしている。")),
          p(S("「大変、逃げなきゃ！」と聞こえても、「逃げても解決しない。いっしょに行く」と足を進めた。"))
        ];
      },
      fail: function () {
        return [
          p(S("かっこよくよけるつもりが、道の石につまずいて、はでに転んだ。")),
          p(S("顔が真っ赤になる。あせるほど足がもつれる。「すぅ、はぁ。」冷たい空気が胸に届くと、イライラが消えていった。"))
        ];
      },
      think: function () {
        return [p(N("hero"), S("は深く息をした。あせりをいったんしまって、もう一度相手を見た。"))];
      },
      path: function () {
        return [p(R("道","みち"), S("は長い。"), N("hero"), S("は一歩ずつ進む。急ぐほど、石につまずく天才だった。"))];
      },
      meet: function (ctx, hasF) {
        return [
          hasF
            ? p(S("そこで"), N("friend"), S("に会った。「来たの、いま？」と聞いて、ふたりで同時に変な声を出した。"))
            : p(N("hero"), S("は、新しい風に会った。風は名前を言わないのに、味方くさい。"))
        ];
      },
      help: function (ctx, hasF) {
        return [
          hasF
            ? p(N("friend"), S("と"), N("hero"), S("は手を重ねた。力を合わせると、失敗まで分け前になった。"))
            : p(N("hero"), S("は、自分の力を信じた。ひとり分でも、ちゃんと一票だ。"))
        ];
      },
      hard: function (ctx) {
        return [p(S(ctx.setting), S("の風が強くなった。"), N("hero"), S("は心を重ねて、吹き飛ばされないように笑った。"))];
      },
      crisis: function (ctx) {
        return [
          p(S("いちばん困ったとき、"), N("hero"), S("は「"), S(ctx.theme), S("」を思い出した。")),
          p(S("おこりに任せていたときとは違い、相手の動きがよく見えた。"))
        ];
      },
      win: function () {
        return [
          p(N("hero"), S("は小さな一歩をふみ出した。光が広がり、困りごとはおだやかになっていく。")),
          p(S("勝ちの言葉より、立て直したことが先にうれしかった。"))
        ];
      },
      home: function () {
        return [
          p(N("hero"), S("はいつもの姿にもどり、おだやかな道へ帰った。世界は、すこし優しく見えた。")),
          p(S("青空を見上げて、手をつなぎ、いつもの場所へ向かった。"))
        ];
      },
      coda: function (ctx) {
        return [
          p(S("「"), S(ctx.theme), S("」は、"), N("hero"), S("の心の中に残った。")),
          p(S("おしまい。"))
        ];
      }
    },
    "age-13-15": {
      day: function (ctx) {
        return [
          p(N("hero"), S("は、晴れ渡る空の朝日を浴びて起きた。まだ眠い。それでも、起きなければ一日が始まらない。")),
          p(S(ctx.setting), S("へ向かう身支度が始まり、いつもの一日が、用事の顔で待っている。"))
        ];
      },
      world: function (ctx) {
        return [
          p(N("hero"), S("が"), S(ctx.setting), S("へ向かう道中、見慣れた景色が二人をつつんでいる。")),
          p(S("あいさつは短い。知っている角ほど、今日の本題をかくすのが上手い。"))
        ];
      },
      once: function () {
        return [p(N("hero"), S("は一度、歩いてみた。正しさより先に、靴音が返事をした。"))];
      },
      again: function () {
        return [p(S("また"), N("hero"), S("は歩いた。同じ失敗を、二度目は少し上手に踏んだ。"))];
      },
      again2: function () {
        return [p(S("その次も歩いた。繰り返しは退屈ではなく、型の練習だった。"))];
      },
      again3: function () {
        return [p(S("何度も繰り返すうちに、道が見えた。答えは新しくなく、足元にあった。"))];
      },
      ask: function () {
        return [p(N("hero"), S("は「どうして？」と聞いた。子どもの問いのほうが、説明より鋭い。"))];
      },
      look: function (ctx) {
        return [p(N("hero"), S("は"), S(ctx.setting), S("をよく見た。観察は、急がない優しさだ。"))];
      },
      notice: function () {
        return [p(S("ところが、小さな困りごとが起きた。大事の前触れは、たいてい失礼な大きさで来る。"))];
      },
      noon: function () {
        return [p(R("昼","ひる"), S("になった。"), N("hero"), S("の空腹は正直で、物語より先に休憩を提案した。"))];
      },
      play: function () {
        return [p(N("hero"), S("は遊んだ。楽しさの隣に、まだ片づけていない気持ちが座っていた。"))];
      },
      evening: function (ctx) {
        return [p(R("夕方","ゆうがた"), S("の"), S(ctx.setting), S("は色を変えた。一日の区切りが、空にある。"))];
      },
      night: function () {
        return [p(R("夜","よる"), S("。"), N("hero"), S("は星を見た。沈黙のほうが、説教より親切だった。"))];
      },
      dream: function (ctx) {
        return [p(N("hero"), S("は夢のなかで"), S(ctx.theme), S("を思い出した。学びは、枕元にも届く。"))];
      },
      learn: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.theme), S("が大事だと気がついた。遅すぎず、早すぎず、ちょうどいい気づきだ。"))];
      },
      share: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("は、知ったことを"), N("friend"), S("に話した。共有すると、正しさが体温を持った。"))
            : p(N("hero"), S("は、知ったことを声にした。ひとりごとでも、約束は始まる。"))
        ];
      },
      spark: function () {
        return [
          p(N("hero"), S("が交差点に差し掛かると、空が急に暗くなった。「ガシャーン」は、事件と呼ぶには笑える規模だった。")),
          p(N("hero"), S("は足を止めて見た。見ない選択は、もう残っていなかった。"))
        ];
      },
      go: function () {
        return [
          p(N("hero"), S("は勇気を出して現場へ駆け寄った。まだ心はどきどきしている。かっこつけた勇気も、中身は同じだ。")),
          p(S("「逃げよう」は賢い。それでも「逃げても解決しない」が、先に足を動かした。"))
        ];
      },
      fail: function () {
        return [
          p(S("かっこよくよけるつもりが、石につまずいて転んだ。失敗は結末ではなく、あとからつけるメモだった。")),
          p(S("顔が熱い。すう、はあ。焦るほど足がもつれるのは、中学生でも同じだ。"))
        ];
      },
      think: function () {
        return [p(N("hero"), S("は深く息をした。急がないことは、サボりではなく技術だ。"))];
      },
      path: function () {
        return [p(R("道","みち"), S("は長い。"), N("hero"), S("は一歩ずつ進む。速さより、戻れる歩幅が大事だった。"))];
      },
      meet: function (ctx, hasF) {
        return [
          hasF
            ? p(S("そこで"), N("friend"), S("に会った。助けは、立派な言葉より先に、顔で来る。"))
            : p(N("hero"), S("は新しい風に会った。見知らぬ味方も、礼儀だけは確かだった。"))
        ];
      },
      help: function (ctx, hasF) {
        return [
          hasF
            ? p(N("friend"), S("と"), N("hero"), S("は手を重ねた。分担すると、責任まで軽くなる。"))
            : p(N("hero"), S("は自分の力を信じた。ひとりの努力も、立派な共同作業の一種だ。"))
        ];
      },
      hard: function (ctx) {
        return [p(S(ctx.setting), S("の風が強くなった。"), N("hero"), S("は心を重ねた。耐えることは、負け方の練習でもある。"))];
      },
      crisis: function (ctx) {
        return [
          p(S("いちばん困ったとき、"), N("hero"), S("は「"), S(ctx.theme), S("」を思い出した。大事な考えは、現場でいちばん役に立つ。")),
          p(S("怒りに任せていたときとは違い、相手の動きがよく見えた。"))
        ];
      },
      win: function () {
        return [
          p(N("hero"), S("は小さな一歩をふみ出した。光が広がり、困りごとは穏やかになっていく。")),
          p(S("勝利より、立て直した姿勢のほうが長持ちする。"))
        ];
      },
      home: function () {
        return [
          p(N("hero"), S("はいつもの姿にもどり、おだやかな道へ帰った。日常は、冒険のあとでこそ更新される。")),
          p(R("世界","せかい"), S("は、すこし優しく見えた。見る側が先に学んだからだ。"))
        ];
      },
      coda: function (ctx) {
        return [
          p(S(ctx.theme), S("は、"), N("hero"), S("の中に残った。忘れても、必要な夜に戻ってくる種類の学びだ。")),
          p(S("おしまい。"))
        ];
      }
    },
    "with-adults": {
      day: function (ctx) {
        return [
          p(N("hero"), S("は、晴れ渡る空の朝日を浴びながら起きた。大人の朝も、光の入り方は同じだ。")),
          p(S(ctx.setting), S("へ向かう身支度がはじまり、いつもの一日が、用事の顔で待っている。"))
        ];
      },
      world: function (ctx) {
        return [
          p(N("hero"), S("が"), S(ctx.setting), S("へ向かう道中、みじかな景色が二人をつつんでいる。")),
          p(S("あいさつは短い。見慣れた角ほど、今日のテーマをかくすのが上手い。"))
        ];
      },
      once: function () {
        return [p(N("hero"), S("は一度、歩いてみた。正しさより先に、靴音が返事をした。"))];
      },
      again: function () {
        return [p(S("また"), N("hero"), S("は歩いた。同じ失敗を、二度目は少し上手に踏んだ。"))];
      },
      again2: function () {
        return [p(S("そのつぎも歩いた。繰り返しは退屈ではなく、型の練習だった。"))];
      },
      again3: function () {
        return [p(S("何度も繰り返すうちに、道が見えた。答えは新しくなく、足元にあった。"))];
      },
      ask: function () {
        return [p(N("hero"), S("は「どうして？」と聞いた。子どもの問いのほうが、会議より鋭い。"))];
      },
      look: function (ctx) {
        return [p(N("hero"), S("は"), S(ctx.setting), S("をよく見た。観察は、急がない優しさだ。"))];
      },
      notice: function () {
        return [p(S("ところが、小さな困りごとが起きた。大事の前触れは、たいてい失礼な大きさで来る。"))];
      },
      noon: function () {
        return [p(R("昼","ひる"), S("になった。"), N("hero"), S("の空腹は正直で、物語より先に休憩を提案した。"))];
      },
      play: function () {
        return [p(N("hero"), S("は遊んだ。楽しさの隣に、まだ片づけていない気持ちが座っていた。"))];
      },
      evening: function (ctx) {
        return [p(R("夕方","ゆうがた"), S("の"), S(ctx.setting), S("は色を変えた。一日の区切りが、空にある。"))];
      },
      night: function () {
        return [p(R("夜","よる"), S("。"), N("hero"), S("は星を見た。沈黙のほうが、説教より親切だった。"))];
      },
      dream: function (ctx) {
        return [p(N("hero"), S("は夢のなかで"), S(ctx.theme), S("を思いだした。学びは、枕元にも届く。"))];
      },
      learn: function (ctx) {
        return [p(N("hero"), S("は、"), S(ctx.theme), S("が大事だと気がついた。遅すぎず、早すぎず、ちょうどいい気づきだ。"))];
      },
      share: function (ctx, hasF) {
        return [
          hasF
            ? p(N("hero"), S("は、知ったことを"), N("friend"), S("に話した。共有すると、正しさが体温を持った。"))
            : p(N("hero"), S("は、知ったことを声にした。ひとりごとでも、約束は始まる。"))
        ];
      },
      spark: function () {
        return [
          p(N("hero"), S("が交差点に差し掛かると、空が急に暗くなった。「ガシャーン」は、事件と呼ぶには笑える規模だった。")),
          p(N("hero"), S("は足を止めて見た。見ない選択は、もう残っていなかった。"))
        ];
      },
      go: function () {
        return [
          p(N("hero"), S("は勇気を出して現場へ駆け寄った。まだ心はどきどきしている。大人の勇気も、中身は同じだ。")),
          p(S("「逃げよう」は賢い。それでも「逃げても解決しない」が、先に足を動かした。"))
        ];
      },
      fail: function () {
        return [
          p(S("かっこよくよけるつもりが、石につまずいて転んだ。失敗は結末ではなく、あとからつけるメモだった。")),
          p(S("顔が熱い。すう、はあ。焦るほど足がもつれるのは、年齢を問わない。"))
        ];
      },
      think: function () {
        return [p(N("hero"), S("は深く息をした。急がないことは、怠けではなく技術だ。"))];
      },
      path: function () {
        return [p(R("道","みち"), S("は長い。"), N("hero"), S("は一歩ずつ進む。速さより、戻れる歩幅が大事だった。"))];
      },
      meet: function (ctx, hasF) {
        return [
          hasF
            ? p(S("そこで"), N("friend"), S("に会った。助けは、立派な言葉より先に、顔で来る。"))
            : p(N("hero"), S("は新しい風に会った。見知らぬ味方も、礼儀だけは確かだった。"))
        ];
      },
      help: function (ctx, hasF) {
        return [
          hasF
            ? p(N("friend"), S("と"), N("hero"), S("は手をたずさえた。分担すると、責任まで軽くなる。"))
            : p(N("hero"), S("は自分の力を信じた。孤独な努力も、立派な共同作業の一種だ。"))
        ];
      },
      hard: function (ctx) {
        return [p(S(ctx.setting), S("の風が強くなった。"), N("hero"), S("は心を重ねた。耐えることは、負け方の練習でもある。"))];
      },
      crisis: function (ctx) {
        return [
          p(S("いちばん困ったとき、"), N("hero"), S("は「"), S(ctx.theme), S("」を思いだした。大事な考えは、現場でいちばん役に立つ。")),
          p(S("怒りに任せていたときとは違い、相手の動きがよく見えた。"))
        ];
      },
      win: function () {
        return [
          p(N("hero"), S("は小さな一歩をふみだした。光がひろがり、困りごとは穏やかになっていく。")),
          p(S("勝利より、立て直した姿勢のほうが長持ちする。"))
        ];
      },
      home: function () {
        return [
          p(N("hero"), S("はいつもの姿にもどり、平穏な道へ帰った。日常は、冒険のあとでこそ更新される。")),
          p(R("世界","せかい"), S("は、すこし優しく見えた。見る側が先に学んだからだ。"))
        ];
      },
      coda: function (ctx) {
        return [
          p(S(ctx.theme), S("は、"), N("hero"), S("の中に残った。忘れても、必要な夜に戻ってくる種類の学びだ。")),
          p(S("おしまい。"))
        ];
      }
    }
  };

  function trimForAudience(paragraphs, audience) {
    if (audience === "age-2-3") return paragraphs.slice(0, 5);
    if (audience === "age-4-6") return paragraphs.slice(0, 8);
    return paragraphs;
  }

  function stripParenReadings(text) {
    return String(text || "").replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/g, "");
  }

  function expandPlainRubyTokens(tokens) {
    var out = [];
    (tokens || []).forEach(function (tok) {
      var text;
      var re;
      var last;
      var match;
      var mid;
      var tail;
      if (!tok) return;
      if (tok.n) {
        out.push(tok);
        return;
      }
      if (tok.k) {
        text = stripParenReadings(tok.k);
        if (text) out.push(tok.r ? { k: text, r: tok.r } : { t: text });
        return;
      }
      text = String(tok.t || "");
      re = /([一-龯々〆ヵヶ]+)[ \u3000]*[（(]([ぁ-ゖァ-ヶー]+)[）)]/g;
      last = 0;
      while ((match = re.exec(text))) {
        if (match.index > last) {
          mid = stripParenReadings(text.slice(last, match.index));
          if (mid) out.push({ t: mid });
        }
        out.push({ k: match[1], r: match[2] });
        last = match.index + match[0].length;
      }
      tail = stripParenReadings(text.slice(last));
      if (tail) out.push({ t: tail });
    });
    return out;
  }

  function readingMap(paragraphs) {
    var map = {};
    (paragraphs || []).forEach(function (tokens) {
      expandPlainRubyTokens(tokens).forEach(function (tok) {
        if (tok && tok.k && tok.r) map[tok.k] = tok.r;
      });
    });
    return map;
  }

  function bookReadingMap(book) {
    var map = {};
    ((book && book.spreads) || []).forEach(function (spread) {
      var part = readingMap(spread && spread.paragraphs);
      Object.keys(part).forEach(function (key) {
        map[key] = part[key];
      });
    });
    return map;
  }

  function escapeRegExp(text) {
    return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function injectReadings(text, map) {
    var keys = Object.keys(map || {}).filter(Boolean).sort(function (a, b) {
      return b.length - a.length;
    });
    var marked = [];
    var protectedText = String(text || "").replace(
      /([一-龯々〆ヵヶ]+)[ \u3000]*[（(][ぁ-ゖァ-ヶー]+[）)]/g,
      function (chunk) {
        marked.push(chunk);
        return "\u0000" + (marked.length - 1) + "\u0000";
      }
    );
    keys.forEach(function (key) {
      protectedText = protectedText.replace(new RegExp(escapeRegExp(key), "g"), key + "（" + map[key] + "）");
    });
    return protectedText.replace(/\u0000(\d+)\u0000/g, function (_, n) {
      return marked[Number(n)];
    });
  }

  function applyReadings(paragraphs, map) {
    return (paragraphs || []).map(function (tokens) {
      var out = [];
      expandPlainRubyTokens(tokens).forEach(function (tok) {
        if (!tok) return;
        if (tok.n) {
          out.push(tok);
          return;
        }
        if (tok.k) {
          out.push(tok.r || !(map && map[tok.k]) ? tok : { k: tok.k, r: map[tok.k] });
          return;
        }
        expandPlainRubyTokens([{ t: injectReadings(String(tok.t || ""), map) }]).forEach(function (piece) {
          if (piece) out.push(piece);
        });
      });
      return out;
    });
  }

  function unmarkedKanji(paragraphs) {
    var missing = [];
    (paragraphs || []).forEach(function (tokens) {
      expandPlainRubyTokens(tokens).forEach(function (tok) {
        var found;
        if (!tok) return;
        if (tok.k && !String(tok.r || "").trim()) missing.push(tok.k);
        if (tok.t) {
          found = String(tok.t).match(/[一-龯々〆ヵヶ]+/g);
          if (found) found.forEach(function (word) { missing.push(word); });
        }
      });
    });
    return missing;
  }

  function wantsRuby(book) {
    if (!book || !book.furigana) return false;
    var audience = book.intent && book.intent.audience;
    return audience !== "age-2-3" && audience !== "age-4-6";
  }

  function parsePlainLine(line) {
    var tokens = [];
    var re = /([一-龯々〆ヵヶ]+)[ \u3000]*[（(]([ぁ-ゖァ-ヶー]+)[）)]/g;
    var last = 0;
    var match;
    while ((match = re.exec(line))) {
      if (match.index > last) tokens.push({ t: line.slice(last, match.index) });
      tokens.push({ k: match[1], r: match[2] });
      last = match.index + match[0].length;
    }
    if (last < line.length) tokens.push({ t: line.slice(last) });
    return tokens.filter(function (tok) {
      return (tok.t && tok.t.length) || (tok.k && tok.k.length);
    });
  }

  function castOf(intent) {
    var list = (intent && intent.characters) || [];
    var hero = null;
    var partner = null;
    var enemy = null;
    var forms = [];
    list.forEach(function (ch) {
      var blob = (ch.name || "") + (ch.kindFree || "") + (ch.traits || "") + (ch.roleFree || "");
      if (ch.role === "enemy") enemy = enemy || ch;
      else if (/変身後/.test(blob)) forms.push(ch);
      else if (ch.role === "hero" && !hero) hero = ch;
      else if (!partner) partner = ch;
    });
    if (!hero && list[0]) hero = list[0];
    return { hero: hero, partner: partner, enemy: enemy, forms: forms, all: list };
  }

  function planWho(cast, keys) {
    var names = [];
    (keys || []).forEach(function (key) {
      if (key === "hero" && cast.hero) names.push(cast.hero.name);
      if (key === "partner" && cast.partner) names.push(cast.partner.name);
      if (key === "enemy" && cast.enemy) names.push(cast.enemy.name);
      if (key === "forms") {
        cast.forms.forEach(function (ch) { names.push(ch.name); });
      }
    });
    return names.filter(Boolean).join("、") || (cast.hero && cast.hero.name) || "";
  }

  var BENCH_24_AGE79 = {
    cover: [12, 28],
    ki: [55, 85],
    "ki-road": [50, 85],
    sho: [150, 200],
    "sho-run": [85, 130],
    "sho-act": [160, 220],
    "ten-fail": [190, 250],
    "ten-form": [180, 240],
    "ten-fight": [170, 230],
    "ten-sync": [70, 110],
    "ketsu-fight": [170, 230],
    ketsu: [140, 200]
  };
  var BENCH_SCALE = {
    "age-2-3": 0.675,
    "age-4-6": 1.05,
    "age-7-9": 1.5,
    "age-10-12": 1.65,
    "age-13-15": 1.725,
    "with-adults": 1.8
  };

  function benchLengths(age) {
    var scale = BENCH_SCALE[age] || 1.5;
    var cap = (SBS.LIMITS && SBS.LIMITS.pageText) || 600;
    var out = {};
    Object.keys(BENCH_24_AGE79).forEach(function (key) {
      var pair = BENCH_24_AGE79[key];
      var lo = Math.max(8, Math.round(pair[0] * scale));
      var hi = Math.min(cap, Math.round(pair[1] * scale));
      out[key] = lo + "-" + hi;
    });
    return out;
  }

  function defaultPlans(intent, count) {
    var cast = castOf(intent);
    var hasTransform = cast.forms.length > 0;
    var lens = benchLengths(ageKey(intent.audience));
    var interiorSlots = {
      5: ["ki", "sho", "ten-fail", "ten-form", "ketsu"],
      7: ["ki", "ki-road", "sho", "sho-act", "ten-fail", "ten-form", "ketsu"],
      9: ["ki", "ki-road", "sho", "sho-run", "sho-act", "ten-fail", "ten-form", "ketsu-fight", "ketsu"],
      11: ["ki", "ki-road", "sho", "sho-run", "sho-act", "ten-fail", "ten-form", "ten-fight", "ten-sync", "ketsu-fight", "ketsu"]
    };
    var legacySlots = {
      6: ["cover", "ki", "sho", "ten-fail", "ten-form", "ketsu"],
      8: ["cover", "ki", "ki-road", "sho", "sho-act", "ten-fail", "ten-form", "ketsu"],
      9: ["cover", "ki", "ki-road", "sho", "sho-act", "ten-fail", "ten-form", "ketsu-fight", "ketsu"],
      10: ["cover", "ki", "ki-road", "sho", "sho-run", "sho-act", "ten-fail", "ten-form", "ketsu-fight", "ketsu"],
      12: ["cover", "ki", "ki-road", "sho", "sho-run", "sho-act", "ten-fail", "ten-form", "ten-fight", "ten-sync", "ketsu-fight", "ketsu"]
    };
    var interior = count >= 7 && count % 2 === 1 ? count - 2 : 0;
    var keys;
    if (interiorSlots[interior]) {
      keys = ["cover"].concat(interiorSlots[interior]).concat(["back"]);
    } else if (legacySlots[count]) {
      keys = legacySlots[count];
    } else {
      keys = pickBeats(legacySlots[12], count);
    }
    var catalog = {
      cover: {
        summary: "【表紙】插絵のみ。物語の文章は載せない。",
        who: planWho(cast, ["hero", "partner"]),
        length: lens.cover
      },
      ki: {
        summary: "【起】",
        who: planWho(cast, ["hero", "partner"]),
        length: lens.ki
      },
      "ki-road": {
        summary: "【起】",
        who: planWho(cast, ["hero", "partner"]),
        length: lens["ki-road"]
      },
      sho: {
        summary: "【承】",
        who: planWho(cast, ["hero", "partner", "enemy"]),
        length: lens.sho
      },
      "sho-run": {
        summary: "【承】",
        who: planWho(cast, ["hero", "partner", "enemy"]),
        length: lens["sho-run"]
      },
      "sho-act": {
        summary: "【承】",
        who: planWho(cast, ["hero", "partner", "enemy"]),
        length: lens["sho-act"]
      },
      "ten-fail": {
        summary: "【転】",
        who: planWho(cast, ["hero", "partner"]),
        length: lens["ten-fail"]
      },
      "ten-form": {
        summary: "【転】",
        who: hasTransform ? planWho(cast, ["forms"]) : planWho(cast, ["hero", "partner"]),
        length: lens["ten-form"]
      },
      "ten-fight": {
        summary: "【転】",
        who: hasTransform ? planWho(cast, ["forms", "enemy"]) : planWho(cast, ["hero", "partner", "enemy"]),
        length: lens["ten-fight"]
      },
      "ten-sync": {
        summary: "【転】",
        who: hasTransform ? planWho(cast, ["forms", "enemy"]) : planWho(cast, ["hero", "partner", "enemy"]),
        length: lens["ten-sync"]
      },
      "ketsu-fight": {
        summary: "【結】",
        who: hasTransform ? planWho(cast, ["forms", "enemy"]) : planWho(cast, ["hero", "partner", "enemy"]),
        length: lens["ketsu-fight"]
      },
      ketsu: {
        summary: "【結】",
        who: planWho(cast, ["hero", "partner"]),
        length: lens.ketsu
      },
      back: {
        summary: "【裏表紙】插絵のみ。物語の文章は載せない。終わりは直前の奇数ページ。",
        who: planWho(cast, ["hero", "partner"]),
        length: "0-0"
      }
    };
    return keys.map(function (key, index) {
      var row = catalog[key] || catalog.ki;
      return {
        key: key,
        n: index + 1,
        summary: row.summary,
        who: row.who,
        length: row.length
      };
    });
  }

  function parseBounds(length) {
    var m = String(length || "").match(/(\d+)\s*-\s*(\d+)/);
    if (!m) return { lo: 0, hi: 0 };
    return { lo: parseInt(m[1], 10), hi: parseInt(m[2], 10) };
  }

  function mergeKanjiRuby(text) {
    return String(text || "").replace(
      /(?:[\u4e00-\u9fff々〆ヵヶ]+[ \u3000]*[（(][ぁ-ゖァ-ヶー]+[）)]){2,}/g,
      function (chunk) {
        var kanji = "";
        var yomi = "";
        var re = /([\u4e00-\u9fff々〆ヵヶ]+)[ \u3000]*[（(]([ぁ-ゖァ-ヶー]+)[）)]/g;
        var m;
        while ((m = re.exec(chunk))) {
          kanji += m[1];
          yomi += m[2];
        }
        return kanji + "（" + yomi + "）";
      }
    );
  }

  function stripFuriganaMarks(text) {
    return String(text || "").replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/g, "");
  }

  function countStoryChars(text) {
    return stripFuriganaMarks(text).replace(/\s+/g, "").length;
  }

  function countPlain(paragraphs, names) {
    var text = "";
    (paragraphs || []).forEach(function (tokens) {
      (tokens || []).forEach(function (tok) {
        if (!tok) return;
        if (tok.n) text += (names && names[tok.n]) || "";
        else if (tok.k) text += tok.k || "";
        else text += tok.t || "";
      });
    });
    return text.replace(/\s+/g, "").length;
  }

  function extraDraftLine(age, ctx, n) {
    var set = ctx.setting || "まち";
    var banks = {
      "age-2-3": [
        p(N("hero"), S("は、もういちどみた。にこっ。")),
        p(S(set), S("のくう。ひろい、ひろい。")),
        p(S("こえがした。てをつないだ。")),
        p(N("hero"), S("、「うん。」ぽん。")),
        p(S("あしもと、ぽくぽく。つづくよ。")),
        p(S("かぜがふいた。あったかい。"))
      ],
      "age-4-6": [
        p(N("hero"), S("は立ちどまって、もう一度あたりを見た。")),
        p(S(set), S("の音がして、風がほほをなでた。")),
        p(S("「だいじょうぶ？」とこえを出して、自分に言った。")),
        p(S("つまずいても、いち、に、と歩幅をもどす。")),
        p(S("なまえを呼ぶ声がして、ふりむいた。")),
        p(S("空の色が変わって、つぎのばしょが見えた。"))
      ],
      "age-7-9": [
        p(N("hero"), S("は一度立ち止まり、今の場面をはっきり目に焼きつけた。")),
        p(S(set), S("の空気が変わって、足元の音まで近く聞こえた。")),
        p(S("「まだ終わっていない」と小さく言って、次の一歩を選んだ。")),
        p(S("失敗のあとでも、手のひらの汗をふいてから顔を上げる。")),
        p(S("隣の気配をたしかめて、息を合わせて進んだ。")),
        p(S("テーマの言葉が胸に残って、歩く速さが少し落ち着いた。"))
      ],
      "age-10-12": [
        p(N("hero"), S("は立ち止まり、今の失敗がどこでずれたかを自分の言葉で確かめた。")),
        p(S(set), S("の景色は同じなのに、見る側の呼吸だけが変わっていた。")),
        p(S("「逃げても現場は残る」とつぶやいて、もう一度正面を向く。")),
        p(S("手が震えても、次の動作を小さく分けて進めた。")),
        p(S("隣の声を聞き逃さないように、一歩遅れて合わせた。")),
        p(S("解決の形は派手じゃなくてもよく、今の場所で足りるものを選んだ。"))
      ],
      "age-13-15": [
        p(N("hero"), S("はかっこつけた言葉を飲み込み、今の場に必要な一言だけを残した。")),
        p(S(set), S("のざわめきを聞きながら、自分の失敗を先に認めた。")),
        p(S("「まだ間に合う」は言い訳にも励ましにもなる、と気づく。")),
        p(S("視線を外さずに、次の動作を一段落させてから動いた。")),
        p(S("隣の間合いを測り、先に出す声の大きさを一段下げた。")),
        p(S("学びは残るが、今はこの場面を最後まで歩くことが先だった。"))
      ],
      "with-adults": [
        p(N("hero"), S("は立ち止まり、今の場面で何がずれていたかを静かに言い直した。")),
        p(S(set), S("の光が変わって、同じ道でも足元の意味が少し違って見えた。")),
        p(S("「間に合う」は結論ではなく、次の動作の名前だと思い直す。")),
        p(S("失敗の熱が残っていても、手の動きだけ先に戻した。")),
        p(S("隣の呼吸に合わせて、言葉を短くしてから進んだ。")),
        p(S("残る学びは後でよく、今はこの場を最後まで歩くことが仕事だった。"))
      ]
    };
    var list = banks[age] || banks["age-4-6"];
    return list[n % list.length];
  }

  function tokensToPlain(paragraphs, names) {
    var text = "";
    (paragraphs || []).forEach(function (tokens) {
      (tokens || []).forEach(function (tok) {
        if (!tok) return;
        if (tok.n) text += (names && names[tok.n]) || "";
        else if (tok.k) text += tok.k || "";
        else text += tok.t || "";
      });
    });
    return text.replace(/\s+/g, "");
  }

  function isStockProse(text, spread, intent) {
    var s = String(text || "").replace(/\s+/g, "");
    var head;
    var fp;
    var ctx;
    if (!s) return false;
    head = s.slice(0, 90);
    if (/朝日をあびて|はれの朝日|てくてく|あいさつをかわ|したくがはじま|むかう道なか|みじかなけしき|こうさてんの空|空がぐらっ|おきて、にこっ/.test(head)) {
      return true;
    }
    if (/もういちどみた。にこっ|一度立ち止まり、今の場面|逃げても現場は残る|かっこつけた言葉を飲み込み/.test(s)) {
      return true;
    }
    if (!spread || spread.role === "cover" || spread.role === "back") return false;
    ctx = ctxFromIntent(intent || {});
    fp = tokensToPlain(paragraphsFor(spread.scene || "day", ctx), ctx.names).slice(0, 28);
    return fp.length >= 28 && s.indexOf(fp) !== -1;
  }

  function fillDraftToPlan(book, ctx) {
    var age = ageKey(ctx && ctx.audience);
    var names = (ctx && ctx.names) || {};
    ((book && book.spreads) || []).forEach(function (spread) {
      var bounds;
      var n;
      if (!spread || spread.role === "cover") return;
      bounds = parseBounds(spread.plan && spread.plan.length);
      if (!bounds.lo) return;
      n = 0;
      while (countPlain(spread.paragraphs, names) < bounds.lo && n < 12) {
        spread.paragraphs = (spread.paragraphs || []).concat(
          applyScript([extraDraftLine(age, ctx, n)], ctx)
        );
        n += 1;
      }
    });
  }

  function attachPlans(book) {
    if (!book || !book.spreads) return book;
    var plans = defaultPlans(book.intent || {}, book.spreads.length);
    book.spreads.forEach(function (spread, i) {
      var next = plans[i] || plans[plans.length - 1];
      spread.plan = {
        key: next.key || (spread.plan && spread.plan.key) || "",
        n: spread.n || next.n,
        summary: next.summary,
        who: next.who,
        length: next.length
      };
    });
    return book;
  }

  SBS.Story = {
    build: function build(intent, bible) {
      var ctx = ctxFromIntent(intent);
      var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" };
      var pageCount = SBS.normalizePageCount
        ? SBS.normalizePageCount(intent.pageCount || (SBS.getPageCount && SBS.getPageCount()) || 12)
        : 12;
      var interiorCount = SBS.interiorSpreadCount ? SBS.interiorSpreadCount(pageCount) : Math.max(1, pageCount / 2 - 1);
      var storyPool = beatsFor(structurePick.preset).filter(function (beat) {
        return beat !== "cover";
      });
      var storyBeats = pickBeats(storyPool, interiorCount);
      var spreads = [{
        n: 1,
        role: "cover",
        scene: "cover",
        paragraphs: [p(S(ctx.title)), ctx.dedication ? p(S(ctx.dedication)) : p(S(""))]
      }].concat(storyBeats.map(function (beat, index) {
        return {
          n: index + 2,
          role: beat === "coda" ? "coda" : "story",
          scene: beat,
          paragraphs: []
        };
      })).concat([{
        n: storyBeats.length + 2,
        role: "back",
        scene: "back",
        paragraphs: []
      }]);
      var book = {
        schemaVersion: 1,
        title: ctx.title,
        dedication: ctx.dedication,
        textDirection: intent.textDirection || "yoko",
        furigana: !!intent.furigana,
        pageCount: pageCount,
        intent: intent,
        bible: bible,
        spreads: spreads
      };
      attachPlans(book);
      return book;
    },
    attachPlans: attachPlans,
    defaultPlans: defaultPlans,
    isStockProse: isStockProse,
    stripFuriganaMarks: stripFuriganaMarks,
    mergeKanjiRuby: mergeKanjiRuby,
    countStoryChars: countStoryChars,
    parseBounds: parseBounds,
    expandPlainRubyTokens: expandPlainRubyTokens,
    readingMap: readingMap,
    bookReadingMap: bookReadingMap,
    injectReadings: injectReadings,
    applyReadings: applyReadings,
    unmarkedKanji: unmarkedKanji,
    wantsRuby: wantsRuby,
    renderParagraph: function renderParagraph(host, tokens, names, useRuby) {
      host.textContent = "";
      expandPlainRubyTokens(tokens).forEach(function (tok) {
        if (!tok) return;
        if (tok.n) {
          host.appendChild(document.createTextNode(names[tok.n] || ""));
          return;
        }
        if (tok.k) {
          if (useRuby && tok.r) {
            var ruby = document.createElement("ruby");
            ruby.appendChild(document.createTextNode(tok.k));
            var rt = document.createElement("rt");
            rt.textContent = tok.r;
            ruby.appendChild(rt);
            host.appendChild(ruby);
          } else {
            host.appendChild(document.createTextNode(tok.k));
          }
          return;
        }
        host.appendChild(document.createTextNode(tok.t || ""));
      });
    },
    parsePlainLine: parsePlainLine,
    fromPlainText: function fromPlainText(text, maxLen) {
      var cap = maxLen || (SBS.LIMITS && SBS.LIMITS.pageText) || 600;
      var raw = mergeKanjiRuby(String(text || "").replace(/\s+$/, ""));
      if (countStoryChars(raw) > cap && raw.length > cap * 2) raw = raw.slice(0, cap * 2);
      var lines = raw.split(/\n+/).map(function (line) { return String(line || "").trim(); }).filter(Boolean);
      if (!lines.length && raw.trim()) lines = [raw.trim()];
      return lines.map(function (line) { return expandPlainRubyTokens(parsePlainLine(line)); });
    },
    plainText: function plainText(paragraphs, names, opts) {
      var withRuby = !opts || opts.ruby !== false;
      var lines = [];
      (paragraphs || []).forEach(function (tokens) {
        var s = "";
        (tokens || []).forEach(function (tok) {
          if (!tok) return;
          if (tok.n) s += (names && names[tok.n]) || "";
          else if (tok.k) s += (withRuby && tok.r) ? tok.k + "（" + tok.r + "）" : tok.k;
          else s += tok.t || "";
        });
        if (s) lines.push(s);
      });
      return lines.join("\n");
    }
  };

  global.SBS = SBS;
})(window);
