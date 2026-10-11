(function (global) {
  var SBS = global.SBS || {};

  var PALETTES = [
    { hair: "#3b2a1a", skin: "#f3d1b0", eyes: "#2c4a3a", clothesPrimary: "#c44536", clothesAccent: "#f4e3c1" },
    { hair: "#1f1a17", skin: "#e8c4a8", eyes: "#4a3728", clothesPrimary: "#3d6b8a", clothesAccent: "#e8d5a3" },
    { hair: "#6b3a2a", skin: "#f6ddc4", eyes: "#3a5a8c", clothesPrimary: "#6b8f4e", clothesAccent: "#f0d48a" },
    { hair: "#c4a574", skin: "#f0c9b0", eyes: "#6b3a2a", clothesPrimary: "#8b5a8c", clothesAccent: "#f7e6c8" },
    { hair: "#2a1f18", skin: "#c98a62", eyes: "#1f3a2e", clothesPrimary: "#d4782a", clothesAccent: "#2f5d50" }
  ];

  var ANIMAL_TONES = [
    { hair: "#6b4a28", skin: "#d4b07a" },
    { hair: "#3d2a1c", skin: "#e8c4a0" },
    { hair: "#8a6a3c", skin: "#f0d2a8" },
    { hair: "#5a4030", skin: "#c9a07a" },
    { hair: "#2f241c", skin: "#d8b898" }
  ];

  var ROBOT_TONES = [
    { hair: "#7a8b96", skin: "#c5d0d6" },
    { hair: "#5a6a72", skin: "#d8dee2" },
    { hair: "#8a9aa4", skin: "#b8c4cc" },
    { hair: "#4a555c", skin: "#cfd6da" },
    { hair: "#6e7c86", skin: "#e2e8ec" }
  ];

  var LOOK_MARKS = {
    child: [
      { keep: "short even bob, neat bangs, simple crew-neck shirt", never: "long wavy hair, pigtails, overalls" },
      { keep: "shoulder-length wavy hair, small side clip, knit cardigan", never: "short even bob, pigtails" },
      { keep: "short fluffy hair, overalls over a plain shirt", never: "long wavy hair, side clip" },
      { keep: "two short pigtails, striped long-sleeve shirt", never: "short even bob, cardigan" },
      { keep: "side-parted medium hair, rounded collar shirt", never: "pigtails, overalls" }
    ],
    adult: [
      { keep: "short tidy hair, simple collared shirt", never: "long wavy hair, pigtails" },
      { keep: "shoulder-length hair, soft cardigan", never: "short crop only, striped shirt" },
      { keep: "pulled-back hair, plain jacket", never: "loose long waves, overalls" },
      { keep: "side-parted hair, knit vest", never: "pigtails, crew-neck only" },
      { keep: "wavy medium hair, scarf-free coat", never: "short tidy crop, striped shirt" }
    ],
    animal: [
      { keep: "rounder muzzle, small inner-ear contrast, solid coat", never: "spots, long shaggy mane" },
      { keep: "slightly longer ears, lighter chest patch", never: "solid coat with no patch" },
      { keep: "short rounded ears, darker back stripe", never: "chest patch only" },
      { keep: "fluffier tail, two-tone paws", never: "solid one-color paws" },
      { keep: "wider face, short tail", never: "long fluffy tail" }
    ],
    plush: [
      { keep: "round stitched smile, button-like eyes, short felt ears", never: "long floppy ears" },
      { keep: "long floppy ears, visible seam on the belly", never: "button eyes only, short ears" },
      { keep: "tiny ribbon at the neck, compact body", never: "long floppy ears without a ribbon" },
      { keep: "patch on one paw, wider head", never: "neck ribbon" },
      { keep: "softer oval face, short stubby limbs", never: "button eyes and belly seam together" }
    ],
    robot: [
      { keep: "round head lamp, boxy body, two small antenna nubs", never: "wide visor face" },
      { keep: "wide visor face, compact body, one chest light", never: "round head lamp and antenna nubs" },
      { keep: "dome head, longer arms, tread-like feet", never: "boxy body with chest light only" },
      { keep: "square head, short antenna, jointed legs", never: "dome head, treads" },
      { keep: "oval visor, rounded shoulders, two chest dots", never: "square head, antenna nubs" }
    ],
    fairy: [
      { keep: "short cropped hair, small round wings, leaf-green clothes", never: "long hair, large butterfly wings" },
      { keep: "long loose hair, larger butterfly-like wings, petal skirt", never: "short crop, leaf clothes" },
      { keep: "two small buns, tiny pointed wings, wrap top", never: "long loose hair, petal skirt" },
      { keep: "side braid, narrow wings, vest over a tunic", never: "buns, leaf-green only" },
      { keep: "wavy bob, speckled wings, simple romper", never: "braid, vest" }
    ],
    creature: [
      { keep: "rounder snout, short horns, stocky body", never: "long horns, slim tail" },
      { keep: "longer ears, slim tail, lighter belly", never: "short horns, stocky body" },
      { keep: "small crest, shorter legs, mottled back", never: "long ears, slim tail" },
      { keep: "wide eyes, tufted cheeks, compact limbs", never: "crest, mottled back" },
      { keep: "soft mane, longer neck, plain coat", never: "tufted cheeks, short horns" }
    ],
    object: [
      { keep: "rounder silhouette, two simple eyes, short limbs", never: "tall thin silhouette" },
      { keep: "taller silhouette, one highlight spot, longer legs", never: "round compact body" },
      { keep: "wider base, small cap-like top, stubby arms", never: "tall thin legs" },
      { keep: "oval body, tiny ears or handles, short feet", never: "cap-like top" },
      { keep: "boxier body, soft corners, two-tone face", never: "oval body with handles" }
    ]
  };

  var KIND_BODY = {
    child: { headToBody: "1:4", heightUnits: 1, build: "child" },
    adult: { headToBody: "1:7", heightUnits: 1.45, build: "adult" },
    animal: { headToBody: "1:3.5", heightUnits: 0.85, build: "animal" },
    creature: { headToBody: "1:4", heightUnits: 1.1, build: "creature" },
    object: { headToBody: "1:2", heightUnits: 0.7, build: "object" },
    robot: { headToBody: "1:4", heightUnits: 1, build: "robot" },
    fairy: { headToBody: "1:3.5", heightUnits: 0.7, build: "fairy" },
    plush: { headToBody: "1:3", heightUnits: 0.8, build: "plush" }
  };

  var AGE_LOOK = {
    "age-2-3": {
      child: { headToBody: "1:2.5", heightUnits: 1, build: "toddler-chibi" },
      adult: { headToBody: "1:4", heightUnits: 1.35, build: "soft-adult" },
      style: "Default for 2-3: very simple toddler picture-book design. Huge head, round body, big friendly eyes, few details, soft felt-toy shapes. Not a realistic child."
    },
    "age-4-6": {
      child: { headToBody: "1:3", heightUnits: 1, build: "kindergarten-chibi" },
      adult: { headToBody: "1:5", heightUnits: 1.4, build: "gentle-adult" },
      style: "Default for 4-6: kindergarten picture-book design. Large head, simple readable clothes, warm rounded faces. Easy to recognize from far away."
    },
    "age-7-9": {
      child: { headToBody: "1:4", heightUnits: 1, build: "early-elementary" },
      adult: { headToBody: "1:6.5", heightUnits: 1.45, build: "adult" },
      style: "Default for 7-9: classic elementary picture-book child. Readable face, school-age proportions, still stylized not photoreal."
    },
    "age-10-12": {
      child: { headToBody: "1:5", heightUnits: 1, build: "upper-elementary" },
      adult: { headToBody: "1:7", heightUnits: 1.5, build: "adult" },
      style: "Default for 10-12: upper-elementary look. Longer limbs than a toddler book, still illustration, not teen fashion."
    },
    "age-13-15": {
      child: { headToBody: "1:6", heightUnits: 1, build: "junior-high" },
      adult: { headToBody: "1:7", heightUnits: 1.5, build: "adult" },
      style: "Default for 13-15: junior-high illustration. Teen proportions, everyday clothes, not chibi, not photoreal, not glamor."
    },
    "with-adults": {
      child: { headToBody: "1:5.5", heightUnits: 0.85, build: "child-in-adult-book" },
      adult: { headToBody: "1:7", heightUnits: 1.45, build: "adult" },
      style: "Default for reading with adults: naturalistic picture-book proportions, still painted not photo."
    }
  };

  function specialLookNote(ch, orig) {
    var traits = String((orig && orig.promptTraits) || ch.traits || "").replace(/\s+/g, " ").trim();
    var kindFree = String((orig && orig.promptKindFree) || ch.kindFree || "").replace(/\s+/g, " ").trim();
    if (/ちび|リアル|大人っぽ|中学生|高校|幼児|あかちゃん|赤ちゃん|プロポーション|頭身|写実/.test(traits)) {
      return traits;
    }
    if (kindFree && !ch.kind) return kindFree;
    return "";
  }

  var MOOD_STYLE = {
    watercolor: { medium: "watercolor", paletteTemp: "warm-soft", lineWeight: "light", lighting: "diffused daylight" },
    crayon: { medium: "crayon", paletteTemp: "bright", lineWeight: "waxy", lighting: "flat cheerful" },
    collage: { medium: "paper collage", paletteTemp: "layered", lineWeight: "cut-edge", lighting: "studio paper" },
    pastel: { medium: "pastel", paletteTemp: "powdery", lineWeight: "soft", lighting: "hazy morning" },
    night: { medium: "gouache night", paletteTemp: "cool-dark", lineWeight: "gentle", lighting: "moon and lamps" },
    "colored-pencil": { medium: "colored pencil", paletteTemp: "muted-warm", lineWeight: "fine graphite", lighting: "soft desk light" },
    sumi: { medium: "sumi ink wash", paletteTemp: "ink-and-paper", lineWeight: "brush bleed", lighting: "quiet paper white" },
    felt: { medium: "felt and wool applique", paletteTemp: "tactile-soft", lineWeight: "stitched edge", lighting: "even nursery light" },
    "flat-color": { medium: "flat color fill", paletteTemp: "clean-bright", lineWeight: "even contour", lighting: "even picture-book light" }
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

  var COLOR_WORDS = [
    { keys: ["赤", "あか"], hex: "#c44536" },
    { keys: ["青", "あお"], hex: "#3d6b8a" },
    { keys: ["緑", "みどり"], hex: "#6b8f4e" },
    { keys: ["黄", "きいろ"], hex: "#e0b83a" },
    { keys: ["白", "しろ"], hex: "#f4ead8" },
    { keys: ["黒", "くろ"], hex: "#2b211c" },
    { keys: ["ピンク"], hex: "#e8899a" },
    { keys: ["オレンジ"], hex: "#e07a3d" }
  ];

  function parseTraits(traits) {
    var text = String(traits || "");
    var color = "";
    var i;
    var j;
    for (i = 0; i < COLOR_WORDS.length; i += 1) {
      for (j = 0; j < COLOR_WORDS[i].keys.length; j += 1) {
        if (text.indexOf(COLOR_WORDS[i].keys[j]) !== -1) {
          color = COLOR_WORDS[i].hex;
        }
      }
    }
    return {
      color: color,
      scarf: /マフラー|スカーフ/.test(text),
      glasses: /眼鏡|めがね|メガネ/.test(text)
    };
  }

  function characterId(index) {
    return "char-" + String.fromCharCode(97 + index);
  }

  function authorHasLook(orig, ch) {
    var t = String((orig && orig.promptTraits) || ch.traits || "");
    return /髪|ヘア|服|シャツ|ワンピース|ズボン|スカート|リボン|帽子|ぼうし|マフラー|スカーフ|眼鏡|めがね|メガネ|耳|しっぽ|羽|つばさ|ひげ|水玉|しま|ストライプ/.test(t);
  }

  function authorWantsTwinLook(orig, ch) {
    var t = [
      (orig && orig.promptTraits) || ch.traits,
      (orig && orig.promptKindFree) || ch.kindFree,
      ch.roleFree,
      ch.name
    ].join(" ");
    return /双子|ふたご|クローン|同じ姿|そっくり|twins?/i.test(t);
  }

  function takeUnused(list, start, usedKeys, prefix) {
    var i;
    var idx;
    var key;
    if (!list || !list.length) return { item: null, index: 0 };
    for (i = 0; i < list.length; i += 1) {
      idx = (start + i) % list.length;
      key = prefix + idx;
      if (usedKeys.indexOf(key) === -1) {
        usedKeys.push(key);
        return { item: list[idx], index: idx };
      }
    }
    idx = start % list.length;
    return { item: list[idx], index: idx };
  }

  SBS.Bible = {
    fromIntent: function fromIntent(intent) {
      var usedClothes = [];
      var usedMarks = [];
      var usedAnimal = [];
      var usedRobot = [];
      var characters = (intent.characters || []).map(function (ch, index) {
        var orig = SBS.Originality && SBS.Originality.forCharacter
          ? SBS.Originality.forCharacter(ch)
          : { flagged: false, promptName: ch.name, promptTraits: ch.traits, promptKindFree: ch.kindFree };
        var look = AGE_LOOK[intent.audience] || AGE_LOOK["age-4-6"];
        var parsed = parseTraits(orig.promptTraits || ch.traits);
        var special = specialLookNote(ch, orig);
        var body = KIND_BODY[ch.kind] || KIND_BODY.child;
        if (!special) {
          if (!ch.kind || ch.kind === "child") body = look.child;
          else if (ch.kind === "adult") body = look.adult;
        }
        var kindLabel = SBS.labelOf(SBS.PRESETS.kinds, ch.kind) || String(orig.promptKindFree || ch.kindFree || "").slice(0, 40) || ch.kind || "子ども";
        var roleLabel = SBS.labelOf(SBS.PRESETS.roles, ch.role) || String(ch.roleFree || "").slice(0, 40) || ch.role || "";
        var personalityNote = SBS.personalityLine ? SBS.personalityLine(ch) : "";
        if (personalityNote && SBS.Originality && SBS.Originality.rewrite) {
          personalityNote = SBS.Originality.rewrite(personalityNote);
        }
        var palPick = takeUnused(
          PALETTES,
          hashIndex(ch.name + (ch.kind || ch.kindFree || "") + String(index), PALETTES.length),
          usedClothes,
          "pal-"
        );
        var basePal = palPick.item || PALETTES[0];
        var palette = {
          hair: basePal.hair,
          skin: basePal.skin,
          eyes: basePal.eyes,
          clothesPrimary: parsed.color || basePal.clothesPrimary,
          clothesAccent: basePal.clothesAccent,
          scarf: parsed.scarf ? (parsed.color || "#c44536") : ""
        };
        if (ch.kind === "animal" || ch.kind === "plush") {
          var animalTone = takeUnused(
            ANIMAL_TONES,
            hashIndex((ch.name || "") + ch.kind + String(index), ANIMAL_TONES.length),
            usedAnimal,
            "an-"
          ).item || ANIMAL_TONES[0];
          palette.hair = animalTone.hair;
          palette.skin = animalTone.skin;
        }
        if (ch.kind === "robot") {
          var robotTone = takeUnused(
            ROBOT_TONES,
            hashIndex((ch.name || "") + String(index), ROBOT_TONES.length),
            usedRobot,
            "ro-"
          ).item || ROBOT_TONES[0];
          palette.hair = robotTone.hair;
          palette.skin = robotTone.skin;
        }
        if (ch.kind === "fairy") {
          palette.hair = index % 2 === 0 ? "#d4b07a" : "#6b3a2a";
          palette.clothesAccent = index % 2 === 0 ? "#e8d5ff" : "#9ad0c0";
        }
        var keep = (SBS.Originality && SBS.Originality.keepLines)
          ? SBS.Originality.keepLines(orig)
          : ["この絵本だけのオリジナルデザイン"];
        if (orig.promptTraits) keep.push("Author features first: " + String(orig.promptTraits).slice(0, 80));
        if (special) {
          keep.push("Keep the named look; do not replace it with a generic age default.");
        } else {
          keep.push(look.style);
          if (ch.kind && ch.kind !== "child" && ch.kind !== "adult") {
            keep.push("Stylize this " + (ch.kind || "character") + " for the book's audience, still the same species.");
          }
        }
        if (ch.kind === "animal" || ch.kind === "plush") keep.push("動物としての輪郭を保つ");
        if (ch.kind === "robot") keep.push("ロボットとしての輪郭を保つ");
        if (ch.kind === "fairy") keep.push("小さな妖精の体を保つ");
        if (personalityNote) keep.push("性格: " + personalityNote);
        if (parsed.scarf) keep.push("マフラーを常に描く");
        var never = (SBS.Originality && SBS.Originality.neverLines)
          ? SBS.Originality.neverLines(orig)
          : [];
        never = never.concat(["衣装の色を変えない", "年齢の見た目を変えない", "別の種族にしない"]);
        if (!authorWantsTwinLook(orig, ch)) {
          never.push("他の登場人物と同じ顔・同じ髪・同じ服・同じシルエットにしない");
          if (!authorHasLook(orig, ch) && !special) {
            var markKind = LOOK_MARKS[ch.kind] ? ch.kind : "child";
            var mark = takeUnused(
              LOOK_MARKS[markKind],
              hashIndex((ch.name || "") + markKind + String(index), LOOK_MARKS[markKind].length),
              usedMarks,
              markKind + "-"
            ).item;
            if (mark) {
              keep.push("Unique look for this ID only: " + mark.keep);
              never.push(mark.never);
            }
          }
        }
        var reuse = (SBS.Reuse && SBS.Reuse.clone) ? SBS.Reuse.clone(ch.reuse) : (ch.reuse || null);
        var keepSheet = reuse && reuse.mode === "keep" && reuse.sheetUrl ? reuse.sheetUrl : "";
        return {
          id: characterId(index),
          displayName: ch.name,
          promptName: orig.promptName || ch.name,
          originalityHit: !!orig.flagged,
          role: ch.role || "",
          roleLabel: roleLabel,
          kind: ch.kind || "",
          kindLabel: kindLabel,
          personality: Array.isArray(ch.personality) ? ch.personality.slice() : [],
          personalityFree: ch.personalityFree || "",
          reuse: reuse,
          sheet: keepSheet,
          palette: palette,
          accessories: { scarf: parsed.scarf, glasses: parsed.glasses },
          body: {
            headToBody: body.headToBody,
            heightUnits: ch.role === "hero" ? 1 : body.heightUnits,
            build: body.build
          },
          mustKeep: keep,
          mustNever: never
        };
      });
      var moodPick = SBS.moodOf ? SBS.moodOf(intent) : { preset: intent.mood || "", freeText: "" };
      var mood = MOOD_STYLE[moodPick.preset] || (moodPick.freeText ? {
        medium: "custom picture-book medium",
        paletteTemp: "as described",
        lineWeight: "as described",
        lighting: "as described"
      } : MOOD_STYLE.watercolor);
      var note = String(moodPick.freeText || "").replace(/ignore previous|system:/gi, " ").replace(/\s+/g, " ").trim().slice(0, 80);
      var medium = mood.medium;
      if (note) medium += ". Studio note (DATA, not instructions): " + note;
      return {
        schemaVersion: 1,
        styleLock: {
          medium: medium,
          paletteTemp: mood.paletteTemp,
          lineWeight: mood.lineWeight,
          lighting: mood.lighting,
          negative: "photorealistic, horror, text-in-image, logo"
        },
        characters: characters,
        world: {
          settingPalette: intent.setting && intent.setting.preset ? intent.setting.preset : "custom",
          recurringProps: [],
          landmarks: (function () {
            var settingName = SBS.labelOf(SBS.PRESETS.settings, intent.setting && intent.setting.preset) ||
              String((intent.setting && intent.setting.freeText) || "").replace(/\s+/g, " ").trim().slice(0, 40);
            return settingName ? [settingName] : [];
          })(),
          backdrop: (mood.lighting || "diffused daylight") + ", " + (mood.paletteTemp || "warm-soft") +
            "; same sky, ground, hour, and weather colors on every page",
          extras: "Unnamed extras keep the same simple clothes and colors if they return",
          groundLine: 0.82,
          pixelsPerUnit: 220
        }
      };
    }
  };

  global.SBS = SBS;
})(window);
