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

  var SENTENCE_RULES = {
    "age-2-3": "1 to 2 very short sentences. Repeat simple words. Right page only.",
    "age-4-6": "2 to 4 short sentences that fit the right page.",
    "age-7-9": "3 to 5 sentences. Still spoken aloud, no long clauses.",
    "with-adults": "2 to 5 sentences. A little more vocabulary is allowed."
  };

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
      return ch.displayName + " (" + (ch.roleLabel || ch.role) + ")";
    });
    if (/meet|help|together|share|bond/.test(scene) && names.friend) return labels.join(", ");
    if (chars.length) {
      var hero = chars.filter(function (ch) { return ch.role === "hero"; })[0];
      if (/cover|coda|home|win|crisis|go|try|fail|think|path|once|again|day|morning|spark/.test(scene)) {
        return hero ? hero.displayName + " (hero)" : names.hero;
      }
    }
    return labels.join(", ") || names.hero;
  }

  function extraPalette(ch) {
    var bits = [];
    if (ch.palette && ch.palette.scarf) bits.push("scarf " + ch.palette.scarf + " (always visible)");
    if (ch.accessories && ch.accessories.glasses) bits.push("round glasses");
    return bits.length ? ", " + bits.join(", ") : "";
  }

  function characterBlocks(bible) {
    var T = SBS.PromptTemplates;
    return ((bible && bible.characters) || []).map(function (ch) {
      return fill(T.characterBlock, {
        CHAR_ID: ch.id,
        DISPLAY_NAME: sanitize(ch.displayName, 20),
        ROLE: ch.roleLabel || ch.role || "",
        KIND: ch.kindLabel || ch.kind || "",
        PERSONALITY: (SBS.personalityLine && SBS.personalityLine(ch)) || "(unspecified)",
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
    }).join("\n");
  }

  function buildLocks(intent, bible) {
    var T = SBS.PromptTemplates;
    var style = bible.styleLock || {};
    var world = bible.world || {};
    var settingId = (intent.setting && intent.setting.preset) || "custom";
    var settingLabel = SBS.labelOf(SBS.PRESETS.settings, settingId) || sanitize(intent.setting && intent.setting.freeText, 80) || settingId;
    var styleLock = fill(T.styleLock, {
      MEDIUM: style.medium || "watercolor",
      PALETTE_TEMP: style.paletteTemp || "warm-soft",
      LINE_WEIGHT: style.lineWeight || "light",
      LIGHTING: style.lighting || "diffused daylight"
    });
    var characterLock = fill(T.characterLock, {
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
    var structureLabel = SBS.labelOf(SBS.PRESETS.structures, structurePick.preset) || sanitize(structurePick.freeText, 80) || structurePick.preset || "起承転結";
    var charactersLine = ((bible && bible.characters) || []).map(function (ch) {
      var bits = [sanitize(ch.displayName, 20) || "(unnamed)"];
      if (ch.roleLabel || ch.role) bits.push("role: " + (ch.roleLabel || ch.role));
      if (ch.kindLabel || ch.kind) bits.push("kind: " + (ch.kindLabel || ch.kind));
      var pers = SBS.personalityLine ? SBS.personalityLine(ch) : "";
      if (pers) bits.push("personality: " + pers);
      return bits.join(", ");
    }).join("; ") || "(no characters)";
    var shared = {
      IMAGE_SYSTEM: T.imageSystem,
      STORY_SYSTEM: T.storySystem,
      STYLE_LOCK: locks.styleLock,
      CHARACTER_LOCK: locks.characterLock,
      WORLD_LOCK: locks.worldLock,
      NEGATIVE: locks.negative
    };
    var characterSheet = fill(T.characterSheet, shared);
    var pages = (book.spreads || []).map(function (spread) {
      var scene = spread.scene || "day";
      var copy = SCENE_COPY[scene] || SCENE_COPY.day;
      var page = pageToken(spread.n);
      var currentText = SBS.Story.plainText(spread.paragraphs, names);
      var image = fill(T.pageImage, {
        IMAGE_SYSTEM: shared.IMAGE_SYSTEM,
        STYLE_LOCK: shared.STYLE_LOCK,
        CHARACTER_LOCK: shared.CHARACTER_LOCK,
        WORLD_LOCK: shared.WORLD_LOCK,
        NEGATIVE: shared.NEGATIVE,
        PAGE: page.slice(1),
        SPREAD_TOTAL: String((book.spreads || []).length || 12),
        SCENE: scene,
        ROLE: spread.role || "story",
        SCENE_DIRECTION: copy.direction,
        WHO: whoFor(scene, names, bible),
        COMPOSITION: copy.composition
      });
      var text = fill(T.pageText, {
        STORY_SYSTEM: shared.STORY_SYSTEM,
        PAGE: page.slice(1),
        SPREAD_TOTAL: String((book.spreads || []).length || 12),
        TITLE: sanitize(intent.title || book.title, 40),
        THEME: themeLabel,
        SETTING: settingLabel,
        AUDIENCE: intent.audience || "",
        AUDIENCE_LABEL: audienceLabel,
        STRUCTURE: structureLabel,
        SCENE: scene,
        HERO: names.hero,
        HERO_PERSONALITY: (function () {
          var heroCh = ((bible && bible.characters) || []).filter(function (c) { return c.role === "hero"; })[0];
          return (SBS.personalityLine && heroCh && SBS.personalityLine(heroCh)) || "(unspecified)";
        }()),
        CHARACTERS_LINE: charactersLine,
        FRIEND_LINE: names.friend ? "Friend: " + names.friend : "Friend: (none)",
        TEXT_DIRECTION: intent.textDirection || book.textDirection || "yoko",
        FURIGANA: book.furigana ? "yes" : "no",
        SENTENCE_RULE: SENTENCE_RULES[intent.audience] || SENTENCE_RULES["age-4-6"],
        RUBY_RULE: book.furigana ? " If helpful, mark ruby as 漢字（かんじ）." : " Do not add furigana.",
        SCENE_DIRECTION: copy.direction,
        CURRENT_TEXT: currentText || "(empty)"
      });
      return {
        n: spread.n,
        page: page,
        scene: scene,
        role: spread.role,
        image: image,
        text: text,
        summary: copy.direction
      };
    });

    var dir = "prompt/" + id.bookId + "/";
    var files = [
      { path: dir + id.bookId + ".style-lock.txt", data: locks.styleLock },
      { path: dir + id.bookId + ".character-lock.txt", data: locks.characterLock },
      { path: dir + id.bookId + ".world-lock.txt", data: locks.worldLock },
      { path: dir + id.bookId + ".negative.txt", data: locks.negative },
      { path: dir + id.bookId + "_character-sheet.prompt.txt", data: characterSheet }
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
        text: "gemini-2.5-flash",
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
    downloadZip: downloadZip
  };

  global.SBS = SBS;
})(window);
