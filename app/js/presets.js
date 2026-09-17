(function (global) {
  var SBS = global.SBS || {};

  SBS.LIMITS = {
    freeText: 200,
    name: 20,
    title: 40,
    dedication: 80,
    maxCharacters: 4
  };

  SBS.PRESETS = {
    themes: [
      { id: "yuuki", label: "勇気" },
      { id: "kindness", label: "やさしさ" },
      { id: "friendship", label: "友情" },
      { id: "challenge", label: "挑戦" },
      { id: "family", label: "家族" },
      { id: "curiosity", label: "好奇心" },
      { id: "nature", label: "自然を大切に" },
      { id: "its-ok", label: "失敗しても大丈夫" }
    ],
    audiences: [
      { id: "age-2-3", label: "2〜3歳", furiganaDefault: true },
      { id: "age-4-6", label: "4〜6歳", furiganaDefault: true },
      { id: "age-7-9", label: "7〜9歳", furiganaDefault: false },
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
      { id: "forest", label: "森" },
      { id: "sea", label: "海" },
      { id: "town", label: "まち" },
      { id: "school", label: "学校" },
      { id: "home", label: "うち" },
      { id: "space", label: "宇宙" },
      { id: "fantasy", label: "ファンタジーの国" }
    ],
    moods: [
      { id: "watercolor", label: "やさしい水彩" },
      { id: "crayon", label: "クレヨン" },
      { id: "collage", label: "切り絵" },
      { id: "pastel", label: "やわらかいパステル" },
      { id: "night", label: "夜の絵本" }
    ],
    directions: [
      { id: "yoko", label: "横書き" },
      { id: "tate", label: "縦書き" }
    ],
    roles: [
      { id: "hero", label: "主人公" },
      { id: "friend", label: "友だち" },
      { id: "family", label: "家族" },
      { id: "guide", label: "案内役" },
      { id: "rival", label: "ちょっとしたライバル" }
    ],
    kinds: [
      { id: "child", label: "子ども" },
      { id: "adult", label: "おとな" },
      { id: "animal", label: "動物" },
      { id: "creature", label: "空想の生き物" },
      { id: "object", label: "もの（乗り物など）" }
    ],
    personalities: [
      { id: "playful", label: "おちゃめ" },
      { id: "careful", label: "しんちょう" },
      { id: "kind", label: "やさしい" },
      { id: "brave", label: "ゆうかん" },
      { id: "curious", label: "こうきしんおうせい" },
      { id: "cheerful", label: "あかるい" }
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

  SBS.labelOf = function labelOf(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i].label;
    }
    return "";
  };

  global.SBS = SBS;
})(window);
