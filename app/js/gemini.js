(function (global) {
  var SBS = global.SBS || {};
  var KEY = "sbs-gemini-key";
  var MODE = "sbs-gen-mode";
  var IMAGE_TIER = "sbs-image-tier";
  var TEXT_MODEL = "sbs-text-model";
  var TEXT_MODEL_CHOICES = {
    "3.1-pro": ["gemini-3.1-pro-preview", "gemini-3.5-flash"],
    "3.5-flash": ["gemini-3.5-flash", "gemini-2.5-flash"],
    "2.5-flash": ["gemini-2.5-flash"]
  };
  var TEXT_MODEL_PAID = { "3.1-pro": true };
  var IMAGE_MODELS_FLASH = [
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation"
  ];
  var IMAGE_MODELS_LITE = [
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-lite-image-preview"
  ];
  var IMAGE_MODELS_FLASH25 = [
    "gemini-2.5-flash-image",
    "gemini-2.5-flash-lite-image",
    "gemini-2.5-flash-image-preview"
  ];
  var IMAGE_TIER_IDS = { flash: true, lite: true, "lite-25": true };
  var SAFETY = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
  ];
  var paintToken = { cancel: false };
  var cachedTextModel = null;
  var cachedImageModel = null;
  var cachedSheetModel = null;

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

  function getImageTier() {
    try {
      var tier = window.localStorage.getItem(IMAGE_TIER) || "flash";
      return IMAGE_TIER_IDS[tier] ? tier : "flash";
    } catch (err) {
      return "flash";
    }
  }

  function setImageTier(value) {
    var tier = IMAGE_TIER_IDS[value] ? value : "flash";
    if (getImageTier() !== tier) cachedImageModel = null;
    try {
      window.localStorage.setItem(IMAGE_TIER, tier);
    } catch (err) {
      return;
    }
  }

  function getTextModelId() {
    try {
      var id = window.localStorage.getItem(TEXT_MODEL) || "3.5-flash";
      if (TEXT_MODEL_CHOICES[id]) return id;
      return "3.5-flash";
    } catch (err) {
      return "3.5-flash";
    }
  }

  function setTextModelId(value) {
    var id = TEXT_MODEL_CHOICES[value] ? value : "3.5-flash";
    if (getTextModelId() !== id) cachedTextModel = null;
    try {
      window.localStorage.setItem(TEXT_MODEL, id);
    } catch (err) {
      return;
    }
  }

  function textModels() {
    return TEXT_MODEL_CHOICES[getTextModelId()] || TEXT_MODEL_CHOICES["3.5-flash"];
  }

  function textModelName() {
    return textModels()[0];
  }

  function textModelLabel() {
    var suffix = TEXT_MODEL_PAID[getTextModelId()] ? "（有料・最高品質）" : "（無料枠）";
    return textModelName() + suffix;
  }

  function imageModels() {
    var tier = getImageTier();
    if (tier === "lite") return IMAGE_MODELS_LITE;
    if (tier === "lite-25") return IMAGE_MODELS_FLASH25;
    return IMAGE_MODELS_FLASH;
  }

  function imageModelName() {
    return imageModels()[0];
  }

  function imageSize() {
    return "512";
  }

  function imageSizeLabel() {
    return "0.5K";
  }

  function pageImageConfig() {
    return { aspectRatio: "3:4", imageSize: imageSize() };
  }

  function imageTierLabel() {
    var role = getImageTier() === "flash" ? "本番" : "試し作り";
    return role + " " + imageModelName() + "（" + imageSizeLabel() + "）";
  }

  function modeLabel() {
    var mode = getMode();
    if (mode === "demo") return "いつもデモ";
    if (mode === "gemini") return "必ず Gemini（失敗したページはデモ）";
    return "自動（キーがあれば Gemini、なければデモ）";
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
      return "いまはデモ插絵です。自動または Gemini にすると、キーを使って絵を頼みます。文章は「" + textModelLabel() + "」、画質は「" + imageTierLabel() + "」です。插絵モデルに無料枠はありません。";
    }
    return "キーがあります。文章は " + textModelLabel() + "、插絵は " + imageTierLabel() + " です。插絵は有料で、失敗したページだけキットで描きます。";
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
      if (part.thought || part.thoughtSignature) return;
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
    return tryModels(textModels(), cachedTextModel, function () {
      return {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        safetySettings: SAFETY
      };
    }, extractText, 0).then(function (result) {
      if (result.model) cachedTextModel = result.model;
      return result.value || "";
    });
  }

  function characterRefs(book) {
    var chars = (book && book.bible && book.bible.characters) || [];
    var sheets = (book && book.characterSheets) || [];
    var out = [];
    var i;
    var cap = (SBS.LIMITS && SBS.LIMITS.maxCharacters) || 5;
    for (i = 0; i < chars.length && out.length < cap; i += 1) {
      if (sheets[i] && sheets[i].url) {
        out.push({
          id: chars[i].id || sheets[i].id,
          name: chars[i].displayName || "",
          url: sheets[i].url
        });
      }
    }
    return out;
  }

  function generateImage(prompt, sheetUrl, opts) {
    if (!prompt) return Promise.resolve("");
    opts = opts || {};
    var models = opts.models || imageModels();
    var cached = opts.cacheKey === "sheet" ? cachedSheetModel : cachedImageModel;
    var refs = [];
    if (opts.refs && opts.refs.length) {
      refs = opts.refs;
    } else if (sheetUrl) {
      refs = [{ url: sheetUrl }];
    }
    return tryModels(models, cached, function () {
      var parts = [{ text: prompt }];
      refs.forEach(function (ref) {
        var parsed = parseDataUrl(ref && ref.url ? ref.url : ref);
        if (parsed) {
          parts.push({
            inlineData: { mimeType: parsed.mime, data: parsed.data }
          });
        }
      });
      return {
        contents: [{ role: "user", parts: parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: opts.imageConfig || pageImageConfig()
        },
        safetySettings: SAFETY
      };
    }, extractImage, 0).then(function (result) {
      if (result.model) {
        if (opts.cacheKey === "sheet") cachedSheetModel = result.model;
        else cachedImageModel = result.model;
      }
      if (!result.value) return "";
      if (opts.crop === false) return result.value;
      return cropBlankMargins(result.value);
    });
  }

  function cropBlankMargins(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.width;
          var h = img.height;
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          var data = ctx.getImageData(0, 0, w, h).data;
          function blank(x, y) {
            var i = (y * w + x) * 4;
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            var max = Math.max(r, g, b);
            var min = Math.min(r, g, b);
            return max > 228 && (max - min) < 30;
          }
          function rowBlank(y) {
            var x;
            var n = 0;
            for (x = 0; x < w; x += 3) if (blank(x, y)) n += 1;
            return n > (w / 3) * 0.92;
          }
          function colBlank(x) {
            var y;
            var n = 0;
            for (y = 0; y < h; y += 3) if (blank(x, y)) n += 1;
            return n > (h / 3) * 0.92;
          }
          var top = 0;
          var bottom = h - 1;
          var left = 0;
          var right = w - 1;
          while (top < h && rowBlank(top)) top += 1;
          while (bottom > top && rowBlank(bottom)) bottom -= 1;
          while (left < w && colBlank(left)) left += 1;
          while (right > left && colBlank(right)) right -= 1;
          var pad = Math.round(Math.min(w, h) * 0.06);
          if (top < pad && left < pad && (h - 1 - bottom) < pad && (w - 1 - right) < pad) {
            resolve(dataUrl);
            return;
          }
          var cw = right - left + 1;
          var ch = bottom - top + 1;
          if (cw < w * 0.55 || ch < h * 0.55) {
            resolve(dataUrl);
            return;
          }
          var out = document.createElement("canvas");
          out.width = cw;
          out.height = ch;
          out.getContext("2d").drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
          resolve(out.toDataURL("image/png"));
        } catch (err) {
          resolve(dataUrl);
        }
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
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
    if (SBS.Story && SBS.Story.parsePlainLine) return SBS.Story.parsePlainLine(line);
    var tokens = [];
    var re = /([一-龯々〆ヵヶ]+)[ \u3000]*[（(]([ぁ-ゖァ-ヶー]+)[）)]/g;
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

  function isMostlyJapanese(text) {
    var s = String(text || "").replace(/\s+/g, "");
    if (!s) return false;
    var jp = (s.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
    var latin = (s.match(/[A-Za-z]/g) || []).length;
    return jp >= 4 && jp > latin;
  }

  function pageTextMax() {
    return (SBS.LIMITS && SBS.LIMITS.pageText) || 400;
  }

  function isUsablePageText(text, role) {
    var s = String(text || "").replace(/\s+/g, " ").trim();
    if (!s || !isMostlyJapanese(s)) return false;
    if (/（[^）]*$/.test(s)) return false;
    if (/[A-Za-z]{12,}/.test(s.replace(/[\u3040-\u30ff\u4e00-\u9fff]/g, ""))) return false;
    if (role === "cover") return s.length >= 2 && s.length <= 80;
    if (s.length < 12) return false;
    if (s.length > pageTextMax()) return false;
    return /[。！？…」）]$/.test(s) || /おしまい/.test(s);
  }

  function applyText(spread, raw) {
    var cap = pageTextMax();
    var body = String(raw || "").replace(/\s+$/, "");
    if (body.length > cap) body = body.slice(0, cap);
    var lines = body.split(/\n+/).map(stripDecor).filter(Boolean).slice(0, 12);
    if (!lines.length) return false;
    if (!isUsablePageText(lines.join("\n"), spread && spread.role)) return false;
    spread.paragraphs = lines.map(function (line) { return parseLine(line); });
    spread.geminiTextDone = true;
    return true;
  }

  function refreshImagePrompt(book, index) {
    if (SBS.PromptCompiler && SBS.PromptCompiler.refreshPageImage) {
      SBS.PromptCompiler.refreshPageImage(book, index);
    }
  }

  function writePageText(book, index) {
    var spread = book.spreads[index];
    var page = book.prompts.pages && book.prompts.pages[index];
    if (!spread) return Promise.resolve();
    function after(raw) {
      if (raw && applyText(spread, raw)) {
        spread.geminiTextDone = true;
      } else {
        spread.geminiTextDone = true;
      }
      refreshImagePrompt(book, index);
    }
    return generateText(page && page.text).then(function (raw) {
      if (isUsablePageText(raw, spread.role)) {
        after(raw);
        return;
      }
      var hint = spread.role === "cover"
        ? "\n\n表紙の右ページだけ。タイトルとなまえを1〜2行。日本語のみ。60字以内。"
        : "\n\n日本語の本文だけ。英語禁止。このページの計画どおりの出来事を書く。字数は計画の範囲。最大400。文末を。！？」で閉じる。テンプレの日常文で埋めない。";
      return generateText((page && page.text ? page.text : "") + hint).then(function (raw2) {
        after(isUsablePageText(raw2, spread.role) ? raw2 : raw);
      });
    });
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

  function ensureCharacterSheets(book) {
    var chars = (book && book.bible && book.bible.characters) || [];
    if (!book.characterSheets) book.characterSheets = [];
    var i;
    for (i = 0; i < chars.length; i += 1) {
      if (!book.characterSheets[i]) {
        book.characterSheets[i] = { id: chars[i].id, url: "", note: "" };
      }
      if (!book.characterSheets[i].id) book.characterSheets[i].id = chars[i].id;
    }
    return chars;
  }

  function paintOneCharacterSheet(book, index, extraNote) {
    var chars = ensureCharacterSheets(book);
    var ch = chars[index];
    if (!ch) return Promise.resolve("");
    var prompt = (SBS.PromptCompiler && SBS.PromptCompiler.characterTurnaround)
      ? SBS.PromptCompiler.characterTurnaround(book, index, extraNote)
      : "";
    var prev = extraNote && book.characterSheets[index] ? book.characterSheets[index].url : "";
    function store(url, source) {
      book.characterSheets[index] = {
        id: ch.id,
        url: url || "",
        note: extraNote || "",
        source: source || ""
      };
      ch.sheet = url || "";
      return url || "";
    }
    if (!wantsGemini() || !prompt) {
      if (SBS.DemoArt && SBS.DemoArt.paintCharacterSheet) {
        SBS.DemoArt.paintCharacterSheet(book, index, extraNote);
        return Promise.resolve(book.characterSheets[index] && book.characterSheets[index].url || "");
      }
      return Promise.resolve("");
    }
    return generateImage(prompt, prev, {
      models: IMAGE_MODELS_FLASH,
      cacheKey: "sheet",
      crop: false,
      imageConfig: { aspectRatio: "16:9", imageSize: imageSize() }
    }).then(function (url) {
      if (url) return store(url, "gemini-flash");
      if (SBS.DemoArt && SBS.DemoArt.paintCharacterSheet) {
        SBS.DemoArt.paintCharacterSheet(book, index, extraNote);
        return book.characterSheets[index] && book.characterSheets[index].url || "";
      }
      return store("", "");
    });
  }

  function paintCharacterSheets(book, onProgress, onDone) {
    paintToken.cancel = false;
    var chars = ensureCharacterSheets(book);
    var settled = false;

    function finish(status) {
      if (settled) return;
      settled = true;
      if (onDone) onDone(book, status);
    }

    if (!chars.length) {
      finish("complete");
      return Promise.resolve();
    }
    if (!wantsGemini()) {
      return SBS.DemoArt.paintCharacterSheets(book, onProgress, onDone);
    }

    function run(i) {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      if (i >= chars.length) {
        finish("complete");
        return Promise.resolve();
      }
      if (book.characterSheets[i] && book.characterSheets[i].url) {
        return run(i + 1);
      }
      if (onProgress) {
        onProgress(i, chars.length, (chars[i].displayName || "登場人物") + " の見た目を描いています");
      }
      return paintOneCharacterSheet(book, i, book.characterSheets[i].note || "").then(function () {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        return wait(280).then(function () { return run(i + 1); });
      });
    }

    if (onProgress) onProgress(0, chars.length, "キャラクターデザインを描いています");
    return run(0).catch(function () {
      finish(paintToken.cancel ? "interrupted" : "complete");
    });
  }

  function paintCharacterSheet(book, index, extraNote, onProgress, onDone) {
    paintToken.cancel = false;
    var chars = ensureCharacterSheets(book);
    var ch = chars[index];
    if (onProgress) {
      onProgress(0, 1, (ch && ch.displayName ? ch.displayName : "登場人物") + " を描き直しています");
    }
    return paintOneCharacterSheet(book, index, extraNote).then(function () {
      if (onDone) onDone(book, paintToken.cancel ? "interrupted" : "complete");
    }).catch(function () {
      if (onDone) onDone(book, paintToken.cancel ? "interrupted" : "complete");
    });
  }

  function stampModels(book) {
    book.imageTier = getImageTier();
    book.imageModel = imageModelName();
    book.textModel = textModelName();
    if (book.prompts && book.prompts.meta && book.prompts.meta.models) {
      book.prompts.meta.models.image = imageModelName();
      book.prompts.meta.models.text = textModelName();
    }
  }

  function writeBook(book, onProgress, onDone) {
    paintToken.cancel = false;
    if (!wantsGemini() || !book || !book.prompts) {
      if (onDone) onDone(book, "complete");
      return Promise.resolve();
    }
    stampModels(book);
    if (SBS.Story && SBS.Story.attachPlans) SBS.Story.attachPlans(book);
    if (SBS.PromptCompiler && SBS.PromptCompiler.refreshAllPageText) {
      SBS.PromptCompiler.refreshAllPageText(book);
    }
    var spreads = book.spreads || [];
    var total = spreads.length;
    var settled = false;

    function progress(message) {
      if (onProgress) onProgress(doneCount(book), total, message);
    }

    function finish(status) {
      if (settled) return;
      settled = true;
      if (onDone) onDone(book, status);
    }

    function runText(i) {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      if (i >= spreads.length) {
        finish("complete");
        return Promise.resolve();
      }
      if (spreads[i].geminiTextDone) {
        refreshImagePrompt(book, i);
        return runText(i + 1);
      }
      progress("おはなしを書いています（あと " + remainingText(spreads) + " ページ）");
      return writePageText(book, i).then(function () {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        return wait(280).then(function () { return runText(i + 1); });
      });
    }

    progress("おはなしを書いています");
    return runText(0).catch(function () {
      finish(paintToken.cancel ? "interrupted" : "complete");
    });
  }

  function paintImages(book, onProgress, onDone) {
    paintToken.cancel = false;
    if (!wantsGemini() || !book || !book.prompts) {
      return SBS.DemoArt.paintBook(book, onProgress, onDone);
    }
    stampModels(book);
    var spreads = book.spreads || [];
    var total = spreads.length;
    var usedGemini = 0;
    var usedDemo = 0;
    var refs = characterRefs(book);
    var sheetOk = refs.length > 0 || !!book.characterSheet;
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

    function runSheet() {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      if (refs.length || book.characterSheet) {
        sheetOk = true;
        return runImages(0);
      }
      progress("登場人物の見た目をそろえています");
      return generateImage(book.prompts.characterSheet, null, { crop: false }).then(function (url) {
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
        spreads[i].artSource = "demo";
        usedDemo += 1;
        return wait(20).then(function () { return runImages(i + 1); });
      }
      refreshImagePrompt(book, i);
      var page = book.prompts.pages && book.prompts.pages[i];
      return generateImage(page && page.image, book.characterSheet, {
        refs: refs.length ? refs : null
      }).then(function (url) {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        if (url) {
          spreads[i].leftArt = url;
          spreads[i].artSource = "gemini";
          usedGemini += 1;
        } else {
          paintOneDemo(book, i);
          spreads[i].artSource = "demo";
          usedDemo += 1;
        }
        return wait(360).then(function () { return runImages(i + 1); });
      });
    }

    progress("絵を描いています");
    return runSheet().catch(function () {
      if (paintToken.cancel) {
        finish("interrupted");
        return;
      }
      return runImages(0);
    });
  }

  function paintBook(book, onProgress, onDone) {
    return writeBook(book, onProgress, function (finished, status) {
      if (status === "interrupted") {
        if (onDone) onDone(finished, status);
        return;
      }
      paintImages(finished, onProgress, onDone);
    });
  }

  function ensurePrompts(book) {
    if (book.prompts && book.prompts.pages && book.prompts.pages.length) return true;
    if (!book.intent || !book.bible || !SBS.PromptCompiler) return false;
    SBS.PromptCompiler.compile(book.intent, book.bible, book);
    return !!(book.prompts && book.prompts.pages);
  }

  function recountGenerator(book) {
    var geminiArt = 0;
    var demoArt = 0;
    ((book && book.spreads) || []).forEach(function (s) {
      if (s.artSource === "gemini") geminiArt += 1;
      else if (s.artSource === "demo") demoArt += 1;
    });
    if (geminiArt || demoArt) setGenerator(book, geminiArt, demoArt);
  }

  function paintSpread(book, spreadIndex, onProgress, onDone) {
    paintToken.cancel = false;
    var spreads = (book && book.spreads) || [];
    var spread = spreads[spreadIndex];
    var previous = spread ? spread.leftArt : "";
    var previousSource = spread ? spread.artSource : "";

    function finish(status, result) {
      book.redrawResult = result || (status === "interrupted" ? "kept" : "updated");
      recountGenerator(book);
      if (onDone) onDone(book, status);
    }

    function progress(message) {
      if (onProgress) onProgress(doneCount(book), spreads.length, message);
    }

    if (!spread) {
      finish("complete", "kept");
      return Promise.resolve();
    }

    if (!wantsGemini() || !ensurePrompts(book)) {
      paintOneDemo(book, spreadIndex);
      spread.artSource = "demo";
      finish("complete", "demo");
      return Promise.resolve();
    }
    book.imageTier = getImageTier();
    book.imageModel = imageModelName();
    book.textModel = textModelName();

    function runImage() {
        if (paintToken.cancel) {
          spread.leftArt = previous;
          spread.artSource = previousSource;
          finish("interrupted", "kept");
          return Promise.resolve();
        }
      progress("このページの絵を描いています");
      refreshImagePrompt(book, spreadIndex);
      var page = book.prompts.pages && book.prompts.pages[spreadIndex];
      var refs = characterRefs(book);
      return generateImage(page && page.image, book.characterSheet, {
        refs: refs.length ? refs : null
      }).then(function (url) {
        if (paintToken.cancel) {
          spread.leftArt = previous;
          spread.artSource = previousSource;
          finish("interrupted", "kept");
          return;
        }
        if (url) {
          spread.leftArt = url;
          spread.artSource = "gemini";
          finish("complete", "updated");
        } else if (!previous) {
          paintOneDemo(book, spreadIndex);
          spread.artSource = "demo";
          finish("complete", "demo");
        } else {
          spread.leftArt = previous;
          spread.artSource = previousSource;
          finish("complete", "kept");
        }
      });
    }

    if (characterRefs(book).length || book.characterSheet) return runImage();
    progress("登場人物の見た目をそろえています");
    return generateImage(book.prompts.characterSheet, null, { crop: false }).then(function (url) {
      if (paintToken.cancel) {
        spread.leftArt = previous;
        spread.artSource = previousSource;
        finish("interrupted", "kept");
        return;
      }
      if (url) book.characterSheet = url;
      return runImage();
    }).catch(function () {
      if (paintToken.cancel) {
        spread.leftArt = previous;
        spread.artSource = previousSource;
        finish("interrupted", "kept");
        return;
      }
      return runImage();
    });
  }

  SBS.Gemini = {
    getKey: getKey,
    setKey: setKey,
    getMode: getMode,
    setMode: setMode,
    getImageTier: getImageTier,
    setImageTier: setImageTier,
    getTextModelId: getTextModelId,
    setTextModelId: setTextModelId,
    textModelName: textModelName,
    textModelLabel: textModelLabel,
    imageModelName: imageModelName,
    imageSize: imageSize,
    imageSizeLabel: imageSizeLabel,
    imageTierLabel: imageTierLabel,
    modeLabel: modeLabel,
    canCallNetwork: canCallNetwork,
    wantsGemini: wantsGemini,
    statusMessage: statusMessage,
    cancelPaint: function cancelPaint() {
      paintToken.cancel = true;
      if (SBS.DemoArt) SBS.DemoArt.cancelPaint();
    },
    writeBook: writeBook,
    paintImages: paintImages,
    paintBook: paintBook,
    paintSpread: paintSpread,
    paintCharacterSheets: paintCharacterSheets,
    paintCharacterSheet: paintCharacterSheet
  };

  global.SBS = SBS;
})(window);
