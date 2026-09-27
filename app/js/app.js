(function (global) {
  var SBS = global.SBS || {};

  function isKiosk() {
    try {
      return /(?:^|[?&])kiosk=1(?:&|$)/.test(location.search);
    } catch (err) {
      return false;
    }
  }

  function isStudio() {
    if (isKiosk()) return false;
    try {
      return /(?:^|[?&])studio=1(?:&|$)/.test(location.search);
    } catch (err) {
      return false;
    }
  }

  SBS.isKiosk = isKiosk;
  SBS.isStudio = isStudio;

  function $(id) {
    return document.getElementById(id);
  }

  function showSoon(featureName, extra) {
    var dialog = $("soon-dialog");
    var body = $("soon-message");
    var text = extra || (featureName + "は、いまはこの画面では使えません。");
    if (!dialog || !body) {
      window.alert(text);
      return;
    }
    body.textContent = text;
    if ($("soon-title")) $("soon-title").textContent = featureName || "お知らせ";
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeSoon() {
    var dialog = $("soon-dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function openDialog(id) {
    var dialog = $(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(id) {
    var dialog = $(id);
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function pageModeLabel() {
    return SBS.pageModeLabel ? SBS.pageModeLabel() : "見開き12ページ";
  }

  function homeLedeText() {
    return "テーマや登場人物を選んで、" + pageModeLabel() + "の絵本をつくるスタジオです。";
  }

  function refreshHomeLede() {
    var lede = $("page-lede");
    var home = $("screen-home");
    if (!lede || (home && home.hidden)) return;
    lede.textContent = homeLedeText();
  }

  function refreshGeminiStatus() {
    var status = $("gemini-status");
    var keyEl = $("gemini-key");
    var pageCount = SBS.getPageCount ? SBS.getPageCount() : 12;
    document.querySelectorAll("input[name=\"page-count\"]").forEach(function (el) {
      el.checked = parseInt(el.value, 10) === pageCount;
    });
    var homePages = $("home-setting-pages");
    if (homePages) homePages.textContent = pageModeLabel();
    refreshHomeLede();
    if (!SBS.Gemini) return;
    if (keyEl && !keyEl.value) keyEl.value = SBS.Gemini.getKey();
    document.querySelectorAll("input[name=\"gen-mode\"]").forEach(function (el) {
      el.checked = el.value === SBS.Gemini.getMode();
    });
    document.querySelectorAll("input[name=\"image-tier\"]").forEach(function (el) {
      el.checked = el.value === SBS.Gemini.getImageTier();
    });
    document.querySelectorAll("input[name=\"text-model\"]").forEach(function (el) {
      el.checked = el.value === SBS.Gemini.getTextModelId();
    });
    if (status) status.textContent = SBS.Gemini.statusMessage();
    var homeKey = $("home-setting-key");
    var homeMode = $("home-setting-mode");
    var homeText = $("home-setting-text");
    var homeImage = $("home-setting-image");
    var homeNet = $("home-setting-net");
    var homeNote = $("home-setting-note");
    if (homeKey) homeKey.textContent = SBS.Gemini.getKey() ? "入っています" : "ありません";
    if (homeMode) homeMode.textContent = SBS.Gemini.modeLabel();
    if (homeText) homeText.textContent = SBS.Gemini.textModelLabel();
    if (homeImage) homeImage.textContent = SBS.Gemini.imageTierLabel();
    if (homeNet) homeNet.textContent = SBS.Gemini.canCallNetwork() ? "送れます（http）" : "送れません（file:// など）";
    if (homeNote) homeNote.textContent = SBS.Gemini.statusMessage();
  }

  function showScreen(name) {
    var home = $("screen-home");
    var wizard = $("screen-wizard");
    var book = $("screen-book");
    var gen = $("screen-generating");
    var library = $("screen-library");
    var print = $("screen-print");
    var review = $("screen-text-review");
    var chars = $("screen-char-review");
    var lede = $("page-lede");
    if (home) home.hidden = name !== "home";
    if (wizard) wizard.hidden = name !== "wizard";
    if (book) book.hidden = name !== "book";
    if (gen) gen.hidden = name !== "generating";
    if (library) library.hidden = name !== "library";
    if (print) print.hidden = name !== "print";
    if (review) review.hidden = name !== "text-review";
    if (chars) chars.hidden = name !== "char-review";
    document.body.classList.toggle("print-mode", name === "print");
    if (name !== "print") {
      document.body.classList.remove("print-kind-spread", "print-kind-booklet");
    }
    if (lede) {
      if (name === "wizard") {
        lede.textContent = (SBS.Wizard && SBS.Wizard.hasBook && SBS.Wizard.hasBook())
          ? "この絵本の指定です。戻ると絵本、つぎへで文章確認へ進めます。"
          : "選んだことは、あとから物語と插絵の材料になります。";
      } else if (name === "book") {
        lede.textContent = "左が插絵、右が文章です。「工程に戻る」で指定からキャラ確認まで見直せます。";
      }
      else if (name === "generating") {
        lede.textContent = redrawing
          ? "いま、このページの絵を描き直しています。"
          : "いま、絵本を組み立てています。";
      }
      else if (name === "library") lede.textContent = "保存した絵本を、ここから開き直せます。";
      else if (name === "text-review") lede.textContent = "右ページの文章を直してから、登場人物の見た目を確認します。";
      else if (name === "char-review") {
        lede.textContent = (SBS.Wizard && SBS.Wizard.hasBook && SBS.Wizard.hasBook())
          ? "この絵本のキャラクター6面図です。当時の試し作りを見直せます。"
          : "登場人物の見た目を確認してから、絵本の絵を描きます。";
      }
      else if (name === "print") lede.textContent = "A4横の見開きで印刷します。";
      else lede.textContent = homeLedeText();
    }
    if (name === "home") refreshGeminiStatus();
  }

  var redrawing = false;

  function doneCount(book) {
    var n = 0;
    ((book && book.spreads) || []).forEach(function (s) {
      if (s.leftArt) n += 1;
    });
    return n;
  }

  var assembleTick = null;
  var assembleState = null;

  function stopAssembleTick() {
    if (assembleTick) {
      window.clearInterval(assembleTick);
      assembleTick = null;
    }
  }

  function updateGenProgress(done, total, message, unit) {
    var safeTotal = total > 0 ? total : 1;
    var raw = Number(done) || 0;
    var safeDone = Math.max(0, Math.min(raw, safeTotal));
    var pages = Math.min(safeTotal, Math.max(0, Math.floor(safeDone + 1e-6)));
    var pct = Math.round((safeDone / safeTotal) * 100);
    var msg = $("gen-message");
    var fill = $("gen-progress-fill");
    var meta = $("gen-progress-meta");
    var bar = $("gen-progress");
    if (msg && message) msg.textContent = message;
    if (bar) {
      bar.hidden = false;
      bar.setAttribute("aria-valuenow", String(pct));
      bar.setAttribute("aria-valuemax", "100");
    }
    if (fill) fill.style.width = pct + "%";
    if (meta) {
      meta.textContent = pct + "%　完成 " + pages + "／" + safeTotal + (unit || " ページ");
    }
  }

  function startAssembleTick(total, message) {
    stopAssembleTick();
    assembleState = {
      total: total > 0 ? total : 1,
      floor: 0,
      shown: 0,
      message: message || "",
      started: Date.now()
    };
    assembleTick = window.setInterval(function () {
      var st = assembleState;
      if (!st) return;
      var sec = (Date.now() - st.started) / 1000;
      var eased = st.total * 0.86 * (1 - Math.exp(-sec / 15));
      if (eased > st.shown) st.shown = eased;
      if (st.floor >= st.total) {
        st.shown = st.total;
        updateGenProgress(st.total, st.total, st.message, " ページ");
        stopAssembleTick();
        return;
      }
      var next = Math.max(st.floor, st.shown);
      if (next >= st.total - 0.35) next = st.total - 0.35;
      updateGenProgress(next, st.total, st.message, " ページ");
    }, 320);
  }

  function noteAssembleProgress(done, total, message) {
    var st = assembleState;
    var safeTotal = total > 0 ? total : (st && st.total) || 1;
    var safeDone = Math.max(0, Number(done) || 0);
    if (!st) {
      updateGenProgress(safeDone, safeTotal, message, " ページ");
      return;
    }
    if (message) st.message = message;
    if (safeTotal) st.total = safeTotal;
    if (safeDone > st.floor) st.floor = safeDone;
    if (safeDone > st.shown) st.shown = safeDone;
    if (st.floor >= st.total) {
      st.shown = st.total;
      updateGenProgress(st.total, st.total, st.message, " ページ");
      stopAssembleTick();
      return;
    }
    updateGenProgress(Math.max(st.floor, st.shown), st.total, st.message, " ページ");
  }

  function showGenerating(opts) {
    opts = opts || {};
    var titleEl = $("gen-title");
    if (titleEl && opts.title) titleEl.textContent = opts.title;
    showScreen("generating");
    updateGenProgress(opts.done || 0, opts.total || 1, opts.message || "", opts.unit);
  }

  function startWizard(seed) {
    showScreen("wizard");
    SBS.Wizard.start(seed);
  }

  function paintAndOpen(nextBook) {
    writeThenReview(nextBook);
  }

  var reviewBook = null;

  function writeThenReview(nextBook) {
    var writingTitle = nextBook && nextBook.title ? String(nextBook.title) : "";
    var pageTotal = (nextBook.spreads || []).length || 1;
    var assembleMsg = writingTitle
      ? "『" + writingTitle + "』のおはなしを書いています"
      : "おはなしを書いています";
    showGenerating({
      title: "いま、絵本を組み立てています。",
      message: assembleMsg,
      done: 0,
      total: pageTotal,
      unit: " ページ"
    });
    startAssembleTick(pageTotal, assembleMsg);
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), pageTotal);
    var writer = (SBS.Gemini && SBS.Gemini.writeBook) ? SBS.Gemini.writeBook : function (book, onP, onD) {
      if (onD) onD(book, "complete");
    };
    writer(nextBook, function (done, total, message) {
      noteAssembleProgress(done, total, message);
      SBS.LibraryIO.sessionSave(nextBook, "running", Math.floor(done || 0), total);
    }, function (finished, status) {
      stopAssembleTick();
      if (status === "interrupted") {
        SBS.LibraryIO.sessionSave(finished, "interrupted", doneCount(finished), (finished.spreads || []).length);
        showScreen("home");
        refreshResume();
        return;
      }
      persistBook(finished);
      showTextReview(finished);
    });
  }

  function bookHasArt(book) {
    return ((book && book.spreads) || []).some(function (s) { return s && s.leftArt; });
  }

  function showTextReview(book) {
    reviewBook = book;
    if (SBS.Wizard && SBS.Wizard.attachBook) SBS.Wizard.attachBook();
    var host = $("text-review-list");
    var err = $("text-review-error");
    if (!host) return;
    host.innerHTML = "";
    var titleNote = $("text-review-title-note");
    if (titleNote && book && book.title) {
      titleNote.textContent = "文章はステップ4までの指定だけから書き、題名は本文から『" + book.title +
        "』に直しました。右ページを直してから、登場人物の見た目を確認します。" +
        (book.furigana && book.intent && book.intent.audience !== "age-2-3" && book.intent.audience !== "age-4-6"
          ? "ふりがなは絵本のルビで出します。確認欄には（ふりがな）を書かないでください。字数は漢字だけです。"
          : book.intent && (book.intent.audience === "age-2-3" || book.intent.audience === "age-4-6")
            ? "2〜6歳の本文はひらがなだけです。漢字や 漢字（ふりがな） は使いません。"
            : "");
    }
    if (err) {
      if (book && book.textWriteNote) {
        err.hidden = false;
        err.textContent = book.textWriteNote;
      } else {
        err.hidden = true;
        err.textContent = "";
      }
    }
    var names = {};
    var bible = book.bible || { characters: [] };
    (bible.characters || []).forEach(function (ch) {
      if (ch.role === "hero") names.hero = ch.displayName;
      else if (!names.friend) names.friend = ch.displayName;
    });
    if (book.intent && book.intent.characters && book.intent.characters[0]) {
      names.hero = names.hero || book.intent.characters[0].name || "";
    }
    names.friend = names.friend || "";
    var cap = (SBS.LIMITS && SBS.LIMITS.pageText) || 600;
    var young = book.intent && (book.intent.audience === "age-2-3" || book.intent.audience === "age-4-6");
    (book.spreads || []).forEach(function (spread, i) {
      var wrap = document.createElement("article");
      wrap.className = "text-review-item";
      var label = document.createElement("label");
      var bounds = SBS.Story && SBS.Story.parseBounds
        ? SBS.Story.parseBounds(spread.plan && spread.plan.length)
        : { lo: 0, hi: 0 };
      var range = bounds.lo && bounds.hi ? "　目安 " + bounds.lo + "〜" + bounds.hi + "字" : "";
      label.className = "block-label";
      label.textContent = "右ページ " + (i * 2 + 2) + "（見開き" + spread.n + "）" + range +
        (book.furigana && !young ? "　ふりがなは絵本のルビ。ここには（ふりがな）を書かないでください" : "");
      var ta = document.createElement("textarea");
      ta.id = "review-text-" + i;
      ta.rows = bounds.hi && bounds.hi > 180 ? 10 : 6;
      ta.maxLength = book.furigana && !young ? cap * 2 : cap;
      ta.value = SBS.Story.plainText(spread.paragraphs, names, { ruby: false });
      label.appendChild(ta);
      var count = document.createElement("p");
      count.className = "text-review-count";
      function showCount() {
        var n = SBS.Story && SBS.Story.countStoryChars
          ? SBS.Story.countStoryChars(ta.value)
          : ta.value.replace(/\s+/g, "").length;
        count.textContent = n + "字" + range + "　上限 " + cap + "字" +
          (book.furigana && !young ? "（ふりがなを除く）" : "");
      }
      showCount();
      ta.addEventListener("input", showCount);
      wrap.appendChild(label);
      wrap.appendChild(count);
      host.appendChild(wrap);
    });
    showScreen("text-review");
  }

  function applyTextReview(book) {
    var cap = (SBS.LIMITS && SBS.LIMITS.pageText) || 600;
    var empty = false;
    var names = {};
    var bible = (book && book.bible) || { characters: [] };
    (bible.characters || []).forEach(function (ch) {
      if (ch.role === "hero") names.hero = ch.displayName;
      else if (!names.friend) names.friend = ch.displayName;
    });
    if (book.intent && book.intent.characters && book.intent.characters[0]) {
      names.hero = names.hero || book.intent.characters[0].name || "";
    }
    names.friend = names.friend || "";
    var bookMap = (SBS.Story && SBS.Story.bookReadingMap) ? SBS.Story.bookReadingMap(book) : {};
    (book.spreads || []).forEach(function (spread, i) {
      var ta = $("review-text-" + i);
      if (!ta) return;
      var text = String(ta.value || "").trim();
      var young = book.intent && (book.intent.audience === "age-2-3" || book.intent.audience === "age-4-6");
      var kept = SBS.Story.readingMap ? SBS.Story.readingMap(spread.paragraphs) : {};
      Object.keys(bookMap).forEach(function (key) {
        if (!kept[key]) kept[key] = bookMap[key];
      });
      if (young) text = text.replace(/[\u4e00-\u9fff]+[（(]([ぁ-ゖァ-ヶー]+)[）)]/g, "$1");
      else if (book.furigana && SBS.Story) {
        if (SBS.Story.mergeKanjiRuby) text = SBS.Story.mergeKanjiRuby(text);
        if (SBS.Story.injectReadings) text = SBS.Story.injectReadings(text, kept);
      }
      if (spread.role === "cover") {
        text = text.split(/\n+/).filter(function (line) {
          return line.trim() && !/さく\s*[・･／\/]\s*え|作\s*[・･／\/]\s*絵|オリジナルさっか|さっか|作者クレジット/.test(line);
        }).join("\n");
      }
      if (!text) empty = true;
      var prev = SBS.Story.plainText(spread.paragraphs, names, { ruby: false }).replace(/\s+/g, " ").trim();
      spread.paragraphs = SBS.Story.fromPlainText(text, cap);
      if (book.furigana && SBS.Story.applyReadings) {
        spread.paragraphs = SBS.Story.applyReadings(spread.paragraphs, kept);
      }
      spread.geminiTextDone = true;
      var next = SBS.Story.plainText(spread.paragraphs, names, { ruby: false }).replace(/\s+/g, " ").trim();
      if (prev !== next) spread.textEdited = true;
      if (SBS.PromptCompiler && SBS.PromptCompiler.refreshPageImage) {
        SBS.PromptCompiler.refreshPageImage(book, i);
      }
    });
    return !empty;
  }

  function sheetsReady(book) {
    var chars = (book && book.bible && book.bible.characters) || [];
    if (!chars.length) return true;
    return ((book.characterSheets || []).filter(function (s) { return s && s.url; }).length) >= chars.length;
  }

  function reviewCharactersAndOpen(nextBook) {
    var charTotal = ((nextBook.bible && nextBook.bible.characters) || []).length || 1;
    showGenerating({
      title: "キャラクターデザインを描いています",
      message: "キャラクターデザインを描いています",
      done: 0,
      total: charTotal,
      unit: " 人"
    });
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    var painter = (SBS.Gemini && SBS.Gemini.paintCharacterSheets)
      ? SBS.Gemini.paintCharacterSheets
      : SBS.DemoArt.paintCharacterSheets;
    painter(nextBook, function (done, total, message) {
      updateGenProgress(done, total, message, " 人");
      SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    }, function (finished, status) {
      if (status === "interrupted") {
        SBS.LibraryIO.sessionSave(finished, "interrupted", doneCount(finished), (finished.spreads || []).length);
        showScreen("home");
        refreshResume();
        return;
      }
      persistBook(finished);
      showCharReview(finished);
    });
  }

  function showCharReview(book) {
    reviewBook = book;
    if (SBS.Wizard && SBS.Wizard.attachBook) SBS.Wizard.attachBook();
    var err = $("char-review-error");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    if ($("btn-char-review-book")) $("btn-char-review-book").hidden = !bookHasArt(book);
    renderCharReview(book);
    showScreen("char-review");
  }

  function hydrateWizardFromBook(book) {
    if (SBS.Wizard && SBS.Wizard.resumeFromBook) SBS.Wizard.resumeFromBook(book);
  }

  function returnToBook() {
    var book = reviewBook || (SBS.Viewer && SBS.Viewer.current && SBS.Viewer.current());
    if (!book) {
      showScreen("home");
      return;
    }
    if (SBS.Wizard && SBS.Wizard.currentTitle) {
      applyBookTitle(book, SBS.Wizard.currentTitle());
    }
    persistBook(book);
    showScreen("book");
    SBS.Viewer.open(book);
    refreshFolderButton();
  }

  function openStepsFromBook(book) {
    if (!book) return;
    reviewBook = book;
    if (SBS.LibraryIO && SBS.LibraryIO.hydrateCharacterSheets) {
      SBS.LibraryIO.hydrateCharacterSheets(book);
    }
    hydrateWizardFromBook(book);
    if (sheetsReady(book) || !((book.bible && book.bible.characters) || []).length) {
      showCharReview(book);
    } else {
      showTextReview(book);
    }
  }

  function renderCharReview(book) {
    var host = $("char-review-list");
    if (!host) return;
    host.innerHTML = "";
    var chars = (book.bible && book.bible.characters) || [];
    if (!chars.length) {
      var empty = document.createElement("p");
      empty.className = "char-review-empty";
      empty.textContent = "登場人物がいません。そのまま絵本をつくれます。";
      host.appendChild(empty);
      return;
    }
    chars.forEach(function (ch, i) {
      var sheet = (book.characterSheets && book.characterSheets[i]) || {};
      var card = document.createElement("article");
      card.className = "char-review-card";
      card.setAttribute("data-char-index", String(i));
      var title = document.createElement("h3");
      title.textContent = (ch.displayName || "登場人物") +
        "［" + (ch.id || "char") + "］" +
        (ch.roleLabel ? "（" + ch.roleLabel + "）" : "");
      card.appendChild(title);
      if (sheet.url) {
        var img = document.createElement("img");
        img.alt = (ch.displayName || "登場人物") + " の前後左右上下";
        img.src = sheet.url;
        card.appendChild(img);
      } else {
        var miss = document.createElement("p");
        miss.className = "char-review-empty";
        miss.textContent = "画像がまだありません。追加指示を書いて描き直してください。";
        card.appendChild(miss);
      }
      var label = document.createElement("label");
      label.className = "block-label";
      label.textContent = "追加指示";
      var ta = document.createElement("textarea");
      ta.id = "char-note-" + i;
      ta.rows = 3;
      ta.maxLength = 240;
      ta.placeholder = "例：髪をもっと短く。マフラーは赤。";
      ta.value = sheet.note || "";
      label.appendChild(ta);
      card.appendChild(label);
      var busy = document.createElement("p");
      busy.className = "char-review-busy";
      busy.id = "char-busy-" + i;
      busy.hidden = true;
      busy.textContent = "描き直しています…";
      card.appendChild(busy);
      var actions = document.createElement("div");
      actions.className = "char-review-actions";
      var regen = document.createElement("button");
      regen.type = "button";
      regen.className = "btn btn-ghost";
      regen.setAttribute("data-char-regen", String(i));
      regen.textContent = "指示を入れて描き直す";
      actions.appendChild(regen);
      card.appendChild(actions);
      host.appendChild(card);
    });
  }

  var charBusy = false;

  function setCharBusy(on) {
    charBusy = !!on;
    var paint = $("btn-char-review-paint");
    if (paint) paint.disabled = charBusy;
    document.querySelectorAll("[data-char-regen]").forEach(function (el) {
      el.disabled = charBusy;
    });
  }

  function regenerateCharacter(index) {
    if (!reviewBook || charBusy) return;
    var ta = $("char-note-" + index);
    var note = ta ? String(ta.value || "").trim() : "";
    if (reviewBook.characterSheets && reviewBook.characterSheets[index]) {
      reviewBook.characterSheets[index].note = note;
    }
    var busy = $("char-busy-" + index);
    if (busy) busy.hidden = false;
    setCharBusy(true);
    showGenerating({
      title: "キャラクターデザインを描いています",
      message: "キャラクターデザインを描いています",
      done: 0,
      total: 1,
      unit: " 人"
    });
    var painter = (SBS.Gemini && SBS.Gemini.paintCharacterSheet)
      ? SBS.Gemini.paintCharacterSheet
      : function (book, i, extra, onP, onD) {
        SBS.DemoArt.paintCharacterSheet(book, i, extra);
        if (onP) onP(1, 1, "描き直しています");
        if (onD) onD(book, "complete");
      };
    painter(reviewBook, index, note, function (done, total, message) {
      updateGenProgress(done, total || 1, message, " 人");
      if (busy) busy.textContent = message || "描き直しています…";
    }, function (finished) {
      reviewBook = finished;
      setCharBusy(false);
      showCharReview(finished);
      persistBook(finished);
      SBS.LibraryIO.sessionSave(finished, "running", doneCount(finished), (finished.spreads || []).length);
    });
  }

  function collectCharNotes(book) {
    ((book && book.bible && book.bible.characters) || []).forEach(function (ch, i) {
      var ta = $("char-note-" + i);
      if (!ta) return;
      if (!book.characterSheets) book.characterSheets = [];
      if (!book.characterSheets[i]) book.characterSheets[i] = { id: ch.id, url: "", note: "" };
      book.characterSheets[i].note = String(ta.value || "").trim();
    });
  }

  function resetSpreadArt(book) {
    ((book && book.spreads) || []).forEach(function (spread) {
      if (!spread) return;
      spread.leftArt = "";
      spread.artSource = "";
      spread.textEdited = true;
    });
    if (book) book.forceRepaint = true;
  }

  function composeThenPaint(nextBook) {
    collectCharNotes(nextBook);
    resetSpreadArt(nextBook);
    var compose = (SBS.DemoArt && SBS.DemoArt.composeCharacterSheet)
      ? SBS.DemoArt.composeCharacterSheet
      : function (book) { return Promise.resolve(book); };
    compose(nextBook).then(function (finished) {
      paintImagesAndOpen(finished || nextBook);
    });
  }

  function paintImagesAndOpen(nextBook) {
    var pageTotal = (nextBook.spreads || []).length || 1;
    showGenerating({
      title: "絵本をつくっています",
      message: "絵を描いています",
      done: doneCount(nextBook),
      total: pageTotal,
      unit: " ページ"
    });
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), pageTotal);
    var painter = (SBS.Gemini && SBS.Gemini.paintImages) ? SBS.Gemini.paintImages : SBS.DemoArt.paintBook;
    painter(nextBook, function (done, total, message) {
      updateGenProgress(done, total, message, " ページ");
      SBS.LibraryIO.sessionSave(nextBook, "running", done, total);
    }, function (finished, status) {
      var total = (finished.spreads || []).length;
      var done = doneCount(finished);
      if (status === "interrupted") {
        SBS.LibraryIO.sessionSave(finished, "interrupted", done, total);
        showScreen("home");
        refreshResume();
        return;
      }
      SBS.DemoArt.cachePut(finished.title, finished);
      SBS.LibraryIO.saveLocal(finished);
      SBS.LibraryIO.sessionClear();
      refreshFolderButton();
      reviewBook = null;
      showScreen("book");
      SBS.Viewer.open(finished);
    });
  }

  function fallbackOmakaseIntent() {
    var seeds = [
      {
        themePreset: "its-ok", audience: "age-4-6", structure: "problem",
        settingPreset: "school", mood: "crayon", title: "みおのカレー",
        characters: [{ name: "みお", role: "hero", kind: "child", personality: ["earnest", "shy"], traits: "子ども。きみどりのぼうし。" }]
      },
      {
        themePreset: "kindness", audience: "age-4-6", structure: "kishotenketsu",
        settingPreset: "sea", mood: "watercolor", title: "きいろいバケツ",
        characters: [{ name: "はる", role: "hero", kind: "child", personality: ["kind", "curious"], traits: "子ども。あおのスカーフ。" }]
      },
      {
        themePreset: "family", audience: "age-2-3", structure: "daily",
        settingPreset: "home", mood: "felt", title: "くつしたどこ",
        characters: [{ name: "そら", role: "hero", kind: "child", personality: ["playful", "kind"], traits: "子ども。ももいろのてぶくろ。" }]
      },
      {
        themePreset: "curiosity", audience: "age-7-9", structure: "adventure",
        settingPreset: "space", mood: "night", title: "三つならんだ星",
        characters: [{ name: "れん", role: "hero", kind: "child", personality: ["curious", "careful"], traits: "子ども。むらさきのバッジ。" }]
      },
      {
        themePreset: "friendship", audience: "age-4-6", structure: "daily",
        settingPreset: "town", mood: "pastel", title: "かたっぽのながぐつ",
        characters: [{ name: "ゆず", role: "hero", kind: "child", personality: ["cheerful", "lonely"], traits: "子ども。ちゃいろのながぐつ。" }]
      },
      {
        themePreset: "nature", audience: "age-7-9", structure: "explain",
        settingPreset: "forest", mood: "colored-pencil", title: "雨あがりのミミズ",
        characters: [{ name: "こと", role: "hero", kind: "child", personality: ["careful", "curious"], traits: "子ども。みずいろのリュック。" }]
      }
    ];
    var seed = seeds[Math.floor(Math.random() * seeds.length)];
    seed.furigana = false;
    seed.textDirection = "yoko";
    return SBS.intentFromSeed(seed);
  }

  function startOmakase() {
    var intent = null;
    try {
      if (typeof SBS.omakaseIntent === "function") intent = SBS.omakaseIntent();
    } catch (err) {
      intent = null;
    }
    if (!intent || !intent.title || intent.title === "くうのゆうき") {
      intent = fallbackOmakaseIntent();
    }
    openBook(intent);
  }

  function openBook(intent) {
    var title = intent && intent.title ? String(intent.title) : "";
    var pages = SBS.normalizePageCount
      ? SBS.normalizePageCount((intent && intent.pageCount) || (SBS.getPageCount && SBS.getPageCount()) || 12)
      : 12;
    var pageGuess = SBS.spreadCountOf ? SBS.spreadCountOf(pages) : Math.round(pages / 2);
    showGenerating({
      title: "いま、絵本を組み立てています。",
      message: title
        ? "『" + title + "』のおはなしを書いています"
        : "おはなしを書いています",
      done: 0,
      total: pageGuess || 6,
      unit: " ページ"
    });
    window.setTimeout(function () {
      try {
        var bible = SBS.Bible.fromIntent(intent);
        var nextBook = SBS.Story.build(intent, bible);
        if (!SBS.PromptTemplates || !SBS.PromptCompiler) {
          throw new Error("prompt compiler missing");
        }
        SBS.PromptCompiler.compile(intent, bible, nextBook);
        writeThenReview(nextBook);
      } catch (err) {
        showScreen("home");
        showSoon("絵本", "絵本を開けませんでした。ページを再読み込みして、もう一度試してください。");
      }
    }, 60);
  }

  function persistBook(book) {
    if (!book) return Promise.resolve(false);
    SBS.DemoArt.cachePut(book.title, book);
    return SBS.LibraryIO.saveLocal(book);
  }

  function applyBookTitle(book, nextTitle) {
    var limit = (SBS.LIMITS && SBS.LIMITS.title) || 40;
    var title = String(nextTitle || "").replace(/\s+/g, " ").trim().slice(0, limit);
    if (!book) return { ok: false, reason: "missing" };
    if (!title) return { ok: false, reason: "empty" };
    var prev = String(book.title || "");
    book.title = title;
    if (!book.intent) book.intent = {};
    book.intent.title = title;
    if (book.intent.briefMarkdown && typeof book.intent.briefMarkdown === "string") {
      book.intent.briefMarkdown = book.intent.briefMarkdown.replace(
        /(^|\n)(- タイトル：)[^\n]*/,
        "$1$2" + title
      );
    }
    var spreads = book.spreads || [];
    var i;
    var spread;
    var first;
    var current;
    for (i = 0; i < spreads.length; i += 1) {
      spread = spreads[i];
      if (!spread || (spread.role && spread.role !== "cover")) continue;
      first = (spread.paragraphs || [])[0];
      current = first && SBS.Story && SBS.Story.plainText
        ? SBS.Story.plainText([first], {}, { ruby: false })
        : "";
      if (!first || current === prev || !String(current || "").trim()) {
        if (!spread.paragraphs) spread.paragraphs = [];
        spread.paragraphs[0] = [{ t: title }];
      }
      break;
    }
    return { ok: true, title: title };
  }

  function refreshOpenTitle(book) {
    var current = SBS.Viewer && SBS.Viewer.current && SBS.Viewer.current();
    var input = $("book-title-input");
    var bar = $("book-title-bar");
    if (current && book && current.bookId === book.bookId) {
      SBS.Viewer.open(current, SBS.Viewer.spreadNumber ? SBS.Viewer.spreadNumber() : 1);
      return;
    }
    if (current) return;
    if (input) input.value = (book && book.title) || "";
    if (bar) bar.textContent = (book && book.title) || "";
  }

  function saveBookTitle(book, nextTitle) {
    var result = applyBookTitle(book, nextTitle);
    if (!result.ok) {
      showSoon("タイトル", result.reason === "empty" ? "タイトルを入れてください。" : "タイトルを保存できませんでした。");
      return Promise.resolve(false);
    }
    if (!reviewBook || reviewBook.bookId === book.bookId) reviewBook = book;
    refreshOpenTitle(book);
    if (!SBS.Viewer || !SBS.Viewer.current || !SBS.Viewer.current() || SBS.Viewer.current().bookId === book.bookId) {
      hydrateWizardFromBook(book);
    }
    return persistBook(book).then(function () {
      return true;
    });
  }

  SBS.applyBookTitle = applyBookTitle;

  function redrawCurrent() {
    var current = SBS.Viewer.current();
    var stay = SBS.Viewer.spreadNumber ? SBS.Viewer.spreadNumber() : 1;
    var idx = SBS.Viewer.spreadIndex ? SBS.Viewer.spreadIndex() : stay - 1;
    if (!current || !current.spreads || !current.spreads[idx]) {
      showSoon("描き直し", "先に絵本を開いてから、描き直してください。");
      return;
    }
    redrawing = true;
    showGenerating({
      title: "絵本をつくっています",
      message: "このページの絵を描き直しています",
      done: 0,
      total: 1,
      unit: " ページ"
    });
    var painter = (SBS.Gemini && SBS.Gemini.paintSpread)
      ? SBS.Gemini.paintSpread
      : function (book, i, onProgress, onDone) {
        SBS.DemoArt.paintOne(book, i);
        if (onDone) onDone(book, "complete");
      };
    painter(current, idx, function (done, total, message) {
      updateGenProgress(done, total || 1, message, " ページ");
    }, function (finished, status) {
      redrawing = false;
      persistBook(finished);
      refreshFolderButton();
      showScreen("book");
      SBS.Viewer.open(finished, stay);
      if (status === "interrupted") return;
      if (finished.redrawResult === "kept") {
        showSoon("描き直し", "描き直せませんでした。前の絵のままです。");
      }
    });
  }

  function refreshResume() {
    var row = $("resume-row");
    var label = $("resume-label");
    if (!row) return;
    SBS.LibraryIO.sessionLoad().then(function (session) {
      var incomplete = session && session.book && session.status !== "complete" &&
        (session.done || 0) < (session.total || 12);
      row.hidden = !incomplete;
      if (incomplete && label) {
        label.textContent = "「" + (session.title || "絵本") + "」の絵が途中です（" +
          (session.done || 0) + " / " + (session.total || 12) + "）。";
      }
    });
  }

  function refreshFolderButton() {
    var btn = $("btn-write-folder");
    var importBtn = $("btn-library-import");
    var choose = $("btn-choose-folder");
    var status = $("folder-status");
    var can = SBS.LibraryIO.canUseFolder();
    if (choose) choose.hidden = !can;
    if (!can) {
      if (btn) btn.hidden = true;
      if (importBtn) importBtn.hidden = true;
      if (status) status.textContent = "このブラウザではフォルダへ直書きできません。絵本のZIPは保存できます。Chrome または Edge で http から開くと、library フォルダを選べます。";
      return;
    }
    SBS.LibraryIO.currentFolder().then(function (handle) {
      if (!handle) {
        if (btn) btn.hidden = true;
        if (importBtn) importBtn.hidden = true;
        if (status) status.textContent = "保存先フォルダはまだ選んでいません。リポジトリの library フォルダを選んでください。";
        return;
      }
      var label = SBS.LibraryIO.folderLabel(handle);
      if (!handle.queryPermission) {
        if (btn) btn.hidden = false;
        if (importBtn) importBtn.hidden = false;
        if (status) status.textContent = "保存先: " + label;
        return;
      }
      handle.queryPermission({ mode: "readwrite" }).then(function (state) {
        var granted = state === "granted";
        if (btn) btn.hidden = !granted;
        if (importBtn) importBtn.hidden = !granted;
        if (status) {
          status.textContent = granted
            ? "保存先: " + label
            : "保存先 " + label + " の許可がありません。もう一度選んでください。";
        }
      }).catch(function () {
        if (btn) btn.hidden = true;
        if (importBtn) importBtn.hidden = true;
      });
    });
  }

  function formatStamp(stamp) {
    if (!stamp || stamp.length < 15) return "";
    return stamp.slice(0, 4) + "/" + stamp.slice(4, 6) + "/" + stamp.slice(6, 8) +
      " " + stamp.slice(9, 11) + ":" + stamp.slice(11, 13);
  }

  function openLibraryBook(bookId) {
    return SBS.LibraryIO.openLocal(bookId).then(function (book) {
      if (!book) {
        showSoon("書庫", "この絵本を開けませんでした。");
        return null;
      }
      reviewBook = book;
      if (SBS.LibraryIO && SBS.LibraryIO.hydrateCharacterSheets) {
        SBS.LibraryIO.hydrateCharacterSheets(book);
      }
      hydrateWizardFromBook(book);
      showScreen("book");
      SBS.Viewer.open(book);
      refreshFolderButton();
      return book;
    });
  }

  function renderLibrary(rows) {
    var list = $("library-list");
    var empty = $("library-empty");
    if (!list) return;
    list.innerHTML = "";
    if (!rows || !rows.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    rows.forEach(function (row) {
      var cat = row.catalog || {};
      var item = document.createElement("li");
      var edit = document.createElement("div");
      var label = document.createElement("label");
      var input = document.createElement("input");
      var saveBtn = document.createElement("button");
      var meta = document.createElement("span");
      var actions = document.createElement("div");
      var openBtn = document.createElement("button");
      item.className = "library-row";
      edit.className = "library-title-edit";
      label.className = "book-title-label";
      label.textContent = "タイトル";
      input.className = "library-title-input";
      input.type = "text";
      input.maxLength = (SBS.LIMITS && SBS.LIMITS.title) || 40;
      input.value = cat.title || "";
      input.setAttribute("aria-label", "タイトル");
      saveBtn.type = "button";
      saveBtn.className = "btn btn-ghost";
      saveBtn.textContent = "タイトルを保存";
      meta.className = "library-meta";
      meta.textContent = formatStamp(cat.stamp) + (cat.bookId ? " ・ " + cat.bookId : "");
      actions.className = "library-row-actions";
      openBtn.type = "button";
      openBtn.className = "btn btn-primary";
      openBtn.textContent = "この絵本を開く";
      openBtn.addEventListener("click", function () {
        openLibraryBook(cat.bookId);
      });
      saveBtn.addEventListener("click", function () {
        var current = SBS.Viewer && SBS.Viewer.current && SBS.Viewer.current();
        var ready = (current && current.bookId === cat.bookId)
          ? Promise.resolve(current)
          : SBS.LibraryIO.openLocal(cat.bookId);
        ready.then(function (book) {
          if (!book) {
            showSoon("書庫", "この絵本を開けませんでした。");
            return;
          }
          return saveBookTitle(book, input.value).then(function (ok) {
            if (ok) {
              cat.title = book.title;
              input.value = book.title;
              showSoon("タイトル", "「" + book.title + "」に保存しました。");
            }
          });
        });
      });
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          saveBtn.click();
        }
      });
      edit.appendChild(label);
      edit.appendChild(input);
      edit.appendChild(saveBtn);
      actions.appendChild(openBtn);
      item.appendChild(edit);
      item.appendChild(meta);
      item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function openLibrary() {
    showScreen("library");
    SBS.LibraryIO.listLocal().then(renderLibrary);
  }

  SBS.init = function init() {
    if (isKiosk()) document.body.classList.add("kiosk");

    $("btn-make").addEventListener("click", function () {
      startWizard(null);
    });
    if ($("btn-make-prompt")) {
      $("btn-make-prompt").addEventListener("click", function () {
        showScreen("wizard");
        if (SBS.Wizard.startPrompt) SBS.Wizard.startPrompt();
        else startWizard(null);
      });
    }
    $("btn-omakase").addEventListener("click", startOmakase);
    $("btn-library").addEventListener("click", openLibrary);
    $("btn-library-home").addEventListener("click", function () {
      showScreen("home");
    });
    $("btn-library-import").addEventListener("click", function () {
      SBS.LibraryIO.importFolder().then(function () {
        return SBS.LibraryIO.listLocal();
      }).then(renderLibrary);
    });
    $("btn-resume").addEventListener("click", function () {
      SBS.LibraryIO.sessionLoad().then(function (session) {
        if (!session || !session.book) return;
        var book = session.book;
        var texts = (book.spreads || []).every(function (s) {
          return s.geminiTextDone || (s.paragraphs && s.paragraphs.length);
        });
        var arts = (book.spreads || []).some(function (s) { return s.leftArt; });
        if (texts && arts) paintImagesAndOpen(book);
        else if (texts && sheetsReady(book)) showCharReview(book);
        else if (texts) reviewCharactersAndOpen(book);
        else writeThenReview(book);
      });
    });
    if ($("btn-text-review-back")) {
      $("btn-text-review-back").addEventListener("click", function () {
        if (reviewBook) {
          applyTextReview(reviewBook);
          persistBook(reviewBook);
          hydrateWizardFromBook(reviewBook);
        }
        showScreen("wizard");
        if (SBS.Wizard && SBS.Wizard.goTo) SBS.Wizard.goTo(4);
      });
    }
    if ($("btn-text-review-paint")) {
      $("btn-text-review-paint").addEventListener("click", function () {
        if (!reviewBook) return;
        if (!applyTextReview(reviewBook)) {
          var err = $("text-review-error");
          if (err) {
            err.hidden = false;
            err.textContent = "空の右ページがあります。文章を入れてください。";
          }
          return;
        }
        persistBook(reviewBook);
        function afterRuby() {
          persistBook(reviewBook);
          if (sheetsReady(reviewBook)) showCharReview(reviewBook);
          else reviewCharactersAndOpen(reviewBook);
        }
        if (SBS.Story && SBS.Story.wantsRuby && SBS.Story.wantsRuby(reviewBook) &&
            SBS.Gemini && SBS.Gemini.fillMissingReadings) {
          var need = (reviewBook.spreads || []).some(function (spread) {
            return SBS.Story.unmarkedKanji && SBS.Story.unmarkedKanji(spread.paragraphs).length;
          });
          if (need) {
            showGenerating({
              title: "ふりがなを付けています",
              message: "漢字にふりがなを付けています",
              done: 0,
              total: (reviewBook.spreads || []).length,
              unit: " ページ"
            });
            SBS.Gemini.fillMissingReadings(reviewBook, function (done, total) {
              updateGenProgress(done, total, "漢字にふりがなを付けています", " ページ");
            }).then(afterRuby);
            return;
          }
        }
        afterRuby();
      });
    }
    if ($("btn-char-review-back")) {
      $("btn-char-review-back").addEventListener("click", function () {
        if (!reviewBook) return;
        showTextReview(reviewBook);
      });
    }
    if ($("btn-char-review-book")) {
      $("btn-char-review-book").addEventListener("click", function () {
        returnToBook();
      });
    }
    if ($("btn-char-review-paint")) {
      $("btn-char-review-paint").addEventListener("click", function () {
        if (!reviewBook || charBusy) return;
        composeThenPaint(reviewBook);
      });
    }
    if ($("char-review-list")) {
      $("char-review-list").addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-char-regen]") : null;
        if (!btn) return;
        regenerateCharacter(Number(btn.getAttribute("data-char-regen")));
      });
    }
    $("btn-gen-cancel").addEventListener("click", function () {
      stopAssembleTick();
      if (SBS.Gemini) SBS.Gemini.cancelPaint();
      else SBS.DemoArt.cancelPaint();
    });
    function persistSettings() {
      var pageEl = document.querySelector("input[name=\"page-count\"]:checked");
      if (SBS.setPageCount) SBS.setPageCount(pageEl ? pageEl.value : 12);
      if (SBS.Gemini) {
        var keyEl = $("gemini-key");
        var modeEl = document.querySelector("input[name=\"gen-mode\"]:checked");
        var tierEl = document.querySelector("input[name=\"image-tier\"]:checked");
        var textEl = document.querySelector("input[name=\"text-model\"]:checked");
        if (keyEl) SBS.Gemini.setKey(keyEl.value);
        SBS.Gemini.setMode(modeEl ? modeEl.value : "auto");
        SBS.Gemini.setImageTier(tierEl ? tierEl.value : "flash");
        SBS.Gemini.setTextModelId(textEl ? textEl.value : "3.5-flash");
      }
      refreshGeminiStatus();
    }
    $("btn-gear").addEventListener("click", function () {
      refreshFolderButton();
      refreshGeminiStatus();
      openDialog("settings-dialog");
    });
    $("btn-soon-close").addEventListener("click", closeSoon);
    $("btn-settings-close").addEventListener("click", function () {
      persistSettings();
      closeDialog("settings-dialog");
    });
    if ($("gemini-key")) {
      $("gemini-key").addEventListener("change", persistSettings);
    }
    document.querySelectorAll("input[name=\"gen-mode\"]").forEach(function (el) {
      el.addEventListener("change", persistSettings);
    });
    document.querySelectorAll("input[name=\"image-tier\"]").forEach(function (el) {
      el.addEventListener("change", persistSettings);
    });
    document.querySelectorAll("input[name=\"text-model\"]").forEach(function (el) {
      el.addEventListener("change", persistSettings);
    });
    document.querySelectorAll("input[name=\"page-count\"]").forEach(function (el) {
      el.addEventListener("change", persistSettings);
    });
    $("btn-choose-folder").addEventListener("click", function () {
      SBS.LibraryIO.chooseFolder().then(function (handle) {
        refreshFolderButton();
        if (!handle) showSoon("フォルダ", "フォルダを選べませんでした。Chrome または Edge で、http から開いてください。");
      });
    });

    $("btn-wizard-back").addEventListener("click", function () {
      var where = SBS.Wizard.back();
      if (where === "home") showScreen("home");
      else if (where === "book") returnToBook();
    });
    $("btn-wizard-next").addEventListener("click", function () {
      var result = SBS.Wizard.next();
      if (result && result.resume) {
        if (reviewBook) showTextReview(reviewBook);
        return;
      }
      if (result) openBook(result);
    });
    if ($("btn-wizard-remake")) {
      $("btn-wizard-remake").addEventListener("click", function () {
        var intent = SBS.Wizard.remake && SBS.Wizard.remake();
        if (intent) openBook(intent);
      });
    }
    $("btn-add-character").addEventListener("click", function () {
      SBS.Wizard.addCharacter();
    });
    $("title-input").addEventListener("input", function () {
      SBS.Wizard.markTitleTouched();
    });
    if ($("dedication-input")) {
      $("dedication-input").addEventListener("input", function () {
        if (SBS.Wizard.markDedication) SBS.Wizard.markDedication();
      });
    }
    $("furigana-input").addEventListener("change", function () {
      SBS.Wizard.markFuriganaTouched();
    });
    $("btn-book-home").addEventListener("click", function () {
      showScreen("home");
      refreshResume();
    });
    if ($("btn-book-steps")) {
      $("btn-book-steps").addEventListener("click", function () {
        var current = (SBS.Viewer && SBS.Viewer.current && SBS.Viewer.current()) || reviewBook;
        if (!current) {
          showSoon("工程", "先に絵本を開いてから、工程に戻ってください。");
          return;
        }
        openStepsFromBook(current);
      });
    }
    if ($("btn-redraw")) {
      $("btn-redraw").addEventListener("click", redrawCurrent);
    }
    if ($("btn-save-title")) {
      $("btn-save-title").addEventListener("click", function () {
        var current = (SBS.Viewer && SBS.Viewer.current && SBS.Viewer.current()) || reviewBook;
        if (!current) {
          showSoon("タイトル", "先に絵本を開いてから、タイトルを保存してください。");
          return;
        }
        saveBookTitle(current, $("book-title-input") ? $("book-title-input").value : current.title).then(function (ok) {
          if (ok) showSoon("タイトル", "「" + current.title + "」に保存しました。");
        });
      });
    }
    if ($("book-title-input")) {
      $("book-title-input").addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        if ($("btn-save-title")) $("btn-save-title").click();
      });
    }
    $("btn-save-zip").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current) {
        showSoon("保存", "先に絵本をつくってから保存してください。");
        return;
      }
      if ($("book-title-input")) applyBookTitle(current, $("book-title-input").value);
      SBS.LibraryIO.saveLocal(current).then(function () {
        return SBS.LibraryIO.downloadZip(current);
      }).then(function (ok) {
        if (!ok) showSoon("保存", "ZIPを作れませんでした。");
      });
    });
    $("btn-write-folder").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current) return;
      if ($("book-title-input")) applyBookTitle(current, $("book-title-input").value);
      SBS.LibraryIO.saveLocal(current).then(function () {
        return SBS.LibraryIO.writeFolder(current);
      }).then(function (result) {
        if (!result || !result.ok) {
          showSoon("フォルダ", "フォルダに書き出せませんでした。歯車から library フォルダを選んでください。");
        }
      });
    });
    $("btn-print").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current || !SBS.Export) {
        showSoon("印刷", "先に絵本をつくってから印刷してください。");
        return;
      }
      showScreen("print");
      applyPrintKind();
    });
    function printKind() {
      var el = document.querySelector("input[name=\"print-kind\"]:checked");
      return el && el.value === "booklet" ? "booklet" : "spread";
    }
    function applyPrintKind() {
      var kind = printKind();
      var book = SBS.Viewer.current();
      var hint = $("print-hint");
      document.body.classList.toggle("print-kind-booklet", kind === "booklet");
      document.body.classList.toggle("print-kind-spread", kind !== "booklet");
      if (book) {
        SBS.Export.renderPrint($("print-pages"), book, kind);
        if (SBS.PageFit) {
          SBS.PageFit.afterLayout(function () {
            SBS.PageFit.fitAll($("print-pages"), ".print-page.right, .print-leaf.text");
          });
        }
      }
      if (!hint) return;
      var pageCount = (book && (book.pageCount || ((book.spreads || []).length * 2))) || (SBS.getPageCount ? SBS.getPageCount() : 12);
      var bookletLabel = $("print-booklet-label");
      if (bookletLabel) bookletLabel.textContent = "製本用（A5×" + pageCount + "ページ・プリンタの製本／小冊子）";
      if (kind === "booklet") {
        hint.textContent = "本文" + pageCount + "ページ（A5縦）です。プリンタの「製本」または「小冊子」で用紙A4・両面にすると、折って一冊になります。PDFは「PDFを保存」を使うと用紙サイズがA5縦で固定されます。奥付は印刷に入りません。";
      } else {
        hint.textContent = "見開き1つがA4横1枚です。ブラウザの印刷だと縦になってしまうことがあるので、PDFは「PDFを保存」を使ってください。奥付は印刷に入りません。";
      }
    }
    document.querySelectorAll("input[name=\"print-kind\"]").forEach(function (el) {
      el.addEventListener("change", applyPrintKind);
    });
    $("btn-print-back").addEventListener("click", function () {
      showScreen("book");
    });
    $("btn-print-run").addEventListener("click", function () {
      applyPrintKind();
      if (SBS.PageFit) {
        SBS.PageFit.afterLayout(function () {
          SBS.PageFit.fitAll($("print-pages"), ".print-page.right, .print-leaf.text");
          window.print();
        });
        return;
      }
      window.print();
    });
    window.addEventListener("beforeprint", function () {
      if (!document.body.classList.contains("print-mode") || !SBS.PageFit) return;
      SBS.PageFit.fitAll($("print-pages"), ".print-page.right, .print-leaf.text");
    });
    $("btn-print-pdf").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      var btn = $("btn-print-pdf");
      if (!current || !SBS.Export || !SBS.Export.buildPdf) return;
      btn.disabled = true;
      SBS.Export.buildPdf(current, printKind()).then(function (file) {
        SBS.downloadBytes(file.filename, file.bytes, "application/pdf");
        btn.disabled = false;
      }).catch(function () {
        btn.disabled = false;
        showSoon("PDF", "PDFを作れませんでした。もう一度試してください。");
      });
    });
    $("btn-prompt-zip").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current || !SBS.PromptCompiler.downloadZip(current)) {
        showSoon("プロンプト", "先に絵本をつくってから保存してください。");
      }
    });
    SBS.Viewer.bind();
    refreshResume();
    refreshFolderButton();
    refreshGeminiStatus();
  };

  global.SBS = SBS;
})(window);
