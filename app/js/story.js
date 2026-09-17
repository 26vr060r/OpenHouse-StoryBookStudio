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
      theme: SBS.labelOf(SBS.PRESETS.themes, intent.theme.preset) || intent.theme.freeText || "たいせつなこと",
      setting: SBS.labelOf(SBS.PRESETS.settings, intent.setting.preset) || intent.setting.freeText || "まち",
      audience: intent.audience,
      structure: intent.structure,
      names: {
        hero: hero.name || "こども",
        friend: friend ? friend.name : ""
      }
    };
  }

  function p() {
    var parts = [];
    var i;
    for (i = 0; i < arguments.length; i += 1) parts.push(arguments[i]);
    return parts;
  }

  function friendClause(ctx, whenPresent, whenAbsent) {
    return ctx.names.friend ? whenPresent : whenAbsent;
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

  function paragraphsFor(beat, ctx) {
    var F = friendClause;
    switch (beat) {
      case "cover":
        return [p(S(ctx.title)), ctx.dedication ? p(S(ctx.dedication)) : p(S(""))];
      case "day":
      case "morning":
        return [p(N("hero"), S("は、"), R("朝","あさ"), S("の"), R("光","ひかり"), S("のなかにいました。"))];
      case "world":
      case "map":
        return [p(N("hero"), S("の"), R("舞台","ぶたい"), S("は、"), S(ctx.setting), S("です。"))];
      case "once":
        return [p(N("hero"), S("は、"), S("いちど"), R("歩","ある"), S("いてみました。"))];
      case "again":
        return [p(S("また"), N("hero"), S("は、"), R("歩","ある"), S("きました。"))];
      case "again2":
        return [p(S("そのつぎも、"), N("hero"), S("は"), R("歩","ある"), S("きました。"))];
      case "again3":
        return [p(S("なんどもくりかえすうちに、"), R("道","みち"), S("が"), R("見","み"), S("えてきました。"))];
      case "ask":
        return [p(N("hero"), S("は、"), S("「どうして？」と"), R("聞","き"), S("きました。"))];
      case "look":
        return [p(N("hero"), S("は、"), S(ctx.setting), S("をよく"), R("見","み"), S("ました。"))];
      case "notice":
        return [p(S("ところが、"), R("小さな","ちいさな"), R("困","こま"), S("りごとがおきました。"))];
      case "noon":
        return [p(R("昼","ひる"), S("になりました。"), N("hero"), S("の"), R("お腹","おなか"), S("がなりました。"))];
      case "play":
        return [p(N("hero"), S("は、"), R("遊","あそ"), S("びました。"), S("でも、まだ"), R("心","こころ"), S("はそわそわです。"))];
      case "evening":
        return [p(R("夕","ゆう"), R("方","がた"), S("の"), S(ctx.setting), S("は、"), R("色","いろ"), S("がかわります。"))];
      case "night":
        return [p(R("夜","よる"), S("です。"), N("hero"), S("は、"), R("星","ほし"), S("を"), R("見","み"), S("ました。"))];
      case "dream":
        return [p(N("hero"), S("は、"), R("夢","ゆめ"), S("のなかで"), S(ctx.theme), S("を"), R("思","おも"), S("いだしました。"))];
      case "learn":
        return [p(N("hero"), S("は、"), S(ctx.theme), S("が"), R("大事","だいじ"), S("だと"), R("気","き"), S("がつきました。"))];
      case "share":
        return [
          ctx.names.friend
            ? p(N("hero"), S("は、"), R("知","し"), S("ったことを"), N("friend"), S("に"), R("話","はな"), S("しました。"))
            : p(N("hero"), S("は、"), R("知","し"), S("ったことを"), R("声","こえ"), S("にだしました。"))
        ];
      case "spark":
        return [p(S("あるひ、"), N("hero"), S("のまえに、"), R("小さな","ちいさな"), S("できごとがおきました。"))];
      case "go":
      case "try":
        return [p(N("hero"), S("は、"), R("勇","ゆう"), R("気","き"), S("をだして"), R("出","で"), S("かけました。"))];
      case "fail":
        return [p(S("うまくいきません。"), N("hero"), S("は、"), R("足","あし"), S("を"), R("止","と"), S("めました。"))];
      case "think":
        return [p(N("hero"), S("は、"), R("深","ふか"), S("く"), R("息","いき"), S("をすいました。"))];
      case "path":
        return [p(R("道","みち"), S("はながいです。"), N("hero"), S("は、"), R("一歩","いっぽ"), S("ずつ"), R("進","すす"), S("みます。"))];
      case "meet":
        return [
          F(
            ctx,
            p(S("そこで、"), N("friend"), S("に"), R("会","あ"), S("いました。")),
            p(N("hero"), S("は、"), R("新しい","あたらしい"), R("風","かぜ"), S("に"), R("会","あ"), S("いました。"))
          )
        ];
      case "help":
      case "together":
        return [
          F(
            ctx,
            p(N("friend"), S("と"), N("hero"), S("は、"), R("手","て"), S("をたずさえました。")),
            p(N("hero"), S("は、"), R("自分","じぶん"), S("の"), R("力","ちから"), S("を"), R("信","しん"), S("じました。"))
          )
        ];
      case "hard":
      case "bond":
        return [p(S(ctx.setting), S("の"), R("風","かぜ"), S("がつよくなりました。"), N("hero"), S("は、"), R("心","こころ"), S("を"), R("重","かさ"), S("ねました。"))];
      case "crisis":
        return [p(S("いちばん"), R("困","こま"), S("ったとき、"), N("hero"), S("は"), S(ctx.theme), S("を"), R("思","おも"), S("いだしました。"))];
      case "win":
        return [p(N("hero"), S("は、"), R("小さな","ちいさな"), R("一歩","いっぽ"), S("をふみだしました。"))];
      case "home":
        return [p(N("hero"), S("は、"), R("帰","かえ"), S("りました。"), R("世界","せかい"), S("は、すこし"), R("優","やさ"), S("しく"), R("見","み"), S("えました。"))];
      case "coda":
        return [
          p(S(ctx.theme), S("は、"), N("hero"), S("の"), R("中","なか"), S("にいます。")),
          p(S("おしまい。"))
        ];
      default:
        return [p(N("hero"), S("は、"), R("歩","ある"), S("きつづけました。"))];
    }
  }

  function trimForAudience(paragraphs, audience) {
    if (audience === "age-2-3") return paragraphs.slice(0, 1);
    if (audience === "age-4-6") return paragraphs.slice(0, 2);
    return paragraphs;
  }

  SBS.Story = {
    build: function build(intent, bible) {
      var ctx = ctxFromIntent(intent);
      var beats = beatsFor(intent.structure);
      var spreads = beats.map(function (beat, index) {
        return {
          n: index + 1,
          role: beat === "cover" ? "cover" : beat === "coda" ? "coda" : "story",
          scene: beat,
          paragraphs: trimForAudience(paragraphsFor(beat, ctx), intent.audience)
        };
      });
      return {
        schemaVersion: 1,
        title: ctx.title,
        dedication: ctx.dedication,
        textDirection: intent.textDirection || "yoko",
        furigana: !!intent.furigana,
        intent: intent,
        bible: bible,
        spreads: spreads
      };
    },
    renderParagraph: function renderParagraph(host, tokens, names, useRuby) {
      host.textContent = "";
      (tokens || []).forEach(function (tok) {
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
    plainText: function plainText(paragraphs, names) {
      var lines = [];
      (paragraphs || []).forEach(function (tokens) {
        var s = "";
        (tokens || []).forEach(function (tok) {
          if (!tok) return;
          if (tok.n) s += (names && names[tok.n]) || "";
          else if (tok.k) s += tok.k;
          else s += tok.t || "";
        });
        if (s) lines.push(s);
      });
      return lines.join("\n");
    }
  };

  global.SBS = SBS;
})(window);
