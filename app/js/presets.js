(function (global) {
  var SBS = global.SBS || {};

  SBS.LIMITS = {
    freeText: 200,
    name: 20,
    title: 40,
    dedication: 80,
    maxCharacters: 5,
    personalityMax: 3,
    pageText: 400
  };

  var PAGE_KEY = "sbs-page-count";
  var PAGE_COUNTS = [12, 18, 24];

  function normalizePageCount(value) {
    var n = parseInt(value, 10);
    return PAGE_COUNTS.indexOf(n) !== -1 ? n : 12;
  }

  SBS.pageCounts = PAGE_COUNTS;
  SBS.normalizePageCount = normalizePageCount;

  SBS.getPageCount = function getPageCount() {
    try {
      return normalizePageCount(window.localStorage.getItem(PAGE_KEY));
    } catch (err) {
      return 12;
    }
  };

  SBS.setPageCount = function setPageCount(value) {
    try {
      window.localStorage.setItem(PAGE_KEY, String(normalizePageCount(value)));
    } catch (err) {
      return;
    }
  };

  SBS.spreadCountOf = function spreadCountOf(pages) {
    return Math.round(normalizePageCount(pages) / 2);
  };

  SBS.pageModeLabel = function pageModeLabel(pages) {
    var n = pages == null ? SBS.getPageCount() : normalizePageCount(pages);
    return "見開き" + n + "ページ";
  };

  SBS.PRESETS = {
    themes: [
      { id: "yuuki", label: "勇気", kana: "ゆうき", kana79: "ゆうき" },
      { id: "kindness", label: "やさしさ", kana: "やさしさ", kana79: "やさしさ" },
      { id: "friendship", label: "友情", kana: "ゆうじょう", kana79: "友じょう" },
      { id: "challenge", label: "挑戦", kana: "ちょうせん", kana79: "ちょうせん" },
      { id: "family", label: "家族", kana: "かぞく", kana79: "家ぞく" },
      { id: "curiosity", label: "好奇心", kana: "こうきしん", kana79: "こうきしん" },
      { id: "nature", label: "自然を大切に", kana: "しぜんをたいせつに", kana79: "しぜんを大切に" },
      { id: "its-ok", label: "失敗しても大丈夫", kana: "しっぱいしてもだいじょうぶ", kana79: "しっぱいしてもだいじょうぶ" }
    ],
    audiences: [
      { id: "age-2-3", label: "2〜3歳", furiganaDefault: true },
      { id: "age-4-6", label: "4〜6歳", furiganaDefault: true },
      { id: "age-7-9", label: "7〜9歳", furiganaDefault: false },
      { id: "age-10-12", label: "10〜12歳", furiganaDefault: false },
      { id: "age-13-15", label: "13〜15歳", furiganaDefault: false },
      { id: "with-adults", label: "おとなと一緒に", furiganaDefault: false }
    ],
    structures: [
      { id: "kishotenketsu", label: "起承転結" },
      { id: "adventure", label: "小さな冒険" },
      { id: "repeat", label: "くりかえし" },
      { id: "problem", label: "問題→解決" },
      { id: "daily", label: "一日のできごと" },
      { id: "explain", label: "知ってほしいこと" }
    ],
    settings: [
      { id: "forest", label: "森", kana: "もり", kana79: "森" },
      { id: "sea", label: "海", kana: "うみ", kana79: "海" },
      { id: "town", label: "まち", kana: "まち", kana79: "まち" },
      { id: "school", label: "学校", kana: "がっこう", kana79: "学校" },
      { id: "home", label: "うち", kana: "うち", kana79: "うち" },
      { id: "space", label: "宇宙", kana: "うちゅう", kana79: "うちゅう" },
      { id: "fantasy", label: "ファンタジーの国", kana: "ファンタジーのくに", kana79: "ファンタジーの国" }
    ],
    moods: [
      { id: "watercolor", label: "やさしい水彩" },
      { id: "crayon", label: "クレヨン" },
      { id: "collage", label: "切り絵" },
      { id: "pastel", label: "やわらかいパステル" },
      { id: "night", label: "夜の絵本" },
      { id: "colored-pencil", label: "色えんぴつ" },
      { id: "sumi", label: "すみの絵" },
      { id: "felt", label: "フェルトの絵" },
      { id: "flat-color", label: "あざやかな色面" }
    ],
    directions: [
      { id: "yoko", label: "横書き" },
      { id: "tate", label: "縦書き" }
    ],
    roles: [
      { id: "hero", label: "主人公" },
      { id: "sibling", label: "主人公のきょうだい" },
      { id: "family", label: "主人公の家族" },
      { id: "friend", label: "友だち" },
      { id: "guide", label: "案内役" },
      { id: "rival", label: "ちょっとしたライバル" },
      { id: "enemy", label: "敵" }
    ],
    kinds: [
      { id: "child", label: "子ども" },
      { id: "adult", label: "おとな" },
      { id: "animal", label: "動物" },
      { id: "creature", label: "空想の生き物" },
      { id: "object", label: "もの（乗り物など）" },
      { id: "robot", label: "ロボット" },
      { id: "fairy", label: "妖精" },
      { id: "plush", label: "ぬいぐるみ" }
    ],
    personalities: [
      { id: "playful", label: "おちゃめ" },
      { id: "careful", label: "しんちょう" },
      { id: "kind", label: "やさしい" },
      { id: "brave", label: "ゆうかん" },
      { id: "curious", label: "こうきしんおうせい" },
      { id: "cheerful", label: "あかるい" },
      { id: "shy", label: "はずかしがり" },
      { id: "relaxed", label: "のんびり" },
      { id: "stubborn", label: "がんこ" },
      { id: "lonely", label: "さびしがり" },
      { id: "earnest", label: "まじめ" }
    ]
  };

  SBS.OMAKASE = {
    themePreset: "yuuki",
    themeFree: "",
    audience: "age-4-6",
    structure: "adventure",
    settingPreset: "forest",
    settingFree: "",
    mood: "watercolor",
    textDirection: "yoko",
    furigana: true,
    title: "くうのゆうき",
    dedication: "",
    characters: [
      {
        name: "くう",
        role: "hero",
        kind: "animal",
        personality: ["brave", "kind"],
        traits: "小さなくま。赤いマフラーがトレードマーク。"
      }
    ]
  };

  SBS.intentFromSeed = function intentFromSeed(seed) {
    seed = seed || {};
    return {
      schemaVersion: 1,
      theme: { preset: seed.themePreset || "", freeText: seed.themeFree || "" },
      audience: seed.audience || "",
      structure: typeof seed.structure === "object" && seed.structure
        ? { preset: seed.structure.preset || "", freeText: seed.structure.freeText || "" }
        : { preset: seed.structure || "", freeText: seed.structureFree || "" },
      setting: { preset: seed.settingPreset || "", freeText: seed.settingFree || "" },
      mood: typeof seed.mood === "object" && seed.mood
        ? { preset: seed.mood.preset || "", freeText: seed.mood.freeText || "" }
        : { preset: seed.mood || "", freeText: seed.moodFree || "" },
      textDirection: seed.textDirection || "yoko",
      furigana: seed.furigana !== false,
      title: seed.title || "",
      dedication: seed.dedication || "",
      pageCount: SBS.normalizePageCount(seed.pageCount || (SBS.getPageCount && SBS.getPageCount()) || 12),
      characters: (seed.characters || []).map(function (c) {
        return {
          name: c.name || "",
          role: c.role || "",
          roleFree: c.roleFree || "",
          kind: c.kind || "",
          kindFree: c.kindFree || "",
          personality: (c.personality || []).slice(),
          personalityFree: c.personalityFree || "",
          traits: c.traits || ""
        };
      })
    };
  };

  SBS.personalityLine = function personalityLine(ch) {
    var labels = [];
    ((ch && ch.personality) || []).forEach(function (id) {
      var label = SBS.labelOf(SBS.PRESETS.personalities, id);
      if (label) labels.push(label);
    });
    if (ch && ch.personalityFree) labels.push(String(ch.personalityFree).slice(0, 80));
    return labels.join("、");
  };

  SBS.structureOf = function structureOf(intent) {
    var raw = intent && intent.structure;
    if (!raw) return { preset: "", freeText: "" };
    if (typeof raw === "string") return { preset: raw, freeText: "" };
    return { preset: raw.preset || "", freeText: raw.freeText || "" };
  };

  SBS.moodOf = function moodOf(intent) {
    var raw = intent && intent.mood;
    if (!raw) return { preset: "", freeText: "" };
    if (typeof raw === "string") return { preset: raw, freeText: "" };
    return { preset: raw.preset || "", freeText: raw.freeText || "" };
  };

  SBS.labelOf = function labelOf(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i].label;
    }
    return "";
  };

  SBS.audienceWord = function audienceWord(list, field, audience) {
    var free = "";
    var id = "";
    var i;
    var item = null;
    if (field && typeof field === "object") {
      free = field.freeText || "";
      id = field.preset || "";
    } else if (typeof field === "string") {
      id = field;
    }
    if (free) return free;
    for (i = 0; i < (list || []).length; i += 1) {
      if (list[i].id === id) {
        item = list[i];
        break;
      }
    }
    if (!item) return "";
    if ((audience === "age-2-3" || audience === "age-4-6") && item.kana) return item.kana;
    if (audience === "age-7-9" && item.kana79) return item.kana79;
    return item.label;
  };

  global.SBS = SBS;
})(window);
