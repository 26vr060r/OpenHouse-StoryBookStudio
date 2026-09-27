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
      ? ".spread{display:block;min-height:auto;margin:0 16px 24px;border:1px solid #c4a574;background:#fffdf8;} .leaf{min-height:60vh;padding:20px;} .leaf.art{background:#efe3d0;} @media print{.spread{display:none;} .leaf{margin:0;border:0;min-height:194mm;height:194mm;break-after:page;page-break-after:always;}}"
      : ".spread{display:grid;grid-template-columns:1fr 1fr;min-height:70vh;background:#fffdf8;margin:0 16px 24px;border:1px solid #c4a574;} @media print{.spread{margin:0;border:0;width:277mm;height:190mm;break-after:page;page-break-after:always;} .leaf{display:none;}}";
    return [
      "@font-face{font-family:'Noto Serif JP';src:url('../fonts/NotoSerifJP-Regular.woff2') format('woff2');font-weight:400;font-display:swap;}",
      "@font-face{font-family:'Noto Sans JP';src:url('../fonts/NotoSansJP-Regular.woff2') format('woff2');font-weight:400;font-display:swap;}",
      "html,body{margin:0;background:#f4ead8;color:#3a2a22;font-family:'Noto Serif JP','Hiragino Mincho ProN',serif;}",
      ".bar{padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}",
      ".bar button{min-height:44px;padding:8px 16px;border-radius:999px;border:1px solid #7a2e32;background:#fffaf2;color:#7a2e32;font-family:'Noto Sans JP',sans-serif;}",
      ".left{background:#efe3d0;padding:0;overflow:hidden;height:100%;}",
      ".right,.leaf:not(.art){--page-size:18px;--page-lead:1.9;--page-gap:.45em;--page-pad:.5em;padding:20px 18px 14px 24px;line-height:var(--page-lead);font-size:var(--page-size);overflow:hidden;overflow-wrap:anywhere;word-break:break-word;line-break:strict;height:100%;box-sizing:border-box;}",
      ".right p,.leaf p{margin:0 0 var(--page-gap);padding-top:var(--page-pad);text-align:justify;}",
      ".right p:last-child,.leaf p:last-child{margin-bottom:0;}",
      ".right.tate,.leaf.tate{writing-mode:vertical-rl;text-orientation:mixed;}",
      "img{width:100%;height:100%;object-fit:cover;display:block;}",
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
    var body;
    var pageCount = book.pageCount || ((book.spreads || []).length * 2) || 12;
    var label = kind === "booklet" ? "製本用 A5×" + pageCount + "ページ" : "A4横 1枚＝見開き1つ";
    if (kind === "booklet") {
      body = (book.spreads || []).map(function (s) {
        var src = "../book/" + id + "/" + id + "_p" + pad2(s.n) + ".png";
        return "<section class=\"leaf art\"><img src=\"" + esc(src) + "\" alt=\"\"></section><section class=\"leaf " + dir + "\">" + paragraphsHtml(s, names, book.furigana) + "</section>";
      }).join("");
    } else {
      body = (book.spreads || []).map(function (s) {
        var src = "../book/" + id + "/" + id + "_p" + pad2(s.n) + ".png";
        return "<section class=\"spread\"><div class=\"left\"><img src=\"" + esc(src) + "\" alt=\"\"></div><div class=\"right " + dir + "\">" + paragraphsHtml(s, names, book.furigana) + "</div></section>";
      }).join("");
    }
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
    (book.spreads || []).forEach(function (spread) {
      if (kind === "booklet") {
        var art = document.createElement("section");
        var text = document.createElement("section");
        art.className = "print-leaf art";
        if (spread.leftArt) {
          var img = document.createElement("img");
          img.className = "print-art";
          img.alt = "";
          img.src = spread.leftArt;
          art.appendChild(img);
        }
        text.className = "print-leaf text " + dir;
        text.setAttribute("data-role", spread.role || "story");
        renderParagraphs(text, spread, book);
        container.appendChild(art);
        container.appendChild(text);
        return;
      }
      var sheet = document.createElement("section");
      var left = document.createElement("div");
      var right = document.createElement("div");
      sheet.className = "print-sheet";
      left.className = "print-page left";
      if (spread.leftArt) {
        var spreadImg = document.createElement("img");
        spreadImg.className = "print-art";
        spreadImg.alt = "";
        spreadImg.src = spread.leftArt;
        left.appendChild(spreadImg);
      }
      right.className = "print-page right " + dir;
      right.setAttribute("data-role", spread.role || "story");
      renderParagraphs(right, spread, book);
      sheet.appendChild(left);
      sheet.appendChild(right);
      container.appendChild(sheet);
    });
    if (SBS.PageFit) {
      SBS.PageFit.afterLayout(function () {
        SBS.PageFit.fitAll(container, ".print-page.right, .print-leaf.text");
      });
    }
  }

  function buildPdf(book, kind) {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var pages = [];
    kind = kind === "booklet" ? "booklet" : "spread";
    return ready.then(function () {
      var chain = Promise.resolve();
      (book.spreads || []).forEach(function (spread) {
        chain = chain.then(function () {
          if (kind === "booklet") {
            return drawA5Art(spread).then(function (art) {
              pages.push(canvasToJpeg(art));
              return drawA5Text(book, spread);
            }).then(function (text) {
              pages.push(canvasToJpeg(text));
            });
          }
          return drawSpreadPng(book, spread).then(function (canvas) {
            pages.push(canvasToJpeg(canvas));
          });
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
    renderPrint: renderPrint,
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
