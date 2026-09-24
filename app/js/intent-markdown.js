(function (global) {
  var SBS = global.SBS || {};

  function trim(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function noun(value) {
    var text = trim(value);
    return text || "なし";
  }

  function idFromLabel(list, value) {
    var v = trim(value);
    var i;
    if (!v || v === "なし") return "";
    for (i = 0; i < (list || []).length; i += 1) {
      if (list[i].label === v || list[i].id === v) return list[i].id;
    }
    return "";
  }

  function pickValue(list, preset, freeText) {
    return SBS.labelOf(list, preset) || trim(freeText);
  }

  function xorPick(list, value) {
    var id = idFromLabel(list, value);
    if (id) return { preset: id, freeText: "" };
    return { preset: "", freeText: trim(value) === "なし" ? "" : trim(value) };
  }

  function emptyCharacter() {
    return {
      name: "",
      role: "",
      roleFree: "",
      kind: "",
      kindFree: "",
      personality: [],
      personalityFree: "",
      traits: ""
    };
  }

  function applyPersonality(ch, value) {
    var ids = [];
    var free = [];
    var max = (SBS.LIMITS && SBS.LIMITS.personalityMax) || 3;
    String(value || "").split(/[、,，]/).forEach(function (part) {
      var token = trim(part);
      var id;
      if (!token || token === "なし") return;
      id = idFromLabel(SBS.PRESETS.personalities, token);
      if (id && ids.indexOf(id) === -1 && ids.length < max) ids.push(id);
      else if (!id) free.push(token);
    });
    ch.personality = ids;
    if (ids.length < max && free.length) ch.personalityFree = free.join("、").slice(0, 80);
    else ch.personalityFree = "";
  }

  function applyRole(ch, value) {
    var id = idFromLabel(SBS.PRESETS.roles, value);
    if (id) {
      ch.role = id;
      ch.roleFree = "";
    } else {
      ch.role = "";
      ch.roleFree = trim(value) === "なし" ? "" : trim(value);
    }
  }

  function applyKind(ch, value) {
    var id = idFromLabel(SBS.PRESETS.kinds, value);
    if (id) {
      ch.kind = id;
      ch.kindFree = "";
    } else {
      ch.kind = "";
      ch.kindFree = trim(value) === "なし" ? "" : trim(value);
    }
  }

  function furiganaValue(flag) {
    return flag ? "あり" : "なし";
  }

  function parseFurigana(value) {
    var v = trim(value);
    if (/なし|つけない|off|no/i.test(v)) return false;
    return true;
  }

  function parsePageCount(value) {
    var n = parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
    return SBS.normalizePageCount ? SBS.normalizePageCount(n) : 12;
  }

  function stringify(intent) {
    intent = intent || {};
    var P = SBS.PRESETS;
    var theme = pickValue(P.themes, intent.theme && intent.theme.preset, intent.theme && intent.theme.freeText);
    var structure = SBS.structureOf ? SBS.structureOf(intent) : { preset: "", freeText: "" };
    var setting = intent.setting || {};
    var mood = SBS.moodOf ? SBS.moodOf(intent) : { preset: "", freeText: "" };
    var lines = [
      "<!-- sbs-brief:1 -->",
      "# 絵本指定",
      "",
      "- テーマ：" + noun(theme),
      "- 対象：" + noun(SBS.labelOf(P.audiences, intent.audience)),
      "- おはなしの型：" + noun(pickValue(P.structures, structure.preset, structure.freeText)),
      "- 舞台：" + noun(pickValue(P.settings, setting.preset, setting.freeText)),
      "- 絵の雰囲気：" + noun(pickValue(P.moods, mood.preset, mood.freeText)),
      "- 組方向：" + noun(SBS.labelOf(P.directions, intent.textDirection || "yoko")),
      "- ふりがな：" + furiganaValue(intent.furigana !== false),
      "- ページ数：" + (SBS.pageModeLabel ? SBS.pageModeLabel(intent.pageCount) : "見開き12ページ"),
      "- タイトル：" + noun(intent.title),
      "- 献辞：" + noun(intent.dedication),
      ""
    ];
    (intent.characters || []).forEach(function (ch, index) {
      var role = SBS.labelOf(P.roles, ch.role) || trim(ch.roleFree);
      var kind = SBS.labelOf(P.kinds, ch.kind) || trim(ch.kindFree);
      var pers = SBS.personalityLine ? SBS.personalityLine(ch) : "";
      lines.push("## 登場人物" + (index + 1));
      lines.push("- なまえ：" + noun(ch.name));
      lines.push("- やくわり：" + noun(role));
      lines.push("- しゅるい：" + noun(kind));
      lines.push("- せいかく：" + noun(pers));
      lines.push("- とくちょう：" + noun(ch.traits));
      lines.push("");
    });
    return lines.join("\n").replace(/\n+$/, "\n");
  }

  function stripFence(text) {
    var raw = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
    var fenced = raw.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
    return fenced ? fenced[1].replace(/\s+$/, "") : raw;
  }

  function parse(text) {
    var raw = stripFence(text);
    var intent = {
      schemaVersion: 1,
      theme: { preset: "", freeText: "" },
      audience: "",
      structure: { preset: "", freeText: "" },
      setting: { preset: "", freeText: "" },
      mood: { preset: "", freeText: "" },
      textDirection: "yoko",
      furigana: true,
      title: "",
      dedication: "",
      pageCount: SBS.getPageCount ? SBS.getPageCount() : 12,
      characters: [],
      briefMarkdown: raw
    };
    var chars = [];
    var current = null;
    var error = "";

    function flushChar() {
      if (current) chars.push(current);
      current = null;
    }

    function ensureChar() {
      if (!current) current = emptyCharacter();
      return current;
    }

    raw.split("\n").forEach(function (row) {
      var line = String(row || "").trim();
      var match;
      var key;
      var val;
      var pick;
      if (!line || line.indexOf("<!--") === 0) return;
      if (/^#+\s*登場人物/.test(line)) {
        flushChar();
        current = emptyCharacter();
        return;
      }
      match = line.match(/^[-*]\s*(.+?)[：:]\s*(.*)$/);
      if (!match) return;
      key = trim(match[1]);
      val = trim(match[2]);
      if (key === "テーマ") {
        pick = xorPick(SBS.PRESETS.themes, val);
        intent.theme = { preset: pick.preset, freeText: pick.freeText };
      } else if (key === "対象" || key === "だれのための絵本") {
        intent.audience = idFromLabel(SBS.PRESETS.audiences, val) || intent.audience;
      } else if (key === "おはなしの型" || key === "型") {
        pick = xorPick(SBS.PRESETS.structures, val);
        intent.structure = { preset: pick.preset, freeText: pick.freeText };
      } else if (key === "舞台") {
        pick = xorPick(SBS.PRESETS.settings, val);
        intent.setting = { preset: pick.preset, freeText: pick.freeText };
      } else if (key === "絵の雰囲気" || key === "雰囲気") {
        pick = xorPick(SBS.PRESETS.moods, val);
        intent.mood = { preset: pick.preset, freeText: pick.freeText };
      } else if (key === "組方向") {
        intent.textDirection = idFromLabel(SBS.PRESETS.directions, val) || "yoko";
      } else if (key === "ふりがな") {
        intent.furigana = parseFurigana(val);
      } else if (key === "ページ数") {
        intent.pageCount = parsePageCount(val);
      } else if (key === "タイトル") {
        intent.title = val === "なし" ? "" : val.slice(0, (SBS.LIMITS && SBS.LIMITS.title) || 40);
      } else if (key === "献辞") {
        intent.dedication = val === "なし" ? "" : val.slice(0, (SBS.LIMITS && SBS.LIMITS.dedication) || 80);
      } else if (key === "なまえ" || key === "名前") {
        ensureChar().name = val === "なし" ? "" : val.slice(0, (SBS.LIMITS && SBS.LIMITS.name) || 20);
      } else if (key === "やくわり") {
        applyRole(ensureChar(), val);
      } else if (key === "しゅるい") {
        applyKind(ensureChar(), val);
      } else if (key === "せいかく") {
        applyPersonality(ensureChar(), val);
      } else if (key === "とくちょう") {
        ensureChar().traits = val === "なし" ? "" : val.slice(0, (SBS.LIMITS && SBS.LIMITS.freeText) || 200);
      }
    });
    flushChar();
    if (chars.length) intent.characters = chars;
    var hero = chars.filter(function (ch) { return ch.role === "hero"; })[0];
    if (!intent.theme.preset && !intent.theme.freeText) error = "テーマが読めません。";
    else if (!intent.audience) error = "対象が読めません。";
    else if (!intent.structure.preset && !intent.structure.freeText) error = "おはなしの型が読めません。";
    else if (!intent.setting.preset && !intent.setting.freeText) error = "舞台が読めません。";
    else if (!intent.mood.preset && !intent.mood.freeText) error = "絵の雰囲気が読めません。";
    else if (!intent.characters.length) error = "登場人物が読めません。";
    else if (!hero) error = "主人公のやくわりが読めません。";
    else if (!hero.name) error = "主人公のなまえが読めません。";
    else if (!intent.title) error = "タイトルが読めません。";
    return { intent: intent, error: error };
  }

  function intentFromBook(book) {
    var src = (book && book.intent) || {};
    var intent = {
      schemaVersion: 1,
      theme: src.theme && typeof src.theme === "object"
        ? { preset: src.theme.preset || "", freeText: src.theme.freeText || "" }
        : { preset: src.theme || "", freeText: src.themeFree || "" },
      audience: src.audience || "",
      structure: src.structure && typeof src.structure === "object"
        ? { preset: src.structure.preset || "", freeText: src.structure.freeText || "" }
        : { preset: src.structure || "", freeText: src.structureFree || "" },
      setting: src.setting && typeof src.setting === "object"
        ? { preset: src.setting.preset || "", freeText: src.setting.freeText || "" }
        : { preset: src.settingPreset || "", freeText: src.settingFree || "" },
      mood: src.mood && typeof src.mood === "object"
        ? { preset: src.mood.preset || "", freeText: src.mood.freeText || "" }
        : { preset: src.mood || "", freeText: src.moodFree || "" },
      textDirection: src.textDirection || (book && book.textDirection) || "yoko",
      furigana: src.furigana != null ? src.furigana : !(book && book.furigana === false),
      title: src.title || (book && book.title) || "",
      dedication: src.dedication || (book && book.dedication) || "",
      pageCount: src.pageCount || (book && book.pageCount) || 12,
      characters: (src.characters || []).map(function (c) {
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
    if (!intent.characters.length && book && book.bible && book.bible.characters) {
      intent.characters = book.bible.characters.map(function (ch) {
        return {
          name: ch.displayName || "",
          role: ch.role || "",
          roleFree: "",
          kind: ch.kind || "",
          kindFree: ch.kindLabel || "",
          personality: (ch.personality || []).slice(),
          personalityFree: ch.personalityFree || "",
          traits: (ch.mustKeep || []).filter(function (item) {
            return item && item.indexOf("オリジナル") === -1 && item.indexOf("雰囲気") === -1;
          }).slice(0, 1).join("")
        };
      });
    }
    return intent;
  }

  function fromBook(book) {
    var src = (book && book.intent) || {};
    if (src.briefMarkdown && trim(src.briefMarkdown)) return stripFence(src.briefMarkdown);
    return stringify(intentFromBook(book));
  }

  function filename(intent) {
    var title = trim(intent && intent.title).replace(/[\\/:*?"<>|]/g, "").slice(0, 24);
    return (title || "絵本指定") + ".md";
  }

  function download(text, intent) {
    var body = stripFence(text);
    var name = filename(intent);
    var blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 800);
    return name;
  }

  function copy(text) {
    var inner = stripFence(text);
    var payload = "```markdown\n" + inner.replace(/\n+$/, "\n") + "```\n";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(payload);
    }
    return Promise.reject(new Error("clipboard"));
  }

  SBS.IntentMarkdown = {
    stringify: stringify,
    example: function example() {
      return stringify(SBS.intentFromSeed ? SBS.intentFromSeed(SBS.OMAKASE) : {
        theme: { preset: "yuuki", freeText: "" },
        audience: "age-4-6",
        structure: { preset: "adventure", freeText: "" },
        setting: { preset: "forest", freeText: "" },
        mood: { preset: "watercolor", freeText: "" },
        textDirection: "yoko",
        furigana: true,
        title: "くうのゆうき",
        dedication: "",
        pageCount: 12,
        characters: [{ name: "くう", role: "hero", kind: "animal", personality: ["brave"], traits: "" }]
      });
    },
    parse: parse,
    fromBook: fromBook,
    intentFromBook: intentFromBook,
    stripFence: stripFence,
    filename: filename,
    download: download,
    copy: copy
  };

  global.SBS = SBS;
})(window);
