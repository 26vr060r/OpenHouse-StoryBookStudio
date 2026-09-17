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
    (spread.paragraphs || []).forEach(function (tokens) {
      var p = document.createElement("p");
      SBS.Story.renderParagraph(p, tokens, names, book.furigana);
      if (p.textContent) right.appendChild(p);
    });

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

    var studio = $("book-studio");
    if (studio) {
      if (SBS.isStudio && SBS.isStudio()) {
        studio.hidden = false;
        studio.textContent = JSON.stringify({ bible: book.bible, spread: spread.scene }, null, 2);
      } else {
        studio.hidden = true;
      }
    }
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
    open: function open(nextBook) {
      book = nextBook;
      index = 0;
      $("book-title-bar").textContent = book.title;
      renderSpread();
    },
    bind: function bind() {
      $("btn-book-prev").addEventListener("click", function () { go(-1); });
      $("btn-book-next").addEventListener("click", function () { go(1); });
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
