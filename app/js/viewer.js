(function (global) {
  var SBS = global.SBS || {};
  var index = 0;
  var book = null;
  var touchX = null;

  function $(id) {
    return document.getElementById(id);
  }

  function isPortrait() {
    return window.matchMedia && window.matchMedia("(max-width: 700px), (orientation: portrait) and (max-width: 900px)").matches;
  }

  function pageCount() {
    if (!book) return 0;
    return isPortrait() ? book.spreads.length * 2 : book.spreads.length;
  }

  function spreadOf(viewIndex) {
    if (isPortrait()) return book.spreads[Math.floor(viewIndex / 2)];
    return book.spreads[viewIndex];
  }

  function showSide(viewIndex) {
    if (!isPortrait()) return "both";
    return viewIndex % 2 === 0 ? "left" : "right";
  }

  function renderSpread() {
    if (!book) return;
    var spread = spreadOf(index);
    var side = showSide(index);
    var left = $("book-left");
    var right = $("book-right");
    var label = $("book-page-label");
    var names = {};
    var bible = book.bible || { characters: [] };
    bible.characters.forEach(function (ch) {
      if (ch.role === "hero") names.hero = ch.displayName;
      else if (!names.friend) names.friend = ch.displayName;
    });
    names.hero = names.hero || (book.intent.characters[0] && book.intent.characters[0].name) || "";
    names.friend = names.friend || "";

    left.innerHTML = "";
    var art = document.createElement("img");
    art.className = "spread-art";
    art.alt = "";
    if (spread.leftArt) {
      art.src = spread.leftArt;
      left.appendChild(art);
    } else {
      var fallback = document.createElement("div");
      fallback.className = "art-placeholder";
      fallback.appendChild(document.createTextNode("插絵 " + (spread.n < 10 ? "0" : "") + spread.n));
      left.appendChild(fallback);
    }

    right.innerHTML = "";
    right.className = "book-page right-page " + (book.textDirection === "tate" ? "tate" : "yoko");
    right.setAttribute("data-role", spread.role || "story");
    (spread.paragraphs || []).forEach(function (tokens) {
      var p = document.createElement("p");
      SBS.Story.renderParagraph(p, tokens, names, book.furigana);
      if (p.textContent) right.appendChild(p);
    });
    if (spread.role === "coda" && SBS.Export && SBS.Export.colophonLines) {
      SBS.Export.colophonLines(book).forEach(function (line) {
        var note = document.createElement("p");
        note.className = "colophon-line";
        note.textContent = line;
        right.appendChild(note);
      });
    }

    if (isPortrait()) {
      left.hidden = side !== "left";
      right.hidden = side !== "right";
      label.textContent = "ページ " + (index + 1) + " / " + pageCount();
    } else {
      left.hidden = false;
      right.hidden = false;
      label.textContent = "見開き " + spread.n + " / " + book.spreads.length;
    }

    $("btn-book-prev").disabled = index <= 0;
    $("btn-book-next").disabled = index >= pageCount() - 1;
    fillBookBrief();
    if (SBS.PageFit) {
      SBS.PageFit.afterLayout(function () {
        if ($("book-right")) SBS.PageFit.fit($("book-right"));
      });
    }

    var studio = $("book-studio");
    var panel = $("studio-prompts");
    var pagePrompt = null;
    if (book.prompts && book.prompts.pages) {
      pagePrompt = book.prompts.pages[spread.n - 1];
    }
    var studioOn = SBS.isStudio && SBS.isStudio() && !(SBS.isKiosk && SBS.isKiosk());
    if (studioOn) {
      if (studio) {
        studio.hidden = false;
        studio.textContent = JSON.stringify({
          bookId: book.bookId || "",
          bible: book.bible,
          spread: spread.scene
        }, null, 2);
      }
      if (panel) {
        panel.hidden = false;
        if ($("studio-bookid")) $("studio-bookid").textContent = "bookId: " + (book.bookId || "");
        if ($("studio-image-prompt")) $("studio-image-prompt").value = pagePrompt ? pagePrompt.image : "";
        if ($("studio-text-prompt")) $("studio-text-prompt").value = pagePrompt ? pagePrompt.text : "";
        if ($("studio-locks")) {
          $("studio-locks").textContent = [
            book.prompts && book.prompts.styleLock,
            book.prompts && book.prompts.characterLock,
            book.prompts && book.prompts.worldLock,
            book.prompts && book.prompts.negative
          ].filter(Boolean).join("\n\n");
        }
      }
    } else {
      if (studio) studio.hidden = true;
      if (panel) panel.hidden = true;
    }
  }

  function fillBookBrief() {
    var box = $("book-brief");
    var editor = $("book-brief-markdown");
    if (!box || !editor || !SBS.IntentMarkdown) return;
    var text = SBS.IntentMarkdown.fromBook(book);
    editor.value = text || "";
    box.hidden = !text;
  }

  function go(delta) {
    var next = index + delta;
    if (next < 0 || next >= pageCount()) return;
    index = next;
    renderSpread();
  }

  function onKey(ev) {
    if (!$("screen-book") || $("screen-book").hidden) return;
    if (ev.key === "ArrowRight") go(1);
    if (ev.key === "ArrowLeft") go(-1);
  }

  function onTouchStart(ev) {
    if (!ev.changedTouches || !ev.changedTouches[0]) return;
    touchX = ev.changedTouches[0].clientX;
  }

  function onTouchEnd(ev) {
    if (touchX == null || !ev.changedTouches || !ev.changedTouches[0]) return;
    var dx = ev.changedTouches[0].clientX - touchX;
    touchX = null;
    if (dx > 40) go(-1);
    if (dx < -40) go(1);
  }

  SBS.Viewer = {
    open: function open(nextBook, spreadN) {
      book = nextBook;
      var n = spreadN || 1;
      if (n < 1) n = 1;
      if (book && book.spreads && n > book.spreads.length) n = book.spreads.length;
      if (isPortrait()) index = (n - 1) * 2;
      else index = n - 1;
      if (index < 0) index = 0;
      var titleEl = $("book-title-input") || $("book-title-bar");
      if (titleEl) {
        if ("value" in titleEl) titleEl.value = book.title || "";
        else titleEl.textContent = book.title || "";
      }
      renderSpread();
    },
    current: function current() {
      return book;
    },
    spreadNumber: function spreadNumber() {
      if (!book) return 1;
      return spreadOf(index).n;
    },
    spreadIndex: function spreadIndex() {
      if (!book) return 0;
      return spreadOf(index).n - 1;
    },
    bind: function bind() {
      $("btn-book-prev").addEventListener("click", function () { go(-1); });
      $("btn-book-next").addEventListener("click", function () { go(1); });
      if ($("btn-book-brief-copy")) {
        $("btn-book-brief-copy").addEventListener("click", function () {
          var editor = $("book-brief-markdown");
          if (!editor || !SBS.IntentMarkdown) return;
          SBS.IntentMarkdown.copy(editor.value).then(function () {
            $("btn-book-brief-copy").textContent = "コピーしました";
            window.setTimeout(function () {
              $("btn-book-brief-copy").textContent = "コピー";
            }, 1600);
          });
        });
      }
      if ($("btn-book-brief-download")) {
        $("btn-book-brief-download").addEventListener("click", function () {
          var editor = $("book-brief-markdown");
          if (!editor || !SBS.IntentMarkdown) return;
          SBS.IntentMarkdown.download(editor.value, SBS.IntentMarkdown.intentFromBook(book));
        });
      }
      document.addEventListener("keydown", onKey);
      var stage = $("book-spread");
      stage.addEventListener("touchstart", onTouchStart, { passive: true });
      stage.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("resize", function () {
        if (!$("screen-book") || $("screen-book").hidden || !book) return;
        var spreadN = spreadOf(index).n;
        if (isPortrait()) index = (spreadN - 1) * 2;
        else index = spreadN - 1;
        if (index < 0) index = 0;
        renderSpread();
      });
    }
  };

  global.SBS = SBS;
})(window);
