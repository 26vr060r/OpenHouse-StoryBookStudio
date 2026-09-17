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
    var text = extra || (featureName + "はまだつながっていません。次のスプリントで載せます。");
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

  function showScreen(name) {
    var home = $("screen-home");
    var wizard = $("screen-wizard");
    var book = $("screen-book");
    var gen = $("screen-generating");
    var library = $("screen-library");
    var lede = $("page-lede");
    if (home) home.hidden = name !== "home";
    if (wizard) wizard.hidden = name !== "wizard";
    if (book) book.hidden = name !== "book";
    if (gen) gen.hidden = name !== "generating";
    if (library) library.hidden = name !== "library";
    if (lede) {
      if (name === "wizard") lede.textContent = "選んだことは、あとから物語と插絵の材料になります。";
      else if (name === "book") lede.textContent = "左が插絵、右が文章です。キャラの見た目は全ページでそろえています。";
      else if (name === "generating") lede.textContent = "いま、絵本を組み立てています。";
      else if (name === "library") lede.textContent = "保存した絵本を、ここから開き直せます。";
      else lede.textContent = "テーマや登場人物を選んで、見開き24ページの絵本をつくるスタジオです。";
    }
  }

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
    showScreen("generating");
    $("gen-message").textContent = "登場人物の色をそろえています";
    SBS.LibraryIO.sessionSave(nextBook, "running", doneCount(nextBook), (nextBook.spreads || []).length);
    SBS.DemoArt.paintBook(nextBook, function (done, total, message) {
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
      showScreen("book");
      SBS.Viewer.open(finished);
    });
  }

  function openBook(intent) {
    showScreen("generating");
    $("gen-message").textContent = "登場人物の色をそろえています";
    window.setTimeout(function () {
      try {
        var bible = SBS.Bible.fromIntent(intent);
        var nextBook = SBS.Story.build(intent, bible);
        if (!SBS.PromptTemplates || !SBS.PromptCompiler) {
          throw new Error("prompt compiler missing");
        }
        SBS.PromptCompiler.compile(intent, bible, nextBook);
        paintAndOpen(nextBook);
      } catch (err) {
        showScreen("home");
        showSoon("絵本", "絵本を開けませんでした。ページを再読み込みして、もう一度試してください。");
      }
    }, 60);
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
        paintAndOpen(session.book);
      });
    });
    $("btn-gen-cancel").addEventListener("click", function () {
      SBS.DemoArt.cancelPaint();
    });
    $("btn-gear").addEventListener("click", function () {
      refreshFolderButton();
      openDialog("settings-dialog");
    });
    $("btn-soon-close").addEventListener("click", closeSoon);
    $("btn-settings-close").addEventListener("click", function () {
      closeDialog("settings-dialog");
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
    $("furigana-input").addEventListener("change", function () {
      SBS.Wizard.markFuriganaTouched();
    });
    $("btn-book-home").addEventListener("click", function () {
      showScreen("home");
      refreshResume();
    });
    $("btn-save-zip").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current) {
        showSoon("保存", "先に絵本をつくってから保存してください。");
        return;
      }
      SBS.LibraryIO.saveLocal(current).then(function () {
        if (!SBS.LibraryIO.downloadZip(current)) {
          showSoon("保存", "ZIPを作れませんでした。");
        }
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
    $("btn-prompt-zip").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current || !SBS.PromptCompiler.downloadZip(current)) {
        showSoon("プロンプト", "先に絵本をつくってから保存してください。");
      }
    });
    SBS.Viewer.bind();
    refreshResume();
    refreshFolderButton();
  };

  global.SBS = SBS;
})(window);
