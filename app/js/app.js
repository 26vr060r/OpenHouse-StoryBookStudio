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
      if (name === "wizard") lede.textContent = "選んだことは、あとから物語と插絵の材料になります。";
      else if (name === "book") lede.textContent = "左が插絵、右が文章です。キャラの見た目は全ページでそろえています。";
      else if (name === "generating") {
        lede.textContent = redrawing
          ? "いま、このページの絵を描き直しています。"
          : "いま、絵本を組み立てています。";
      }
      else if (name === "library") lede.textContent = "保存した絵本を、ここから開き直せます。";
      else if (name === "text-review") lede.textContent = "右ページの文章を直してから、登場人物の見た目を確認します。";
      else if (name === "char-review") lede.textContent = "登場人物の見た目を確認してから、絵本の絵を描きます。";
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

  function startWizard(seed) {
    showScreen("wizard");
    SBS.Wizard.start(seed);
  }

  function paintAndOpen(nextBook) {
    writeThenReview(nextBook);
  }

  var reviewBook = null;

  function writeThenReview(nextBook) {
    showScreen("generating");
    $("gen-message").textContent = "おはなしを書いています";
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    var writer = (SBS.Gemini && SBS.Gemini.writeBook) ? SBS.Gemini.writeBook : function (book, onP, onD) {
      if (onD) onD(book, "complete");
    };
    writer(nextBook, function (done, total, message) {
      $("gen-message").textContent = message;
      SBS.LibraryIO.sessionSave(nextBook, "running", done, total);
    }, function (finished, status) {
      if (status === "interrupted") {
        SBS.LibraryIO.sessionSave(finished, "interrupted", doneCount(finished), (finished.spreads || []).length);
        showScreen("home");
        refreshResume();
        return;
      }
      showTextReview(finished);
    });
  }

  function showTextReview(book) {
    reviewBook = book;
    var host = $("text-review-list");
    var err = $("text-review-error");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    if (!host) return;
    host.innerHTML = "";
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
    var cap = (SBS.LIMITS && SBS.LIMITS.pageText) || 400;
    (book.spreads || []).forEach(function (spread, i) {
      var wrap = document.createElement("article");
      wrap.className = "text-review-item";
      var label = document.createElement("label");
      label.className = "block-label";
      label.textContent = "右ページ " + (i * 2 + 2) + "（見開き" + spread.n + "）";
      var ta = document.createElement("textarea");
      ta.id = "review-text-" + i;
      ta.rows = 6;
      ta.maxLength = cap;
      ta.value = SBS.Story.plainText(spread.paragraphs, names);
      label.appendChild(ta);
      var count = document.createElement("p");
      count.className = "text-review-count";
      count.textContent = ta.value.length + " / " + cap + "字";
      ta.addEventListener("input", function () {
        count.textContent = ta.value.length + " / " + cap + "字";
      });
      wrap.appendChild(label);
      wrap.appendChild(count);
      host.appendChild(wrap);
    });
    showScreen("text-review");
  }

  function applyTextReview(book) {
    var cap = (SBS.LIMITS && SBS.LIMITS.pageText) || 400;
    var empty = false;
    (book.spreads || []).forEach(function (spread, i) {
      var ta = $("review-text-" + i);
      if (!ta) return;
      var text = String(ta.value || "").trim();
      if (!text) empty = true;
      spread.paragraphs = SBS.Story.fromPlainText(text, cap);
      spread.geminiTextDone = true;
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
    showScreen("generating");
    $("gen-message").textContent = "キャラクターデザインを描いています";
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    var painter = (SBS.Gemini && SBS.Gemini.paintCharacterSheets)
      ? SBS.Gemini.paintCharacterSheets
      : SBS.DemoArt.paintCharacterSheets;
    painter(nextBook, function (done, total, message) {
      $("gen-message").textContent = message;
      SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    }, function (finished, status) {
      if (status === "interrupted") {
        SBS.LibraryIO.sessionSave(finished, "interrupted", doneCount(finished), (finished.spreads || []).length);
        showScreen("home");
        refreshResume();
        return;
      }
      showCharReview(finished);
    });
  }

  function showCharReview(book) {
    reviewBook = book;
    var err = $("char-review-error");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    renderCharReview(book);
    showScreen("char-review");
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
    var painter = (SBS.Gemini && SBS.Gemini.paintCharacterSheet)
      ? SBS.Gemini.paintCharacterSheet
      : function (book, i, extra, onP, onD) {
        SBS.DemoArt.paintCharacterSheet(book, i, extra);
        if (onD) onD(book, "complete");
      };
    painter(reviewBook, index, note, function (done, total, message) {
      if (busy) busy.textContent = message || "描き直しています…";
    }, function (finished) {
      reviewBook = finished;
      setCharBusy(false);
      renderCharReview(finished);
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

  function composeThenPaint(nextBook) {
    collectCharNotes(nextBook);
    var compose = (SBS.DemoArt && SBS.DemoArt.composeCharacterSheet)
      ? SBS.DemoArt.composeCharacterSheet
      : function (book) { return Promise.resolve(book); };
    compose(nextBook).then(function (finished) {
      paintImagesAndOpen(finished || nextBook);
    });
  }

  function paintImagesAndOpen(nextBook) {
    showScreen("generating");
    $("gen-message").textContent = "絵を描いています";
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    var painter = (SBS.Gemini && SBS.Gemini.paintImages) ? SBS.Gemini.paintImages : SBS.DemoArt.paintBook;
    painter(nextBook, function (done, total, message) {
      $("gen-message").textContent = message;
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

  function openBook(intent) {
    showScreen("generating");
    $("gen-message").textContent = "おはなしを書いています";
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

  function redrawCurrent() {
    var current = SBS.Viewer.current();
    var stay = SBS.Viewer.spreadNumber ? SBS.Viewer.spreadNumber() : 1;
    var idx = SBS.Viewer.spreadIndex ? SBS.Viewer.spreadIndex() : stay - 1;
    if (!current || !current.spreads || !current.spreads[idx]) {
      showSoon("描き直し", "先に絵本を開いてから、描き直してください。");
      return;
    }
    redrawing = true;
    showScreen("generating");
    $("gen-message").textContent = "このページの絵を描き直しています";
    var painter = (SBS.Gemini && SBS.Gemini.paintSpread)
      ? SBS.Gemini.paintSpread
      : function (book, i, onProgress, onDone) {
        SBS.DemoArt.paintOne(book, i);
        if (onDone) onDone(book, "complete");
      };
    painter(current, idx, function (done, total, message) {
      $("gen-message").textContent = message;
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
      var btn = document.createElement("button");
      var title = document.createElement("span");
      var meta = document.createElement("span");
      btn.type = "button";
      btn.className = "library-item";
      btn.setAttribute("data-book-id", cat.bookId || "");
      title.className = "library-title";
      title.textContent = cat.title || "無題";
      meta.className = "library-meta";
      meta.textContent = formatStamp(cat.stamp) + (cat.bookId ? " ・ " + cat.bookId : "");
      btn.appendChild(title);
      btn.appendChild(meta);
      btn.addEventListener("click", function () {
        SBS.LibraryIO.openLocal(cat.bookId).then(function (book) {
          if (!book) {
            showSoon("書庫", "この絵本を開けませんでした。");
            return;
          }
          showScreen("book");
          SBS.Viewer.open(book);
          refreshFolderButton();
        });
      });
      item.appendChild(btn);
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
    $("btn-omakase").addEventListener("click", function () {
      openBook(SBS.intentFromSeed(SBS.OMAKASE));
    });
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
    if ($("btn-text-review-home")) {
      $("btn-text-review-home").addEventListener("click", function () {
        if (reviewBook) {
          SBS.LibraryIO.sessionSave(reviewBook, "interrupted", doneCount(reviewBook), (reviewBook.spreads || []).length);
        }
        reviewBook = null;
        showScreen("home");
        refreshResume();
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
        reviewCharactersAndOpen(reviewBook);
      });
    }
    if ($("btn-char-review-home")) {
      $("btn-char-review-home").addEventListener("click", function () {
        if (reviewBook) {
          SBS.LibraryIO.sessionSave(reviewBook, "interrupted", doneCount(reviewBook), (reviewBook.spreads || []).length);
        }
        reviewBook = null;
        showScreen("home");
        refreshResume();
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
    });
    $("btn-wizard-next").addEventListener("click", function () {
      var intent = SBS.Wizard.next();
      if (intent) openBook(intent);
    });
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
    if ($("btn-redraw")) {
      $("btn-redraw").addEventListener("click", redrawCurrent);
    }
    $("btn-save-zip").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current) {
        showSoon("保存", "先に絵本をつくってから保存してください。");
        return;
      }
      SBS.LibraryIO.saveLocal(current).then(function () {
        return SBS.LibraryIO.downloadZip(current);
      }).then(function (ok) {
        if (!ok) showSoon("保存", "ZIPを作れませんでした。");
      });
    });
    $("btn-write-folder").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current) return;
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
      if (book) SBS.Export.renderPrint($("print-pages"), book, kind);
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
      window.print();
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
