(function (global) {
  var SBS = global.SBS || {};
  var issued = {};

  var DIGRAPHS = {
    きゃ: "kya", きゅ: "kyu", きょ: "kyo",
    しゃ: "sha", しゅ: "shu", しょ: "sho",
    ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
    にゃ: "nya", にゅ: "nyu", にょ: "nyo",
    ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
    みゃ: "mya", みゅ: "myu", みょ: "myo",
    りゃ: "rya", りゅ: "ryu", りょ: "ryo",
    ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
    じゃ: "ja", じゅ: "ju", じょ: "jo",
    びゃ: "bya", びゅ: "byu", びょ: "byo",
    ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
    キャ: "kya", キュ: "kyu", キョ: "kyo",
    シャ: "sha", シュ: "shu", ショ: "sho",
    チャ: "cha", チュ: "chu", チョ: "cho",
    ニャ: "nya", ニュ: "nyu", ニョ: "nyo",
    ヒャ: "hya", ヒュ: "hyu", ヒョ: "hyo",
    ミャ: "mya", ミュ: "myu", ミョ: "myo",
    リャ: "rya", リュ: "ryu", リョ: "ryo",
    ギャ: "gya", ギュ: "gyu", ギョ: "gyo",
    ジャ: "ja", ジュ: "ju", ジョ: "jo",
    ビャ: "bya", ビュ: "byu", ビョ: "byo",
    ピャ: "pya", ピュ: "pyu", ピョ: "pyo"
  };

  var MONO = {
    あ: "a", い: "i", う: "u", え: "e", お: "o",
    か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
    さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
    た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
    な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
    は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
    ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
    や: "ya", ゆ: "yu", よ: "yo",
    ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
    わ: "wa", を: "o", ん: "n",
    が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
    ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
    だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
    ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
    ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
    ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
    ゃ: "ya", ゅ: "yu", ょ: "yo", ゎ: "wa",
    ア: "a", イ: "i", ウ: "u", エ: "e", オ: "o",
    カ: "ka", キ: "ki", ク: "ku", ケ: "ke", コ: "ko",
    サ: "sa", シ: "shi", ス: "su", セ: "se", ソ: "so",
    タ: "ta", チ: "chi", ツ: "tsu", テ: "te", ト: "to",
    ナ: "na", ニ: "ni", ヌ: "nu", ネ: "ne", ノ: "no",
    ハ: "ha", ヒ: "hi", フ: "fu", ヘ: "he", ホ: "ho",
    マ: "ma", ミ: "mi", ム: "mu", メ: "me", モ: "mo",
    ヤ: "ya", ユ: "yu", ヨ: "yo",
    ラ: "ra", リ: "ri", ル: "ru", レ: "re", ロ: "ro",
    ワ: "wa", ヲ: "o", ン: "n",
    ガ: "ga", ギ: "gi", グ: "gu", ゲ: "ge", ゴ: "go",
    ザ: "za", ジ: "ji", ズ: "zu", ゼ: "ze", ゾ: "zo",
    ダ: "da", ヂ: "ji", ヅ: "zu", デ: "de", ド: "do",
    バ: "ba", ビ: "bi", ブ: "bu", ベ: "be", ボ: "bo",
    パ: "pa", ピ: "pi", プ: "pu", ペ: "pe", ポ: "po",
    ァ: "a", ィ: "i", ゥ: "u", ェ: "e", ォ: "o",
    ャ: "ya", ュ: "yu", ョ: "yo", ヮ: "wa"
  };

  var SCENE_COPY = {
    cover: {
      direction: "Cover portrait. The hero is the focus, gentle and inviting, in the story world. No title lettering.",
      composition: "centered medium shot, generous sky, hero standing on the ground line"
    },
    day: {
      direction: "An ordinary morning. The hero is at home in this world, calm before anything happens.",
      composition: "wide establishing shot, hero readable but not filling the frame"
    },
    morning: {
      direction: "Morning light. The hero wakes or steps into the day.",
      composition: "interior or threshold, warm light from one side"
    },
    world: {
      direction: "Show the setting as a place the hero belongs to. Landmarks stay simple and child-safe.",
      composition: "establishing landscape with the hero in the lower third"
    },
    map: {
      direction: "A path, trail, or implied journey ahead. The hero looks toward it.",
      composition: "path leading into the distance, hero in the foreground"
    },
    once: {
      direction: "The hero takes a first small walk or try.",
      composition: "side view of walking, open space ahead"
    },
    again: {
      direction: "The same kind of action, repeated. Keep the world recognizable.",
      composition: "walking pose, slightly further along the same path"
    },
    again2: {
      direction: "Another repeat of the action. Tiny change in background only.",
      composition: "walking pose, familiar setting"
    },
    again3: {
      direction: "After many repeats, the path feels clearer.",
      composition: "hero pausing, looking at a clearer way forward"
    },
    ask: {
      direction: "The hero wonders why. Curious, not frightened.",
      composition: "close-medium, face readable, hands near chest"
    },
    look: {
      direction: "The hero looks closely at the setting.",
      composition: "over-shoulder toward a simple landmark"
    },
    notice: {
      direction: "A small, non-scary problem appears. Soft tension only.",
      composition: "hero noticing a small object or change in the foreground"
    },
    noon: {
      direction: "Midday. The hero is a little hungry or tired, still safe.",
      composition: "bright outdoor light, hero standing or sitting"
    },
    play: {
      direction: "Playful movement, still a little restless.",
      composition: "dynamic but gentle play pose"
    },
    evening: {
      direction: "Evening colors in the setting. Quiet change of light.",
      composition: "wide shot, warm low light, hero small"
    },
    night: {
      direction: "Night, gentle and safe. Stars or lamps, not darkness-as-threat.",
      composition: "hero looking up, large sky"
    },
    dream: {
      direction: "A soft dream of the theme. Same character design, slightly softer edges.",
      composition: "hero centered, simple dreamlike shapes, still on a ground line"
    },
    learn: {
      direction: "A quiet realization. The hero understands the theme.",
      composition: "medium shot, calm stance, open hands"
    },
    share: {
      direction: "The hero shares what they learned, with a friend if present.",
      composition: "two-shot if a friend exists, otherwise hero speaking to the world"
    },
    spark: {
      direction: "A small event starts the story. Surprise, not danger.",
      composition: "hero reaching or turning toward a small happening"
    },
    go: {
      direction: "The hero sets out, brave but small.",
      composition: "walking left to right, path ahead"
    },
    try: {
      direction: "The hero tries something new.",
      composition: "active pose, clear goal object nearby"
    },
    fail: {
      direction: "It does not work yet. Sad or stuck, never injured.",
      composition: "sitting or halted, head a little down"
    },
    think: {
      direction: "A pause to breathe and think.",
      composition: "quiet sitting or standing still"
    },
    path: {
      direction: "A long path. One step at a time.",
      composition: "deep path, hero mid-stride"
    },
    meet: {
      direction: "A meeting. If there is a friend, show them clearly in lock colors.",
      composition: "two figures facing, equal ground, readable faces"
    },
    help: {
      direction: "Help and togetherness. Hands or closeness, not crowding.",
      composition: "side-by-side or reaching toward the same thing"
    },
    together: {
      direction: "Acting together. Same outfits as the lock.",
      composition: "two-shot moving in the same direction"
    },
    hard: {
      direction: "Wind or weather gets stronger. Challenge, not disaster.",
      composition: "leaning into wind, setting still recognizable"
    },
    bond: {
      direction: "Hearts together. Soft closeness.",
      composition: "close two-shot or hero with hands on chest"
    },
    crisis: {
      direction: "The hardest moment, still age-safe. The hero remembers the theme.",
      composition: "low crouch or pause, theme object or sky as comfort"
    },
    win: {
      direction: "A small step forward. Joy, not triumph-over-enemies.",
      composition: "cheer or step onto the path, open body"
    },
    home: {
      direction: "Return. The world looks a little kinder.",
      composition: "home or familiar setting, hero waving or arriving"
    },
    coda: {
      direction: "Quiet ending. The theme lives with the hero. Soft farewell.",
      composition: "calm full-body, lots of sky, gentle wave"
    }
  };

  var GRADE12_KANJI = "一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男中虫町天田土二日入年白八百文木本名目立力林六引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東童道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話";

  var SENTENCE_RULES = {
    "age-2-3": "Very short spoken Japanese. Repeat simple words. One 擬音 is OK. Follow THIS PAGE's target length. For a 24-page book, opening pages stay tiny, turning pages a little longer. Never stop mid-sentence. SCRIPT: Write the body in ひらがな only. Katakana is OK for names and 擬音. Do not use 漢字, even if the brief or PAGE_PLAN uses 漢字 — rewrite those words in ひらがな. Character names stay as given.",
    "age-4-6": "Simple spoken Japanese. Short dialogue and 擬音. Follow THIS PAGE's target length. For a 24-page kishotenketsu book, opening ~50-80, turning ~90-160. Do not pad. SCRIPT: Write the body in ひらがな only. Katakana is OK for names and 擬音. Do not use 漢字, even if the brief or PAGE_PLAN uses 漢字 — rewrite those words in ひらがな. Character names stay as given.",
    "age-7-9": "Spoken Japanese for 7-9. Scene + 擬音 + dialogue + a small fail, then recovery. Follow THIS PAGE's target length. 24-page kishotenketsu benchmark: opening 50-85, incident 150-200, fail/turn 180-250, short link 70-110, ending 140-200. Do not pad past the range. SCRIPT: Use 漢字 only from Japanese elementary grades 1–2 (小学校低学年). Allowed 漢字: " + GRADE12_KANJI + ". Any other 漢字 must be ひらがな (e.g. おきる, こまる, げんば, にげる, ころんだ, すがた, せかい, ゆうき). Names stay as given.",
    "age-10-12": "Spoken Japanese for 10-12 (upper elementary). Scene + 擬音 + dialogue + a fail, then the hero notices how to recover. Follow THIS PAGE's target length. Same 24-page kishotenketsu shape as 7-9, about 1.1 times the words. Do not pad. SCRIPT: Use 漢字 taught in Japanese elementary school (grades 1–6). OK: 起きる, 向かう, 失敗, 世界, 姿, 現場, 深呼吸, 転んだ, 解決. Junior-high-only or rare 漢字 must be ひらがな. Names stay as given.",
    "age-13-15": "Spoken Japanese for 13-15 (junior high). Readable aloud. Humor from trying to look cool, then a leftover lesson. Follow THIS PAGE's target length. Same 24-page kishotenketsu shape as 7-9, about 1.15 times the words. Do not pad. SCRIPT: Use 漢字 at junior-high textbook level and everyday 常用漢字. Avoid rare literary 漢字 (no 脚注, 俯瞰, 示唆). Names stay as given.",
    "with-adults": "Richer spoken Japanese, still readable aloud. Humor and a leftover lesson. Follow THIS PAGE's target length. Same 24-page kishotenketsu shape as 7-9, about 1.2 times the words. Do not pad. SCRIPT: Use everyday 常用漢字 from daily life and newspapers. Avoid rare or literary 漢字 (no 脚注, 理念, 俯瞰, 示唆). Prefer ordinary words such as 失敗, 大事, 考える, 日常. Names stay as given."
  };

  function rubyRule(audience, furigana) {
    if (!furigana) {
      return " Do not add 漢字（ふりがな）. Follow the script: young ages stay ひらがな; older ages use bare 漢字.";
    }
    return " Furigana is ON and required. Write EVERY 漢字 as 漢字（ひらがな） with Japanese parentheses, e.g. 朝（あさ）空（そら）. Close every parenthesis. Do not output bare 漢字. Do not ruby カタカナ 擬音 or names already in ひらがな.";
  }

  function sentenceRule(audience, furigana) {
    var base = SENTENCE_RULES[audience] || SENTENCE_RULES["age-4-6"];
    var young = audience === "age-2-3" || audience === "age-4-6";
    if (furigana && young) {
      return base.replace(
        /SCRIPT:[\s\S]*$/,
        "SCRIPT: Furigana is ON. Use easy picture-book 漢字. EVERY 漢字 MUST be written as 漢字（ひらがな）, e.g. 朝（あさ）. Never output 漢字 without a reading. 擬音 stay カタカナ. Names stay as given."
      );
    }
    if (furigana) {
      return base + " Furigana is ON. EVERY 漢字 MUST be 漢字（ひらがな）. Example: 朝日（あさひ）. Close every parenthesis.";
    }
    return base;
  }

  var FULL_BLEED = "Edge-to-edge scene. Fill every pixel of the 3:4 canvas. Large readable figures. Environment continues off every edge. Never a book, never a page, never a white frame.";

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function tokyoParts() {
    var dtf = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    var parts = {};
    dtf.formatToParts(new Date()).forEach(function (p) {
      if (p.type !== "literal") parts[p.type] = p.value;
    });
    var stamp = parts.year + parts.month + parts.day + "-" + parts.hour + parts.minute + parts.second;
    var createdAt = parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.hour + ":" + parts.minute + ":" + parts.second + "+09:00";
    return { stamp: stamp, createdAt: createdAt };
  }

  function romanize(text) {
    var src = String(text || "");
    var out = "";
    var i = 0;
    var two;
    var ch;
    while (i < src.length) {
      ch = src.charAt(i);
      two = src.slice(i, i + 2);
      if (ch === "っ" || ch === "ッ") {
        var next = src.slice(i + 1, i + 3);
        var nextRomaji = DIGRAPHS[next] || MONO[src.charAt(i + 1)] || "";
        if (nextRomaji) out += nextRomaji.charAt(0);
        i += 1;
        continue;
      }
      if (ch === "ー" || ch === "ｰ") {
        if (out) out += out.charAt(out.length - 1);
        i += 1;
        continue;
      }
      if (DIGRAPHS[two]) {
        out += DIGRAPHS[two];
        i += 2;
        continue;
      }
      if (MONO[ch]) {
        out += MONO[ch];
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
    }
    return out;
  }

  function slugPart(text) {
    var raw = romanize(text).toLowerCase();
    raw = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return raw;
  }

  function sanitize(text, maxLen) {
    var value = String(text || "");
    value = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    value = value.replace(/ignore\s+(all\s+)?(previous|above)\s+instructions?/gi, " ");
    value = value.replace(/system\s*:/gi, " ");
    value = value.replace(/```/g, " ");
    value = value.replace(/\s+/g, " ").trim();
    return value.slice(0, maxLen || 200);
  }

  function sanitizeBrief(text) {
    var value = String(text || "");
    value = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    value = value.replace(/ignore\s+(all\s+)?(previous|above)\s+instructions?/gi, " ");
    value = value.replace(/system\s*:/gi, " ");
    return value.replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000);
  }

  function fill(template, vars) {
    return String(template || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, function (_, key) {
      return vars[key] == null ? "" : String(vars[key]);
    });
  }

  function pageToken(n) {
    return "p" + pad2(n);
  }

  function heroOf(intent) {
    var list = (intent && intent.characters) || [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].role === "hero") return list[i];
    }
    return list[0] || { name: "book", role: "hero" };
  }

  function friendOf(intent) {
    var list = (intent && intent.characters) || [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].role !== "hero") return list[i];
    }
    return null;
  }

  function makeSlug(intent) {
    var theme = slugPart((intent.theme && intent.theme.preset) || "") || slugPart(intent.theme && intent.theme.freeText);
    var hero = slugPart(heroOf(intent).name);
    var parts = [];
    if (theme) parts.push(theme);
    if (hero && hero !== theme) parts.push(hero);
    var slug = parts.join("-") || "book";
    if (slug.length > 24) slug = slug.slice(0, 24).replace(/-+$/g, "");
    if (!slug) slug = "book";
    return slug;
  }

  function issueId(intent) {
    var clock = tokyoParts();
    var slug = makeSlug(intent);
    var key = clock.stamp + "_" + slug;
    var n = issued[key] || 0;
    n += 1;
    issued[key] = n;
    if (n > 1) {
      var suffix = "_" + pad2(n);
      var base = slug.slice(0, Math.max(1, 24 - suffix.length));
      slug = base.replace(/-+$/g, "") + suffix;
    }
    return {
      stamp: clock.stamp,
      createdAt: clock.createdAt,
      slug: slug,
      bookId: clock.stamp + "_" + slug
    };
  }

  function namesFrom(intent, bible) {
    var names = { hero: "", friend: "" };
    var list = (bible && bible.characters) || [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].role === "hero") names.hero = list[i].displayName;
      else if (!names.friend) names.friend = list[i].displayName;
    }
    if (!names.hero) names.hero = sanitize(heroOf(intent).name, 20) || "こども";
    if (!names.friend) {
      var fr = friendOf(intent);
      names.friend = fr ? sanitize(fr.name, 20) : "";
    }
    return names;
  }

  function whoFor(scene, names, bible) {
    var chars = (bible && bible.characters) || [];
    var labels = chars.map(function (ch) {
      return (ch.displayName || "character") + " [ID " + ch.id + "] (" + (ch.roleLabel || ch.role) + ")";
    });
    if (/meet|help|together|share|bond/.test(scene) && names.friend) return labels.join(", ");
    if (chars.length) {
      var hero = chars.filter(function (ch) { return ch.role === "hero"; })[0];
      if (/cover|coda|home|win|crisis|go|try|fail|think|path|once|again|day|morning|spark/.test(scene)) {
        return hero ? hero.displayName + " [ID " + hero.id + "] (hero)" : names.hero;
      }
    }
    return labels.join(", ") || names.hero;
  }

  function pagePlanOf(spread) {
    var plan = (spread && spread.plan) || {};
    return {
      summary: plan.summary || "",
      who: plan.who || "",
      length: plan.length || "80-240"
    };
  }

  function extraPalette(ch) {
    var bits = [];
    if (ch.palette && ch.palette.scarf) bits.push("scarf " + ch.palette.scarf + " (always visible)");
    if (ch.accessories && ch.accessories.glasses) bits.push("round glasses");
    return bits.length ? ", " + bits.join(", ") : "";
  }

  function characterBlock(ch) {
    var T = SBS.PromptTemplates;
    if (!ch) return "";
    return fill(T.characterBlock, {
      CHAR_ID: ch.id,
      DISPLAY_NAME: sanitize(ch.promptName || ch.displayName, 80),
      ROLE: ch.roleLabel || ch.role || "",
      KIND: ch.kindLabel || ch.kind || "",
      PERSONALITY: (function () {
        var line = (SBS.personalityLine && SBS.personalityLine(ch)) || "(unspecified)";
        return (SBS.Originality && SBS.Originality.rewrite) ? SBS.Originality.rewrite(line) : line;
      })(),
      HAIR: ch.palette.hair,
      SKIN: ch.palette.skin,
      EYES: ch.palette.eyes,
      CLOTHES: ch.palette.clothesPrimary,
      ACCENT: ch.palette.clothesAccent,
      EXTRA_PALETTE: extraPalette(ch),
      HEAD_TO_BODY: ch.body.headToBody,
      HEIGHT_UNITS: String(ch.body.heightUnits),
      BUILD: ch.body.build,
      MUST_KEEP: (ch.mustKeep || []).join("; "),
      MUST_NEVER: (ch.mustNever || []).join("; ")
    });
  }

  function characterBlocks(bible) {
    return ((bible && bible.characters) || []).map(characterBlock).join("\n");
  }

  function characterRefLines(book) {
    var chars = (book && book.bible && book.bible.characters) || [];
    var sheets = (book && book.characterSheets) || [];
    var lines = ["Character identity map (do not invent a new design for these IDs):"];
    var n = 0;
    var i;
    var cap = (SBS.LIMITS && SBS.LIMITS.maxCharacters) || 5;
    for (i = 0; i < chars.length && n < cap; i += 1) {
      if (!sheets[i] || !sheets[i].url) continue;
      n += 1;
      lines.push(
        "Attached image " + n + " is identity ID " + chars[i].id +
        " named \"" + sanitize(chars[i].promptName || chars[i].displayName, 40) +
        "\" (role: " + (chars[i].roleLabel || chars[i].role || "") +
        "). Copy this character exactly. Same ID means the same face, hair, clothes, species, and height."
      );
    }
    if (!n) {
      return "No attached character identity images. Follow the character lock text.";
    }
    lines.push("Only place IDs listed in People in the scene. Do not redesign any ID.");
    return lines.join("\n");
  }

  function characterTurnaround(book, charIndex, extraNote) {
    var T = SBS.PromptTemplates;
    var bible = (book && book.bible) || {};
    var ch = (bible.characters || [])[charIndex];
    if (!T || !T.characterTurnaround || !ch) return "";
    var lock = fill(T.characterLock, {
      ORIGINALITY_LOCK: (SBS.Originality && SBS.Originality.imageLock) ||
        "Original characters only. Market-similar is OK. Exact famous characters are not.",
      CHARACTER_BLOCKS: characterBlock(ch)
    });
    var note = sanitize(extraNote, 240) || "(none)";
    if (SBS.Originality && SBS.Originality.rewrite) note = SBS.Originality.rewrite(note) || note;
    return fill(T.characterTurnaround, {
      STYLE_LOCK: (book.prompts && book.prompts.styleLock) || "",
      ONE_CHARACTER_LOCK: lock,
      EXTRA_NOTE: note,
      NEGATIVE: (book.prompts && book.prompts.negative) || ""
    });
  }

  function buildLocks(intent, bible) {
    var T = SBS.PromptTemplates;
    var style = bible.styleLock || {};
    var world = bible.world || {};
    var settingId = (intent.setting && intent.setting.preset) || "custom";
    var settingLabel = SBS.labelOf(SBS.PRESETS.settings, settingId) || sanitize(intent.setting && intent.setting.freeText, 80) || settingId;
    var originalityLock = (SBS.Originality && SBS.Originality.imageLock) ||
      "Original characters only. Market-similar is OK. Exact famous characters are not.";
    var styleLock = fill(T.styleLock, {
      MEDIUM: style.medium || "watercolor",
      PALETTE_TEMP: style.paletteTemp || "warm-soft",
      LINE_WEIGHT: style.lineWeight || "light",
      LIGHTING: style.lighting || "diffused daylight"
    });
    var characterLock = fill(T.characterLock, {
      ORIGINALITY_LOCK: originalityLock,
      CHARACTER_BLOCKS: characterBlocks(bible) || "(no characters)"
    });
    var worldLock = fill(T.worldLock, {
      SETTING_LABEL: settingLabel,
      SETTING_ID: settingId,
      GROUND_LINE: String(world.groundLine == null ? 0.82 : world.groundLine),
      PIXELS_PER_UNIT: String(world.pixelsPerUnit || 220),
      RECURRING_PROPS: (world.recurringProps && world.recurringProps.length) ? world.recurringProps.join(", ") : "none"
    });
    var negative = fill(T.negative, {
      NEGATIVE: style.negative || "text-in-image"
    });
    return {
      styleLock: styleLock,
      characterLock: characterLock,
      worldLock: worldLock,
      negative: negative
    };
  }

  function compile(intent, bible, book) {
    var T = SBS.PromptTemplates;
    var keepId = book && book.bookId && book.stamp && book.createdAt;
    var id = keepId
      ? { bookId: book.bookId, stamp: book.stamp, createdAt: book.createdAt }
      : issueId(intent);
    var locks = buildLocks(intent, bible);
    var names = namesFrom(intent, bible);
    var themeLabel = SBS.labelOf(SBS.PRESETS.themes, intent.theme && intent.theme.preset) || sanitize(intent.theme && intent.theme.freeText, 80) || "たいせつなこと";
    var settingLabel = SBS.labelOf(SBS.PRESETS.settings, intent.setting && intent.setting.preset) || sanitize(intent.setting && intent.setting.freeText, 80) || "まち";
    var audienceLabel = SBS.labelOf(SBS.PRESETS.audiences, intent.audience) || intent.audience;
    var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" };
    var structureLabel = structurePick.freeText
      ? sanitize(structurePick.freeText, 800)
      : (SBS.labelOf(SBS.PRESETS.structures, structurePick.preset) || structurePick.preset || "起承転結");
    var charactersLine = ((bible && bible.characters) || []).map(function (ch) {
      var bits = [sanitize(ch.displayName, 20) || "(unnamed)"];
      if (ch.roleLabel || ch.role) bits.push("role: " + (ch.roleLabel || ch.role));
      if (ch.kindLabel || ch.kind) bits.push("kind: " + (ch.kindLabel || ch.kind));
      var pers = SBS.personalityLine ? SBS.personalityLine(ch) : "";
      if (pers) bits.push("personality: " + pers);
      if (ch.originalityHit) bits.push("original design for this book, not a famous character");
      return bits.join(", ");
    }).join("; ") || "(no characters)";
    var originalityLock = (SBS.Originality && SBS.Originality.imageLock) ||
      "Original characters only. Market-similar is OK. Exact famous characters are not.";
    var shared = {
      IMAGE_SYSTEM: fill(T.imageSystem, { ORIGINALITY_LOCK: originalityLock }),
      STORY_SYSTEM: T.storySystem,
      STYLE_LOCK: locks.styleLock,
      CHARACTER_LOCK: locks.characterLock,
      WORLD_LOCK: locks.worldLock,
      NEGATIVE: locks.negative
    };
    function fillPageImage(spread, storyText) {
      var scene = spread.scene || "day";
      var copy = SCENE_COPY[scene] || SCENE_COPY.day;
      var page = pageToken(spread.n);
      return fill(T.pageImage, {
        IMAGE_SYSTEM: shared.IMAGE_SYSTEM,
        STYLE_LOCK: shared.STYLE_LOCK,
        CHARACTER_LOCK: shared.CHARACTER_LOCK,
        CHARACTER_REFS: characterRefLines(book),
        WORLD_LOCK: shared.WORLD_LOCK,
        NEGATIVE: shared.NEGATIVE,
        PAGE: page.slice(1),
        SPREAD_TOTAL: String((book.spreads || []).length || 12),
        SCENE: scene,
        ROLE: spread.role || "story",
        SCENE_DIRECTION: pagePlanOf(spread).summary || copy.direction,
        STORY_TEXT: storyText || pagePlanOf(spread).summary || copy.direction,
        WHO: pagePlanOf(spread).who || whoFor(scene, names, bible),
        COMPOSITION: FULL_BLEED
      });
    }
    var characterSheet = fill(T.characterSheet, shared);
    var pages = (book.spreads || []).map(function (spread) {
      var scene = spread.scene || "day";
      var copy = SCENE_COPY[scene] || SCENE_COPY.day;
      var page = pageToken(spread.n);
      var currentText = SBS.Story.plainText(spread.paragraphs, names);
      var image = fillPageImage(spread, currentText);
      var text = fill(T.pageText, {
        STORY_SYSTEM: shared.STORY_SYSTEM,
        PAGE: page.slice(1),
        SPREAD_TOTAL: String((book.spreads || []).length || 12),
        TITLE: sanitize(intent.title || book.title, 40),
        THEME: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.themes, intent.theme, intent.audience)) || themeLabel,
        SETTING: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.settings, intent.setting, intent.audience)) || settingLabel,
        AUDIENCE: intent.audience || "",
        AUDIENCE_LABEL: audienceLabel,
        STRUCTURE: structureLabel,
        SCENE: scene,
        PAGE_PLAN: pagePlanOf(spread).summary || copy.direction,
        PAGE_WHO: pagePlanOf(spread).who || whoFor(scene, names, bible),
        HERO: names.hero,
        HERO_PERSONALITY: (function () {
          var heroCh = ((bible && bible.characters) || []).filter(function (c) { return c.role === "hero"; })[0];
          return (SBS.personalityLine && heroCh && SBS.personalityLine(heroCh)) || "(unspecified)";
        }()),
        CHARACTERS_LINE: charactersLine,
        FRIEND_LINE: names.friend ? "Friend: " + names.friend : "Friend: (none)",
        TEXT_DIRECTION: intent.textDirection || book.textDirection || "yoko",
        FURIGANA: book.furigana ? "yes" : "no",
        SENTENCE_RULE: sentenceRule(intent.audience, book.furigana),
        LENGTH_RULE: pagePlanOf(spread).length + " Japanese characters. Cover may be 10-60. Do not force 180.",
        RUBY_RULE: rubyRule(intent.audience, book.furigana),
        BRIEF_MARKDOWN: sanitizeBrief(intent.briefMarkdown || (SBS.IntentMarkdown && SBS.IntentMarkdown.stringify(intent)) || ""),
        SCENE_DIRECTION: pagePlanOf(spread).summary || copy.direction,
        CURRENT_TEXT: currentText || "(empty placeholder)"
      });
      return {
        n: spread.n,
        page: page,
        scene: scene,
        role: spread.role,
        image: image,
        text: text,
        summary: pagePlanOf(spread).summary || copy.direction
      };
    });

    var dir = "prompt/" + id.bookId + "/";
    var files = [
      { path: dir + id.bookId + ".style-lock.txt", data: locks.styleLock },
      { path: dir + id.bookId + ".character-lock.txt", data: locks.characterLock },
      { path: dir + id.bookId + ".world-lock.txt", data: locks.worldLock },
      { path: dir + id.bookId + ".negative.txt", data: locks.negative },
      { path: dir + id.bookId + "_character-sheet.prompt.txt", data: characterSheet },
      {
        path: dir + id.bookId + ".brief.md",
        data: sanitizeBrief(intent.briefMarkdown || (SBS.IntentMarkdown && SBS.IntentMarkdown.stringify(intent)) || "")
      }
    ];
    pages.forEach(function (p) {
      files.push({ path: dir + id.bookId + "_" + p.page + ".image.prompt.txt", data: p.image });
      files.push({ path: dir + id.bookId + "_" + p.page + ".text.prompt.txt", data: p.text });
    });

    var outline = {
      bookId: id.bookId,
      title: book.title,
      structure: structurePick,
      beats: pages.map(function (p) {
        return { n: p.n, page: p.page, scene: p.scene, role: p.role, summary: p.summary };
      })
    };
    files.unshift({
      path: dir + id.bookId + ".story-outline.json",
      data: JSON.stringify(outline, null, 2)
    });

    var meta = {
      schemaVersion: 1,
      bookId: id.bookId,
      stamp: id.stamp,
      createdAt: id.createdAt,
      title: book.title,
      generator: (keepId && book.generator) || "demo",
      models: {
        text: (SBS.Gemini && SBS.Gemini.textModelName)
          ? SBS.Gemini.textModelName()
          : "gemini-3.5-flash",
        image: (SBS.Gemini && SBS.Gemini.imageModelName)
          ? SBS.Gemini.imageModelName()
          : "gemini-3.1-flash-image"
      },
      files: files.map(function (f) { return f.path; })
    };
    files.unshift({
      path: dir + id.bookId + ".meta.json",
      data: JSON.stringify(meta, null, 2)
    });

    book.schemaVersion = 1;
    book.bookId = id.bookId;
    book.stamp = id.stamp;
    book.createdAt = id.createdAt;
    if (!keepId) book.generator = "demo";
    book.prompts = {
      meta: meta,
      styleLock: locks.styleLock,
      characterLock: locks.characterLock,
      worldLock: locks.worldLock,
      negative: locks.negative,
      characterSheet: characterSheet,
      outline: outline,
      pages: pages,
      files: files
    };
    return book.prompts;
  }

  function refreshPageImage(book, index) {
    if (!book || !book.prompts || !book.prompts.pages || !book.spreads) return "";
    var spread = book.spreads[index];
    var page = book.prompts.pages[index];
    if (!spread || !page) return "";
    var T = SBS.PromptTemplates;
    var intent = book.intent || {};
    var bible = book.bible || {};
    var names = namesFrom(intent, bible);
    var originalityLock = (SBS.Originality && SBS.Originality.imageLock) ||
      "Original characters only. Market-similar is OK. Exact famous characters are not.";
    var shared = {
      IMAGE_SYSTEM: fill(T.imageSystem, { ORIGINALITY_LOCK: originalityLock }),
      STYLE_LOCK: book.prompts.styleLock || "",
      CHARACTER_LOCK: book.prompts.characterLock || "",
      WORLD_LOCK: book.prompts.worldLock || "",
      NEGATIVE: book.prompts.negative || ""
    };
    var scene = spread.scene || "day";
    var copy = SCENE_COPY[scene] || SCENE_COPY.day;
    var storyText = (SBS.Story && SBS.Story.plainText)
      ? SBS.Story.plainText(spread.paragraphs, names, { ruby: false })
      : "";
    page.image = fill(T.pageImage, {
      IMAGE_SYSTEM: shared.IMAGE_SYSTEM,
      STYLE_LOCK: shared.STYLE_LOCK,
      CHARACTER_LOCK: shared.CHARACTER_LOCK,
      CHARACTER_REFS: characterRefLines(book),
      WORLD_LOCK: shared.WORLD_LOCK,
      NEGATIVE: shared.NEGATIVE,
      PAGE: pageToken(spread.n).slice(1),
      SPREAD_TOTAL: String((book.spreads || []).length || 12),
      SCENE: scene,
      ROLE: spread.role || "story",
      SCENE_DIRECTION: pagePlanOf(spread).summary || copy.direction,
      STORY_TEXT: storyText || pagePlanOf(spread).summary || copy.direction,
      WHO: pagePlanOf(spread).who || whoFor(scene, names, bible),
      COMPOSITION: FULL_BLEED
    });
    return page.image;
  }

  function refreshPageText(book, index) {
    if (!book || !book.prompts || !book.prompts.pages || !book.spreads) return "";
    var spread = book.spreads[index];
    var page = book.prompts.pages[index];
    if (!spread || !page) return "";
    var T = SBS.PromptTemplates;
    var intent = book.intent || {};
    var bible = book.bible || {};
    var names = namesFrom(intent, bible);
    var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: "", freeText: "" };
    var structureLabel = structurePick.freeText
      ? sanitize(structurePick.freeText, 800)
      : (SBS.labelOf(SBS.PRESETS.structures, structurePick.preset) || "起承転結");
    var charactersLine = ((bible.characters) || []).map(function (ch) {
      var bits = [sanitize(ch.displayName, 20) || "(unnamed)"];
      if (ch.roleLabel || ch.role) bits.push("role: " + (ch.roleLabel || ch.role));
      return bits.join(", ");
    }).join("; ");
    var copy = SCENE_COPY[spread.scene] || SCENE_COPY.day;
    var plan = pagePlanOf(spread);
    page.text = fill(T.pageText, {
      STORY_SYSTEM: T.storySystem,
      PAGE: pageToken(spread.n).slice(1),
      SPREAD_TOTAL: String((book.spreads || []).length || 12),
      TITLE: sanitize(intent.title || book.title, 40),
      THEME: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.themes, intent.theme, intent.audience)) ||
        sanitize(intent.theme && intent.theme.freeText, 80) || "たいせつなこと",
      SETTING: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.settings, intent.setting, intent.audience)) ||
        sanitize(intent.setting && intent.setting.freeText, 80) || "まち",
      AUDIENCE: intent.audience || "",
      AUDIENCE_LABEL: SBS.labelOf(SBS.PRESETS.audiences, intent.audience) || intent.audience,
      STRUCTURE: structureLabel,
      PAGE_PLAN: plan.summary || copy.direction,
      PAGE_WHO: plan.who || whoFor(spread.scene, names, bible),
      HERO: names.hero,
      HERO_PERSONALITY: (function () {
        var heroCh = (bible.characters || []).filter(function (c) { return c.role === "hero"; })[0];
        return (SBS.personalityLine && heroCh && SBS.personalityLine(heroCh)) || "(unspecified)";
      }()),
      CHARACTERS_LINE: charactersLine,
      FRIEND_LINE: names.friend ? "Friend: " + names.friend : "Friend: (none)",
      TEXT_DIRECTION: intent.textDirection || book.textDirection || "yoko",
      FURIGANA: book.furigana ? "yes" : "no",
      SENTENCE_RULE: sentenceRule(intent.audience, book.furigana),
      LENGTH_RULE: plan.length + " Japanese characters. Cover may be 10-60. Do not force 180.",
      RUBY_RULE: rubyRule(intent.audience, book.furigana),
      BRIEF_MARKDOWN: sanitizeBrief(intent.briefMarkdown || (SBS.IntentMarkdown && SBS.IntentMarkdown.stringify(intent)) || ""),
      CURRENT_TEXT: "(empty placeholder)"
    });
    page.summary = plan.summary || page.summary;
    return page.text;
  }

  function refreshAllPageText(book) {
    if (!book || !book.spreads) return;
    if (SBS.Story && SBS.Story.attachPlans) SBS.Story.attachPlans(book);
    book.spreads.forEach(function (_, i) {
      refreshPageText(book, i);
    });
  }

  function downloadZip(book) {
    var pack = book && book.prompts;
    if (!pack || !pack.files || !pack.files.length) return false;
    var bytes = SBS.zipStore(pack.files);
    SBS.downloadBytes(book.bookId + ".prompt.zip", bytes, "application/zip");
    return true;
  }

  SBS.PromptCompiler = {
    issueId: issueId,
    compile: compile,
    refreshPageImage: refreshPageImage,
    refreshPageText: refreshPageText,
    refreshAllPageText: refreshAllPageText,
    characterTurnaround: characterTurnaround,
    characterRefLines: characterRefLines,
    downloadZip: downloadZip
  };

  global.SBS = SBS;
})(window);
