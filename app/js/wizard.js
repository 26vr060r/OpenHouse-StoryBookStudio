(function (global) {
  var SBS = global.SBS || {};
  var STEP_COUNT = 4;
  var state = {
    step: 1,
    themePreset: "",
    themeFree: "",
    audience: "",
    structure: "",
    settingPreset: "",
    settingFree: "",
    mood: "",
    textDirection: "yoko",
    furigana: true,
    furiganaTouched: false,
    title: "",
    titleTouched: false,
    dedication: "",
    characters: []
  };

  function $(id) {
    return document.getElementById(id);
  }

  function emptyCharacter(role) {
    return {
      name: "",
      role: role || "friend",
      kind: "child",
      personality: [],
      traits: ""
    };
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
    state.settingFree = clampText(($("setting-free") && $("setting-free").value) || "", SBS.LIMITS.freeText);
    state.title = clampText(($("title-input") && $("title-input").value) || "", SBS.LIMITS.title);
    state.dedication = clampText(($("dedication-input") && $("dedication-input").value) || "", SBS.LIMITS.dedication);
    var furigana = $("furigana-input");
    if (furigana) state.furigana = furigana.checked;
  }

  function collectCharactersFromDom() {
    var cards = document.querySelectorAll(".character-card");
    var next = [];
    cards.forEach(function (card, index) {
      var nameEl = card.querySelector("[data-field=name]");
      var roleEl = card.querySelector("[data-field=role]");
      var kindEl = card.querySelector("[data-field=kind]");
      var traitsEl = card.querySelector("[data-field=traits]");
      var personality = [];
      card.querySelectorAll("[data-personality][aria-pressed=true]").forEach(function (btn) {
        personality.push(btn.getAttribute("data-personality"));
      });
      next.push({
        name: clampText(nameEl ? nameEl.value : "", SBS.LIMITS.name),
        role: roleEl ? roleEl.value : (index === 0 ? "hero" : "friend"),
        kind: kindEl ? kindEl.value : "child",
        personality: personality,
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
    if (heroCount === 0 && state.characters.length) {
      state.characters[0].role = "hero";
    }
    if (heroCount > 1) {
      var seen = false;
      for (i = 0; i < state.characters.length; i += 1) {
        if (state.characters[i].role === "hero") {
          if (seen) state.characters[i].role = "friend";
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
      theme: { preset: state.themePreset || "", freeText: state.themeFree },
      audience: state.audience,
      structure: state.structure,
      setting: { preset: state.settingPreset || "", freeText: state.settingFree },
      mood: state.mood,
      textDirection: state.textDirection,
      furigana: state.furigana,
      title: state.title || suggestTitle(),
      dedication: state.dedication,
      characters: state.characters.map(function (c) {
        return {
          name: c.name,
          role: c.role,
          kind: c.kind,
          personality: c.personality.slice(),
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
      if (!state.structure) return "おはなしの型を選んでください。";
    }
    if (step === 2) {
      if (!state.settingPreset && !state.settingFree.trim()) return "舞台を選ぶか、書いてください。";
      if (!state.mood) return "絵の雰囲気を選んでください。";
      if (!state.textDirection) return "組方向を選んでください。";
    }
    if (step === 3) {
      ensureHero();
      if (!state.characters.length) return "登場人物を一人以上入れてください。";
      if (!heroName().trim()) return "主人公の名前を入力してください。";
    }
    if (step === 4) {
      if (!(state.title || suggestTitle()).trim()) return "タイトルを入力してください。";
    }
    return "";
  }

  function showError(message) {
    var el = $("wizard-error");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
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
        "<label>やくわり" +
        "<select data-field=\"role\"></select>" +
        "</label>" +
        "<label>しゅるい" +
        "<select data-field=\"kind\"></select>" +
        "</label>" +
        "<p class=\"field-label\">せいかく</p>" +
        "<div class=\"chip-row\" data-personality-row></div>" +
        "<label>とくちょう" +
        "<textarea data-field=\"traits\" maxlength=\"" + SBS.LIMITS.freeText + "\" rows=\"2\"></textarea>" +
        "</label>";
      host.appendChild(card);

      var nameEl = card.querySelector("[data-field=name]");
      var roleEl = card.querySelector("[data-field=role]");
      var kindEl = card.querySelector("[data-field=kind]");
      var traitsEl = card.querySelector("[data-field=traits]");
      nameEl.value = ch.name;
      traitsEl.value = ch.traits;
      SBS.PRESETS.roles.forEach(function (opt) {
        var option = document.createElement("option");
        option.value = opt.id;
        option.textContent = opt.label;
        if (opt.id === ch.role) option.selected = true;
        roleEl.appendChild(option);
      });
      SBS.PRESETS.kinds.forEach(function (opt) {
        var option = document.createElement("option");
        option.value = opt.id;
        option.textContent = opt.label;
        if (opt.id === ch.kind) option.selected = true;
        kindEl.appendChild(option);
      });
      var row = card.querySelector("[data-personality-row]");
      SBS.PRESETS.personalities.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.textContent = opt.label;
        btn.setAttribute("data-personality", opt.id);
        btn.setAttribute("aria-pressed", ch.personality.indexOf(opt.id) !== -1 ? "true" : "false");
        btn.addEventListener("click", function () {
          var on = btn.getAttribute("aria-pressed") === "true";
          btn.setAttribute("aria-pressed", on ? "false" : "true");
        });
        row.appendChild(btn);
      });
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

  function fillSummary() {
    var intent = buildIntent();
    var P = SBS.PRESETS;
    $("summary-theme").textContent = SBS.labelOf(P.themes, intent.theme.preset) || intent.theme.freeText || "（未設定）";
    $("summary-audience").textContent = SBS.labelOf(P.audiences, intent.audience) || "（未設定）";
    $("summary-structure").textContent = SBS.labelOf(P.structures, intent.structure) || "（未設定）";
    $("summary-setting").textContent = SBS.labelOf(P.settings, intent.setting.preset) || intent.setting.freeText || "（未設定）";
    $("summary-mood").textContent = SBS.labelOf(P.moods, intent.mood) || "（未設定）";
    $("summary-direction").textContent = SBS.labelOf(P.directions, intent.textDirection);
    $("summary-furigana").textContent = intent.furigana ? "つける" : "つけない";
    $("summary-title").textContent = intent.title;
    $("summary-dedication").textContent = intent.dedication || "（なし）";
    $("summary-characters").textContent = intent.characters.map(function (c) {
      return (SBS.labelOf(P.roles, c.role) || c.role) + " " + (c.name || "（無名）");
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
  }

  function goStep(step) {
    state.step = step;
    [1, 2, 3, 4].forEach(function (n) {
      var panel = $("wizard-step-" + n);
      if (panel) panel.hidden = n !== step;
    });
    $("wizard-progress").textContent = "ステップ " + step + " / " + STEP_COUNT;
    $("btn-wizard-back").textContent = step === 1 ? "ホームへ" : "戻る";
    $("btn-wizard-next").textContent = step === 4 ? "この条件でつくる" : "つぎへ";
    showError("");
    if (step === 3) renderCharacters();
    if (step === 4) {
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

  function bindChips() {
    bindChipGroup("theme-chips", SBS.PRESETS.themes, function () { return state.themePreset; }, function (id) {
      state.themePreset = id;
    });
    bindChipGroup("audience-chips", SBS.PRESETS.audiences, function () { return state.audience; }, function (id) {
      state.audience = id;
      if (!state.furiganaTouched) {
        state.furigana = audienceFurigana(id);
        $("furigana-input").checked = state.furigana;
      }
    });
    bindChipGroup("structure-chips", SBS.PRESETS.structures, function () { return state.structure; }, function (id) {
      state.structure = id;
    });
    bindChipGroup("setting-chips", SBS.PRESETS.settings, function () { return state.settingPreset; }, function (id) {
      state.settingPreset = id;
    });
    bindChipGroup("mood-chips", SBS.PRESETS.moods, function () { return state.mood; }, function (id) {
      state.mood = id;
    });
    bindChipGroup("direction-chips", SBS.PRESETS.directions, function () { return state.textDirection; }, function (id) {
      state.textDirection = id;
    });
  }

  function applyIntent(intent) {
    state.themePreset = intent.themePreset || "";
    state.themeFree = intent.themeFree || "";
    state.audience = intent.audience || "";
    state.structure = intent.structure || "";
    state.settingPreset = intent.settingPreset || "";
    state.settingFree = intent.settingFree || "";
    state.mood = intent.mood || "";
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
            role: c.role || "hero",
            kind: c.kind || "child",
            personality: (c.personality || []).slice(),
            traits: c.traits || ""
          };
        })
      : [emptyCharacter("hero")];
  }

  function fillInputs() {
    $("theme-free").value = state.themeFree;
    $("setting-free").value = state.settingFree;
    $("furigana-input").checked = state.furigana;
    $("title-input").value = state.title;
    $("dedication-input").value = state.dedication;
  }

  SBS.Wizard = {
    start: function start(seed) {
      applyIntent(seed || {
        textDirection: "yoko",
        furigana: true,
        characters: [emptyCharacter("hero")]
      });
      fillInputs();
      bindChips();
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
      return buildIntent();
    },
    back: function back() {
      readFormIntoState();
      showError("");
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
    },
    markFuriganaTouched: function markFuriganaTouched() {
      state.furiganaTouched = true;
    },
    currentIntent: buildIntent
  };

  global.SBS = SBS;
})(window);
