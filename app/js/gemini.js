(function (global) {
  var SBS = global.SBS || {};
  var KEY = "sbs-gemini-key";
  var MODE = "sbs-gen-mode";
  var TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
  var IMAGE_MODELS = [
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation"
  ];
  var SAFETY = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
  ];
  var paintToken = { cancel: false };
  var cachedTextModel = null;
  var cachedImageModel = null;

  function getKey() {
    try {
      return String(window.localStorage.getItem(KEY) || "").trim();
    } catch (err) {
      return "";
    }
  }

  function setKey(value) {
    try {
      var next = String(value || "").trim();
      if (next) window.localStorage.setItem(KEY, next);
      else window.localStorage.removeItem(KEY);
    } catch (err) {
      return;
    }
  }

  function getMode() {
    try {
      var mode = window.localStorage.getItem(MODE) || "auto";
      if (mode === "demo" || mode === "gemini" || mode === "auto") return mode;
      return "auto";
    } catch (err) {
      return "auto";
    }
  }

  function setMode(value) {
    var mode = value === "demo" || value === "gemini" ? value : "auto";
    try {
      window.localStorage.setItem(MODE, mode);
    } catch (err) {
      return;
    }
  }

  function canCallNetwork() {
    try {
      return location.protocol !== "file:";
    } catch (err) {
      return false;
    }
  }

  function wantsGemini() {
    var mode = getMode();
    if (mode === "demo") return false;
    if (!getKey()) return false;
    if (!canCallNetwork()) return false;
    return mode === "auto" || mode === "gemini";
  }

  function statusMessage() {
    if (!canCallNetwork()) {
      return "この開き方では Gemini に送れません。キーを入れてもデモ插絵になります。Chrome で http から開いてください。";
    }
    if (!getKey()) {
      return "キーがなければデモ插絵です。キーはこのブラウザにだけ残します。ZIP や Git には入りません。";
    }
    if (getMode() === "demo") {
      return "いまはデモ插絵です。自動または Gemini にすると、キーを使って絵を頼みます。";
    }
    return "キーがあります。絵本をつくると Gemini に送り、失敗したページだけキットで描きます。";
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function endpoint(model) {
    return "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(getKey());
  }

  function parseDataUrl(url) {
    if (!url || url.indexOf("base64,") === -1) return null;
    var mime = "image/png";
    var head = url.slice(0, url.indexOf("base64,"));
    var found = head.match(/data:([^;]+)/);
    if (found && found[1]) mime = found[1];
    return { mime: mime, data: url.split("base64,")[1] };
  }

  function post(model, body) {
    return fetch(endpoint(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().then(function (json) {
        return { ok: res.ok, status: res.status, json: json };
      }).catch(function () {
        return { ok: false, status: res.status, json: null };
      });
    });
  }

  function blocked(json) {
    if (!json) return true;
    if (json.promptFeedback && json.promptFeedback.blockReason) return true;
    var cand = json.candidates && json.candidates[0];
    if (!cand) return true;
    var reason = cand.finishReason || cand.finish_reason;
    return reason === "SAFETY" || reason === "BLOCKLIST" || reason === "PROHIBITED_CONTENT";
  }

  function eachPart(json, fn) {
    var cands = (json && json.candidates) || [];
    var i;
    var j;
    var parts;
    for (i = 0; i < cands.length; i += 1) {
      parts = (cands[i].content && cands[i].content.parts) || [];
      for (j = 0; j < parts.length; j += 1) fn(parts[j]);
    }
  }

  function extractText(json) {
    if (blocked(json)) return "";
    var out = "";
    eachPart(json, function (part) {
      if (part.text) out += part.text;
    });
    return out.replace(/\s+$/, "");
  }

  function extractImage(json) {
    if (blocked(json)) return "";
    var url = "";
    eachPart(json, function (part) {
      var inline = part.inlineData || part.inline_data;
      if (!inline || !inline.data) return;
      var mime = inline.mimeType || inline.mime_type || "image/png";
      if (mime.indexOf("image/") !== 0) return;
      url = "data:" + mime + ";base64," + String(inline.data).replace(/^data:[^;]+;base64,/, "");
    });
    return url;
  }

  function tryModels(models, cached, bodyFn, extractFn, attempt) {
    var list = cached
      ? [cached].concat(models.filter(function (m) { return m !== cached; }))
      : models.slice();
    attempt = attempt || 0;

    function next(i) {
      if (i >= list.length) return Promise.resolve({ value: null, model: null });
      return post(list[i], bodyFn()).then(function (res) {
        if ((res.status === 429 || res.status === 503) && attempt < 2) {
          return wait(1800 * (attempt + 1)).then(function () {
            return tryModels(models, cached, bodyFn, extractFn, attempt + 1);
          });
        }
        if (res.status === 401 || res.status === 403) {
          return { value: null, model: null };
        }
        if (res.status === 404 || res.status === 400) return next(i + 1);
        if (!res.ok) return { value: null, model: null };
        var value = extractFn(res.json);
        if (value) return { value: value, model: list[i] };
        return next(i + 1);
      }).catch(function () {
        return { value: null, model: null };
      });
    }

    return next(0);
  }

  function generateText(prompt) {
    if (!prompt) return Promise.resolve("");
    return tryModels(TEXT_MODELS, cachedTextModel, function () {
      return {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        safetySettings: SAFETY
      };
    }, extractText, 0).then(function (result) {
      if (result.model) cachedTextModel = result.model;
      return result.value || "";
    });
  }

  function generateImage(prompt, sheetUrl) {
    if (!prompt) return Promise.resolve("");
    return tryModels(IMAGE_MODELS, cachedImageModel, function () {
      var parts = [{ text: prompt }];
      var parsed = parseDataUrl(sheetUrl);
      if (parsed) {
        parts.push({
          inlineData: { mimeType: parsed.mime, data: parsed.data }
        });
      }
      return {
        contents: [{ role: "user", parts: parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "3:4" }
        },
        safetySettings: SAFETY
      };
    }, extractImage, 0).then(function (result) {
      if (result.model) cachedImageModel = result.model;
      return result.value || "";
    });
  }

  function stripDecor(line) {
    return String(line || "")
      .replace(/^\s*[-*#>\d.]+\s*/, "")
      .replace(/[*_`#]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseLine(line) {
    var tokens = [];
    var re = /([一-龯々〆ヵヶ]+)（([ぁ-ゖー]+)）/g;
    var last = 0;
    var match;
    while ((match = re.exec(line))) {
      if (match.index > last) tokens.push({ t: line.slice(last, match.index) });
      tokens.push({ k: match[1], r: match[2] });
      last = match.index + match[0].length;
    }
    if (last < line.length) tokens.push({ t: line.slice(last) });
    return tokens.filter(function (tok) {
      return (tok.t && tok.t.length) || (tok.k && tok.k.length);
    });
  }

  function applyText(spread, raw) {
    var lines = String(raw || "").split(/\n+/).map(stripDecor).filter(Boolean).slice(0, 5);
    if (!lines.length) return false;
    spread.paragraphs = lines.map(function (line) { return parseLine(line); });
    spread.geminiTextDone = true;
    return true;
  }

  function doneCount(book) {
    var n = 0;
    ((book && book.spreads) || []).forEach(function (s) {
      if (s.leftArt) n += 1;
    });
    return n;
  }

  function remainingArt(spreads) {
    var n = 0;
    spreads.forEach(function (s) {
      if (!s.leftArt) n += 1;
    });
    return n;
  }

  function remainingText(spreads) {
    var n = 0;
    spreads.forEach(function (s) {
      if (!s.geminiTextDone) n += 1;
    });
    return n;
  }

  function setGenerator(book, geminiArt, demoArt) {
    var gen = geminiArt && demoArt ? "hybrid" : (geminiArt ? "gemini" : "demo");
    book.generator = gen;
    if (book.prompts && book.prompts.meta) book.prompts.meta.generator = gen;
  }

  function paintOneDemo(book, index) {
    if (SBS.DemoArt && SBS.DemoArt.paintOne) SBS.DemoArt.paintOne(book, index);
  }

  function paintBook(book, onProgress, onDone) {
    paintToken.cancel = false;
    if (!wantsGemini() || !book || !book.prompts) {
      return SBS.DemoArt.paintBook(book, onProgress, onDone);
    }

    var spreads = book.spreads || [];
    var total = spreads.length;
    var usedGemini = 0;
    var usedDemo = 0;
    var sheetOk = !!book.characterSheet;
    var settled = false;

    function progress(message) {
      if (onProgress) onProgress(doneCount(book), total, message);
    }

    function finish(status) {
      if (settled) return;
      settled = true;
      setGenerator(book, usedGemini, usedDemo);
      if (onDone) onDone(book, status);
    }

    function runText(i) {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      if (i >= spreads.length) return runSheet();
      if (spreads[i].geminiTextDone) return runText(i + 1);
      progress("おはなしを整えています（あと " + remainingText(spreads) + " ページ）");
      var page = book.prompts.pages && book.prompts.pages[i];
      return generateText(page && page.text).then(function (raw) {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        if (raw) applyText(spreads[i], raw);
        else spreads[i].geminiTextDone = true;
        return wait(280).then(function () { return runText(i + 1); });
      });
    }

    function runSheet() {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      if (book.characterSheet) {
        sheetOk = true;
        return runImages(0);
      }
      progress("登場人物の見た目をそろえています");
      return generateImage(book.prompts.characterSheet, null).then(function (url) {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        if (url) {
          book.characterSheet = url;
          sheetOk = true;
        } else {
          sheetOk = false;
        }
        return wait(320).then(function () { return runImages(0); });
      });
    }

    function runImages(i) {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      while (i < spreads.length && spreads[i].leftArt) i += 1;
      if (i >= spreads.length) {
        finish("complete");
        return Promise.resolve();
      }
      progress("絵を描いています（あと " + remainingArt(spreads) + " ページ）");
      if (!sheetOk) {
        paintOneDemo(book, i);
        usedDemo += 1;
        return wait(20).then(function () { return runImages(i + 1); });
      }
      var page = book.prompts.pages && book.prompts.pages[i];
      return generateImage(page && page.image, book.characterSheet).then(function (url) {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        if (url) {
          spreads[i].leftArt = url;
          usedGemini += 1;
        } else {
          paintOneDemo(book, i);
          usedDemo += 1;
        }
        return wait(360).then(function () { return runImages(i + 1); });
      });
    }

    progress("おはなしを整えています");
    return runText(0).catch(function () {
      if (paintToken.cancel) {
        finish("interrupted");
        return;
      }
      return runImages(0);
    });
  }

  SBS.Gemini = {
    getKey: getKey,
    setKey: setKey,
    getMode: getMode,
    setMode: setMode,
    canCallNetwork: canCallNetwork,
    wantsGemini: wantsGemini,
    statusMessage: statusMessage,
    cancelPaint: function cancelPaint() {
      paintToken.cancel = true;
      if (SBS.DemoArt) SBS.DemoArt.cancelPaint();
    },
    paintBook: paintBook
  };

  global.SBS = SBS;
})(window);
