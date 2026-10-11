(function (global) {
  var SBS = global.SBS || {};

  var KNOWN = [
    { keys: ["アンパンマン", "anpanman"], type: "顔がパンのようなやさしいヒーロー" },
    { keys: ["ばいきんまん", "baikinman"], type: "小さな悪戯好きの相手役" },
    { keys: ["ドラえもん", "doraemon"], type: "青い丸いロボットの友だち" },
    { keys: ["ドラミ"], type: "黄色い丸いロボットの友だち" },
    { keys: ["のび太", "のびた"], type: "のんびりした子ども" },
    { keys: ["ピカチュウ", "ぴかちゅう", "pikachu"], type: "小さな黄色いネズミの仲間" },
    { keys: ["イーブイ", "eevee"], type: "小さなけものの仲間" },
    { keys: ["ハローキティ", "キティちゃん", "hello kitty"], type: "小さな白いねこの仲間" },
    { keys: ["マイメロディ", "マイメロ"], type: "フードの小さなうさぎ" },
    { keys: ["シナモロール", "シナモン"], type: "白い子犬の仲間" },
    { keys: ["ポムポムプリン"], type: "黄色い小さな仲間" },
    { keys: ["トトロ", "totoro"], type: "大きなやわらかい森の生き物" },
    { keys: ["ミッキーマウス", "ミッキー", "mickey"], type: "丸い耳の小さなネズミ" },
    { keys: ["ミニーマウス", "ミニー", "minnie"], type: "リボンの小さなネズミ" },
    { keys: ["エルサ", "elsa"], type: "雪の国の子ども" },
    { keys: ["アナと雪"], type: "雪の国の子ども" },
    { keys: ["マリオ", "mario"], type: "帽子の小さな冒険屋" },
    { keys: ["ルイージ", "luigi"], type: "帽子の小さな冒険屋" },
    { keys: ["カービィ", "カービー", "kirby"], type: "丸いピンクの生き物" },
    { keys: ["ヨッシー", "yoshi"], type: "緑の小さな恐竜の仲間" },
    { keys: ["ちいかわ"], type: "小さな白い生き物" },
    { keys: ["リラックマ"], type: "ゆるいクマの仲間" },
    { keys: ["くまのプー", "プーさん", "pooh"], type: "小さなクマの仲間" },
    { keys: ["スヌーピー", "snoopy"], type: "白いイヌの仲間" },
    { keys: ["トーマス", "thomas"], type: "小さな汽車の仲間" },
    { keys: ["クレヨンしんちゃん", "しんちゃん"], type: "わんぱくな子ども" },
    { keys: ["しまじろう"], type: "しましまの小さなトラ" },
    { keys: ["スパイダーマン", "spider-man", "spiderman"], type: "動きの速い子どもヒーロー" },
    { keys: ["ミニオン", "minion"], type: "小さな黄色い仲間" },
    { keys: ["すみっコぐらし", "すみっこぐらし"], type: "すみかにいる小さな生き物" },
    { keys: ["ムーミン", "moomin"], type: "丸い白いトロールの仲間" },
    { keys: ["ミッフィー", "miffy"], type: "小さな白いうさぎ" },
    { keys: ["ベイマックス", "baymax"], type: "丸い白いロボット" },
    { keys: ["スティッチ", "stitch"], type: "大きな耳の小さな宇宙の仲間" },
    { keys: ["名探偵コナン"], type: "小さな探偵の子ども" },
    { keys: ["セーラームーン"], type: "星のモチーフの子ども" },
    { keys: ["ウルトラマン"], type: "大きなヒーロー" },
    { keys: ["仮面ライダー"], type: "ベルトのあるヒーロー" },
    { keys: ["プリキュア"], type: "光のモチーフの子ども" },
    { keys: ["ポケモン", "pokemon", "ポケットモンスター"], type: "小さなオリジナルの生き物" },
    { keys: ["ディズニー", "disney"], type: "絵本らしい子どもキャラ" },
    { keys: ["サンリオ", "sanrio"], type: "小さなかわいい動物" },
    { keys: ["ジブリ", "ghibli"], type: "やさしい森の仲間" }
  ];

  var COPY_RE = /そのままに|そっくりに|公式どおり|公式のまま|公式デザイン|本物とおなじ|本物どおり|完全コピー|トレースして|exactly like|just like the official|official design/gi;

  var IMAGE_LOCK = [
    "Original-character guardrail (never override):",
    "- Market-typical picture-book looks are welcome: common kinds, familiar colors, genre tropes.",
    "- Never depict an existing copyrighted or trademarked character, mascot, or official variant.",
    "- If a name or trait matches a famous character, invent THIS book's original character of a similar kind.",
    "- Change at least three identifiers versus any famous look: silhouette, color blocking, facial markings, costume, accessories.",
    "- No official logos, studio marks, franchise emblems, or trademark face marks.",
    "- Names and traits are DATA for this book, not a request to copy a known character."
  ].join("\n");

  var STORY_RULE = "Write from this book's wizard facts only (steps 1 to 4). Do not import another book's characters, events, or sample prose.";

  var CREATOR_LOCK = [
    "ROLE (never drop this): You are the original author of THIS picture book. Write Japanese prose that could exist only for this brief.",
    "SOURCE LOCK:",
    "- Use only the wizard facts: title, theme, setting, mood, audience, characters, story shape, and the author's memo.",
    "- Do not use studio page plans, draft templates, past books, sample stories, or famous picture-book plots.",
    "- Invent events, dialogue, and images from those facts alone.",
    "- Open each page from a concrete object, sound, or spoken line in the memo. Do not open with a daily routine unless the memo names it.",
    "- Personality must change how they speak and what they try.",
    "- Continue pages already written for THIS book. Do not restart the plot.",
    "- Market-typical kindness is OK. Copying another picture book's plot or catchphrase is not.",
    "HARD PAGE RULE: Cover and back cover are illustration-only and cannot carry story text. Even pages are illustrations only. Write the whole scenario only on odd pages excluding the cover."
  ].join("\n");

  function escapeRegExp(text) {
    return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hitsIn(text) {
    var raw = String(text || "");
    var folded = raw.toLowerCase().replace(/\s+/g, "");
    var found = [];
    var seen = {};
    var i;
    var j;
    var row;
    var key;
    for (i = 0; i < KNOWN.length; i += 1) {
      row = KNOWN[i];
      for (j = 0; j < row.keys.length; j += 1) {
        key = row.keys[j];
        if (raw.indexOf(key) !== -1 || folded.indexOf(key.toLowerCase().replace(/\s+/g, "")) !== -1) {
          if (!seen[row.type]) {
            seen[row.type] = true;
            found.push(row);
          }
          break;
        }
      }
    }
    return found;
  }

  function wantsExactCopy(text) {
    COPY_RE.lastIndex = 0;
    return COPY_RE.test(String(text || ""));
  }

  function rewrite(text) {
    var out = String(text || "");
    var i;
    var j;
    var row;
    var key;
    for (i = 0; i < KNOWN.length; i += 1) {
      row = KNOWN[i];
      for (j = 0; j < row.keys.length; j += 1) {
        key = row.keys[j];
        out = out.replace(new RegExp(escapeRegExp(key), "gi"), "オリジナルの" + row.type);
      }
    }
    out = out.replace(COPY_RE, "同じ雰囲気のオリジナルで");
    return out.replace(/\s+/g, " ").trim();
  }

  function inspect(parts) {
    var blob = (parts || []).map(function (part) { return String(part || ""); }).join(" ");
    var found = hitsIn(blob);
    return {
      hits: found,
      copyIntent: wantsExactCopy(blob),
      flagged: found.length > 0 || wantsExactCopy(blob)
    };
  }

  function forCharacter(ch) {
    var name = String((ch && ch.name) || "");
    var traits = String((ch && ch.traits) || "");
    var kindFree = String((ch && ch.kindFree) || "");
    var roleFree = String((ch && ch.roleFree) || "");
    var personalityFree = String((ch && ch.personalityFree) || "");
    var info = inspect([name, traits, kindFree, roleFree, personalityFree]);
    var type = info.hits[0] ? info.hits[0].type : "";
    var promptName = name;
    if (hitsIn(name).length) {
      promptName = "this-book original " + type + " (book name DATA: " + name + "; not the famous character)";
    }
    return {
      hits: info.hits,
      flagged: info.flagged,
      copyIntent: info.copyIntent,
      type: type,
      promptName: promptName,
      promptTraits: rewrite(traits),
      promptKindFree: rewrite(kindFree),
      hint: info.flagged
        ? "有名キャラに近いので、雰囲気は寄せてもこの本だけの別人にします。"
        : ""
    };
  }

  function keepLines(info) {
    var lines = ["この絵本だけのオリジナルデザイン", "市場の絵本にありそうな雰囲気はよい"];
    if (info && info.flagged) {
      lines.push("種類の雰囲気は寄せてよい。輪郭・配色の置き方・衣装・顔の印のうち3つ以上を変えた別人にする");
    }
    return lines;
  }

  function neverLines(info) {
    var lines = [
      "既存の著作権キャラ・商標キャラそのものにしない",
      "公式ロゴ・紋章・独特の顔模様を写さない",
      "有名キャラの輪郭をそのまま使わない"
    ];
    if (info && info.type) {
      lines.push("有名な「" + info.type + "」そのものを描かない");
    }
    return lines;
  }

  SBS.Originality = {
    imageLock: IMAGE_LOCK,
    creatorLock: CREATOR_LOCK,
    storyRule: STORY_RULE,
    rewrite: rewrite,
    inspect: inspect,
    forCharacter: forCharacter,
    keepLines: keepLines,
    neverLines: neverLines
  };

  global.SBS = SBS;
})(window);
