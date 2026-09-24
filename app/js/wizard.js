(function (global) {
  var SBS = global.SBS || {};
  var STEP_COUNT = 4;
  var state = {
    step: 1,
    themePreset: "",
    themeFree: "",
    audience: "",
    structure: "",
    structureFree: "",
    settingPreset: "",
    settingFree: "",
    mood: "",
    moodFree: "",
    textDirection: "yoko",
    furigana: true,
    furiganaTouched: false,
    title: "",
    titleTouched: false,
    dedication: "",
    characters: [],
    briefTouched: false,
    promptOnly: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function emptyCharacter(role) {
    return {
      name: "",
      role: role || "friend",
      roleFree: "",
      kind: "child",
      kindFree: "",
      personality: [],
      personalityFree: "",
      traits: ""
    };
  }

  function personalityMax() {
    return (SBS.LIMITS && SBS.LIMITS.personalityMax) || 3;
  }

  function personalityCountOf(ch) {
    return ((ch && ch.personality) || []).length + (ch && String(ch.personalityFree || "").trim() ? 1 : 0);
  }

  function roleLabelOf(ch) {
    return SBS.labelOf(SBS.PRESETS.roles, ch.role) || String(ch.roleFree || "").trim() || ch.role || "";
  }

  function audienceFurigana(audienceId) {
    var list = SBS.PRESETS.audiences;
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === audienceId) return list[i].furiganaDefault;
    }
    return true;
  }

  function suggestTitle() {
    var hero = "";
    var theme = SBS.labelOf(SBS.PRESETS.themes, state.themePreset) || state.themeFree;
    var i;
    for (i = 0; i < state.characters.length; i += 1) {
      if (state.characters[i].role === "hero" && state.characters[i].name) {
        hero = state.characters[i].name;
        break;
      }
    }
    if (hero && theme) return hero + "の" + theme;
    if (hero) return hero + "の絵本";
    if (theme) return theme + "の絵本";
    return "わたしの絵本";
  }

  function renderChips(container, options, selectedId, onPick, multiSelected) {
    container.innerHTML = "";
    options.forEach(function (opt) {
      var btn = document.createElement("button");
      var pressed;
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = opt.label;
      btn.setAttribute("data-id", opt.id);
      if (multiSelected) {
        pressed = multiSelected.indexOf(opt.id) !== -1;
      } else {
        pressed = selectedId === opt.id;
      }
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      btn.addEventListener("click", function () {
        onPick(opt.id);
      });
      container.appendChild(btn);
    });
  }

  function clampText(value, max) {
    if (!value) return "";
    return String(value).slice(0, max);
  }

  function readFormIntoState() {
    state.themeFree = clampText(($("theme-free") && $("theme-free").value) || "", SBS.LIMITS.freeText);
    state.structureFree = clampText(($("structure-free") && $("structure-free").value) || "", SBS.LIMITS.freeText);
    state.settingFree = clampText(($("setting-free") && $("setting-free").value) || "", SBS.LIMITS.freeText);
    state.moodFree = clampText(($("mood-free") && $("mood-free").value) || "", SBS.LIMITS.freeText);
    state.title = clampText(($("title-input") && $("title-input").value) || "", SBS.LIMITS.title);
    state.dedication = clampText(($("dedication-input") && $("dedication-input").value) || "", SBS.LIMITS.dedication);
    var furigana = $("furigana-input");
    if (furigana) state.furigana = furigana.checked;
  }

  function collectCharactersFromDom() {
    var cards = document.querySelectorAll(".character-card");
    var next = [];
    cards.forEach(function (card) {
      var nameEl = card.querySelector("[data-field=name]");
      var roleBtn = card.querySelector("[data-role][aria-pressed=true]");
      var kindBtn = card.querySelector("[data-kind][aria-pressed=true]");
      var roleFreeEl = card.querySelector("[data-field=role-free]");
      var kindFreeEl = card.querySelector("[data-field=kind-free]");
      var personalityFreeEl = card.querySelector("[data-field=personality-free]");
      var traitsEl = card.querySelector("[data-field=traits]");
      var personality = [];
      card.querySelectorAll("[data-personality][aria-pressed=true]").forEach(function (btn) {
        personality.push(btn.getAttribute("data-personality"));
      });
      var role = roleBtn ? roleBtn.getAttribute("data-role") : "";
      var kind = kindBtn ? kindBtn.getAttribute("data-kind") : "";
      next.push({
        name: clampText(nameEl ? nameEl.value : "", SBS.LIMITS.name),
        role: role,
        roleFree: role ? "" : clampText(roleFreeEl ? roleFreeEl.value : "", SBS.LIMITS.freeText),
        kind: kind,
        kindFree: kind ? "" : clampText(kindFreeEl ? kindFreeEl.value : "", SBS.LIMITS.freeText),
        personality: personality,
        personalityFree: clampText(personalityFreeEl ? personalityFreeEl.value : "", SBS.LIMITS.freeText),
        traits: clampText(traitsEl ? traitsEl.value : "", SBS.LIMITS.freeText)
      });
    });
    if (next.length) state.characters = next;
  }

  function ensureHero() {
    var heroCount = 0;
    var i;
    for (i = 0; i < state.characters.length; i += 1) {
      if (state.characters[i].role === "hero") heroCount += 1;
    }
    if (heroCount === 0 && state.characters.length && !state.characters[0].role && !String(state.characters[0].roleFree || "").trim()) {
      state.characters[0].role = "hero";
      state.characters[0].roleFree = "";
    }
    if (heroCount > 1) {
      var seen = false;
      for (i = 0; i < state.characters.length; i += 1) {
        if (state.characters[i].role === "hero") {
          if (seen) {
            state.characters[i].role = "friend";
            state.characters[i].roleFree = "";
          }
          seen = true;
        }
      }
    }
  }

  function buildIntent() {
    readFormIntoState();
    collectCharactersFromDom();
    ensureHero();
    return {
      schemaVersion: 1,
      theme: state.themeFree.trim()
        ? { preset: "", freeText: state.themeFree }
        : { preset: state.themePreset || "", freeText: "" },
      audience: state.audience,
      structure: state.structureFree.trim()
        ? { preset: "", freeText: state.structureFree }
        : { preset: state.structure || "", freeText: "" },
      setting: state.settingFree.trim()
        ? { preset: "", freeText: state.settingFree }
        : { preset: state.settingPreset || "", freeText: "" },
      mood: state.moodFree.trim()
        ? { preset: "", freeText: state.moodFree }
        : { preset: state.mood || "", freeText: "" },
      textDirection: state.textDirection,
      furigana: state.furigana,
      title: state.title || suggestTitle(),
      dedication: state.dedication,
      pageCount: SBS.getPageCount ? SBS.getPageCount() : 12,
      characters: state.characters.map(function (c) {
        return {
          name: c.name,
          role: c.role || "",
          roleFree: c.roleFree || "",
          kind: c.kind || "",
          kindFree: c.kindFree || "",
          personality: (c.personality || []).slice(),
          personalityFree: c.personalityFree || "",
          traits: c.traits
        };
      })
    };
  }

  function heroName() {
    var i;
    for (i = 0; i < state.characters.length; i += 1) {
      if (state.characters[i].role === "hero") return state.characters[i].name;
    }
    return state.characters[0] ? state.characters[0].name : "";
  }

  function validateStep(step) {
    readFormIntoState();
    if (step === 3) collectCharactersFromDom();
    if (step === 1) {
      if (!state.themePreset && !state.themeFree.trim()) return "テーマを選ぶか、伝えたいことを書いてください。";
      if (!state.audience) return "だれのための絵本かを選んでください。";
      if (!state.structure && !state.structureFree.trim()) return "おはなしの型を選ぶか、書いてください。";
    }
    if (step === 2) {
      if (!state.settingPreset && !state.settingFree.trim()) return "舞台を選ぶか、書いてください。";
      if (!state.mood && !state.moodFree.trim()) return "絵の雰囲気を選ぶか、書いてください。";
      if (!state.textDirection) return "組方向を選んでください。";
    }
    if (step === 3) {
      ensureHero();
      if (!state.characters.length) return "登場人物を一人以上入れてください。";
      var heroCount = 0;
      var i;
      var ch;
      for (i = 0; i < state.characters.length; i += 1) {
        ch = state.characters[i];
        if (ch.role === "hero") heroCount += 1;
        if (!ch.role && !String(ch.roleFree || "").trim()) return "やくわりを選ぶか、書いてください。";
        if (!ch.kind && !String(ch.kindFree || "").trim()) return "しゅるいを選ぶか、書いてください。";
        if (personalityCountOf(ch) > personalityMax()) return "せいかくは3つまでです。";
      }
      if (heroCount === 0) return "主人公のやくわりを一人選んでください。";
      if (heroCount > 1) return "主人公は一人だけにしてください。";
      if (!heroName().trim()) return "主人公の名前を入力してください。";
    }
    if (step === 4) {
      if (state.promptOnly && (!briefEl() || !briefEl().value.trim())) {
        return "マークダウンを貼るか、書いてください。";
      }
      if (!(state.title || suggestTitle()).trim() && !(briefEl() && briefEl().value.trim())) {
        return "タイトルを入力してください。";
      }
      if (briefEl() && briefEl().value.trim()) {
        var parsed = parseBriefToIntent();
        if (parsed.error) return parsed.error;
      }
    }
    return "";
  }

  function showError(message) {
    var el = $("wizard-error");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  function clearPressed(row, attr) {
    row.querySelectorAll("[" + attr + "]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", "false");
    });
  }

  function bindExclusiveChipRow(row, attr, selectedId, freeInput, onPick) {
    var options = attr === "data-role" ? SBS.PRESETS.roles : SBS.PRESETS.kinds;
    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = opt.label;
      btn.setAttribute(attr, opt.id);
      btn.setAttribute("aria-pressed", selectedId === opt.id ? "true" : "false");
      btn.addEventListener("click", function () {
        var was = btn.getAttribute("aria-pressed") === "true";
        clearPressed(row, attr);
        if (was) {
          if (onPick) onPick("");
          return;
        }
        btn.setAttribute("aria-pressed", "true");
        if (freeInput) freeInput.value = "";
        if (onPick) onPick(opt.id);
      });
      row.appendChild(btn);
    });
    if (freeInput) {
      freeInput.addEventListener("input", function () {
        if (freeInput.value.trim()) clearPressed(row, attr);
      });
    }
  }

  function bindPersonalityRow(card, ch) {
    var row = card.querySelector("[data-personality-row]");
    var freeInput = card.querySelector("[data-field=personality-free]");
    SBS.PRESETS.personalities.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = opt.label;
      btn.setAttribute("data-personality", opt.id);
      btn.setAttribute("aria-pressed", ch.personality.indexOf(opt.id) !== -1 ? "true" : "false");
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") === "true";
        if (on) {
          btn.setAttribute("aria-pressed", "false");
          return;
        }
        var selected = card.querySelectorAll("[data-personality][aria-pressed=true]").length;
        if (freeInput && freeInput.value.trim()) selected += 1;
        if (selected >= personalityMax()) return;
        btn.setAttribute("aria-pressed", "true");
      });
      row.appendChild(btn);
    });
    if (freeInput) {
      freeInput.addEventListener("input", function () {
        if (!freeInput.value.trim()) return;
        var selected = card.querySelectorAll("[data-personality][aria-pressed=true]");
        if (selected.length >= personalityMax() && selected.length) {
          selected[selected.length - 1].setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  function renderCharacters() {
    var host = $("character-list");
    if (!host) return;
    host.innerHTML = "";
    state.characters.forEach(function (ch, index) {
      var card = document.createElement("article");
      card.className = "character-card";
      card.innerHTML =
        "<h3>登場人物 " + (index + 1) + "</h3>" +
        "<label>なまえ" +
        "<input data-field=\"name\" maxlength=\"" + SBS.LIMITS.name + "\" value=\"\">" +
        "</label>" +
        "<p class=\"field-label\">やくわり</p>" +
        "<div class=\"chip-row\" data-role-row></div>" +
        "<label>やくわりを自分で書く" +
        "<input data-field=\"role-free\" maxlength=\"" + SBS.LIMITS.freeText + "\" placeholder=\"例: 主人公のいとこ\">" +
        "</label>" +
        "<p class=\"field-label\">しゅるい</p>" +
        "<div class=\"chip-row\" data-kind-row></div>" +
        "<label>しゅるいを自分で書く" +
        "<input data-field=\"kind-free\" maxlength=\"" + SBS.LIMITS.freeText + "\" placeholder=\"例: 小さな竜\">" +
        "</label>" +
        "<p class=\"field-label\">せいかく（3つまで）</p>" +
        "<div class=\"chip-row\" data-personality-row></div>" +
        "<label>せいかくを自分で書く" +
        "<input data-field=\"personality-free\" maxlength=\"" + SBS.LIMITS.freeText + "\" placeholder=\"例: 歌がすき\">" +
        "</label>" +
        "<label>とくちょう" +
        "<textarea data-field=\"traits\" maxlength=\"" + SBS.LIMITS.freeText + "\" rows=\"2\"></textarea>" +
        "</label>" +
        "<p class=\"privacy-note\" data-originality-hint hidden></p>";
      host.appendChild(card);

      var nameEl = card.querySelector("[data-field=name]");
      var traitsEl = card.querySelector("[data-field=traits]");
      var roleFreeEl = card.querySelector("[data-field=role-free]");
      var kindFreeEl = card.querySelector("[data-field=kind-free]");
      var personalityFreeEl = card.querySelector("[data-field=personality-free]");
      nameEl.value = ch.name;
      traitsEl.value = ch.traits;
      roleFreeEl.value = ch.role ? "" : (ch.roleFree || "");
      kindFreeEl.value = ch.kind ? "" : (ch.kindFree || "");
      personalityFreeEl.value = ch.personalityFree || "";

      function refreshOriginalityHint() {
        var hint = card.querySelector("[data-originality-hint]");
        if (!hint || !SBS.Originality || !SBS.Originality.forCharacter) return;
        var info = SBS.Originality.forCharacter({
          name: nameEl.value,
          traits: traitsEl.value,
          roleFree: roleFreeEl.value,
          kindFree: kindFreeEl.value,
          personalityFree: personalityFreeEl.value
        });
        hint.hidden = !info.hint;
        hint.textContent = info.hint || "";
      }
      [nameEl, traitsEl, roleFreeEl, kindFreeEl, personalityFreeEl].forEach(function (el) {
        el.addEventListener("input", refreshOriginalityHint);
      });
      refreshOriginalityHint();

      bindExclusiveChipRow(card.querySelector("[data-role-row]"), "data-role", ch.role, roleFreeEl, function (id) {
        if (id !== "hero") return;
        document.querySelectorAll(".character-card").forEach(function (other) {
          if (other === card) return;
          var heroBtn = other.querySelector("[data-role=hero]");
          if (heroBtn && heroBtn.getAttribute("aria-pressed") === "true") {
            heroBtn.setAttribute("aria-pressed", "false");
            var friendBtn = other.querySelector("[data-role=friend]");
            if (friendBtn) friendBtn.setAttribute("aria-pressed", "true");
          }
        });
      });
      bindExclusiveChipRow(card.querySelector("[data-kind-row]"), "data-kind", ch.kind, kindFreeEl);
      bindPersonalityRow(card, ch);

      if (state.characters.length > 1) {
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "btn btn-ghost btn-small";
        remove.textContent = "この人を外す";
        remove.addEventListener("click", function () {
          collectCharactersFromDom();
          state.characters.splice(index, 1);
          ensureHero();
          renderCharacters();
        });
        card.appendChild(remove);
      }
    });
    $("btn-add-character").hidden = state.characters.length >= SBS.LIMITS.maxCharacters;
  }

  function briefEl() {
    return $("brief-markdown");
  }

  function showBriefError(message) {
    var el = $("brief-md-error");
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
  }

  function writeBriefFromIntent(intent) {
    var el = briefEl();
    if (!el || !SBS.IntentMarkdown) return;
    el.value = SBS.IntentMarkdown.stringify(intent);
    showBriefError("");
  }

  function parseBriefToIntent() {
    var el = briefEl();
    if (!el || !SBS.IntentMarkdown) return { intent: buildIntent(), error: "" };
    return SBS.IntentMarkdown.parse(el.value);
  }

  function applyParsedBrief(silent) {
    var parsed = parseBriefToIntent();
    if (parsed.error) {
      if (!silent) showBriefError(parsed.error);
      return parsed;
    }
    showBriefError("");
    applyIntent(parsed.intent);
    if (parsed.intent.pageCount && SBS.setPageCount) SBS.setPageCount(parsed.intent.pageCount);
    fillInputs();
    bindChips();
    return parsed;
  }

  function patchBriefLine(label, value) {
    var el = briefEl();
    if (!el) return;
    var re = new RegExp("^(-\\s*" + label + "[：:]).*$", "m");
    if (re.test(el.value)) el.value = el.value.replace(re, "$1" + (value || "なし"));
  }

  function fillSummary() {
    var intent = buildIntent();
    var P = SBS.PRESETS;
    $("summary-theme").textContent = SBS.labelOf(P.themes, intent.theme.preset) || intent.theme.freeText || "（未設定）";
    $("summary-audience").textContent = SBS.labelOf(P.audiences, intent.audience) || "（未設定）";
    var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" };
    $("summary-structure").textContent = SBS.labelOf(P.structures, structurePick.preset) || structurePick.freeText || "（未設定）";
    $("summary-setting").textContent = SBS.labelOf(P.settings, intent.setting.preset) || intent.setting.freeText || "（未設定）";
    var moodPick = SBS.moodOf ? SBS.moodOf(intent) : { preset: intent.mood || "", freeText: "" };
    $("summary-mood").textContent = SBS.labelOf(P.moods, moodPick.preset) || moodPick.freeText || "（未設定）";
    $("summary-direction").textContent = SBS.labelOf(P.directions, intent.textDirection);
    $("summary-furigana").textContent = intent.furigana ? "つける" : "つけない";
    $("summary-title").textContent = intent.title;
    $("summary-dedication").textContent = intent.dedication || "（なし）";
    $("summary-characters").textContent = intent.characters.map(function (c) {
      var role = roleLabelOf(c) || "（やくわり未設定）";
      var kind = SBS.labelOf(P.kinds, c.kind) || String(c.kindFree || "").trim();
      var pers = SBS.personalityLine ? SBS.personalityLine(c) : "";
      return role + " " + (c.name || "（無名）") + (kind ? "（" + kind + "）" : "") + (pers ? " / " + pers : "");
    }).join("、");

    var studio = $("studio-json");
    if (studio) {
      if (SBS.isStudio && SBS.isStudio()) {
        studio.hidden = false;
        studio.textContent = JSON.stringify(intent, null, 2);
      } else {
        studio.hidden = true;
      }
    }
    if (!state.briefTouched) writeBriefFromIntent(intent);
  }

  function goStep(step) {
    state.step = step;
    [1, 2, 3, 4].forEach(function (n) {
      var panel = $("wizard-step-" + n);
      if (panel) panel.hidden = n !== step;
    });
    $("wizard-progress").textContent = "ステップ " + step + " / " + STEP_COUNT;
    $("btn-wizard-back").textContent = (step === 1 || (state.promptOnly && step === 4)) ? "ホームへ" : "戻る";
    $("btn-wizard-next").textContent = step === 4 ? "この条件でつくる" : "つぎへ";
    showError("");
    if ($("brief-md-note")) $("brief-md-note").hidden = !!(state.promptOnly && step === 4);
    if ($("brief-md-note-prompt")) $("brief-md-note-prompt").hidden = !(state.promptOnly && step === 4);
    if (step === 3) renderCharacters();
    if (step === 4) {
      if (!state.promptOnly) state.briefTouched = false;
      if (!state.titleTouched) {
        $("title-input").value = suggestTitle();
        state.title = $("title-input").value;
      }
      fillSummary();
    }
  }

  function bindChipGroup(containerId, options, getter, setter) {
    function paint() {
      renderChips($(containerId), options, getter(), function (id) {
        setter(id);
        paint();
      });
    }
    paint();
  }

  function bindExclusiveChipGroup(containerId, options, getPreset, setPreset, freeId, setFree) {
    function paint() {
      renderChips($(containerId), options, getPreset(), function (id) {
        if (getPreset() === id) {
          setPreset("");
        } else {
          setPreset(id);
          setFree("");
          if ($(freeId)) $(freeId).value = "";
        }
        paint();
      });
    }
    paint();
    var freeEl = $(freeId);
    if (freeEl) {
      freeEl.oninput = function () {
        setFree(clampText(freeEl.value, SBS.LIMITS.freeText));
        if (freeEl.value.trim() && getPreset()) {
          setPreset("");
          paint();
        }
      };
    }
  }

  function bindChips() {
    bindExclusiveChipGroup("theme-chips", SBS.PRESETS.themes, function () {
      return state.themePreset;
    }, function (id) {
      state.themePreset = id;
    }, "theme-free", function (text) {
      state.themeFree = text;
    });
    bindChipGroup("audience-chips", SBS.PRESETS.audiences, function () { return state.audience; }, function (id) {
      state.audience = id;
      if (!state.furiganaTouched) {
        state.furigana = audienceFurigana(id);
        $("furigana-input").checked = state.furigana;
      }
    });
    bindExclusiveChipGroup("structure-chips", SBS.PRESETS.structures, function () {
      return state.structure;
    }, function (id) {
      state.structure = id;
    }, "structure-free", function (text) {
      state.structureFree = text;
    });
    bindExclusiveChipGroup("setting-chips", SBS.PRESETS.settings, function () {
      return state.settingPreset;
    }, function (id) {
      state.settingPreset = id;
    }, "setting-free", function (text) {
      state.settingFree = text;
    });
    bindExclusiveChipGroup("mood-chips", SBS.PRESETS.moods, function () {
      return state.mood;
    }, function (id) {
      state.mood = id;
    }, "mood-free", function (text) {
      state.moodFree = text;
    });
    bindChipGroup("direction-chips", SBS.PRESETS.directions, function () { return state.textDirection; }, function (id) {
      state.textDirection = id;
    });
  }

  function applyIntent(intent) {
    if (intent.theme && typeof intent.theme === "object") {
      state.themePreset = intent.theme.preset || "";
      state.themeFree = intent.theme.freeText || "";
    } else {
      state.themePreset = intent.themePreset || "";
      state.themeFree = intent.themeFree || "";
    }
    if (state.themePreset && state.themeFree) state.themeFree = "";
    state.audience = intent.audience || "";
    if (intent.structure && typeof intent.structure === "object") {
      state.structure = intent.structure.preset || "";
      state.structureFree = intent.structure.freeText || "";
    } else {
      state.structure = intent.structure || "";
      state.structureFree = intent.structureFree || "";
    }
    if (state.structure && state.structureFree) state.structureFree = "";
    if (intent.setting && typeof intent.setting === "object") {
      state.settingPreset = intent.setting.preset || "";
      state.settingFree = intent.setting.freeText || "";
    } else {
      state.settingPreset = intent.settingPreset || "";
      state.settingFree = intent.settingFree || "";
    }
    if (state.settingPreset && state.settingFree) state.settingFree = "";
    if (intent.mood && typeof intent.mood === "object") {
      state.mood = intent.mood.preset || "";
      state.moodFree = intent.mood.freeText || "";
    } else {
      state.mood = intent.mood || "";
      state.moodFree = intent.moodFree || "";
    }
    if (state.mood && state.moodFree) state.moodFree = "";
    state.textDirection = intent.textDirection || "yoko";
    state.furigana = intent.furigana !== false;
    state.furiganaTouched = typeof intent.furigana === "boolean";
    state.title = intent.title || "";
    state.titleTouched = !!intent.title;
    state.dedication = intent.dedication || "";
    state.characters = (intent.characters && intent.characters.length)
      ? intent.characters.map(function (c) {
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
      : [emptyCharacter("hero")];
  }

  function fillInputs() {
    $("theme-free").value = state.themeFree;
    if ($("structure-free")) $("structure-free").value = state.structureFree;
    $("setting-free").value = state.settingFree;
    if ($("mood-free")) $("mood-free").value = state.moodFree;
    $("furigana-input").checked = state.furigana;
    $("title-input").value = state.title;
    $("dedication-input").value = state.dedication;
  }

  function finishIntent() {
    var parsed = applyParsedBrief(false);
    if (parsed.error) return null;
    var intent = parsed.intent;
    if (!intent.title) intent.title = suggestTitle();
    intent.briefMarkdown = SBS.IntentMarkdown
      ? SBS.IntentMarkdown.stripFence(briefEl() ? briefEl().value : "")
      : "";
    return intent;
  }

  function bindBrief() {
    var editor = briefEl();
    if (!editor || editor.getAttribute("data-bound") === "1") return;
    editor.setAttribute("data-bound", "1");
    editor.addEventListener("input", function () {
      state.briefTouched = true;
      applyParsedBrief(true);
      fillSummaryLabelsOnly();
    });
    if ($("btn-brief-copy")) {
      $("btn-brief-copy").addEventListener("click", function () {
        if (!SBS.IntentMarkdown) return;
        SBS.IntentMarkdown.copy(editor.value).then(function () {
          $("btn-brief-copy").textContent = "コピーしました";
          window.setTimeout(function () {
            $("btn-brief-copy").textContent = "コピー";
          }, 1600);
        }).catch(function () {
          showBriefError("コピーできませんでした。枠内を選んでコピーしてください。");
        });
      });
    }
    if ($("btn-brief-download")) {
      $("btn-brief-download").addEventListener("click", function () {
        if (!SBS.IntentMarkdown) return;
        var parsed = parseBriefToIntent();
        SBS.IntentMarkdown.download(editor.value, parsed.intent);
      });
    }
  }

  function fillSummaryLabelsOnly() {
    var intent = buildIntent();
    var parsed = parseBriefToIntent();
    if (!parsed.error) intent = parsed.intent;
    var P = SBS.PRESETS;
    if ($("summary-theme")) $("summary-theme").textContent = SBS.labelOf(P.themes, intent.theme.preset) || intent.theme.freeText || "（未設定）";
    if ($("summary-audience")) $("summary-audience").textContent = SBS.labelOf(P.audiences, intent.audience) || "（未設定）";
    var structurePick = SBS.structureOf ? SBS.structureOf(intent) : { preset: intent.structure || "", freeText: "" };
    if ($("summary-structure")) $("summary-structure").textContent = SBS.labelOf(P.structures, structurePick.preset) || structurePick.freeText || "（未設定）";
    if ($("summary-setting")) $("summary-setting").textContent = SBS.labelOf(P.settings, intent.setting.preset) || intent.setting.freeText || "（未設定）";
    var moodPick = SBS.moodOf ? SBS.moodOf(intent) : { preset: intent.mood || "", freeText: "" };
    if ($("summary-mood")) $("summary-mood").textContent = SBS.labelOf(P.moods, moodPick.preset) || moodPick.freeText || "（未設定）";
    if ($("summary-direction")) $("summary-direction").textContent = SBS.labelOf(P.directions, intent.textDirection);
    if ($("summary-furigana")) $("summary-furigana").textContent = intent.furigana ? "つける" : "つけない";
    if ($("summary-title")) $("summary-title").textContent = intent.title || "（未設定）";
    if ($("summary-dedication")) $("summary-dedication").textContent = intent.dedication || "（なし）";
    if ($("summary-characters")) {
      $("summary-characters").textContent = (intent.characters || []).map(function (c) {
        var role = roleLabelOf(c) || "（やくわり未設定）";
        var kind = SBS.labelOf(P.kinds, c.kind) || String(c.kindFree || "").trim();
        var pers = SBS.personalityLine ? SBS.personalityLine(c) : "";
        return role + " " + (c.name || "（無名）") + (kind ? "（" + kind + "）" : "") + (pers ? " / " + pers : "");
      }).join("、");
    }
    if ($("title-input") && intent.title) $("title-input").value = intent.title;
    if ($("dedication-input")) $("dedication-input").value = intent.dedication || "";
  }

  SBS.Wizard = {
    start: function start(seed) {
      state.promptOnly = false;
      applyIntent(seed || {
        textDirection: "yoko",
        furigana: true,
        characters: [emptyCharacter("hero")]
      });
      fillInputs();
      bindChips();
      bindBrief();
      goStep(1);
    },
    next: function next() {
      var message = validateStep(state.step);
      if (message) {
        showError(message);
        return null;
      }
      if (state.step < 4) {
        goStep(state.step + 1);
        return null;
      }
      return finishIntent();
    },
    startPrompt: function startPrompt() {
      applyIntent({
        textDirection: "yoko",
        furigana: true,
        characters: [emptyCharacter("hero")]
      });
      state.title = "";
      state.titleTouched = true;
      state.briefTouched = true;
      state.promptOnly = true;
      fillInputs();
      bindChips();
      bindBrief();
      goStep(4);
      var editor = briefEl();
      if (editor) {
        editor.value = "";
        editor.placeholder = (SBS.IntentMarkdown && SBS.IntentMarkdown.example)
          ? SBS.IntentMarkdown.example()
          : "# 絵本指定\n- テーマ：勇気";
        editor.focus();
      }
      if ($("title-input")) $("title-input").value = "";
      if ($("dedication-input")) $("dedication-input").value = "";
      fillSummaryLabelsOnly();
    },
    back: function back() {
      readFormIntoState();
      showError("");
      if (state.promptOnly && state.step === 4) return "home";
      if (state.step === 1) return "home";
      if (state.step === 3) collectCharactersFromDom();
      goStep(state.step - 1);
      return "wizard";
    },
    addCharacter: function addCharacter() {
      collectCharactersFromDom();
      if (state.characters.length >= SBS.LIMITS.maxCharacters) return;
      state.characters.push(emptyCharacter("friend"));
      renderCharacters();
    },
    markTitleTouched: function markTitleTouched() {
      state.titleTouched = true;
      readFormIntoState();
      if ($("summary-title")) $("summary-title").textContent = state.title || suggestTitle();
      patchBriefLine("タイトル", state.title || suggestTitle());
    },
    markFuriganaTouched: function markFuriganaTouched() {
      state.furiganaTouched = true;
    },
    markDedication: function markDedication() {
      readFormIntoState();
      if ($("summary-dedication")) $("summary-dedication").textContent = state.dedication || "（なし）";
      patchBriefLine("献辞", state.dedication || "なし");
    },
    bindBrief: bindBrief,
    currentIntent: buildIntent
  };

  global.SBS = SBS;
})(window);
