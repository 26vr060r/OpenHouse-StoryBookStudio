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
      direction: "Cover portrait only. The hero is the focus, gentle and inviting, in the story world. No title lettering. No story text lives here.",
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
    },
    back: {
      direction: "Back cover TOP-HALF art only, landscape 3:2. A quiet last look at this story world. No lettering, no title, no credits, no story prose. The ending already happened on the last odd text page. Compose as a wide banner: faces readable, figures from waist or knees up.",
      composition: "wide 3:2 banner, waist-up or knees-up, faces in the upper two-thirds, sky continues off the top edge"
    }
  };

  var GRADE12_KANJI = "一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男中虫町天田土二日入年白八百文木本名目立力林六引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東童道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話";

  var SENTENCE_RULES = {
    "age-2-3": "Very short spoken Japanese. Repeat simple words. One 擬音 is OK. HARD: reach THIS PAGE's target length (the lower number is required). SCRIPT: Write the body in ひらがな only. Katakana is OK for names and 擬音. Do not use 漢字, even if the memo uses 漢字 — rewrite those words in ひらがな. Character names stay as given.",
    "age-4-6": "Simple spoken Japanese. Short dialogue and 擬音. HARD: reach THIS PAGE's target length (the lower number is required). SCRIPT: Write the body in ひらがな only. Katakana is OK for names and 擬音. Do not use 漢字, even if the memo uses 漢字 — rewrite those words in ひらがな. Character names stay as given.",
    "age-7-9": "Spoken Japanese for 7-9. Scene + 擬音 + dialogue. HARD: reach THIS PAGE's target length (the lower number is required). SCRIPT: Use 漢字 only from Japanese elementary grades 1–2 (小学校低学年までに学ぶ漢字). Allowed 漢字: " + GRADE12_KANJI + ". Any other 漢字 must be ひらがな. Names stay as given.",
    "age-10-12": "Spoken Japanese for 10-12 (upper elementary). Scene + 擬音 + dialogue. HARD: reach THIS PAGE's target length (the lower number is required). SCRIPT: Use 漢字 taught through Japanese elementary grade 6 (小学校高学年までに学ぶ漢字 / 学年配当1〜6年). Junior-high-only or rare 漢字 must be ひらがな. Names stay as given.",
    "age-13-15": "Spoken Japanese for 13-15 (junior high). Readable aloud. HARD: reach THIS PAGE's target length (the lower number is required). SCRIPT: Use 漢字 taught through Japanese junior high (中学校までに学ぶ漢字) and everyday 常用漢字. Avoid rare literary 漢字. Names stay as given.",
    "with-adults": "Richer spoken Japanese, still readable aloud. HARD: reach THIS PAGE's target length (the lower number is required). SCRIPT: Use everyday 漢字 from daily life and newspapers (通常生活で使う漢字). Avoid rare or literary 漢字. Names stay as given."
  };

  function rubyRule(audience, furigana) {
    var young = audience === "age-2-3" || audience === "age-4-6";
    if (young) {
      return " Ages 2–6: ひらがな only. Do not use 漢字. Do not write 漢字（ひらがな）. Furigana-on does not add kanji.";
    }
    if (!furigana) {
      return " Furigana is OFF. Do not add 漢字（ふりがな）. Use bare allowed 漢字.";
    }
    return " HARD: Furigana is ON. Every 漢字 word MUST be written as 漢字（ひらがな） per 熟語, not per character: 学校（がっこう）, 友達（ともだち）, 東京（とうきょう）. A one-kanji word may be 空（そら） or 行（い）った. Never 学（がく）校（こう）. Never leave bare 漢字. Close every parenthesis. Length counts WITHOUT the （ひらがな）: 学校（がっこう）=2.";
  }

  function sentenceRule(audience, furigana) {
    var base = SENTENCE_RULES[audience] || SENTENCE_RULES["age-4-6"];
    var young = audience === "age-2-3" || audience === "age-4-6";
    if (young) return base;
    if (!furigana) return base;
    return base + " HARD: Furigana is ON. Every 漢字 word MUST be 漢字（ひらがな） per 熟語 (学校（がっこう）), not per 漢字 (学（がく）校（こう）). Never leave bare 漢字. Length counts the 漢字 only.";
  }

  var FULL_BLEED = "Edge-to-edge scene. Fill every pixel of the 3:4 canvas. Large readable figures. Environment continues off every edge. Never a book, never a page, never a white frame.";
  var BACK_BLEED = "Edge-to-edge 3:2 landscape. This canvas is half the height of a portrait 3:4 page (the top half of the back cover). Fill every pixel. Large readable figures, waist-up or knees-up. Environment continues off every edge. Never a book, never a page, never a white frame, never a blank lower band for credits.";

  function isBackSpread(spread) {
    return !!(spread && (spread.role === "back" || spread.scene === "back"));
  }

  function canvasSpecOf(spread) {
    if (isBackSpread(spread)) {
      return "landscape 3:2 only (half the height of a portrait 3:4 picture-book page). This image is ONLY the top half of the back cover. Do not compose a tall 3:4 scene. Keep heads and faces in the upper two-thirds. No blank strip for credits.";
    }
    return "portrait 3:4, high resolution, one scene, edge to edge";
  }

  function compositionOf(spread) {
    if (isBackSpread(spread)) return BACK_BLEED;
    return FULL_BLEED;
  }

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

  var PAGE_CAST_MAX = 3;

  function whoLineOf(chars) {
    var list = (chars || []).map(function (ch) {
      return (ch.displayName || "character") + " [ID " + ch.id + "] (" + (ch.roleLabel || ch.role) + ")";
    }).join(", ");
    if (!list) return "";
    return list + ". HARD: each ID here is exactly one body — never two of the same character.";
  }

  function mentionScore(ch, blob) {
    var score = 0;
    var name = String((ch && ch.displayName) || "").trim();
    var promptName = String((ch && ch.promptName) || "").trim();
    if (name && blob.indexOf(name) !== -1) score += 10;
    if (promptName && promptName !== name && blob.indexOf(promptName) !== -1) score += 8;
    if (ch && ch.id && blob.indexOf(ch.id) !== -1) score += 6;
    return score;
  }

  function selectPageCast(book, spreadIndex, maxCount, storyText) {
    var max = maxCount || PAGE_CAST_MAX;
    var bible = (book && book.bible) || {};
    var chars = bible.characters || [];
    var spread = (book && book.spreads && book.spreads[spreadIndex]) || null;
    var names;
    var story = String(storyText || "");
    var plan;
    var blob;
    var ranked;
    var hits;
    var picked;
    if (!chars.length) return [];
    names = namesFrom((book && book.intent) || {}, bible);
    if (!story && spread && SBS.Story && SBS.Story.plainText) {
      story = SBS.Story.plainText(spread.paragraphs, names, { ruby: false });
    }
    plan = pagePlanOf(spread);
    blob = [story, plan.summary, plan.who].join("\n");
    ranked = chars.map(function (ch, i) {
      return { ch: ch, i: i, score: mentionScore(ch, blob) };
    });
    hits = ranked.filter(function (row) { return row.score >= 6; });
    if (!hits.length) hits = ranked.filter(function (row) { return row.score > 0; });
    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.ch.role === "hero") return -1;
      if (b.ch.role === "hero") return 1;
      return a.i - b.i;
    });
    picked = hits.slice(0, max).map(function (row) { return row.ch; });
    if (spread) {
      spread.pageCast = picked.map(function (ch) { return ch.id; });
    }
    return picked;
  }

  function whoFromStory(storyText, bible, fallback) {
    return whoLineOf(selectPageCast({ bible: bible, spreads: [] }, 0, PAGE_CAST_MAX, storyText)) || fallback || "";
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
      length: plan.length || "120-360"
    };
  }

  function storySlotOf(book, spread, index) {
    var totalSpreads = ((book && book.spreads) || []).length || 0;
    var storyTotal = SBS.interiorSpreadCount
      ? SBS.interiorSpreadCount((book && book.pageCount) || 12)
      : Math.max(1, totalSpreads - 2);
    var k = -1;
    var parts;
    var odd;
    if (SBS.bookParts && book) {
      parts = SBS.bookParts(book);
      storyTotal = parts.interior.length || storyTotal;
      k = parts.interior.indexOf(spread);
      if (k < 0) {
        parts.interior.forEach(function (s, i) {
          if (s && spread && s.n === spread.n) k = i;
        });
      }
    }
    if (k < 0) k = Math.max(0, (index || 0) - 1);
    odd = SBS.oddTextPageOf && book ? SBS.oddTextPageOf(book, spread) : 0;
    if (!odd) odd = k * 2 + 3;
    return { k: k, odd: odd, even: odd - 1, total: storyTotal };
  }

  function pagePlaceOf(spread, index, total, book) {
    var slot;
    if ((spread && spread.role === "cover") || (spread && spread.scene === "cover")) {
      return "表紙（1ページ）。插絵のみ。題名はフッター。物語の文章は載せられないので書かない。";
    }
    if ((spread && spread.role === "back") || (spread && spread.scene === "back")) {
      return "裏表紙。插絵のみ。物語の文章は載せられない。終わりは直前の奇数ページで書く。";
    }
    slot = storySlotOf(book, spread, index);
    if (slot.k <= 0) {
      return "印刷ページ" + slot.odd + "（表紙を除いた奇数ページの1つ目／シナリオ" +
        (slot.k + 1) + "／" + slot.total + "）。偶数ページ" + slot.even +
        "は插絵だけ。表紙・裏表紙には物語を書かない。作者メモの現場から書く。";
    }
    if (slot.k >= slot.total - 1) {
      return "印刷ページ" + slot.odd + "（シナリオ最後の奇数ページ／" +
        slot.total + "／" + slot.total + "）。ここで話を終える。裏表紙には文章を書かない。偶数ページ" +
        slot.even + "は插絵。";
    }
    return "印刷ページ" + slot.odd + "（シナリオ" + (slot.k + 1) + "／" + slot.total +
      "）。偶数ページ" + slot.even + "は插絵。表紙・裏表紙には物語を書かない。すでに書いた奇数ページの直後から続ける。";
  }

  function beatLabelOf(spread, index, total) {
    var key = String((spread && spread.plan && spread.plan.key) || (spread && spread.scene) || "");
    if ((spread && spread.role === "cover") || key === "cover") return "表紙";
    if ((spread && spread.role === "back") || key === "back") return "裏表紙";
    if (/^(ki|day|morning|world|map|once|ask)([-_]|$)/.test(key)) return "起";
    if (/^(sho|spark|go|meet|notice|try|noon|play)([-_]|$)/.test(key)) return "承";
    if (/^(ten|fail|hard|bond|crisis|think|path|again)/.test(key)) return "転";
    if (/^(ketsu|win|home|coda|learn|share|dream|night|evening)/.test(key)) return "結";
    var t = total || 12;
    var p = ((index || 0) + 1) / t;
    if (p <= 0.28) return "起";
    if (p <= 0.52) return "承";
    if (p <= 0.82) return "転";
    return "結";
  }

  function previousPagesBlock(book, index) {
    var intent = (book && book.intent) || {};
    var bible = (book && book.bible) || {};
    var names = namesFrom(intent, bible);
    var lines = [];
    var spreads = (book && book.spreads) || [];
    var i;
    for (i = 0; i < index; i += 1) {
      if (SBS.needsStoryText && !SBS.needsStoryText(spreads[i])) continue;
      var body = (SBS.Story && SBS.Story.plainText)
        ? SBS.Story.plainText(spreads[i] && spreads[i].paragraphs, names, { ruby: false })
        : "";
      body = String(body || "").replace(/\s+/g, " ").trim();
      if (body) {
        lines.push("ページ" + (SBS.oddTextPageOf ? SBS.oddTextPageOf(book, spreads[i]) : (i * 2 + 1)) + "：" + body);
      }
    }
    return lines.join("\n") || "（まだない。ここからこの本の物語を始める）";
  }

  function charactersLineOf(bible) {
    return ((bible && bible.characters) || []).map(function (ch) {
      var bits = [sanitize(ch.displayName, 20) || "(unnamed)"];
      if (ch.roleLabel || ch.role) bits.push("role: " + (ch.roleLabel || ch.role));
      if (ch.kindLabel || ch.kind) bits.push("kind: " + (ch.kindLabel || ch.kind));
      var pers = SBS.personalityLine ? SBS.personalityLine(ch) : "";
      if (pers) bits.push("personality: " + pers);
      if (ch.originalityHit) bits.push("original design for this book, not a famous character");
      return bits.join(", ");
    }).join("; ") || "(no characters)";
  }

  function pageTextVars(book, spread, spreadIndex) {
    var T = SBS.PromptTemplates;
    var intent = (book && book.intent) || {};
    var bible = (book && book.bible) || {};
    var names = namesFrom(intent, bible);
    var total = ((book && book.spreads) || []).length || 12;
    var plan = pagePlanOf(spread);
    var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" };
    var structureLabel = structurePick.freeText
      ? sanitize(structurePick.freeText, 800)
      : (SBS.labelOf(SBS.PRESETS.structures, structurePick.preset) || structurePick.preset || "起承転結");
    var creatorLock = (SBS.Originality && SBS.Originality.creatorLock) ||
      "You are an original picture-book author. Write from the wizard facts only.";
    var heroCh = ((bible && bible.characters) || []).filter(function (c) { return c.role === "hero"; })[0];
    var slot = storySlotOf(book, spread, spreadIndex);
    var pageLock = (SBS.pageLockJa && SBS.pageLockJa(book)) || (SBS.pageLock && SBS.pageLock(book)) || "";
    return {
      STORY_SYSTEM: fill(T.storySystem, { CREATOR_LOCK: creatorLock }),
      PAGE: pageToken(spread && spread.n).slice(1),
      PRINT_PAGE: String(slot.odd),
      EVEN_PAGE: String(slot.even),
      STORY_SLOT: String(slot.k + 1),
      STORY_SLOT_TOTAL: String(slot.total),
      PAGE_LOCK: pageLock,
      SPREAD_TOTAL: String(total),
      TITLE: sanitize(intent.title || (book && book.title), 40),
      THEME: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.themes, intent.theme, intent.audience)) ||
        sanitize(intent.theme && intent.theme.freeText, 80) || "たいせつなこと",
      SETTING: (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.settings, intent.setting, intent.audience)) ||
        sanitize(intent.setting && intent.setting.freeText, 80) || "まち",
      AUDIENCE: intent.audience || "",
      AUDIENCE_LABEL: SBS.labelOf(SBS.PRESETS.audiences, intent.audience) || intent.audience || "",
      STRUCTURE: structureLabel,
      HERO: names.hero,
      HERO_PERSONALITY: (SBS.personalityLine && heroCh && SBS.personalityLine(heroCh)) || "(unspecified)",
      CHARACTERS_LINE: charactersLineOf(bible),
      FRIEND_LINE: names.friend ? "Friend: " + names.friend : "Friend: (none)",
      TEXT_DIRECTION: intent.textDirection || (book && book.textDirection) || "yoko",
      FURIGANA: book && book.furigana ? "yes" : "no",
      SENTENCE_RULE: sentenceRule(intent.audience, book && book.furigana),
      LENGTH_RULE: "REQUIRED " + plan.length + " Japanese characters counted WITHOUT 漢字（ふりがな） readings (学校（がっこう）=2). Story pages only (odd pages excluding cover). Hard max " +
        ((SBS.LIMITS && SBS.LIMITS.pageText) || 600) + " without furigana.",
      RUBY_RULE: rubyRule(intent.audience, book && book.furigana),
      BRIEF_MARKDOWN: sanitizeBrief(intent.briefMarkdown || (SBS.IntentMarkdown && SBS.IntentMarkdown.stringify(intent)) || ""),
      PAGE_BEAT: pagePlaceOf(spread, spreadIndex, total, book),
      STORY_SPINE: String((book && book.storySpine) || "").trim() || "（指定メモだけから、この本の出来事を発明する）",
      PREVIOUS_PAGES: previousPagesBlock(book, spreadIndex)
    };
  }

  function wizardFactsBlock(book) {
    var vars = pageTextVars(book, ((book && book.spreads) || [])[0] || { n: 1, role: "cover" }, 0);
    return [
      "【指定（ステップ1〜4だけ。これ以外は使わない）】",
      "仮題名: " + vars.TITLE,
      "テーマ: " + vars.THEME,
      "舞台: " + vars.SETTING,
      "読者: " + vars.AUDIENCE_LABEL,
      "話の形: " + vars.STRUCTURE,
      "組方向: " + vars.TEXT_DIRECTION,
      "ふりがな: " + (vars.FURIGANA === "yes"
        ? ((vars.AUDIENCE === "age-2-3" || vars.AUDIENCE === "age-4-6")
          ? "あり（2〜6歳は漢字も漢字（ふりがな）も使わない）"
          : "あり（熟語ごとに 学校（がっこう）。字数はふりがなを除く）")
        : "なし"),
      "文字の規則: " + vars.SENTENCE_RULE + vars.RUBY_RULE,
      "主人公: " + vars.HERO + " / " + vars.HERO_PERSONALITY,
      "登場人物: " + vars.CHARACTERS_LINE,
      "",
      "【作者メモ】",
      vars.BRIEF_MARKDOWN
    ].join("\n");
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

  function sheetIndexOf(book, ch) {
    var chars = (book && book.bible && book.bible.characters) || [];
    var sheets = (book && book.characterSheets) || [];
    var i;
    for (i = 0; i < chars.length; i += 1) {
      if (ch && (chars[i] === ch || (ch.id && chars[i].id === ch.id))) return i;
    }
    for (i = 0; i < sheets.length; i += 1) {
      if (ch && sheets[i] && sheets[i].id && sheets[i].id === ch.id) return i;
    }
    return -1;
  }

  var DOUBLE_CAST_RE = /分身|残像|二重写し|もうひとりの(自分|ぼく|わたし|おれ)|過去の自分|未来の自分|変身前.{0,12}変身後|同じ(人|子|キャラ|こ).{0,10}(二人|ふたり|複数)|二人の自分|ふたりの自分|before[\s-]*and[\s-]*after|doppelganger|two copies of (the )?same|the same (person|child|character).{0,24}(twice|two)/i;

  function allowsDuplicateCast(text) {
    return DOUBLE_CAST_RE.test(String(text || ""));
  }

  function castOnceRule(allowDouble) {
    if (allowDouble) {
      return "SPECIAL STAGING on this page only: the story explicitly asks for more than one body of the same identity. Draw that effect. Do not paste the six-view turnaround grid.";
    }
    return "HARD: one living body per identity ID. The story does not ask for a double. No twins, clones, extra silhouettes, reflections as a second body, before-and-after of the same person, or several angles of the same person.";
  }

  function poseRule() {
    return "HARD ANATOMY: human and child bodies have natural joints. No broken spine, extra elbows or knees, backwards knees, twisted neck, 360° torso, pretzel limbs, floating disconnected arms, or impossible bending. Picture-book proportions are OK; unnatural body folding is not.";
  }

  function pageNegative(book, allowDouble) {
    var base = String((book && book.prompts && book.prompts.negative) || "");
    if (allowDouble) {
      base = base
        .replace(/duplicate of the same character,?\s*/gi, "")
        .replace(/twins of one identity ID,?\s*/gi, "")
        .replace(/cloned figure,?\s*/gi, "")
        .replace(/extra copy of a named character,?\s*/gi, "");
    }
    if (!/unnatural human bending/.test(base)) {
      base += " Do not depict unnatural human bending, extra joints, backwards knees, or a broken spine.";
    }
    return base;
  }

  function characterRefLines(book, cast) {
    var chars = cast && cast.length
      ? cast
      : ((book && book.bible && book.bible.characters) || []);
    var sheets = (book && book.characterSheets) || [];
    var lines = ["Character identity map (do not invent a new design for these IDs):"];
    var n = 0;
    var i;
    var idx;
    var ch;
    for (i = 0; i < chars.length && n < PAGE_CAST_MAX; i += 1) {
      ch = chars[i];
      idx = sheetIndexOf(book, ch);
      if (idx < 0 || !sheets[idx] || !sheets[idx].url) continue;
      n += 1;
      lines.push(
        "Attached image " + n + " is identity ID " + ch.id +
        " named \"" + sanitize(ch.promptName || ch.displayName, 40) +
        "\" (role: " + (ch.roleLabel || ch.role || "") +
        "). Copy this character exactly. Same ID means the same face, hair, clothes, species, and height. " +
        "This sheet is several angles of ONE person. Draw ID " + ch.id +
        " once unless this page's CAST rule allows special staging."
      );
    }
    if (!n) {
      return "No attached character identity images. Follow the character lock text. Follow this page's CAST rule for one body vs special staging.";
    }
    lines.push("Each attached image is a turnaround of ONE person. Copy the design, never the six-view grid. Follow this page's CAST rule for how many bodies of that ID.");
    lines.push("People on this page: only the IDs above (max " + PAGE_CAST_MAX + "). Do not add other book characters. Do not redesign any ID.");
    return lines.join("\n");
  }

  function authorWantsTwinLook(ch) {
    var t = [
      ch && ch.displayName,
      ch && ch.promptName,
      ch && ch.kindLabel,
      ch && ch.roleLabel,
      ((ch && ch.mustKeep) || []).join(" ")
    ].join(" ");
    return /双子|ふたご|クローン|同じ姿|そっくり|twins?/i.test(t);
  }

  function distinctLock(book, charIndex) {
    var chars = ((book && book.bible && book.bible.characters) || []);
    var ch = chars[charIndex];
    if (!ch) return "";
    if (authorWantsTwinLook(ch)) {
      return "The author asked this character to resemble another. Keep that request. Still do not paste another sheet's face unchanged.";
    }
    if (chars.length < 2) {
      return "HARD UNIQUE IDENTITY: This sheet is one unique person for this book.";
    }
    var others = [];
    var i;
    var other;
    for (i = 0; i < chars.length; i += 1) {
      if (i === charIndex) continue;
      other = chars[i];
      others.push(
        "ID " + other.id + " \"" + sanitize(other.promptName || other.displayName, 20) +
        "\" (kind: " + (other.kindLabel || other.kind || "") +
        ", clothes " + ((other.palette && other.palette.clothesPrimary) || "") + ")"
      );
    }
    return "HARD UNIQUE IDENTITY: This sheet is ID " + ch.id + " \"" +
      sanitize(ch.promptName || ch.displayName, 20) +
      "\" only. Instantly different from every other character in this book: " +
      others.join("; ") +
      ". Different face shape, hair, silhouette, clothes, and signature detail. " +
      "Same illustration medium is required. Same person, twins, or palette-swap clones are forbidden. " +
      "If a style-lock image is attached, copy ONLY the paint touch. That attached person is someone else.";
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
    var style = (bible.styleLock || {});
    var medium = style.medium || "watercolor";
    return fill(T.characterTurnaround, {
      STYLE_LOCK: (book.prompts && book.prompts.styleLock) || "",
      STYLE_UNITY: "HARD STYLE UNITY: Every character sheet in this book must look painted by the same illustrator, same day. Same medium (" +
        medium + "), same line, same coloring, same lighting. Face, clothes, hair, and species MUST differ from every other character. Do not give this character a different art style (no sudden 3D, photoreal, pixel, or another medium). If a style-lock image is attached, copy only that touch, never that other person's design.",
      DISTINCT_LOCK: distinctLock(book, charIndex),
      ONE_CHARACTER_LOCK: lock,
      EXTRA_NOTE: note,
      NEGATIVE: (book.prompts && book.prompts.negative) || ""
    });
  }

  function listLock(value) {
    if (Array.isArray(value) && value.length) {
      return value.filter(Boolean).join("; ");
    }
    var text = String(value || "").trim();
    return text || "none yet — first appearance locks the design for later pages";
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
      KEY_ITEMS: listLock(world.recurringProps),
      LANDMARKS: listLock(world.landmarks),
      BACKDROP: String(world.backdrop || "").trim() ||
        "same sky, ground, hour, and weather colors on every page",
      EXTRAS: String(world.extras || "").trim() ||
        "unnamed extras keep the same simple clothes and colors if they return"
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
    var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" };
    var originalityLock = (SBS.Originality && SBS.Originality.imageLock) ||
      "Original characters only. Market-similar is OK. Exact famous characters are not.";
    var shared = {
      IMAGE_SYSTEM: fill(T.imageSystem, { ORIGINALITY_LOCK: originalityLock }),
      STYLE_LOCK: locks.styleLock,
      CHARACTER_LOCK: locks.characterLock,
      WORLD_LOCK: locks.worldLock,
      NEGATIVE: locks.negative
    };
    function fillPageImage(spread, storyText, spreadIndex) {
      var scene = spread.scene || "day";
      var copy = SCENE_COPY[scene] || SCENE_COPY.day;
      var page = pageToken(spread.n);
      var plan = pagePlanOf(spread);
      var body = String(storyText || "").replace(/\s+/g, " ").trim();
      var cast = selectPageCast(book, spreadIndex, PAGE_CAST_MAX, body);
      var allowDouble = allowsDuplicateCast(body) || allowsDuplicateCast(plan.summary) ||
        allowsDuplicateCast(intent.briefMarkdown || (intent.plotHook || ""));
      return fill(T.pageImage, {
        IMAGE_SYSTEM: shared.IMAGE_SYSTEM,
        STYLE_LOCK: shared.STYLE_LOCK,
        CHARACTER_LOCK: shared.CHARACTER_LOCK,
        CHARACTER_REFS: characterRefLines(book, cast),
        WORLD_LOCK: shared.WORLD_LOCK,
        CAST_ONCE_RULE: castOnceRule(allowDouble),
        POSE_RULE: poseRule(),
        NEGATIVE: pageNegative(book, allowDouble),
        PAGE: page.slice(1),
        SPREAD_TOTAL: String((book.spreads || []).length || 12),
        SCENE: scene,
        ROLE: spread.role || "story",
        SCENE_DIRECTION: body
          ? "Show the right-page Japanese story as a wordless scene. Follow the story events, never write the words, dialogue, or 擬音."
          : (plan.summary || copy.direction),
        STORY_TEXT: body || plan.summary || copy.direction,
        WHO: whoLineOf(cast) || "No named characters. Do not add people from the book cast.",
        COMPOSITION: compositionOf(spread),
        CANVAS_SPEC: canvasSpecOf(spread)
      });
    }
    var characterSheet = fill(T.characterSheet, shared);
    var pages = (book.spreads || []).map(function (spread, spreadIndex) {
      var scene = spread.scene || "day";
      var page = pageToken(spread.n);
      var currentText = SBS.Story.plainText(spread.paragraphs, names, { ruby: false });
      var image = fillPageImage(spread, currentText, spreadIndex);
      var text = (SBS.needsStoryText && !SBS.needsStoryText(spread))
        ? ""
        : fill(T.pageText, pageTextVars(book, spread, spreadIndex));
      var beat = beatLabelOf(spread, spreadIndex, (book.spreads || []).length);
      return {
        n: spread.n,
        page: page,
        scene: scene,
        role: spread.role,
        image: image,
        text: text,
        summary: beat
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
      if (p.text) files.push({ path: dir + id.bookId + "_" + p.page + ".text.prompt.txt", data: p.text });
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
          : "gemini-3.8-flash",
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
    var plan = pagePlanOf(spread);
    var storyText = (SBS.Story && SBS.Story.plainText)
      ? SBS.Story.plainText(spread.paragraphs, names, { ruby: false })
      : "";
    var body = String(storyText || "").replace(/\s+/g, " ").trim();
    var cast = selectPageCast(book, index, PAGE_CAST_MAX, body);
    var allowDouble = allowsDuplicateCast(body) || allowsDuplicateCast(plan.summary) ||
      allowsDuplicateCast((intent.briefMarkdown || intent.plotHook || ""));
    page.image = fill(T.pageImage, {
      IMAGE_SYSTEM: shared.IMAGE_SYSTEM,
      STYLE_LOCK: shared.STYLE_LOCK,
      CHARACTER_LOCK: shared.CHARACTER_LOCK,
      CHARACTER_REFS: characterRefLines(book, cast),
      WORLD_LOCK: shared.WORLD_LOCK,
      CAST_ONCE_RULE: castOnceRule(allowDouble),
      POSE_RULE: poseRule(),
      NEGATIVE: pageNegative(book, allowDouble),
      PAGE: pageToken(spread.n).slice(1),
      SPREAD_TOTAL: String((book.spreads || []).length || 12),
      SCENE: scene,
      ROLE: spread.role || "story",
      SCENE_DIRECTION: body
        ? "Show the right-page Japanese story as a wordless scene. Follow the story events, never write the words, dialogue, or 擬音."
        : (plan.summary || copy.direction),
      STORY_TEXT: body || plan.summary || copy.direction,
      WHO: whoLineOf(cast) || "No named characters. Do not add people from the book cast.",
      COMPOSITION: compositionOf(spread),
      CANVAS_SPEC: canvasSpecOf(spread)
    });
    if (book.prompts.files && book.prompts.files.length) {
      var needle = "_" + page.page + ".image.prompt.txt";
      book.prompts.files.forEach(function (file) {
        if (file.path && file.path.indexOf(needle) !== -1) file.data = page.image;
      });
    }
    return page.image;
  }

  function refreshPageText(book, index) {
    if (!book || !book.prompts || !book.prompts.pages || !book.spreads) return "";
    var spread = book.spreads[index];
    var page = book.prompts.pages[index];
    if (!spread || !page) return "";
    var T = SBS.PromptTemplates;
    if (SBS.needsStoryText && !SBS.needsStoryText(spread)) {
      page.text = "";
      return "";
    }
    page.text = fill(T.pageText, pageTextVars(book, spread, index));
    page.summary = beatLabelOf(spread, index, book.spreads.length);
    if (book.prompts.files && book.prompts.files.length) {
      var needle = "_" + page.page + ".text.prompt.txt";
      book.prompts.files.forEach(function (file) {
        if (file.path && file.path.indexOf(needle) !== -1) file.data = page.text;
      });
    }
    return page.text;
  }

  function refreshAllPageImage(book) {
    if (!book || !book.spreads) return;
    book.spreads.forEach(function (_, i) {
      refreshPageImage(book, i);
    });
  }

  function refreshWorldLock(book) {
    if (!book || !book.intent || !book.bible || !book.prompts) return;
    var locks = buildLocks(book.intent, book.bible);
    book.prompts.worldLock = locks.worldLock;
    if (book.prompts.files && book.prompts.files.length) {
      book.prompts.files.forEach(function (file) {
        if (file.path && /world-lock\.txt$/.test(file.path)) file.data = locks.worldLock;
      });
    }
    refreshAllPageImage(book);
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
    refreshAllPageImage: refreshAllPageImage,
    refreshPageText: refreshPageText,
    refreshAllPageText: refreshAllPageText,
    refreshWorldLock: refreshWorldLock,
    characterTurnaround: characterTurnaround,
    characterRefLines: characterRefLines,
    selectPageCast: selectPageCast,
    pageCastMax: PAGE_CAST_MAX,
    beatLabel: beatLabelOf,
    pagePlace: pagePlaceOf,
    wizardFacts: wizardFactsBlock,
    previousPages: previousPagesBlock,
    downloadZip: downloadZip
  };

  global.SBS = SBS;
})(window);
