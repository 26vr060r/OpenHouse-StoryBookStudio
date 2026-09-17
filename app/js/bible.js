(function (global) {
  var SBS = global.SBS || {};

  var PALETTES = [
    { hair: "#3b2a1a", skin: "#f3d1b0", eyes: "#2c4a3a", clothesPrimary: "#c44536", clothesAccent: "#f4e3c1" },
    { hair: "#1f1a17", skin: "#e8c4a8", eyes: "#4a3728", clothesPrimary: "#3d6b8a", clothesAccent: "#e8d5a3" },
    { hair: "#6b3a2a", skin: "#f6ddc4", eyes: "#3a5a8c", clothesPrimary: "#6b8f4e", clothesAccent: "#f0d48a" },
    { hair: "#c4a574", skin: "#f0c9b0", eyes: "#6b3a2a", clothesPrimary: "#8b5a8c", clothesAccent: "#f7e6c8" }
  ];

  var KIND_BODY = {
    child: { headToBody: "1:4", heightUnits: 1, build: "child" },
    adult: { headToBody: "1:7", heightUnits: 1.45, build: "adult" },
    animal: { headToBody: "1:3.5", heightUnits: 0.85, build: "animal" },
    creature: { headToBody: "1:4", heightUnits: 1.1, build: "creature" },
    object: { headToBody: "1:2", heightUnits: 0.7, build: "object" }
  };

  var MOOD_STYLE = {
    watercolor: { medium: "watercolor", paletteTemp: "warm-soft", lineWeight: "light", lighting: "diffused daylight" },
    crayon: { medium: "crayon", paletteTemp: "bright", lineWeight: "waxy", lighting: "flat cheerful" },
    collage: { medium: "paper collage", paletteTemp: "layered", lineWeight: "cut-edge", lighting: "studio paper" },
    pastel: { medium: "pastel", paletteTemp: "powdery", lineWeight: "soft", lighting: "hazy morning" },
    night: { medium: "gouache night", paletteTemp: "cool-dark", lineWeight: "gentle", lighting: "moon and lamps" }
  };

  function hashIndex(text, modulo) {
    var i;
    var h = 0;
    var str = String(text || "");
    for (i = 0; i < str.length; i += 1) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h) % modulo;
  }

  function characterId(index) {
    return "char-" + String.fromCharCode(97 + index);
  }

  SBS.Bible = {
    fromIntent: function fromIntent(intent) {
      var characters = (intent.characters || []).map(function (ch, index) {
        var body = KIND_BODY[ch.kind] || KIND_BODY.child;
        var palette = PALETTES[hashIndex(ch.name + ch.kind, PALETTES.length)];
        var keep = [];
        if (ch.traits) keep.push(ch.traits.slice(0, 80));
        if (ch.kind === "animal") keep.push("動物としての輪郭を保つ");
        return {
          id: characterId(index),
          displayName: ch.name,
          role: ch.role,
          kind: ch.kind,
          palette: palette,
          body: {
            headToBody: body.headToBody,
            heightUnits: ch.role === "hero" ? 1 : body.heightUnits,
            build: body.build
          },
          mustKeep: keep,
          mustNever: ["衣装の色を変えない", "年齢の見た目を変えない", "別の種族にしない"]
        };
      });
      var mood = MOOD_STYLE[intent.mood] || MOOD_STYLE.watercolor;
      return {
        schemaVersion: 1,
        styleLock: {
          medium: mood.medium,
          paletteTemp: mood.paletteTemp,
          lineWeight: mood.lineWeight,
          lighting: mood.lighting,
          negative: "photorealistic, horror, text-in-image, logo"
        },
        characters: characters,
        world: {
          settingPalette: intent.setting && intent.setting.preset ? intent.setting.preset : "custom",
          recurringProps: [],
          groundLine: 0.82,
          pixelsPerUnit: 220
        }
      };
    }
  };

  global.SBS = SBS;
})(window);
