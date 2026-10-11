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

  function partsOf() {
    return SBS.bookParts ? SBS.bookParts(book) : {
      cover: book.spreads[0],
      interior: (book.spreads || []).slice(1),
      back: book.spreads[(book.spreads || []).length - 1],
      pageCount: book.pageCount || ((book.spreads || []).length * 2)
    };
  }

  function pageCount() {
    if (!book) return 0;
    var parts = partsOf();
    if (isPortrait()) return parts.pageCount;
    return parts.interior.length + 2;
  }

  function currentSpread() {
    var parts = partsOf();
    var p;
    var k;
    if (!book) return null;
    if (isPortrait()) {
      p = index + 1;
      if (p === 1) return parts.cover;
      if (p === parts.pageCount) return parts.back && parts.back.virtual && parts.interior.length
        ? parts.interior[parts.interior.length - 1]
        : parts.back;
      return parts.interior[Math.floor((p - 2) / 2)] || parts.cover;
    }
    if (index === 0) return parts.cover;
    if (index >= parts.interior.length + 1) {
      return parts.back && parts.back.virtual && parts.interior.length
        ? parts.interior[parts.interior.length - 1]
        : parts.back;
    }
    return parts.interior[index - 1] || parts.cover;
  }

  function viewKind() {
    var parts = partsOf();
    if (isPortrait()) {
      if (index === 0) return "cover";
      if (index === parts.pageCount - 1) return "back";
      return (index + 1) % 2 === 0 ? "art" : "text";
    }
    if (index === 0) return "cover";
    if (index >= parts.interior.length + 1) return "back";
    return "spread";
  }

  function appendArt(host, spread, label) {
    var art;
    var fallback;
    host.innerHTML = "";
    if (spread && spread.leftArt) {
      art = document.createElement("img");
      art.className = "spread-art";
      art.alt = "";
      art.src = spread.leftArt;
      host.appendChild(art);
      return;
    }
    fallback = document.createElement("div");
    fallback.className = "art-placeholder";
    fallback.appendChild(document.createTextNode(label || "插絵"));
    host.appendChild(fallback);
  }

  function appendCover(host, spread, names) {
    var artBox = document.createElement("div");
    var footer = document.createElement("footer");
    var title = document.createElement("p");
    var who;
    artBox.className = "cover-art";
    appendArt(artBox, spread, "表紙");
    footer.className = "cover-footer";
    title.className = "cover-title";
    title.textContent = book.title || "";
    footer.appendChild(title);
    who = [names.hero, names.friend].filter(Boolean).join("　");
    if (who) {
      var namesEl = document.createElement("p");
      namesEl.className = "cover-names";
      namesEl.textContent = who;
      footer.appendChild(namesEl);
    }
    host.innerHTML = "";
    host.appendChild(artBox);
    host.appendChild(footer);
  }

  function appendBack(host, spread) {
    var artBox = document.createElement("div");
    var legal = document.createElement("div");
    artBox.className = "book-back-art";
    appendArt(artBox, spread, "裏表紙");
    legal.className = "book-back-legal";
    if (SBS.Export && SBS.Export.fillLegal) SBS.Export.fillLegal(legal);
    else if (SBS.Export && SBS.Export.colophonLines) {
      SBS.Export.colophonLines(book).forEach(function (line) {
        var p = document.createElement("p");
        p.textContent = line;
        legal.appendChild(p);
      });
    }
    host.innerHTML = "";
    host.appendChild(artBox);
    host.appendChild(legal);
  }

  function renderSpread() {
    if (!book) return;
    var spread = currentSpread();
    var kind = viewKind();
    var parts = partsOf();
    var left = $("book-left");
    var right = $("book-right");
    var label = $("book-page-label");
    var stage = $("book-spread");
    var names = {};
    var bible = book.bible || { characters: [] };
    bible.characters.forEach(function (ch) {
      if (ch.role === "hero") names.hero = ch.displayName;
      else if (!names.friend) names.friend = ch.displayName;
    });
    names.hero = names.hero || (book.intent && book.intent.characters && book.intent.characters[0] && book.intent.characters[0].name) || "";
    names.friend = names.friend || "";

    left.className = "book-page left-page" + (kind === "cover" ? " is-cover" : kind === "back" ? " is-back" : "");
    right.className = "book-page right-page " + (book.textDirection === "tate" ? "tate" : "yoko");
    right.removeAttribute("data-role");
    if (stage) stage.classList.toggle("is-single", kind === "cover" || kind === "back");

    if (kind === "cover") {
      appendCover(left, parts.cover, names);
      right.innerHTML = "";
      left.hidden = false;
      right.hidden = true;
      if (label) label.textContent = "表紙（1 / " + parts.pageCount + "ページ）";
    } else if (kind === "back") {
      appendBack(left, parts.back);
      right.innerHTML = "";
      left.hidden = false;
      right.hidden = true;
      if (label) label.textContent = "裏表紙（" + parts.pageCount + " / " + parts.pageCount + "ページ）";
    } else if (kind === "art") {
      appendArt(left, spread, "插絵");
      right.innerHTML = "";
      left.hidden = false;
      right.hidden = true;
      if (label) label.textContent = "ページ " + (index + 1) + " / " + parts.pageCount;
    } else if (kind === "text") {
      left.innerHTML = "";
      right.innerHTML = "";
      right.setAttribute("data-role", spread.role || "story");
      (spread.paragraphs || []).forEach(function (tokens) {
        var p = document.createElement("p");
        SBS.Story.renderParagraph(p, tokens, names, book.furigana);
        if (p.textContent) right.appendChild(p);
      });
      left.hidden = true;
      right.hidden = false;
      if (label) label.textContent = "ページ " + (index + 1) + " / " + parts.pageCount;
    } else {
      appendArt(left, spread, "插絵");
      right.innerHTML = "";
      right.setAttribute("data-role", spread.role || "story");
      (spread.paragraphs || []).forEach(function (tokens) {
        var p = document.createElement("p");
        SBS.Story.renderParagraph(p, tokens, names, book.furigana);
        if (p.textContent) right.appendChild(p);
      });
      left.hidden = false;
      right.hidden = false;
      if (label) {
        var k = index - 1;
        var leftPage = k * 2 + 2;
        label.textContent = "ページ " + leftPage + "–" + (leftPage + 1) + " / " + parts.pageCount;
      }
    }

    $("btn-book-prev").disabled = index <= 0;
    $("btn-book-next").disabled = index >= pageCount() - 1;
    fillBookBrief();
    if (SBS.PageFit) {
      SBS.PageFit.afterLayout(function () {
        var legalBox;
        if ($("book-right") && !$("book-right").hidden) SBS.PageFit.fit($("book-right"));
        legalBox = left.querySelector(".book-back-legal");
        if (legalBox) SBS.PageFit.fit(legalBox, { min: 8, max: 16.5, lead: 1.32, gap: 0.2, pad: 0.05 });
      });
    }

    var studio = $("book-studio");
    var panel = $("studio-prompts");
    var pagePrompt = null;
    if (spread && book.prompts && book.prompts.pages) {
      pagePrompt = book.prompts.pages[spread.n - 1];
    }
    var studioOn = SBS.isStudio && SBS.isStudio() && !(SBS.isKiosk && SBS.isKiosk());
    if (studioOn) {
      if (studio) {
        studio.hidden = false;
        studio.textContent = JSON.stringify({
          bookId: book.bookId || "",
          bible: book.bible,
          spread: spread && spread.scene
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
      var parts;
      var target = null;
      var k;
      if (n < 1) n = 1;
      if (book && book.spreads && n > book.spreads.length) n = book.spreads.length;
      parts = partsOf();
      (book.spreads || []).forEach(function (s) {
        if (s && s.n === n) target = s;
      });
      if (!target) target = parts.cover;
      if (target && target.role === "cover") index = 0;
      else if (target && target.role === "back") {
        index = isPortrait() ? parts.pageCount - 1 : parts.interior.length + 1;
      } else {
        k = parts.interior.indexOf(target);
        if (k < 0) k = 0;
        index = isPortrait() ? k * 2 + 1 : k + 1;
      }
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
    clear: function clear() {
      book = null;
    },
    spreadNumber: function spreadNumber() {
      var spread = currentSpread();
      return (spread && spread.n) || 1;
    },
    spreadIndex: function spreadIndex() {
      var spread = currentSpread();
      if (!book || !spread) return 0;
      return Math.max(0, (book.spreads || []).indexOf(spread));
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
        var spreadN = (currentSpread() && currentSpread().n) || 1;
        SBS.Viewer.open(book, spreadN);
      });
    }
  };

  global.SBS = SBS;
})(window);
