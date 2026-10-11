(function (global) {
  var SBS = global.SBS || {};
  var GATE_KEY = "sbs-reuse-chars";
  var sessionAllowed = false;
  var pickerState = null;
  var rememberedByName = {};

  function $(id) {
    return document.getElementById(id);
  }

  function readGate() {
    try {
      var raw = String(window.localStorage.getItem(GATE_KEY) || "").trim();
      if (raw === "off" || raw === "0" || raw === "false") return "off";
      return "on";
    } catch (err) {
      return "on";
    }
  }

  function writeGate(on) {
    try {
      window.localStorage.setItem(GATE_KEY, on ? "on" : "off");
    } catch (err) {
      /* ignore */
    }
  }

  function syncGateControl() {
    var gate = $("reuse-chars-gate");
    if (gate) gate.checked = readGate() === "on";
  }

  function cloneMood(mood) {
    var raw = mood || {};
    if (typeof raw === "string") return { preset: raw, freeText: "" };
    return { preset: raw.preset || "", freeText: raw.freeText || "" };
  }

  function asPersonalityIds(value) {
    if (Array.isArray(value)) {
      return value.filter(function (id) { return !!id; }).slice(0, 3);
    }
    return [];
  }

  function cloneReuse(reuse) {
    if (!reuse || !reuse.sourceBookId || !reuse.sourceCharId) return null;
    return {
      sourceBookId: String(reuse.sourceBookId || ""),
      sourceCharId: String(reuse.sourceCharId || ""),
      sourceMood: cloneMood(reuse.sourceMood),
      mode: reuse.mode === "regen" ? "regen" : "keep",
      sheetUrl: String(reuse.sheetUrl || ""),
      portraitUrl: String(reuse.portraitUrl || ""),
      moodAcked: !!reuse.moodAcked
    };
  }

  function sourceKey(reuse) {
    if (!reuse || !reuse.sourceBookId || !reuse.sourceCharId) return "";
    return String(reuse.sourceBookId) + "\t" + String(reuse.sourceCharId);
  }

  function moodLabel(mood) {
    var pick = cloneMood(mood);
    if (SBS.labelOf && SBS.PRESETS && SBS.PRESETS.moods && pick.preset) {
      var label = SBS.labelOf(SBS.PRESETS.moods, pick.preset);
      if (label) return label;
    }
    return String(pick.freeText || "").replace(/\s+/g, " ").trim();
  }

  function moodKey(mood) {
    var pick = cloneMood(mood);
    var free = String(pick.freeText || "").replace(/\s+/g, " ").trim();
    if (free) return "free:" + free;
    if (pick.preset) return "preset:" + pick.preset;
    return "";
  }

  function moodsDiffer(currentMood, sourceMood) {
    var now = moodKey(currentMood);
    var src = moodKey(sourceMood);
    if (!now || !src) return false;
    return now !== src;
  }

  function warnMessage(currentMood, sourceMood) {
    var src = moodLabel(sourceMood) || "（未設定）";
    var now = moodLabel(currentMood) || "（未設定）";
    return "元の絵本の雰囲気は「" + src + "」、今の絵本は「" + now +
      "」です。画風が割れることがあります。このデザインの再利用を続けますか？";
  }

  function takenKeys(characters, exceptIndex) {
    var keys = {};
    ((characters) || []).forEach(function (ch, i) {
      if (i === exceptIndex) return;
      var key = sourceKey(ch && ch.reuse);
      if (key) keys[key] = true;
    });
    return keys;
  }

  function canPick() {
    return readGate() === "on" && !!sessionAllowed;
  }

  function kindLabelOf(ch) {
    if (!ch) return "";
    if (SBS.labelOf && SBS.PRESETS && SBS.PRESETS.kinds && ch.kind) {
      return SBS.labelOf(SBS.PRESETS.kinds, ch.kind) || "";
    }
    return String(ch.kindFree || ch.kindLabel || "").trim();
  }

  function modeLabel(mode) {
    return mode === "regen"
      ? "再利用：情報だけ引き継ぎ、デザインを再生成"
      : "再利用：6面図をそのまま使う";
  }

  function sheetOf(sheets, ch, index) {
    var list = sheets || [];
    var found = list[index];
    var i;
    if (found && found.url && (!found.id || !ch || !ch.id || found.id === ch.id)) return found;
    if (ch && ch.id) {
      for (i = 0; i < list.length; i += 1) {
        if (list[i] && list[i].id === ch.id && list[i].url) return list[i];
      }
    }
    if (found && found.url) return found;
    return null;
  }

  function listCandidates() {
    if (!SBS.LibraryIO || !SBS.LibraryIO.listLocal) return Promise.resolve([]);
    return SBS.LibraryIO.listLocal().then(function (rows) {
      var out = [];
      (rows || []).forEach(function (row) {
        var bookId = (row.catalog && row.catalog.bookId) ||
          (row.record && row.record.bookId) || "";
        if (!bookId) return;
        var title = (row.catalog && row.catalog.title) ||
          (row.record && row.record.title) || "絵本";
        var intent = row.intent || {};
        var mood = SBS.moodOf ? SBS.moodOf(intent) : cloneMood(intent.mood);
        var bibleChars = (row.bible && row.bible.characters) || [];
        var intentChars = intent.characters || [];
        var sheets = row.characterSheets || [];
        if (!bibleChars.length && intentChars.length) {
          bibleChars = intentChars.map(function (ch, i) {
            return {
              id: (ch && ch.id) || ("char-" + i),
              displayName: ch && ch.name,
              kind: ch && ch.kind,
              kindLabel: kindLabelOf(ch)
            };
          });
        }
        bibleChars.forEach(function (ch, i) {
          var sheet = sheetOf(sheets, ch, i);
          if (!sheet || !sheet.url) return;
          var ic = intentChars[i] || {};
          out.push({
            key: bookId + "\t" + String((ch && ch.id) || i),
            bookId: bookId,
            charId: String((ch && ch.id) || ("char-" + i)),
            name: String((ch && ch.displayName) || ic.name || "").trim(),
            kind: ic.kind || (ch && ch.kind) || "",
            kindFree: ic.kindFree || "",
            kindLabel: (ch && ch.kindLabel) || kindLabelOf(ic) || "",
            personality: asPersonalityIds(ic.personality || (ch && ch.personality)),
            personalityFree: ic.personalityFree || (ch && ch.personalityFree) || "",
            traits: String(ic.traits || "").trim(),
            sheetUrl: sheet.url,
            portraitUrl: sheet.portraitUrl || "",
            bookTitle: String(title || "絵本"),
            mood: cloneMood(mood),
            moodLabel: moodLabel(mood) || "（雰囲気なし）"
          });
        });
      });
      return out;
    });
  }

  function applyToCharacter(ch, candidate, mode) {
    if (!ch || !candidate) return ch;
    var nameMax = (SBS.LIMITS && SBS.LIMITS.name) || 20;
    var textMax = (SBS.LIMITS && SBS.LIMITS.freeText) || 200;
    var persMax = (SBS.LIMITS && SBS.LIMITS.personalityMax) || 3;
    ch.name = String(candidate.name || "").slice(0, nameMax);
    ch.kind = candidate.kind || "";
    ch.kindFree = candidate.kind ? "" : String(candidate.kindFree || "").trim().slice(0, textMax);
    ch.personality = asPersonalityIds(candidate.personality).slice(0, persMax);
    ch.personalityFree = String(candidate.personalityFree || "").slice(0, textMax);
    ch.traits = String(candidate.traits || "").slice(0, textMax);
    ch.reuse = cloneReuse({
      sourceBookId: candidate.bookId,
      sourceCharId: candidate.charId,
      sourceMood: candidate.mood,
      mode: mode,
      sheetUrl: candidate.sheetUrl,
      portraitUrl: candidate.portraitUrl || "",
      moodAcked: true
    });
    remember(ch);
    return ch;
  }

  function remember(ch) {
    if (!ch || !ch.name || !ch.reuse) return;
    rememberedByName[String(ch.name)] = cloneReuse(ch.reuse);
  }

  function recoverOne(ch) {
    if (!ch) return ch;
    var reuse = cloneReuse(ch.reuse);
    if ((!reuse || !reuse.sheetUrl) && ch.name && rememberedByName[String(ch.name)]) {
      reuse = cloneReuse(rememberedByName[String(ch.name)]);
    }
    if (reuse) ch.reuse = reuse;
    return ch;
  }

  function recoverList(list) {
    (list || []).forEach(recoverOne);
    return list;
  }

  function resetPicks() {
    rememberedByName = {};
  }

  function clearReuse(ch) {
    if (!ch) return ch;
    if (ch.name && rememberedByName[String(ch.name)]) delete rememberedByName[String(ch.name)];
    ch.reuse = null;
    return ch;
  }

  function isKeep(ch) {
    return !!(ch && ch.reuse && ch.reuse.mode === "keep" && ch.reuse.sheetUrl);
  }

  function reuseOf(ch, intentCh) {
    recoverOne(ch);
    recoverOne(intentCh);
    return cloneReuse((ch && ch.reuse) || (intentCh && intentCh.reuse));
  }

  function pendingIndexes(book) {
    attachSheets(book);
    var chars = (book && book.bible && book.bible.characters) || [];
    var intentChars = (book && book.intent && book.intent.characters) || [];
    var sheets = (book && book.characterSheets) || [];
    var out = [];
    chars.forEach(function (ch, i) {
      if (sheets[i] && sheets[i].url) return;
      if (isKeep(ch) || isKeep(intentChars[i])) return;
      out.push(i);
    });
    return out;
  }

  function attachSheets(book) {
    if (!book) return book;
    var chars = (book.bible && book.bible.characters) || [];
    var intentChars = (book.intent && book.intent.characters) || [];
    recoverList(intentChars);
    recoverList(chars);
    if (!book.characterSheets) book.characterSheets = [];
    chars.forEach(function (ch, i) {
      var reuse = reuseOf(ch, intentChars[i]);
      if (ch && reuse) ch.reuse = reuse;
      if (intentChars[i] && reuse) intentChars[i].reuse = reuse;
      if (!book.characterSheets[i]) {
        book.characterSheets[i] = { id: (ch && ch.id) || "", url: "", portraitUrl: "", note: "", source: "" };
      }
      if (book.characterSheets[i] && ch && ch.id) book.characterSheets[i].id = ch.id;
      if (reuse && reuse.mode === "keep" && reuse.sheetUrl) {
        book.characterSheets[i].url = reuse.sheetUrl;
        book.characterSheets[i].portraitUrl = reuse.portraitUrl || book.characterSheets[i].portraitUrl || "";
        book.characterSheets[i].source = "reuse-keep";
        if (ch) ch.sheet = reuse.sheetUrl;
        if (!book.characterSheet) book.characterSheet = reuse.sheetUrl;
      }
    });
    return book;
  }

  function applyToBook(book, index, candidate, mode) {
    if (!book || index < 0) return book;
    if (!book.intent) book.intent = {};
    if (!book.intent.characters) book.intent.characters = [];
    if (!book.bible) book.bible = { characters: [] };
    if (!book.bible.characters) book.bible.characters = [];
    if (!book.intent.characters[index]) {
      book.intent.characters[index] = {
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
    var intentCh = book.intent.characters[index];
    var keepRole = intentCh.role || "";
    var keepRoleFree = intentCh.roleFree || "";
    applyToCharacter(intentCh, candidate, mode);
    intentCh.role = keepRole;
    intentCh.roleFree = keepRoleFree;
    if (SBS.Bible && SBS.Bible.fromIntent) {
      var rebuilt = SBS.Bible.fromIntent(book.intent);
      var old = book.bible.characters[index] || {};
      if (rebuilt && rebuilt.characters && rebuilt.characters[index]) {
        book.bible.characters[index] = rebuilt.characters[index];
        if (old.id) book.bible.characters[index].id = old.id;
      }
    } else if (book.bible.characters[index]) {
      book.bible.characters[index].displayName = intentCh.name;
      book.bible.characters[index].reuse = cloneReuse(intentCh.reuse);
    }
    if (!book.characterSheets) book.characterSheets = [];
    var ch = book.bible.characters[index] || {};
    var note = (book.characterSheets[index] && book.characterSheets[index].note) || "";
    book.characterSheets[index] = {
      id: ch.id || "",
      url: mode === "keep" ? (candidate.sheetUrl || "") : "",
      portraitUrl: mode === "keep" ? (candidate.portraitUrl || "") : "",
      note: note,
      source: mode === "keep" ? "reuse-keep" : ""
    };
    if (mode === "keep" && candidate.sheetUrl) {
      ch.sheet = candidate.sheetUrl;
      if (!book.characterSheet) book.characterSheet = candidate.sheetUrl;
    } else if (ch) {
      ch.sheet = "";
    }
    return book;
  }

  function clearBookReuse(book, index) {
    if (!book) return book;
    var intentCh = book.intent && book.intent.characters && book.intent.characters[index];
    if (intentCh) intentCh.reuse = null;
    var bibleCh = book.bible && book.bible.characters && book.bible.characters[index];
    if (bibleCh) {
      bibleCh.reuse = null;
      bibleCh.sheet = "";
    }
    if (book.characterSheets && book.characterSheets[index]) {
      book.characterSheets[index].url = "";
      book.characterSheets[index].portraitUrl = "";
      book.characterSheets[index].source = "";
    }
    return book;
  }

  function setBookMode(book, index, mode) {
    if (!book) return book;
    var intentCh = book.intent && book.intent.characters && book.intent.characters[index];
    var bibleCh = book.bible && book.bible.characters && book.bible.characters[index];
    var reuse = cloneReuse((intentCh && intentCh.reuse) || (bibleCh && bibleCh.reuse));
    if (!reuse) return book;
    reuse.mode = mode === "regen" ? "regen" : "keep";
    if (intentCh) intentCh.reuse = reuse;
    if (bibleCh) bibleCh.reuse = reuse;
    if (!book.characterSheets) book.characterSheets = [];
    if (!book.characterSheets[index]) {
      book.characterSheets[index] = { id: (bibleCh && bibleCh.id) || "", url: "", portraitUrl: "", note: "" };
    }
    if (reuse.mode === "keep" && reuse.sheetUrl) {
      book.characterSheets[index].url = reuse.sheetUrl;
      book.characterSheets[index].portraitUrl = reuse.portraitUrl || book.characterSheets[index].portraitUrl || "";
      book.characterSheets[index].source = "reuse-keep";
      if (bibleCh) bibleCh.sheet = reuse.sheetUrl;
    } else {
      book.characterSheets[index].url = "";
      book.characterSheets[index].portraitUrl = "";
      book.characterSheets[index].source = "";
      if (bibleCh) bibleCh.sheet = "";
    }
    return book;
  }

  function mismatched(characters, currentMood) {
    var now = cloneMood(currentMood);
    if (!moodKey(now)) return [];
    return ((characters) || []).filter(function (ch) {
      return ch && ch.reuse && !ch.reuse.moodAcked && moodsDiffer(now, ch.reuse.sourceMood);
    });
  }

  function ackMood(characters) {
    ((characters) || []).forEach(function (ch) {
      if (ch && ch.reuse) ch.reuse.moodAcked = true;
    });
  }

  function showPickerView(name) {
    var list = $("reuse-list");
    var mood = $("reuse-mood");
    var mode = $("reuse-mode");
    var empty = $("reuse-empty");
    var preview = $("reuse-preview");
    var dialog = $("reuse-dialog");
    if (list) list.hidden = name !== "list";
    if (mood) mood.hidden = name !== "mood";
    if (mode) mode.hidden = name !== "mode";
    if (empty) empty.hidden = name !== "empty";
    if (preview) preview.hidden = name !== "preview";
    if (dialog) dialog.classList.toggle("reuse-dialog-preview", name === "preview");
  }

  function closePicker() {
    var dialog = $("reuse-dialog");
    pickerState = null;
    if (!dialog) return;
    dialog.classList.remove("reuse-dialog-preview");
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function candidateMetaLine(cand, used) {
    return (cand.kindLabel || "しゅるい未設定") +
      "　／　" + (cand.bookTitle || "絵本") +
      "　／　" + (cand.moodLabel || "（雰囲気なし）") +
      (used ? "　／　ほかの枠で使用中" : "");
  }

  function beginSelect(cand) {
    if (!pickerState || !cand) return;
    pickerState.candidate = cand;
    if (moodsDiffer(pickerState.currentMood, cand.mood)) {
      var msg = $("reuse-mood-message");
      if (msg) msg.textContent = warnMessage(pickerState.currentMood, cand.mood);
      showPickerView("mood");
    } else {
      showPickerView("mode");
    }
  }

  function openPreview(cand, used) {
    if (!pickerState || !cand) return;
    pickerState.previewCandidate = cand;
    pickerState.previewTaken = !!used;
    var img = $("reuse-preview-img");
    var name = $("reuse-preview-name");
    var meta = $("reuse-preview-meta");
    var pick = $("btn-reuse-preview-pick");
    if (img) {
      img.src = cand.sheetUrl || "";
      img.alt = (cand.name || "登場人物") + " の6面図";
    }
    if (name) name.textContent = cand.name || "（無名）";
    if (meta) meta.textContent = candidateMetaLine(cand, used);
    if (pick) {
      pick.hidden = !!used;
      pick.disabled = !!used;
    }
    showPickerView("preview");
  }

  function renderPickerList(candidates, taken) {
    var host = $("reuse-list");
    if (!host) return;
    host.innerHTML = "";
    candidates.forEach(function (cand) {
      var card = document.createElement("article");
      var used = !!(taken && taken[cand.key]);
      card.className = "reuse-card" + (used ? " is-taken" : "");
      if (used) card.setAttribute("aria-disabled", "true");
      var thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "reuse-card-thumb";
      thumb.setAttribute("aria-label", (cand.name || "登場人物") + " の6面図を大きく見る");
      var img = document.createElement("img");
      img.src = cand.sheetUrl;
      img.alt = (cand.name || "登場人物") + " の6面図";
      var zoom = document.createElement("span");
      zoom.className = "reuse-card-zoom";
      zoom.textContent = "大きく見る";
      thumb.appendChild(img);
      thumb.appendChild(zoom);
      thumb.addEventListener("click", function () {
        openPreview(cand, used);
      });
      var body = document.createElement("div");
      body.className = "reuse-card-body";
      var name = document.createElement("p");
      name.className = "reuse-card-name";
      name.textContent = cand.name || "（無名）";
      var meta = document.createElement("p");
      meta.className = "reuse-card-meta";
      meta.textContent = candidateMetaLine(cand, used);
      body.appendChild(name);
      body.appendChild(meta);
      if (!used) {
        var pick = document.createElement("button");
        pick.type = "button";
        pick.className = "btn btn-ghost btn-small";
        pick.textContent = "この人を選ぶ";
        pick.addEventListener("click", function () {
          beginSelect(cand);
        });
        body.appendChild(pick);
      }
      card.appendChild(thumb);
      card.appendChild(body);
      host.appendChild(card);
    });
  }

  function finishPick(mode) {
    var state = pickerState;
    if (!state || !state.candidate || typeof state.onPick !== "function") {
      closePicker();
      return;
    }
    var candidate = state.candidate;
    var done = state.onPick;
    closePicker();
    done(candidate, mode);
  }

  function openPicker(opts) {
    opts = opts || {};
    var dialog = $("reuse-dialog");
    if (!dialog) return;
    pickerState = {
      currentMood: cloneMood(opts.currentMood),
      onPick: opts.onPick,
      candidate: null
    };
    var title = $("reuse-title");
    if (title) title.textContent = opts.title || "過去のデザインから選ぶ";
    showPickerView("list");
    var empty = $("reuse-empty");
    var list = $("reuse-list");
    if (list) list.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent = "読み込んでいます…";
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    listCandidates().then(function (candidates) {
      if (!pickerState) return;
      if (!candidates.length) {
        if (empty) {
          empty.textContent = "6面図のある絵本が、書庫にも途中の本にもありません。";
          empty.hidden = false;
        }
        if (list) list.hidden = true;
        return;
      }
      renderPickerList(candidates, opts.takenKeys || {});
      showPickerView("list");
    });
  }

  function bind() {
    var gate = $("reuse-chars-gate");
    if (gate) {
      gate.addEventListener("change", function () {
        writeGate(gate.checked);
      });
    }
    syncGateControl();
    var cancel = $("btn-reuse-cancel");
    if (cancel) {
      cancel.addEventListener("click", function () {
        closePicker();
      });
    }
    var moodYes = $("btn-reuse-mood-yes");
    if (moodYes) {
      moodYes.addEventListener("click", function () {
        if (!pickerState || !pickerState.candidate) return;
        showPickerView("mode");
      });
    }
    var moodNo = $("btn-reuse-mood-no");
    if (moodNo) {
      moodNo.addEventListener("click", function () {
        if (!pickerState) return;
        pickerState.candidate = null;
        showPickerView("list");
      });
    }
    var keep = $("btn-reuse-mode-keep");
    if (keep) {
      keep.addEventListener("click", function () {
        finishPick("keep");
      });
    }
    var regen = $("btn-reuse-mode-regen");
    if (regen) {
      regen.addEventListener("click", function () {
        finishPick("regen");
      });
    }
    var previewPick = $("btn-reuse-preview-pick");
    if (previewPick) {
      previewPick.addEventListener("click", function () {
        if (!pickerState || !pickerState.previewCandidate || pickerState.previewTaken) return;
        beginSelect(pickerState.previewCandidate);
      });
    }
    var previewBack = $("btn-reuse-preview-back");
    if (previewBack) {
      previewBack.addEventListener("click", function () {
        if (!pickerState) return;
        pickerState.previewCandidate = null;
        pickerState.previewTaken = false;
        showPickerView("list");
      });
    }
    var dialog = $("reuse-dialog");
    if (dialog) {
      dialog.addEventListener("cancel", function () {
        pickerState = null;
      });
    }
  }

  SBS.Reuse = {
    isOn: function isOn() {
      return readGate() === "on";
    },
    setOn: function setOn(on) {
      writeGate(!!on);
      syncGateControl();
    },
    syncGate: syncGateControl,
    allowSession: function allowSession(on) {
      sessionAllowed = !!on;
    },
    isSessionAllowed: function isSessionAllowed() {
      return !!sessionAllowed;
    },
    canPick: canPick,
    canPickStep3: function canPickStep3() {
      return canPick();
    },
    canPickStep6: function canPickStep6() {
      return canPick();
    },
    clone: cloneReuse,
    sourceKey: sourceKey,
    takenKeys: takenKeys,
    moodLabel: moodLabel,
    moodsDiffer: moodsDiffer,
    warnMessage: warnMessage,
    modeLabel: modeLabel,
    applyToCharacter: applyToCharacter,
    recover: recoverList,
    resetPicks: resetPicks,
    clear: clearReuse,
    isKeep: isKeep,
    pendingIndexes: pendingIndexes,
    attachSheets: attachSheets,
    applyToBook: applyToBook,
    clearBookReuse: clearBookReuse,
    setBookMode: setBookMode,
    mismatched: mismatched,
    ackMood: ackMood,
    listCandidates: listCandidates,
    openPicker: openPicker,
    closePicker: closePicker,
    bind: bind
  };

  global.SBS = SBS;
})(window);
