(function (global) {
  var SBS = global.SBS || {};
  var SPREAD_W = 2338;
  var SPREAD_H = 1654;
  var A5_W = 1240;
  var A5_H = 1754;

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function mmToPt(mm) {
    return Math.round(mm * 72 / 25.4 * 100) / 100;
  }

  function esc(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function namesFrom(book) {
    var names = { hero: "", friend: "" };
    var list = (book.bible && book.bible.characters) || [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].role === "hero") names.hero = list[i].displayName;
      else if (!names.friend) names.friend = list[i].displayName;
    }
    if (!names.hero && book.intent && book.intent.characters && book.intent.characters[0]) {
      names.hero = book.intent.characters[0].name || "";
    }
    return names;
  }

  function tokensToHtml(tokens, names, useRuby) {
    var html = "";
    var list = (SBS.Story && SBS.Story.expandPlainRubyTokens)
      ? SBS.Story.expandPlainRubyTokens(tokens)
      : (tokens || []);
    list.forEach(function (tok) {
      if (!tok) return;
      if (tok.n) {
        html += esc(names[tok.n] || "");
        return;
      }
      if (tok.k) {
        if (useRuby && tok.r) {
          html += "<ruby>" + esc(tok.k) + "<rt>" + esc(tok.r) + "</rt></ruby>";
        } else {
          html += esc(tok.k);
        }
        return;
      }
      html += esc(tok.t || "");
    });
    return html;
  }

  function paragraphsHtml(spread, names, furigana) {
    var parts = [];
    (spread.paragraphs || []).forEach(function (tokens) {
      var inner = tokensToHtml(tokens, names, furigana);
      if (inner) parts.push("<p>" + inner + "</p>");
    });
    return parts.join("");
  }

  function colophonLines(book) {
    var day = (book.createdAt || "").replace("T", " ").replace(/\+09:00$/, "");
    var gen = book.generator || "demo";
    var how = "插絵はアプリのキット、文章はスタジオが組み立てています。";
    if (gen === "gemini") {
      how = "插絵と文章の一部は生成AIを使っています。透かしは消していません。";
    } else if (gen === "hybrid") {
      how = "插絵の一部は生成AI、そろえられなかったページはアプリのキットです。透かしは消していません。";
    }
    return [
      "この絵本は StoryBook Studio でつくりました。",
      how,
      "つくった日: " + (day || "（不明）"),
      "bookId: " + (book.bookId || "")
    ];
  }

  var LEGAL_BLOCKS = [
    { k: "h", s: "Credit & Disclaimer" },
    { k: "h2", s: "【関係者の定義】" },
    { k: "p", s: "本クレジットおよび免責事項における用語の定義は以下の通りとします。" },
    { k: "p", s: "開発者・提供者：本アプリ「StoryBook Studio～世界に一つだけの絵本～」および展示物を企画・開発・運営・提供する者。" },
    { k: "p", s: "作成者：本アプリに設定や指示を入力し、絵本を生成・出力・保存・利用した者。" },
    { k: "h2", s: "【制作の想い】" },
    { k: "p", s: "本アプリ「StoryBook Studio～世界に一つだけの絵本～」およびその展示物は、非営利目的で制作・提供されております。皆様がAIに触れるきっかけとなり、その長所や短所を実際に体験していただくために作成いたしました。" },
    { k: "p", s: "アプリ名の通り、誕生した成果物は他にはない「世界に一つだけの作品」です。AIの特徴を深く理解し上手につき合っていくことで、皆様の生活がより豊かになること、そしてAIが共に学びを深めていく良きパートナーとなることを心より願っております。" },
    { k: "h2", s: "【権利関係・禁止事項・免責事項】" },
    { k: "p", s: "目的と成果物の性質：本アプリおよびその成果物は非営利目的で提供されています。生成される作品は個別の設定に基づく「世界に一つだけの作品」ですが、システムやAIの特性上、生成結果の完全な独自性や特定目的への適合性を保証するものではありません。" },
    { k: "p", s: "既存作品との類似性および権利侵害の責任：本作品に含まれるキャラクターのデザインや名前、舞台設定、シナリオストーリー等が既存の作品・第三者の知的財産権と類似または一致した場合であっても、それらに伴う権利侵害や紛争の一切の責任は「作成者」に帰属します。開発者・提供者は内容の事前確認を行わず、一切の責任を負いません。" },
    { k: "p", s: "複製・再配布・転売の禁止：本作品の無断での複製、複写、再配布、転売、および商業利用は固く禁止いたします。万が一、これらに違反した行為や作成者による共有・二次利用によってトラブルや損害が生じた場合、そのすべての責任は「作成者」が負うものとします。" },
    { k: "p", s: "トラブル・損害の免責：本作品の内容および利用（閲覧、配布、転売等を含む）に伴い発生したいかなるトラブルや損害についても、開発者・提供者は直接的・間接的を問わず理由の如何を問わず一切の責任を負いません。当事者間で解決するものとします。" },
    { k: "h2", s: "【利用した生成AI】" },
    { k: "p", s: "文章作成には gemini-3.1-pro-preview／3.8-flash／3.5-flash／2.5-flash、画像生成には gemini-3.1-flash-image／3.1-flash-lite-image／2.5-flash-image のいずれかを利用しています。" },
    { k: "h2", s: "【その他の免責・利用制限】" },
    { k: "p", s: "本クレジットおよび免責事項に記載した内容以外の免責事項や利用制限については、Google の Gemini API 追加利用規約に準ずるものとします。" },
    { k: "p", s: "引用：Gemini API 追加利用規約", href: "https://ai.google.dev/gemini-api/terms?hl=ja" }
  ];

  function legalLine(b) {
    if (!b) return "";
    if (b.href) return String(b.s || "") + " " + b.href;
    return String(b.s || "");
  }

  function legalHtml() {
    return LEGAL_BLOCKS.map(function (b) {
      if (b.k === "h") return "<h2>" + esc(b.s) + "</h2>";
      if (b.k === "h2") return "<h3>" + esc(b.s) + "</h3>";
      if (b.href) {
        return "<p>" + esc(b.s) + " <a href=\"" + esc(b.href) +
          "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(b.href) + "</a></p>";
      }
      return "<p>" + esc(b.s) + "</p>";
    }).join("");
  }

  function fillLegal(host) {
    LEGAL_BLOCKS.forEach(function (b) {
      var el = document.createElement(b.k === "h" ? "h2" : b.k === "h2" ? "h3" : "p");
      if (b.href) {
        el.appendChild(document.createTextNode(b.s + " "));
        var a = document.createElement("a");
        a.href = b.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = b.href;
        el.appendChild(a);
      } else {
        el.textContent = b.s;
      }
      host.appendChild(el);
    });
  }

  function coverFooterLines(book) {
    var names = namesFrom(book);
    var lines = [];
    var title = String((book && book.title) || "").trim();
    var who = [names.hero, names.friend].filter(Boolean).join("　");
    if (title) lines.push(title);
    if (who) lines.push(who);
    return lines;
  }

  function fillCoverFooter(host, book) {
    var lines = coverFooterLines(book);
    var footer = document.createElement("footer");
    var title = document.createElement("p");
    footer.className = "print-cover-footer";
    title.className = "print-cover-title";
    title.textContent = lines[0] || "";
    footer.appendChild(title);
    if (lines[1]) {
      var who = document.createElement("p");
      who.className = "print-cover-names";
      who.textContent = lines[1];
      footer.appendChild(who);
    }
    host.appendChild(footer);
  }

  function appendCoverFace(host, spread, book) {
    var art = document.createElement("div");
    art.className = "print-cover-art";
    appendArtImg(art, spread && spread.leftArt);
    host.appendChild(art);
    fillCoverFooter(host, book);
  }

  function appendBackFace(host, spread) {
    var artBox = document.createElement("div");
    var legal = document.createElement("div");
    artBox.className = "print-back-art";
    appendArtImg(artBox, spread && spread.leftArt);
    legal.className = "print-back-legal";
    fillLegal(legal);
    host.appendChild(artBox);
    host.appendChild(legal);
  }

  function forEachPrintPart(book, kind, fn) {
    var parts = SBS.bookParts ? SBS.bookParts(book) : null;
    var cover;
    var interior;
    var back;
    if (parts) {
      cover = parts.cover;
      interior = parts.interior || [];
      back = parts.back;
    } else {
      cover = (book.spreads || [])[0];
      interior = (book.spreads || []).slice(1);
      back = interior.length ? interior[interior.length - 1] : cover;
    }
    if (kind === "booklet") {
      fn("cover", cover);
      interior.forEach(function (spread) {
        fn("art", spread);
        fn("text", spread);
      });
      fn("back", back);
      return;
    }
    fn("wrap", { cover: cover, back: back });
    interior.forEach(function (spread) {
      fn("spread", spread);
    });
  }

  function appendArtImg(host, src) {
    if (!src) return;
    var img = document.createElement("img");
    img.className = "print-art";
    img.alt = "";
    img.src = src;
    host.appendChild(img);
  }

  function fitPrintText(container) {
    if (!SBS.PageFit) return;
    SBS.PageFit.afterLayout(function () {
      SBS.PageFit.fitAll(container, ".print-page.right, .print-leaf.text");
      var legal = container.querySelectorAll(".print-back-legal");
      var booklet = document.body.classList.contains("print-kind-booklet");
      var i;
      for (i = 0; i < legal.length; i += 1) {
        SBS.PageFit.fit(legal[i], (booklet || legal[i].closest(".print-wrap"))
          ? { min: 7.2, max: 13.8, lead: 1.3, gap: 0.16, pad: 0.04 }
          : { min: 8.5, max: 16.5, lead: 1.32, gap: 0.18, pad: 0.05 });
      }
    });
  }

  function renderParagraphs(host, spread, book) {
    var names = namesFrom(book);
    host.textContent = "";
    (spread.paragraphs || []).forEach(function (tokens) {
      var p = document.createElement("p");
      SBS.Story.renderParagraph(p, tokens, names, book.furigana);
      if (p.textContent) host.appendChild(p);
    });
  }

  function standaloneFitScript() {
    return "<script>(function(){function o(e,t){return t?e.scrollWidth>e.clientWidth+2:e.scrollHeight>e.clientHeight+2;}function f(e){if(!e||e.clientHeight<8)return;var t=e.classList.contains(\"tate\"),min=11,lo=min,hi=20,b=min,i,m;e.style.setProperty(\"--page-size\",\"20px\");e.style.setProperty(\"--page-lead\",\"1.9\");if(!o(e,t))return;for(i=0;i<14;i++){m=(lo+hi)/2;e.style.setProperty(\"--page-size\",m+\"px\");if(o(e,t))hi=m;else{b=m;lo=m;}}e.style.setProperty(\"--page-size\",b+\"px\");if(o(e,t)){e.style.setProperty(\"--page-lead\",\"1.55\");e.style.setProperty(\"--page-gap\",\"0.28em\");}}function run(){document.querySelectorAll(\".right,.leaf:not(.art)\").forEach(f);}if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){requestAnimationFrame(run);});else run();window.addEventListener(\"resize\",run);})();</scr" + "ipt>";
  }

  function standaloneCss(kind) {
    var page = kind === "booklet"
      ? "@page{size:148mm 210mm;margin:8mm;}"
      : "@page{size:297mm 210mm;margin:10mm;}";
    var sheet = kind === "booklet"
      ? ".spread{display:block;min-height:auto;margin:0 16px 24px;border:1px solid #c4a574;background:#fffdf8;} .leaf{min-height:60vh;padding:20px;} .leaf.art,.leaf.cover{background:#efe3d0;padding:0;overflow:hidden;} .leaf.back{display:flex;flex-direction:column;padding:0;} @media print{.spread{display:none;} .leaf{margin:0;border:0;min-height:194mm;height:194mm;break-after:page;page-break-after:always;}}"
      : ".spread{display:grid;grid-template-columns:1fr 1fr;min-height:70vh;background:#fffdf8;margin:0 16px 24px;border:1px solid #c4a574;} .spread.cover{display:block;padding:0;overflow:hidden;} .spread.back{display:flex;flex-direction:column;padding:0;} @media print{.spread{margin:0;border:0;width:277mm;height:190mm;break-after:page;page-break-after:always;} .leaf{display:none;}}";
    return [
      "@font-face{font-family:'Noto Serif JP';src:url('../fonts/NotoSerifJP-Regular.woff2') format('woff2');font-weight:400;font-display:swap;}",
      "@font-face{font-family:'Noto Sans JP';src:url('../fonts/NotoSansJP-Regular.woff2') format('woff2');font-weight:400;font-display:swap;}",
      "html,body{margin:0;background:#f4ead8;color:#3a2a22;font-family:'Noto Serif JP','Hiragino Mincho ProN',serif;}",
      ".bar{padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}",
      ".bar button{min-height:44px;padding:8px 16px;border-radius:999px;border:1px solid #7a2e32;background:#fffaf2;color:#7a2e32;font-family:'Noto Sans JP',sans-serif;}",
      ".left{background:#efe3d0;padding:0;overflow:hidden;height:100%;}",
      ".right,.leaf:not(.art):not(.back):not(.cover){--page-size:18px;--page-lead:1.9;--page-gap:.45em;--page-pad:.5em;padding:20px 18px 14px 24px;line-height:var(--page-lead);font-size:var(--page-size);overflow:hidden;overflow-wrap:anywhere;word-break:break-word;line-break:strict;height:100%;box-sizing:border-box;}",
      ".right p,.leaf p{margin:0 0 var(--page-gap);padding-top:var(--page-pad);text-align:justify;}",
      ".right p:last-child,.leaf p:last-child{margin-bottom:0;}",
      ".right.tate,.leaf.tate{writing-mode:vertical-rl;text-orientation:mixed;}",
      "img{width:100%;height:100%;object-fit:cover;display:block;}",
      ".back-art{height:50%;overflow:hidden;background:#efe3d0;}",
      ".back-legal{height:50%;overflow:hidden;box-sizing:border-box;padding:3mm 4.2mm;font-family:'Noto Sans JP',sans-serif;--page-size:11.5px;--page-lead:1.32;--page-gap:.18em;font-size:var(--page-size);line-height:var(--page-lead);}",
      ".back-legal h2{font-size:1.18em;margin:0 0 .3em;}",
      ".back-legal h3{font-size:1.05em;margin:.45em 0 .12em;}",
      ".back-legal p{margin:0 0 var(--page-gap);padding-top:0;text-align:justify;}",
      ".back-legal a{color:inherit;word-break:break-all;}",
      ".colophon{margin:16px;padding:24px;color:#6b5348;line-height:1.8;}",
      sheet,
      "@media print{" + page + " .bar,.colophon{display:none!important;} body{background:#fff;} .left{padding:0;overflow:hidden;} .right{padding:6mm 4mm 5mm 8mm;height:100%;overflow:hidden;}}"
    ].join("");
  }

  function viewHtml(book) {
    var names = namesFrom(book);
    var id = book.bookId;
    var dir = book.textDirection === "tate" ? "tate" : "yoko";
    var sheets = (book.spreads || []).map(function (s) {
      var src = "../book/" + id + "/" + id + "_p" + pad2(s.n) + ".png";
      return "<section class=\"spread\"><div class=\"left\"><img src=\"" + esc(src) + "\" alt=\"\"></div><div class=\"right " + dir + "\">" + paragraphsHtml(s, names, book.furigana) + "</div></section>";
    }).join("");
    var colo = "<section class=\"colophon\"><p>" + colophonLines(book).map(esc).join("<br>") + "</p></section>";
    return "<!DOCTYPE html><html lang=\"ja\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>" + esc(book.title) + "</title><style>" + standaloneCss("spread") + "</style></head><body><p class=\"bar\">" + esc(book.title) + " ・ 閲覧</p>" + sheets + colo + standaloneFitScript() + "</body></html>";
  }

  function printHtml(book, kind) {
    var names = namesFrom(book);
    var id = book.bookId;
    var dir = book.textDirection === "tate" ? "tate" : "yoko";
    var parts = [];
    var pageCount = SBS.bookPageCount ? SBS.bookPageCount(book) : (book.pageCount || ((book.spreads || []).length * 2) || 12);
    var spreadCount = Math.round(pageCount / 2);
    var label = kind === "booklet"
      ? "製本用 A5×" + pageCount + "ページ"
      : "A4横 " + spreadCount + "枚（見開き" + pageCount + "ページ）";
    kind = kind === "booklet" ? "booklet" : "spread";
    function artSrc(spread) {
      return "../book/" + id + "/" + id + "_p" + pad2(spread && spread.n) + ".png";
    }
    function coverFaceHtml(spread) {
      var lines = coverFooterLines(book);
      return "<div class=\"cover-art\"><img src=\"" + esc(artSrc(spread)) + "\" alt=\"\"></div><footer class=\"cover-footer\"><p class=\"cover-title\">" +
        esc(lines[0] || "") + "</p>" + (lines[1] ? "<p class=\"cover-names\">" + esc(lines[1]) + "</p>" : "") + "</footer>";
    }
    forEachPrintPart(book, kind, function (type, s) {
      var src;
      if (type === "wrap") {
        parts.push("<section class=\"spread wrap\"><div class=\"left back\"><div class=\"back-art\"><img src=\"" +
          esc(artSrc(s.back)) + "\" alt=\"\"></div><div class=\"back-legal\">" + legalHtml() +
          "</div></div><div class=\"right cover\">" + coverFaceHtml(s.cover) + "</div></section>");
        return;
      }
      if (type === "cover") {
        parts.push("<section class=\"leaf cover\">" + coverFaceHtml(s) + "</section>");
        return;
      }
      src = artSrc(s);
      if (type === "back") {
        parts.push("<section class=\"leaf back\"><div class=\"back-art\"><img src=\"" + esc(src) + "\" alt=\"\"></div><div class=\"back-legal\">" + legalHtml() + "</div></section>");
        return;
      }
      if (type === "art") {
        parts.push("<section class=\"leaf art\"><img src=\"" + esc(src) + "\" alt=\"\"></section>");
        return;
      }
      if (type === "text") {
        parts.push("<section class=\"leaf " + dir + "\">" + paragraphsHtml(s, names, book.furigana) + "</section>");
        return;
      }
      parts.push("<section class=\"spread\"><div class=\"left\"><img src=\"" + esc(src) + "\" alt=\"\"></div><div class=\"right " + dir + "\">" + paragraphsHtml(s, names, book.furigana) + "</div></section>");
    });
    var body = parts.join("");
    return "<!DOCTYPE html><html lang=\"ja\"><head><meta charset=\"UTF-8\"><title>" + esc(book.title) + " 印刷</title><style>" + standaloneCss(kind) + "</style></head><body><div class=\"bar no-print\"><span>" + esc(book.title) + " ・ " + label + "</span><button type=\"button\" onclick=\"window.print()\">印刷する</button></div>" + body + standaloneFitScript() + "</body></html>";
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) {
        resolve(null);
        return;
      }
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function wrapYoko(ctx, text, maxWidth) {
    var rows = [];
    String(text || "").split("\n").forEach(function (line) {
      var row = "";
      String(line).split("").forEach(function (ch) {
        if (ctx.measureText(row + ch).width > maxWidth && row) {
          rows.push(row);
          row = ch;
        } else {
          row += ch;
        }
      });
      if (row) rows.push(row);
    });
    return rows;
  }

  function wrapTate(text, maxHeight, lineH) {
    var cols = [];
    String(text || "").split("\n").forEach(function (para) {
      var col = "";
      var used = 0;
      String(para).split("").forEach(function (ch) {
        if (used + lineH > maxHeight && col) {
          cols.push(col);
          col = ch;
          used = lineH;
        } else {
          col += ch;
          used += lineH;
        }
      });
      if (col) cols.push(col);
    });
    return cols;
  }

  function fitAndDrawYoko(ctx, text, x, y, boxW, boxH, startSize) {
    var size = startSize || 32;
    var min = 14;
    var lead = 1.5;
    var rows = [];
    var lineH = 0;
    while (size >= min) {
      ctx.font = size + "px \"Noto Serif JP\", serif";
      rows = wrapYoko(ctx, text, boxW);
      lineH = Math.round(size * lead);
      if (rows.length * lineH <= boxH) break;
      size -= 1;
    }
    if (rows.length * lineH > boxH) {
      lead = 1.28;
      lineH = Math.round(size * lead);
    }
    while (rows.length * lineH > boxH && size > 12) {
      size -= 1;
      ctx.font = size + "px \"Noto Serif JP\", serif";
      rows = wrapYoko(ctx, text, boxW);
      lineH = Math.round(size * 1.25);
    }
    rows.forEach(function (row, i) {
      if (y + i * lineH + lineH > y + boxH + 1) return;
      ctx.fillText(row, x, y + i * lineH);
    });
  }

  function fitAndDrawTate(ctx, text, rightX, y, boxW, boxH, startSize) {
    var size = startSize || 32;
    var min = 14;
    var lineH = 0;
    var colGap = 0;
    var cols = [];
    while (size >= min) {
      lineH = Math.round(size * 1.32);
      colGap = Math.round(size * 1.65);
      cols = wrapTate(text, boxH, lineH);
      if (cols.length * colGap <= boxW) break;
      size -= 1;
    }
    ctx.font = size + "px \"Noto Serif JP\", serif";
    cols.forEach(function (col, i) {
      var cx = rightX - i * colGap;
      var cy = y;
      if (cx < rightX - boxW + size) return;
      String(col).split("").forEach(function (ch) {
        ctx.fillText(ch, cx, cy);
        cy += lineH;
      });
    });
  }

  function coverImage(ctx, img, x, y, w, h) {
    if (!img) return;
    var scale = Math.max(w / img.width, h / img.height);
    var dw = img.width * scale;
    var dh = img.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }

  function drawSpreadPng(book, spread) {
    var names = namesFrom(book);
    return loadImage(spread.leftArt).then(function (img) {
      var canvas = document.createElement("canvas");
      canvas.width = SPREAD_W;
      canvas.height = SPREAD_H;
      var ctx = canvas.getContext("2d");
      var mid = Math.round(SPREAD_W / 2);
      ctx.fillStyle = "#efe3d0";
      ctx.fillRect(0, 0, mid, SPREAD_H);
      ctx.fillStyle = "#fffdf8";
      ctx.fillRect(mid, 0, SPREAD_W - mid, SPREAD_H);
      coverImage(ctx, img, 0, 0, mid, SPREAD_H);
      ctx.fillStyle = "#3a2a22";
      ctx.textBaseline = "top";
      var text = SBS.Story.plainText(spread.paragraphs, names, { ruby: false });
      var pad = 72;
      if (book.textDirection === "tate") {
        fitAndDrawTate(ctx, text, SPREAD_W - pad, pad, SPREAD_W - mid - pad * 2, SPREAD_H - pad * 2, 36);
      } else {
        fitAndDrawYoko(ctx, text, mid + pad, pad, SPREAD_W - mid - pad * 2, SPREAD_H - pad * 2, 36);
      }
      return canvas;
    });
  }

  function drawA5Art(spread) {
    return loadImage(spread.leftArt).then(function (img) {
      var canvas = document.createElement("canvas");
      canvas.width = A5_W;
      canvas.height = A5_H;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#efe3d0";
      ctx.fillRect(0, 0, A5_W, A5_H);
      coverImage(ctx, img, 0, 0, A5_W, A5_H);
      return canvas;
    });
  }

  function drawA5Text(book, spread) {
    var names = namesFrom(book);
    var canvas = document.createElement("canvas");
    canvas.width = A5_W;
    canvas.height = A5_H;
    var ctx = canvas.getContext("2d");
    var text = SBS.Story.plainText(spread.paragraphs, names, { ruby: false });
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, A5_W, A5_H);
    ctx.fillStyle = "#3a2a22";
    ctx.textBaseline = "top";
    if (book.textDirection === "tate") {
      fitAndDrawTate(ctx, text, A5_W - 70, 64, A5_W - 140, A5_H - 128, 38);
    } else {
      fitAndDrawYoko(ctx, text, 64, 64, A5_W - 128, A5_H - 128, 38);
    }
    return Promise.resolve(canvas);
  }

  function legalLayoutHeight(ctx, size, boxW) {
    var y0 = 0;
    LEGAL_BLOCKS.forEach(function (b) {
      var fs = b.k === "h" ? size * 1.2 : b.k === "h2" ? size * 1.08 : size;
      var lead = b.k === "p" ? 1.34 : 1.22;
      var gap = b.k === "h2" ? size * 0.4 : size * 0.18;
      ctx.font = (b.k === "p" ? "400 " : "700 ") + fs + "px \"Noto Sans JP\", sans-serif";
      y0 += wrapYoko(ctx, legalLine(b), boxW).length * fs * lead + gap;
    });
    return y0;
  }

  function fitLegalSize(ctx, boxW, boxH) {
    var lo = 11;
    var hi = 34;
    var best = 11;
    var i;
    var mid;
    for (i = 0; i < 16; i += 1) {
      mid = (lo + hi) / 2;
      if (legalLayoutHeight(ctx, mid, boxW) <= boxH) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return best;
  }

  function drawLegal(ctx, x, y, boxW, boxH) {
    var size = fitLegalSize(ctx, boxW, boxH);
    var bottom = y + boxH;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#3a2a22";
    LEGAL_BLOCKS.forEach(function (b) {
      var fs = b.k === "h" ? size * 1.2 : b.k === "h2" ? size * 1.08 : size;
      var lead = b.k === "p" ? 1.34 : 1.22;
      var gap = b.k === "h2" ? size * 0.4 : size * 0.18;
      var rows;
      var i;
      ctx.font = (b.k === "p" ? "400 " : "700 ") + fs + "px \"Noto Sans JP\", sans-serif";
      rows = wrapYoko(ctx, legalLine(b), boxW);
      if (b.k === "h2") y += size * 0.12;
      for (i = 0; i < rows.length; i += 1) {
        if (y + fs > bottom + 1) return;
        ctx.fillText(rows[i], x, y);
        y += fs * lead;
      }
      y += gap;
    });
  }

  function paintCoverFace(ctx, img, book, x, y, w, h) {
    var footerH = Math.round(h * 0.16);
    var artH = h - footerH;
    var lines = coverFooterLines(book);
    var titleSize = Math.max(18, Math.round(footerH * 0.34));
    ctx.fillStyle = "#efe3d0";
    ctx.fillRect(x, y, w, artH);
    coverImage(ctx, img, x, y, w, artH);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(x, y + artH, w, footerH);
    ctx.fillStyle = "#3a2a22";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + titleSize + "px \"Noto Serif JP\", serif";
    ctx.fillText(lines[0] || "", x + w / 2, y + artH + footerH * (lines[1] ? 0.38 : 0.5), w - 28);
    if (lines[1]) {
      ctx.font = "400 " + Math.round(titleSize * 0.68) + "px \"Noto Sans JP\", sans-serif";
      ctx.fillStyle = "#6b5348";
      ctx.fillText(lines[1], x + w / 2, y + artH + footerH * 0.72, w - 28);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function drawCoverPage(book, spread, w, h) {
    return loadImage(spread && spread.leftArt).then(function (img) {
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      paintCoverFace(canvas.getContext("2d"), img, book, 0, 0, w, h);
      return canvas;
    });
  }

  function drawWrapSheet(book, pair) {
    var mid = Math.round(SPREAD_W / 2);
    return Promise.all([
      loadImage(pair && pair.back && pair.back.leftArt),
      loadImage(pair && pair.cover && pair.cover.leftArt)
    ]).then(function (imgs) {
      var canvas = document.createElement("canvas");
      var ctx;
      var half = Math.round(SPREAD_H / 2);
      canvas.width = SPREAD_W;
      canvas.height = SPREAD_H;
      ctx = canvas.getContext("2d");
      ctx.fillStyle = "#efe3d0";
      ctx.fillRect(0, 0, mid, half);
      coverImage(ctx, imgs[0], 0, 0, mid, half);
      ctx.fillStyle = "#fffdf8";
      ctx.fillRect(0, half, mid, SPREAD_H - half);
      drawLegal(ctx, Math.round(mid * 0.05), half + 14, mid - Math.round(mid * 0.1), SPREAD_H - half - 28);
      paintCoverFace(ctx, imgs[1], book, mid, 0, SPREAD_W - mid, SPREAD_H);
      return canvas;
    });
  }

  function drawBackCanvas(spread, w, h) {
    return loadImage(spread && spread.leftArt).then(function (img) {
      var canvas = document.createElement("canvas");
      var half = Math.round(h / 2);
      var ctx;
      canvas.width = w;
      canvas.height = h;
      ctx = canvas.getContext("2d");
      ctx.fillStyle = "#efe3d0";
      ctx.fillRect(0, 0, w, half);
      coverImage(ctx, img, 0, 0, w, half);
      ctx.fillStyle = "#fffdf8";
      ctx.fillRect(0, half, w, h - half);
      drawLegal(ctx, Math.round(w * 0.045), half + Math.round(h * 0.018), w - Math.round(w * 0.09), h - half - Math.round(h * 0.036));
      return canvas;
    });
  }

  function canvasToJpeg(canvas) {
    var url = canvas.toDataURL("image/jpeg", 0.88);
    var b64 = url.split("base64,")[1] || "";
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    var i;
    for (i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return { width: canvas.width, height: canvas.height, data: out };
  }

  function dataUrlToBytes(url) {
    if (!url || url.indexOf("base64,") === -1) return new Uint8Array(0);
    var b64 = url.split("base64,")[1];
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    var i;
    for (i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }

  function fetchFont(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("font");
      return res.arrayBuffer();
    }).then(function (buf) {
      return new Uint8Array(buf);
    }).catch(function () {
      return null;
    });
  }

  function renderPrint(container, book, kind) {
    container.textContent = "";
    kind = kind === "booklet" ? "booklet" : "spread";
    var dir = book.textDirection === "tate" ? "tate" : "yoko";
    forEachPrintPart(book, kind, function (type, spread) {
      var el;
      var left;
      var right;
      if (type === "wrap") {
        el = document.createElement("section");
        left = document.createElement("div");
        right = document.createElement("div");
        el.className = "print-sheet print-wrap";
        left.className = "print-page left print-back";
        right.className = "print-page right print-cover";
        appendBackFace(left, spread.back);
        appendCoverFace(right, spread.cover, book);
        el.appendChild(left);
        el.appendChild(right);
        container.appendChild(el);
        return;
      }
      if (type === "cover") {
        el = document.createElement("section");
        el.className = "print-leaf print-cover";
        appendCoverFace(el, spread, book);
        container.appendChild(el);
        return;
      }
      if (type === "back") {
        el = document.createElement("section");
        el.className = kind === "booklet" ? "print-leaf print-back" : "print-back";
        appendBackFace(el, spread);
        container.appendChild(el);
        return;
      }
      if (type === "art") {
        el = document.createElement("section");
        el.className = "print-leaf art";
        appendArtImg(el, spread.leftArt);
        container.appendChild(el);
        return;
      }
      if (type === "text") {
        el = document.createElement("section");
        el.className = "print-leaf text " + dir;
        el.setAttribute("data-role", spread.role || "story");
        renderParagraphs(el, spread, book);
        container.appendChild(el);
        return;
      }
      el = document.createElement("section");
      left = document.createElement("div");
      right = document.createElement("div");
      el.className = "print-sheet";
      left.className = "print-page left";
      appendArtImg(left, spread.leftArt);
      right.className = "print-page right " + dir;
      right.setAttribute("data-role", spread.role || "story");
      renderParagraphs(right, spread, book);
      el.appendChild(left);
      el.appendChild(right);
      container.appendChild(el);
    });
    fitPrintText(container);
  }

  function buildPdf(book, kind) {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var pages = [];
    kind = kind === "booklet" ? "booklet" : "spread";
    return ready.then(function () {
      var chain = Promise.resolve();
      forEachPrintPart(book, kind, function (type, spread) {
        chain = chain.then(function () {
          if (type === "wrap") return drawWrapSheet(book, spread);
          if (type === "cover") return drawCoverPage(book, spread, A5_W, A5_H);
          if (type === "art") return drawA5Art(spread);
          if (type === "text") return drawA5Text(book, spread);
          if (type === "back") return drawBackCanvas(spread, A5_W, A5_H);
          return drawSpreadPng(book, spread);
        }).then(function (canvas) {
          pages.push(canvasToJpeg(canvas));
        });
      });
      return chain;
    }).then(function () {
      if (kind === "booklet") {
        return {
          filename: book.bookId + ".booklet.pdf",
          bytes: SBS.pdfFromJpegs(pages, mmToPt(148), mmToPt(210))
        };
      }
      return {
        filename: book.bookId + ".print-a4.pdf",
        bytes: SBS.pdfFromJpegs(pages, mmToPt(297), mmToPt(210))
      };
    });
  }

  SBS.Export = {
    colophonLines: colophonLines,
    fillLegal: fillLegal,
    renderPrint: renderPrint,
    fitPrintText: fitPrintText,
    namesFrom: namesFrom,
    buildPdf: buildPdf,
    buildFiles: function buildFiles(book) {
      var id = book.bookId;
      var files = [
        { path: "html/" + id + ".view.html", data: viewHtml(book) },
        { path: "html/" + id + ".print-a4.html", data: printHtml(book, "spread") },
        { path: "html/" + id + ".print-booklet.html", data: printHtml(book, "booklet") }
      ];
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      return ready.then(function () {
        var chain = Promise.resolve();
        (book.spreads || []).forEach(function (spread) {
          chain = chain.then(function () {
            return drawSpreadPng(book, spread).then(function (canvas) {
              files.push({
                path: "spreads/" + id + "/" + id + "_p" + pad2(spread.n) + ".spread.png",
                data: dataUrlToBytes(canvas.toDataURL("image/png"))
              });
            });
          });
        });
        return chain;
      }).then(function () {
        return Promise.all([
          fetchFont("fonts/NotoSansJP-Regular.woff2"),
          fetchFont("fonts/NotoSerifJP-Regular.woff2")
        ]);
      }).then(function (fonts) {
        if (fonts[0] && fonts[0].length) files.push({ path: "fonts/NotoSansJP-Regular.woff2", data: fonts[0] });
        if (fonts[1] && fonts[1].length) files.push({ path: "fonts/NotoSerifJP-Regular.woff2", data: fonts[1] });
        return files;
      });
    }
  };

  global.SBS = SBS;
})(window);
