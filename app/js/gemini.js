(function (global) {
  var SBS = global.SBS || {};
  var KEY = "sbs-gemini-key";
  var MODE = "sbs-gen-mode";
  var IMAGE_TIER = "sbs-image-tier";
  var TEXT_MODEL = "sbs-text-model";
  var TEXT_MODEL_CHOICES = {
    "3.1-pro": ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"],
    "3.5-flash": ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"],
    "2.5-flash": ["gemini-2.5-flash", "gemini-2.0-flash"]
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
  var lastTextCall = { status: 0, model: "", error: "", finish: "" };

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
    return getImageTier() === "lite-25" ? "1K" : "0.5K";
  }

  function supportsImageSize(model) {
    return /gemini-3/.test(String(model || ""));
  }

  function maxRefsFor(model) {
    return /gemini-2\.5/.test(String(model || "")) ? 3 : 5;
  }

  function imageConfigFor(model, extra) {
    extra = extra || {};
    var cfg = { aspectRatio: extra.aspectRatio || "3:4" };
    if (supportsImageSize(model)) {
      cfg.imageSize = extra.imageSize || imageSize();
    }
    return cfg;
  }

  function imageModalities(model) {
    return /gemini-2\.5/.test(String(model || "")) ? ["IMAGE"] : ["TEXT", "IMAGE"];
  }

  var IMAGE_SAFETY = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
  ];

  function pageImageConfig() {
    return { aspectRatio: "3:4", imageSize: imageSize() };
  }

  function imageTierLabel() {
    var role = getImageTier() === "flash" ? "本番" : "試し作り";
    var note = getImageTier() === "lite-25" ? "・公式は1K固定" : "";
    return role + " " + imageModelName() + "（" + imageSizeLabel() + note + "）";
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
      if (typeof cands[i].content === "string") fn({ text: cands[i].content });
      parts = (cands[i].content && cands[i].content.parts) || [];
      for (j = 0; j < parts.length; j += 1) fn(parts[j]);
      if (cands[i].text) fn({ text: cands[i].text });
    }
  }

  function looksLikeStoryText(text) {
    var s = String(text || "");
    if (!/[\u3040-\u30ff]/.test(s)) return false;
    return /===/.test(s) || /[\u3040-\u30ff\u4e00-\u9fff]{8,}/.test(s.replace(/\s+/g, ""));
  }

  function extractText(json) {
    if (!json) return "";
    var out = "";
    var thoughts = "";
    var cand;
    eachPart(json, function (part) {
      var text = part && (part.text || part.output) ? String(part.text || part.output) : "";
      if (!text) return;
      if (part.thought === true || part.thought === "true") {
        thoughts += text;
        return;
      }
      out += text;
    });
    if (!out && json.candidates && json.candidates[0]) {
      cand = json.candidates[0];
      if (cand.text) out += String(cand.text);
      if (!out && cand.output) out += String(cand.output);
    }
    out = out.replace(/\s+$/, "");
    if (out) return out;
    thoughts = thoughts.replace(/\s+$/, "");
    if (thoughts && (/[\u3040-\u30ff]/.test(thoughts) || thoughts.length > 40)) return thoughts;
    return "";
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

  function noteTextCall(model, res, extra) {
    var json = res && res.json;
    var cand = json && json.candidates && json.candidates[0];
    lastTextCall.model = model || lastTextCall.model || "";
    lastTextCall.status = (res && res.status) || lastTextCall.status || 0;
    lastTextCall.error = (json && json.error && json.error.message) || extra || lastTextCall.error || "";
    lastTextCall.finish = (cand && (cand.finishReason || cand.finish_reason)) ||
      (json && json.promptFeedback && json.promptFeedback.blockReason) ||
      lastTextCall.finish || "";
  }

  function textFailNote() {
    var bits = ["文章LLMから本文が返りませんでした。"];
    if (lastTextCall.model) bits.push(lastTextCall.model);
    if (lastTextCall.status) bits.push("HTTP " + lastTextCall.status);
    if (lastTextCall.finish) bits.push(String(lastTextCall.finish));
    if (lastTextCall.error) bits.push(String(lastTextCall.error).slice(0, 180));
    bits.push("もう一度つくり直してください。");
    return bits.join(" ");
  }

  function uniqueModels(list) {
    var seen = {};
    return (list || []).filter(function (name) {
      if (!name || seen[name]) return false;
      seen[name] = true;
      return true;
    });
  }

  function textBodies(model, prompt, extra) {
    extra = extra || {};
    var maxTok = extra.maxOutputTokens || 8192;
    var name = String(model || "");
    var full = { maxOutputTokens: maxTok };
    if (/gemini-2\.5/.test(name)) {
      full.thinkingConfig = { thinkingBudget: 0 };
    } else if (/gemini-3/.test(name)) {
      full.thinkingConfig = { thinkingLevel: "low" };
    } else {
      full.temperature = 0.92;
    }
    return [
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: full,
        safetySettings: SAFETY
      },
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTok }
      },
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }
    ];
  }

  function tryModels(models, cached, bodyFn, extractFn, attempt) {
    var list = uniqueModels(
      (cached ? [cached] : []).concat(models || [])
    );
    attempt = attempt || 0;

    function next(i) {
      if (i >= list.length) return Promise.resolve({ value: null, model: null });
      return post(list[i], bodyFn(list[i])).then(function (res) {
        noteTextCall(list[i], res);
        if ((res.status === 429 || res.status === 503) && attempt < 2) {
          return wait(1800 * (attempt + 1)).then(function () {
            return tryModels(models, cached, bodyFn, extractFn, attempt + 1);
          });
        }
        if (res.status === 401) return next(i + 1);
        if (!res.ok) return next(i + 1);
        var value = extractFn(res.json);
        if (value) return { value: value, model: list[i] };
        return next(i + 1);
      }).catch(function (err) {
        noteTextCall(list[i], null, err && err.message);
        return next(i + 1);
      });
    }

    return next(0);
  }

  function generateText(prompt, extra) {
    if (!prompt) return Promise.resolve("");
    extra = extra || {};
    var models = uniqueModels([cachedTextModel].concat(textModels()).concat([
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ]));
    function postOne(model) {
      var bodies = textBodies(model, prompt, extra);
      function nextBody(b) {
        if (b >= bodies.length) return Promise.resolve({ ok: false, status: 0, json: null });
        return post(model, bodies[b]).then(function (res) {
          noteTextCall(model, res);
          if (res.ok && extractText(res.json)) return res;
          if ((res.status === 429 || res.status === 503) && b === 0) {
            return wait(1600).then(function () { return nextBody(b + 1); });
          }
          return nextBody(b + 1);
        }).catch(function (err) {
          noteTextCall(model, null, err && err.message);
          return nextBody(b + 1);
        });
      }
      return nextBody(0);
    }
    function next(i) {
      if (i >= models.length) return Promise.resolve("");
      return postOne(models[i]).then(function (res) {
        var value = extractText(res && res.json);
        if (value) {
          cachedTextModel = models[i];
          return value;
        }
        return next(i + 1);
      });
    }
    return next(0);
  }

  function characterRefs(book, cast) {
    var chars = (book && book.bible && book.bible.characters) || [];
    var sheets = (book && book.characterSheets) || [];
    var wanted = cast && cast.length ? cast : chars;
    var out = [];
    var cap = (SBS.PromptCompiler && SBS.PromptCompiler.pageCastMax) || 3;
    wanted.forEach(function (ch) {
      var i;
      var sheet = null;
      if (out.length >= cap) return;
      for (i = 0; i < chars.length; i += 1) {
        if (chars[i] === ch || (ch && ch.id && chars[i].id === ch.id)) {
          sheet = sheets[i];
          break;
        }
      }
      if ((!sheet || !sheet.url) && ch && ch.id) {
        for (i = 0; i < sheets.length; i += 1) {
          if (sheets[i] && sheets[i].id === ch.id) {
            sheet = sheets[i];
            break;
          }
        }
      }
      if (sheet && sheet.url) {
        out.push({
          id: (ch && ch.id) || sheet.id,
          name: (ch && ch.displayName) || "",
          url: sheet.url
        });
      }
    });
    return out;
  }

  function worldArtRef(book, skipIndex) {
    var spreads = (book && book.spreads) || [];
    var pick = null;
    var i;
    var spread;
    for (i = 0; i < spreads.length; i += 1) {
      if (i === skipIndex) continue;
      spread = spreads[i];
      if (!spread || !spread.leftArt) continue;
      if (spread.role !== "cover") {
        pick = spread.leftArt;
        break;
      }
      if (!pick) pick = spread.leftArt;
    }
    if (!pick) return [];
    return [{
      url: pick,
      role: "world",
      name: "world continuity"
    }];
  }

  function refsForPage(book, index) {
    var max = (SBS.PromptCompiler && SBS.PromptCompiler.pageCastMax) || 3;
    var cast = (SBS.PromptCompiler && SBS.PromptCompiler.selectPageCast)
      ? SBS.PromptCompiler.selectPageCast(book, index, max)
      : ((book && book.bible && book.bible.characters) || []).slice(0, max);
    var refs = characterRefs(book, cast);
    worldArtRef(book, index).forEach(function (ref) { refs.push(ref); });
    return refs;
  }

  function hasIdentitySheets(book) {
    if (book && book.characterSheet) return true;
    return ((book && book.characterSheets) || []).some(function (s) {
      return s && s.url;
    });
  }

  function labeledRefParts(refs) {
    var parts = [];
    (refs || []).forEach(function (ref, i) {
      var parsed = parseDataUrl(ref && ref.url ? ref.url : ref);
      if (!parsed) return;
      var label;
      if (ref && ref.role === "world") {
        label = "Attached image " + (i + 1) + " is this book's WORLD CONTINUITY lock." +
          " Copy the designs and colors of key items, landmark buildings, vehicles, sky, ground, weather, and unnamed extras." +
          " Do NOT copy that page's camera, pose, or composition." +
          " Do not add named character IDs from that image unless this page's People list includes them." +
          " Recurring objects stay the same; only the new story moment changes.";
      } else if (ref && ref.role === "style") {
        label = "Attached image " + (i + 1) + " is this book's STYLE LOCK, not this character." +
          " Copy ONLY the art medium, brush, line weight, coloring, lighting, and paper texture." +
          " Do NOT copy that person's face, hair, clothes, species, body, or silhouette." +
          " That attached person is someone else. Invent a new, instantly different design" +
          " in the SAME illustration touch. Palette-swap clones and twins are forbidden.";
      } else if (ref && ref.id) {
        label = "Attached identity image " + (i + 1) + " is ID " + ref.id +
          (ref.name ? " named \"" + ref.name + "\"" : "") +
          ". Copy this character exactly. Same face, hair, clothes, species, and height. " +
          "The sheet may show several angles of this ONE person. Draw ID " + ref.id +
          " exactly once in the scene. Never a second copy.";
      } else {
        label = "Attached identity image " + (i + 1) +
          ". Copy this character exactly. Draw this person exactly once. Never twins or clones.";
      }
      parts.push({ text: label });
      parts.push({
        inlineData: { mimeType: parsed.mime, data: parsed.data }
      });
    });
    return parts;
  }

  function styleSheetRefs(book, skipIndex) {
    var sheets = (book && book.characterSheets) || [];
    var chars = (book && book.bible && book.bible.characters) || [];
    var i;
    for (i = 0; i < sheets.length; i += 1) {
      if (i === skipIndex) continue;
      if (sheets[i] && sheets[i].url) {
        return [{
          url: sheets[i].url,
          role: "style",
          name: (chars[i] && chars[i].displayName) || "style lock"
        }];
      }
    }
    return [];
  }

  function shrinkDataUrl(url, maxEdge) {
    return new Promise(function (resolve) {
      if (!url || url.indexOf("data:") !== 0) {
        resolve(url || "");
        return;
      }
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, (maxEdge || 768) / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch (err) {
          resolve(url);
        }
      };
      img.onerror = function () { resolve(url); };
      img.src = url;
    });
  }

  function shrinkRefs(refs) {
    return Promise.all((refs || []).map(function (ref) {
      return shrinkDataUrl(ref && ref.url ? ref.url : ref, 768).then(function (url) {
        if (typeof ref === "string") return { url: url };
        return { id: ref.id, name: ref.name, url: url, role: ref.role };
      });
    }));
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
      refs = [{ url: sheetUrl, id: "cast", name: "character lock" }];
    }

    function run(refList) {
      return tryModels(models, cached, function (model) {
        var use = (refList || []).slice(0, maxRefsFor(model));
        var extra = opts.imageConfig || pageImageConfig();
        return {
          contents: [{ role: "user", parts: labeledRefParts(use).concat([{ text: prompt }]) }],
          generationConfig: {
            responseModalities: imageModalities(model),
            imageConfig: imageConfigFor(model, extra)
          },
          safetySettings: IMAGE_SAFETY
        };
      }, extractImage, 0);
    }

    function finish(result) {
      if (result.model) {
        if (opts.cacheKey === "sheet") cachedSheetModel = result.model;
        else cachedImageModel = result.model;
      }
      if (!result.value) return "";
      if (opts.crop === false) return result.value;
      return cropBlankMargins(result.value);
    }

    return shrinkRefs(refs).then(function (small) {
      return run(small).then(function (result) {
        if (result.value) return finish(result);
        if (small.length > 1) {
          return run(small.slice(0, 1)).then(function (second) {
            if (second.value) return finish(second);
            return run([]).then(finish);
          });
        }
        if (small.length) return run([]).then(finish);
        return finish(result);
      });
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

  function tokensFromLine(line) {
    var tokens = parseLine(line);
    return (SBS.Story && SBS.Story.expandPlainRubyTokens)
      ? SBS.Story.expandPlainRubyTokens(tokens)
      : tokens;
  }

  function isMostlyJapanese(text) {
    var s = String(text || "").replace(/\s+/g, "");
    if (!s) return false;
    var jp = (s.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
    var latin = (s.match(/[A-Za-z]/g) || []).length;
    return jp >= 4 && jp > latin;
  }

  function pageTextMax() {
    return (SBS.LIMITS && SBS.LIMITS.pageText) || 600;
  }

  function countStoryChars(text) {
    if (SBS.Story && SBS.Story.countStoryChars) return SBS.Story.countStoryChars(text);
    return String(text || "").replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/g, "").replace(/\s+/g, "").length;
  }

  function hasCoverCredit(text) {
    return /さく\s*[・･／\/]\s*え|作\s*[・･／\/]\s*絵|オリジナルさっか|さっか|作者クレジット/.test(String(text || ""));
  }

  function planBounds(spread) {
    var raw = spread && spread.plan && spread.plan.length;
    if (SBS.Story && SBS.Story.parseBounds) return SBS.Story.parseBounds(raw);
    var m = String(raw || "").match(/(\d+)\s*-\s*(\d+)/);
    if (!m) return { lo: 0, hi: 0 };
    return { lo: parseInt(m[1], 10), hi: parseInt(m[2], 10) };
  }

  function isStockPageText(text, spread, book) {
    return !!(SBS.Story && SBS.Story.isStockProse &&
      SBS.Story.isStockProse(text, spread, book && book.intent));
  }

  function isUsablePageText(text, role, spread, book) {
    var s = String(text || "").replace(/\s+/g, " ").trim();
    var bounds;
    var min;
    var n;
    if (!s || !isMostlyJapanese(s)) return false;
    s = closeDanglingRuby(s);
    if (!s) return false;
    if (/[A-Za-z]{12,}/.test(s.replace(/[\u3040-\u30ff\u4e00-\u9fff]/g, ""))) return false;
    if (role === "cover") {
      if (hasCoverCredit(s)) return false;
      n = countStoryChars(s);
      return n >= 2 && n <= 80;
    }
    if (isStockPageText(s, spread, book)) return false;
    bounds = planBounds(spread);
    min = bounds.lo ? Math.max(12, Math.round(bounds.lo * 0.9)) : 12;
    n = countStoryChars(s);
    if (n < min) return false;
    if (n > pageTextMax()) return false;
    return /[。！？…」）]$/.test(s) || /おしまい/.test(s);
  }

  function closeDanglingRuby(text) {
    return String(text || "").replace(/[（(][^）)]*$/, "");
  }

  function isKeepablePageText(text, role) {
    var s = closeDanglingRuby(String(text || "").replace(/\s+/g, " ").trim());
    if (!s || !isMostlyJapanese(s)) return false;
    if (role === "cover") {
      if (hasCoverCredit(s)) return false;
      return countStoryChars(s) >= 2 && countStoryChars(s) <= 120;
    }
    return countStoryChars(s) >= 8;
  }

  function linesFromRaw(raw) {
    var cap = pageTextMax();
    var body = String(raw || "").replace(/\s+$/, "");
    if (countStoryChars(body) > cap && body.length > cap * 2) body = body.slice(0, cap * 2);
    return body.split(/\n+/).map(stripDecor).filter(Boolean).slice(0, 16);
  }

  function dropYoungKanjiRuby(text) {
    return String(text || "").replace(/[\u4e00-\u9fff]+[（(]([ぁ-ゖァ-ヶー]+)[）)]/g, "$1");
  }

  function sanitizePageRaw(raw, book, role) {
    var text = closeDanglingRuby(String(raw || ""));
    var audience = book && book.intent && book.intent.audience;
    if (audience === "age-2-3" || audience === "age-4-6") text = dropYoungKanjiRuby(text);
    else if (book && book.furigana) {
      text = (SBS.Story && SBS.Story.mergeKanjiRuby) ? SBS.Story.mergeKanjiRuby(text) : text;
    }
    if (role === "cover") {
      text = text.split(/\n+/).filter(function (line) {
        return line.trim() && !hasCoverCredit(line);
      }).join("\n");
    }
    return text;
  }

  function applyText(spread, raw, book) {
    var lines = linesFromRaw(sanitizePageRaw(raw, book, spread && spread.role));
    if (!lines.length) return false;
    if (!isUsablePageText(lines.join("\n"), spread && spread.role, spread, book)) return false;
    spread.paragraphs = lines.map(tokensFromLine);
    spread.geminiTextDone = true;
    return true;
  }

  function applyKeepable(spread, raw, book) {
    var lines = linesFromRaw(sanitizePageRaw(raw, book, spread && spread.role));
    if (!lines.length) return false;
    if (!isKeepablePageText(lines.join("\n"), spread && spread.role)) return false;
    spread.paragraphs = lines.map(tokensFromLine);
    spread.geminiTextDone = true;
    return true;
  }

  function applyAnyPage(spread, raw, book) {
    var lines;
    var body;
    if (applyText(spread, raw, book) || applyKeepable(spread, raw, book)) return true;
    lines = linesFromRaw(sanitizePageRaw(raw, book, spread && spread.role)).filter(function (line) {
      return line && !hasCoverCredit(line);
    });
    body = lines.join("\n");
    if (!isMostlyJapanese(body)) return false;
    if (spread && spread.role === "cover") {
      if (countStoryChars(body) < 2 || countStoryChars(body) > 160) return false;
    } else if (countStoryChars(body) < 4) {
      return false;
    }
    spread.paragraphs = lines.map(tokensFromLine);
    spread.geminiTextDone = true;
    return true;
  }

  function ensureCoverTitle(book) {
    var spread = book && book.spreads && book.spreads[0];
    var title = String((book && book.title) || (book && book.intent && book.intent.title) || "").trim();
    if (!spread || spread.role !== "cover" || !title) return;
    if (spread.paragraphs && spread.paragraphs.length) return;
    spread.paragraphs = [[{ t: title }]];
  }

  function pageHasBody(spread) {
    var i;
    var tokens;
    if (!spread || !spread.paragraphs || !spread.paragraphs.length) return false;
    for (i = 0; i < spread.paragraphs.length; i += 1) {
      tokens = spread.paragraphs[i] || [];
      if (tokens.some(function (tok) {
        return tok && ((tok.t && String(tok.t).trim()) || tok.k || tok.n);
      })) return true;
    }
    return false;
  }

  function fillEmptyPages(book) {
    ensureCoverTitle(book);
    ((book && book.spreads) || []).forEach(function (spread) {
      if (!spread || spread.role === "cover") return;
      if (pageHasBody(spread)) return;
      spread.paragraphs = [[{ t: "（このページの文章を、ここに書いてください。）" }]];
    });
  }

  function refreshImagePrompt(book, index) {
    if (SBS.PromptCompiler && SBS.PromptCompiler.refreshPageImage) {
      SBS.PromptCompiler.refreshPageImage(book, index);
    }
  }

  function clearStoryDrafts(book) {
    ((book && book.spreads) || []).forEach(function (spread) {
      if (!spread) return;
      spread.paragraphs = [];
      spread.geminiTextDone = false;
    });
    book.storySpine = "";
  }

  function wizardFactsPrompt(book) {
    if (SBS.PromptCompiler && SBS.PromptCompiler.wizardFacts) {
      return SBS.PromptCompiler.wizardFacts(book);
    }
    return String((book && book.intent && book.intent.briefMarkdown) || "");
  }

  function beatLabelOf(spread, index, total) {
    if (SBS.PromptCompiler && SBS.PromptCompiler.beatLabel) {
      return SBS.PromptCompiler.beatLabel(spread, index, total);
    }
    return spread && spread.role === "cover" ? "表紙" : "本文";
  }

  function inventSpine(book) {
    var prompt = [
      "ROLE: Original picture-book plot inventor.",
      "Invent a unique plot for THIS book from the wizard facts only.",
      "Do not use studio templates, past books, sample stories, or famous picture-book plots.",
      "Do not invent a daily-routine plot (waking, packing, walking, greetings) unless the memo itself names that event.",
      "Start from a concrete situation that can exist only in this memo.",
      "Output 6 to 10 short Japanese sentences that tell this book's story from start to end.",
      "No headings. No title. No English. Names must match the wizard facts.",
      "",
      wizardFactsPrompt(book)
    ].join("\n");
    return generateText(prompt).then(function (raw) {
      var text = String(raw || "").replace(/[#*`]/g, "").trim();
      if (!isMostlyJapanese(text) || text.replace(/\s+/g, "").length < 20) text = "";
      book.storySpine = text.slice(0, 900);
      return book;
    }).catch(function () {
      book.storySpine = "";
      return book;
    });
  }

  function stripSlotHint(body) {
    return String(body || "")
      .replace(/^\([^)]{0,80}\)\s*/, "")
      .replace(/^（[^）]{0,80}）\s*/, "")
      .trim();
  }

  function parsePageBlocks(raw) {
    var text = String(raw || "").replace(/\r/g, "");
    var found = {};
    var patterns = [
      /===[\t ]*p?[\t ]*0*(\d+)[\t ]*===[\t ]*\n?([\s\S]*?)(?====[\t ]*p?[\t ]*0*\d+[\t ]*===|$)/gi,
      /【\s*p?\s*0*(\d+)\s*】\s*([\s\S]*?)(?=【\s*p?\s*0*\d+\s*】|$)/gi,
      /(?:^|\n)\s*(?:右ページ|見開き|ページ|p)\s*0*(\d+)\s*[:：]\s*([\s\S]*?)(?=(?:^|\n)\s*(?:右ページ|見開き|ページ|p)\s*0*\d+\s*[:：]|$)/gi
    ];
    patterns.forEach(function (re) {
      var match;
      re.lastIndex = 0;
      while ((match = re.exec(text))) {
        var n = parseInt(match[1], 10);
        if (!n || found[n]) continue;
        found[n] = stripSlotHint(match[2]);
      }
    });
    return found;
  }

  function writePageText(book, index) {
    var spread = book.spreads[index];
    if (!spread) return Promise.resolve();
    if (SBS.PromptCompiler && SBS.PromptCompiler.refreshPageText) {
      SBS.PromptCompiler.refreshPageText(book, index);
    }
    var page = book.prompts && book.prompts.pages && book.prompts.pages[index];
    function after(raw) {
      if (applyAnyPage(spread, raw, book)) {
        refreshImagePrompt(book, index);
        return;
      }
      if (spread.role === "cover") ensureCoverTitle(book);
      refreshImagePrompt(book, index);
    }
    function pickRaw(first, second) {
      if (isUsablePageText(second, spread.role, spread, book)) return second;
      if (isUsablePageText(first, spread.role, spread, book)) return first;
      if (isKeepablePageText(second, spread.role) && !isStockPageText(second, spread, book)) return second;
      if (isKeepablePageText(first, spread.role) && !isStockPageText(first, spread, book)) return first;
      if (isKeepablePageText(second, spread.role)) return second;
      if (isKeepablePageText(first, spread.role)) return first;
      return second || first;
    }
    var pagePrompt = (page && page.text) || [
      "日本語の絵本の右ページ本文だけを書いてください。説明や英語は不要です。",
      wizardFactsPrompt(book),
      book.storySpine || ""
    ].join("\n");
    return generateText(pagePrompt).then(function (raw) {
      if (isUsablePageText(raw, spread.role, spread, book)) {
        after(raw);
        return;
      }
      var bounds = planBounds(spread);
      var hint = spread.role === "cover"
        ? "\n\n表紙の右ページだけ。タイトルとなまえを1〜2行。日本語のみ。さく・え、作・絵、さっか、オリジナルさっかは書かない。60字以内。"
        : "\n\n指定メモの現場から、この本だけの出来事を日本語で書いてください。" +
          "朝の起床・身支度・道のあいさつ・てくてく歩きで始めない（メモがそれを書いていないなら）。" +
          "物体・音・セリフのどれか具体的なものから書き出す。英語禁止。このページは" +
          (bounds.lo && bounds.hi ? bounds.lo + "〜" + bounds.hi : "計画の範囲") +
          "字。最低" + (bounds.lo || 80) + "字。最大" + pageTextMax() +
          "。文末を。！？」で閉じる。景色だけで埋めない。雛形や他の本の話は使わない。";
      return generateText(pagePrompt + hint).then(function (raw2) {
        after(pickRaw(raw, raw2));
      });
    });
  }

  function writeWholeBook(book) {
    var spreads = book.spreads || [];
    var slots = spreads.map(function (spread, i) {
      var bounds = planBounds(spread);
      var place = (SBS.PromptCompiler && SBS.PromptCompiler.pagePlace)
        ? SBS.PromptCompiler.pagePlace(spread, i, spreads.length)
        : (spread.role === "cover" ? "表紙" : "本文");
      return "===p" + spread.n + "===\n(" + place +
        (bounds.lo && bounds.hi ? "、" + bounds.lo + "〜" + bounds.hi + "字" : "") + ")";
    });
    var prompt = [
      (SBS.Originality && SBS.Originality.creatorLock) || "",
      "",
      "Write EVERY right-page Japanese body for this one picture book.",
      "The only story source is the wizard facts (steps 1 to 4).",
      "Do not use studio page plans, draft templates, past books, or sample stories.",
      "Japanese body text only. No English. No markdown commentary.",
      "Follow 文字の規則: 2–6 ひらがな only (no 漢字, no 漢字（ひらがな） even if ふりがな is on), 7–9 grade 1–2 漢字, 10–12 elementary 漢字, 13–15 junior-high 漢字, adults everyday 漢字.",
      "HARD when ふりがな is あり and the audience is 7 or older: every 漢字 word MUST be 漢字（ひらがな） per 熟語, e.g. 学校（がっこう）, 友達（ともだち）, 行（い）った. Never 学（がく）校（こう）. Never leave bare 漢字. Length counts without （ふりがな）.",
      "Cover (p1): title and names only. Do not write さく・え, 作・絵, さっか, or オリジナルさっか.",
      "Output format (exact markers, then the page body):",
      slots.join("\n"),
      "",
      "Open story pages from a concrete object, sound, or spoken line in the memo.",
      "Do not open with waking, packing, road greetings, or a generic walk unless the memo names that event.",
      "",
      wizardFactsPrompt(book),
      "",
      "この本のあらすじ（指定メモから発明）:",
      book.storySpine || "（指定メモだけから発明する）"
    ].join("\n");
    return generateText(prompt, { maxOutputTokens: 16384 }).then(function (raw) {
      var blocks = parsePageBlocks(raw);
      book.lastTextRaw = raw || "";
      book.lastTextError = textFailNote();
      spreads.forEach(function (spread, i) {
        var body = blocks[spread.n] || blocks[i + 1] || "";
        if (body && applyAnyPage(spread, body, book)) {
          refreshImagePrompt(book, i);
        }
      });
      return book;
    });
  }

  function writePageTextEmergency(book, index) {
    var spread = book.spreads[index];
    var bounds = planBounds(spread);
    var prompt = [
      "日本語の絵本の右ページ本文だけを書いてください。マークダウンも英語も不要です。",
      spread && spread.role === "cover"
        ? "表紙。題名と登場人物のなまえだけ。さく・えやオリジナルさっかは書かない。"
        : "このページは" + (bounds.lo || 80) + "字以上。文末を。！？」で閉じる。",
      book && book.furigana && book.intent && book.intent.audience !== "age-2-3" && book.intent.audience !== "age-4-6"
        ? "ふりがなあり。すべての漢字を 漢字（ひらがな） で書く。学校（がっこう）。"
        : "",
      wizardFactsPrompt(book),
      "この本のあらすじ:",
      book.storySpine || "（指定メモだけから発明する）"
    ].join("\n");
    return generateText(prompt).then(function (raw) {
      if (applyAnyPage(spread, raw, book)) refreshImagePrompt(book, index);
      else if (spread && spread.role === "cover") ensureCoverTitle(book);
    });
  }

  function writeMissingPages(book, onPage) {
    var spreads = book.spreads || [];
    function next(i, writer) {
      if (i >= spreads.length) return Promise.resolve();
      if (pageHasBody(spreads[i])) return next(i + 1, writer);
      return writer(book, i).then(function () {
        if (onPage) onPage();
        return next(i + 1, writer);
      });
    }
    return next(0, writePageText).then(function () {
      return next(0, writePageTextEmergency);
    });
  }

  function writePageGroup(book, indices) {
    if (!indices || !indices.length) return Promise.resolve();
    if (indices.length === 1) return writePageText(book, indices[0]);
    var spreads = book.spreads || [];
    var total = spreads.length;
    var slots = indices.map(function (i) {
      var spread = spreads[i];
      var bounds = planBounds(spread);
      return {
        i: i,
        n: spread.n,
        beat: (SBS.PromptCompiler && SBS.PromptCompiler.pagePlace)
          ? SBS.PromptCompiler.pagePlace(spread, i, total)
          : beatLabelOf(spread, i, total),
        lo: bounds.lo,
        hi: bounds.hi,
        role: spread.role
      };
    });
    var prev = (SBS.PromptCompiler && SBS.PromptCompiler.previousPages)
      ? SBS.PromptCompiler.previousPages(book, indices[0])
      : "（まだない）";
    var prompt = [
      (SBS.Originality && SBS.Originality.creatorLock) || "",
      "",
      "Write the RIGHT-page Japanese for several spreads of ONE original picture book.",
      "The only story source is the wizard facts (steps 1 to 4) and this book's original plot.",
      "Do not use studio page plans, draft templates, past books, or sample stories.",
      "Continue the already-written pages. Do not restart the plot.",
      "Japanese body text only. No English. No markdown commentary.",
      "Output format (exact markers):",
      slots.map(function (s) {
        return "===p" + s.n + "===\n(" + s.beat +
          (s.lo && s.hi ? "、" + s.lo + "〜" + s.hi + "字" : "") + ")";
      }).join("\n"),
      "",
      "Open each page from a concrete object, sound, or spoken line in the memo.",
      "Do not open with waking, packing, road greetings, or a generic walk unless the memo names that event.",
      "",
      wizardFactsPrompt(book),
      "",
      "この本のあらすじ（指定メモから発明）:",
      book.storySpine || "（指定メモだけから発明する）",
      "",
      "すでに書いた右ページ:",
      prev
    ].join("\n");
    return generateText(prompt).then(function (raw) {
      var blocks = parsePageBlocks(raw);
      indices.forEach(function (i) {
        var spread = spreads[i];
        var body = blocks[spread.n] || blocks[i + 1] || "";
        if (body && applyAnyPage(spread, body, book)) {
          refreshImagePrompt(book, i);
        }
      });
      var rest = indices.filter(function (i) { return !spreads[i].geminiTextDone; });
      function next(k) {
        if (k >= rest.length) return Promise.resolve();
        return writePageText(book, rest[k]).then(function () { return next(k + 1); });
      }
      return next(0);
    }).catch(function () {
      function next(k) {
        if (k >= indices.length) return Promise.resolve();
        return writePageText(book, indices[k]).then(function () { return next(k + 1); });
      }
      return next(0);
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
    var refs = [];
    if (prev) {
      refs.push({
        url: prev,
        id: ch.id,
        name: ch.displayName || "character"
      });
    }
    styleSheetRefs(book, index).forEach(function (ref) { refs.push(ref); });
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
    return generateImage(prompt, "", {
      models: IMAGE_MODELS_FLASH,
      cacheKey: "sheet",
      crop: false,
      refs: refs.length ? refs : null,
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
        if (onProgress) onProgress(i + 1, chars.length, (chars[i].displayName || "登場人物") + " の見た目を描いています");
        return run(i + 1);
      }
      if (onProgress) {
        onProgress(i, chars.length, (chars[i].displayName || "登場人物") + " の見た目を描いています");
      }
      return paintOneCharacterSheet(book, i, book.characterSheets[i].note || "").then(function () {
        if (onProgress) {
          onProgress(i + 1, chars.length, (chars[i].displayName || "登場人物") + " の見た目を描いています");
        }
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
      if (onProgress) onProgress(1, 1, (ch && ch.displayName ? ch.displayName : "登場人物") + " を描き直しています");
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

  function collectStoryText(book) {
    var names = {};
    var bible = (book && book.bible) || { characters: [] };
    (bible.characters || []).forEach(function (ch) {
      if (ch.role === "hero") names.hero = ch.displayName;
      else if (!names.friend) names.friend = ch.displayName;
    });
    var lines = [];
    ((book && book.spreads) || []).forEach(function (spread) {
      if (!spread || spread.role === "cover") return;
      var body = SBS.Story && SBS.Story.plainText
        ? SBS.Story.plainText(spread.paragraphs, names, { ruby: false })
        : "";
      if (body) lines.push(body);
    });
    return lines.join("\n");
  }

  function cleanTitle(raw) {
    var t = String(raw || "").split(/\n/)[0];
    t = t.replace(/^\s*(タイトル|題名)[:：]\s*/g, "");
    t = t.replace(/^[\s「『"'「]+|[」』"'\s。！？]+$/g, "");
    return t.replace(/\s+/g, " ").trim().slice(0, (SBS.LIMITS && SBS.LIMITS.title) || 40);
  }

  function isStockTitle(title, book) {
    var t = String(title || "").replace(/\s+/g, "");
    var hero = "";
    var theme = "";
    if (!t) return true;
    if (/^(わたしの絵本|ぼくの絵本|くうのゆうき|みおのカレー)$/.test(t)) return true;
    if (/の絵本$/.test(t)) return true;
    ((book && book.bible && book.bible.characters) || []).forEach(function (ch) {
      if (ch.role === "hero") hero = String(ch.displayName || "").replace(/\s+/g, "");
    });
    if (book && book.intent && SBS.audienceWord && SBS.PRESETS) {
      theme = String(SBS.audienceWord(SBS.PRESETS.themes, book.intent.theme, book.intent.audience) || "").replace(/\s+/g, "");
    }
    if (hero && theme && (t === hero + "の" + theme || t === hero + "と" + theme)) return true;
    if (hero && (t === hero + "のゆうき" || t === hero + "の冒険" || t === hero + "の一日")) return true;
    return false;
  }

  function localInventTitle(book) {
    var blob = collectStoryText(book).replace(/おしまい。?/g, " ");
    var hero = "";
    ((book && book.bible && book.bible.characters) || []).forEach(function (ch) {
      if (ch.role === "hero") hero = String(ch.displayName || "");
    });
    var parts = blob.split(/[。！？「」\n\s]+/).filter(function (p) {
      var s = String(p || "").trim();
      if (s.length < 3 || s.length > 14) return false;
      if (hero && s.indexOf(hero) !== -1) return false;
      if (/おはなし|絵本|主人公|おしまい|こんにちは|おはよう/.test(s)) return false;
      return true;
    });
    if (parts.length) return parts[Math.min(2, parts.length - 1)].slice(0, 22);
    return cleanTitle(book && book.title) || "その日の一冊";
  }

  function applyGeneratedTitle(book, title) {
    if (SBS.applyBookTitle) {
      SBS.applyBookTitle(book, title);
      return book;
    }
    book.title = title;
    if (!book.intent) book.intent = {};
    book.intent.title = title;
    return book;
  }

  function retitleBook(book) {
    if (!book) return Promise.resolve(book);
    var story = collectStoryText(book);
    var working = String((book && book.title) || "");
    function finishTitle(title) {
      var next = cleanTitle(title);
      if (!next || isStockTitle(next, book)) next = localInventTitle(book);
      return applyGeneratedTitle(book, next);
    }
    if (!story.replace(/\s+/g, "")) return Promise.resolve(book);
    if (!wantsGemini()) return Promise.resolve(finishTitle(localInventTitle(book)));
    var prompt = [
      "ROLE: You are an original picture-book namer. After the story exists, you invent ONE title that could belong only to this book.",
      "Read the finished Japanese right-page prose. Output the title only.",
      "HARD:",
      "- Japanese only, 6 to 22 characters, no quotes, no subtitle, no ふりがな, no English",
      "- Name a concrete image, object, sound, or misunderstanding from THIS story",
      "- Forbidden stock titles: わたしの絵本, ○○の絵本, Nameのテーマ, Nameの勇気, Nameの冒険, くうのゆうき",
      "- Do not reuse the working title if it is NameのTheme or ○○の絵本",
      "- Do not summarize the theme in the form 「だれのなに」",
      "",
      "Working title (temporary): " + working,
      "Studio brief:",
      String((book.intent && book.intent.briefMarkdown) || "").slice(0, 800),
      "",
      "Finished story:",
      story.slice(0, 2400)
    ].join("\n");
    return generateText(prompt).then(function (raw) {
      return finishTitle(raw);
    }).catch(function () {
      return finishTitle(localInventTitle(book));
    });
  }

  function bookNames(book) {
    var names = {};
    var bible = (book && book.bible) || { characters: [] };
    (bible.characters || []).forEach(function (ch) {
      if (ch.role === "hero") names.hero = ch.displayName;
      else if (!names.friend) names.friend = ch.displayName;
    });
    names.hero = names.hero || "";
    names.friend = names.friend || "";
    return names;
  }

  function pageNeedsReadings(book, spread) {
    if (!SBS.Story || !SBS.Story.wantsRuby || !SBS.Story.wantsRuby(book) || !spread) return false;
    return !!(SBS.Story.unmarkedKanji && SBS.Story.unmarkedKanji(spread.paragraphs).length);
  }

  function applyFilledReadings(spread, raw, book) {
    var names = bookNames(book);
    var before = SBS.Story.plainText(spread.paragraphs, names, { ruby: false });
    var filled = sanitizePageRaw(raw, book, spread && spread.role);
    var beforeN;
    var afterN;
    var next;
    var kept;
    if (!filled || !/[一-龯々〆ヵヶ]+[ \u3000]*[（(][ぁ-ゖァ-ヶー]+[）)]/.test(filled)) return false;
    beforeN = countStoryChars(before);
    afterN = countStoryChars(filled);
    if (beforeN && Math.abs(afterN - beforeN) > Math.max(12, Math.round(beforeN * 0.2))) return false;
    next = SBS.Story.fromPlainText(filled);
    if (!next.length) return false;
    kept = SBS.Story.readingMap(spread.paragraphs);
    spread.paragraphs = SBS.Story.applyReadings(next, kept);
    return true;
  }

  function fillOnePageReadings(book, index) {
    var spread = book.spreads[index];
    var body;
    if (!pageNeedsReadings(book, spread)) return Promise.resolve();
    body = SBS.Story.plainText(spread.paragraphs, bookNames(book), { ruby: false });
    if (!body || !/[一-龯]/.test(body)) return Promise.resolve();
    return generateText([
      "次の絵本の右ページ本文の、すべての漢字に 漢字（ひらがな） を付けてください。",
      "HARD: every 漢字 word must have a reading, per 熟語: 学校（がっこう）. One-kanji words: 空（そら）, 行（い）った.",
      "Do not change words, order, punctuation, or line breaks except adding （ひらがな）.",
      "Do not add 漢字 that were not there. Do not rewrite the prose.",
      "Already marked 漢字（ひらがな） stay as-is.",
      "Output the page body only.",
      "",
      body
    ].join("\n")).then(function (raw) {
      if (raw) applyFilledReadings(spread, raw, book);
    });
  }

  function fillMissingReadings(book, onProgress) {
    var spreads = (book && book.spreads) || [];
    if (!SBS.Story || !SBS.Story.wantsRuby || !SBS.Story.wantsRuby(book) || !wantsGemini()) {
      return Promise.resolve(book);
    }
    function run(i) {
      if (paintToken.cancel) return Promise.resolve(book);
      if (i >= spreads.length) return Promise.resolve(book);
      if (onProgress) onProgress(i, spreads.length);
      if (!pageNeedsReadings(book, spreads[i])) return run(i + 1);
      return fillOnePageReadings(book, i).then(function () {
        if (onProgress) onProgress(i + 1, spreads.length);
        return wait(200).then(function () { return run(i + 1); });
      });
    }
    return run(0);
  }

  function splitWorldList(value) {
    return String(value || "").split(/[,、;；\/]/).map(function (part) {
      return part.replace(/\s+/g, " ").trim();
    }).filter(function (part) {
      return part && !/^(none|なし|無し|（なし）|\(none\))$/i.test(part);
    }).slice(0, 8);
  }

  function localWorldGuess(book) {
    var intent = (book && book.intent) || {};
    var setting = (SBS.audienceWord && SBS.audienceWord(SBS.PRESETS.settings, intent.setting, intent.audience)) ||
      (SBS.labelOf && SBS.labelOf(SBS.PRESETS.settings, intent.setting && intent.setting.preset)) ||
      String((intent.setting && intent.setting.freeText) || "").replace(/\s+/g, " ").trim();
    var mood = SBS.moodOf ? SBS.moodOf(intent) : { preset: intent.mood || "", freeText: "" };
    var moodLabel = (SBS.labelOf && SBS.labelOf(SBS.PRESETS.moods, mood.preset)) ||
      String(mood.freeText || "").trim() || "やわらかい昼の光";
    return {
      keyItems: [],
      landmarks: setting ? [String(setting).slice(0, 40)] : [],
      backdrop: moodLabel + "。空・地面・時刻の色は全ページで同じ",
      extras: "名前のない人や動物が再登場するときは、服と色を変えない"
    };
  }

  function parseWorldLines(raw) {
    var out = { keyItems: [], landmarks: [], backdrop: "", extras: "" };
    String(raw || "").split(/\n/).forEach(function (line) {
      var m = String(line || "").match(/^(KEY_ITEMS|LANDMARKS|BACKDROP|EXTRAS)\s*[:：]\s*(.+)$/i);
      var key;
      var val;
      if (!m) return;
      key = m[1].toUpperCase();
      val = String(m[2] || "").trim();
      if (key === "KEY_ITEMS") out.keyItems = splitWorldList(val);
      else if (key === "LANDMARKS") out.landmarks = splitWorldList(val);
      else if (key === "BACKDROP") out.backdrop = /^(none|なし)/i.test(val) ? "" : val.slice(0, 160);
      else if (key === "EXTRAS") out.extras = /^(none|なし)/i.test(val) ? "" : val.slice(0, 160);
    });
    return out;
  }

  function applyWorldToBook(book, parsed) {
    if (!book) return;
    if (!book.bible) book.bible = {};
    if (!book.bible.world) book.bible.world = {};
    var world = book.bible.world;
    if (parsed.keyItems && parsed.keyItems.length) world.recurringProps = parsed.keyItems;
    if (parsed.landmarks && parsed.landmarks.length) world.landmarks = parsed.landmarks;
    if (parsed.backdrop) world.backdrop = parsed.backdrop;
    if (parsed.extras) world.extras = parsed.extras;
    if (SBS.PromptCompiler && SBS.PromptCompiler.refreshWorldLock) {
      SBS.PromptCompiler.refreshWorldLock(book);
    } else if (SBS.PromptCompiler && SBS.PromptCompiler.compile && book.intent && book.bible) {
      SBS.PromptCompiler.compile(book.intent, book.bible, book);
    }
  }

  function storyWasEdited(book) {
    return ((book && book.spreads) || []).some(function (spread) {
      return spread && spread.textEdited;
    });
  }

  function lockWorldFromStory(book, opts) {
    var parsed;
    var prose;
    opts = opts || {};
    applyWorldToBook(book, localWorldGuess(book));
    if (!book || !wantsGemini() || opts.localOnly) return Promise.resolve(book);
    if (book.worldLocked && !opts.force && !storyWasEdited(book)) return Promise.resolve(book);
    prose = collectStoryText(book);
    if (!prose) {
      book.worldLocked = true;
      return Promise.resolve(book);
    }
    return generateText([
      "この絵本の本文だけから、挿絵で毎回同じ見た目にすべき世界の要素を抜き出してください。",
      "指定キャラクターの顔や服は書かない。有名作品の固有名詞は作らない。本文に無い物は足さない。",
      "出力は次の4行だけ:",
      "KEY_ITEMS: 繰り返し出る持ち物・乗り物・小物（なければ none）",
      "LANDMARKS: 目印の建物・場所（なければ none）",
      "BACKDROP: 空・地面・天気・時刻の色（なければ none）",
      "EXTRAS: 名前のない人や動物の見た目（なければ none）",
      "",
      prose
    ].join("\n")).then(function (raw) {
      parsed = parseWorldLines(raw);
      applyWorldToBook(book, parsed);
      book.worldLocked = true;
      return book;
    }).catch(function () {
      return book;
    });
  }

  function writeBook(book, onProgress, onDone) {
    paintToken.cancel = false;
    function afterThenDone(status) {
      if (status === "interrupted") {
        if (onDone) onDone(book, status);
        return Promise.resolve();
      }
      if (onProgress) {
        var written = 0;
        ((book.spreads || [])).forEach(function (s) {
          if (pageHasBody(s)) written += 1;
        });
        onProgress(written, (book.spreads || []).length, "この本だけの題名をつけています");
      }
      return retitleBook(book).then(function () {
        fillEmptyPages(book);
        if (onDone) onDone(book, status);
      });
    }
    if (!wantsGemini() || !book || !book.prompts) {
      book.textWriteNote = !canCallNetwork()
        ? "この開き方では文章LLMに送れません。httpで開いてください。"
        : !getKey()
          ? "歯車に Gemini APIキーを入れると、文章を書けます。"
          : getMode() === "demo"
            ? "歯車の生成がデモのため、文章LLMを呼んでいません。"
            : "文章LLMを呼べなかったため、本文がありません。";
      fillEmptyPages(book);
      return afterThenDone("complete");
    }
    lastTextCall = { status: 0, model: "", error: "", finish: "" };
    stampModels(book);
    if (SBS.Story && SBS.Story.attachPlans) SBS.Story.attachPlans(book);
    var spreads = book.spreads || [];
    var total = spreads.length;
    var settled = false;

    function textDoneCount() {
      var n = 0;
      spreads.forEach(function (s) {
        if (pageHasBody(s)) n += 1;
      });
      return n;
    }

    function progress(message) {
      if (onProgress) onProgress(textDoneCount(), total, message);
    }

    function finish(status) {
      if (settled) return Promise.resolve();
      settled = true;
      return afterThenDone(status);
    }

    progress((book.title ? "『" + book.title + "』の" : "") + "おはなしの組み立てを考えています");
    return inventSpine(book).then(function () {
      if (SBS.PromptCompiler && SBS.PromptCompiler.refreshAllPageText) {
        SBS.PromptCompiler.refreshAllPageText(book);
      }
      if (onProgress) onProgress(Math.max(textDoneCount(), Math.min(1, total * 0.12)), total,
        (book.title ? "『" + book.title + "』の" : "") + "おはなしを書いています");
      return writeWholeBook(book).then(function () {
        progress((book.title ? "『" + book.title + "』の" : "") + "おはなしを書いています");
        return writeMissingPages(book, function () {
          progress((book.title ? "『" + book.title + "』の" : "") + "おはなしを書いています");
        });
      }).then(function () {
        if (SBS.Story && SBS.Story.wantsRuby && SBS.Story.wantsRuby(book)) {
          progress("漢字にふりがなを付けています");
          return fillMissingReadings(book, function (done, total) {
            if (onProgress) onProgress(done, total, "漢字にふりがなを付けています");
          });
        }
      }).then(function () {
        progress("世界の見た目をそろえています");
        return lockWorldFromStory(book);
      }).then(function () {
        var written = 0;
        spreads.forEach(function (s) {
          if (pageHasBody(s)) written += 1;
        });
        book.textWriteNote = written <= 1
          ? (book.lastTextRaw
            ? "文章LLMは応答しましたが、本文として取り込めませんでした。もう一度つくり直してください。"
            : textFailNote())
          : "";
        return finish("complete");
      });
    }).catch(function () {
      book.textWriteNote = lastTextCall.status || lastTextCall.error
        ? textFailNote()
        : "文章作成中に失敗しました。もう一度つくり直してください。";
      return finish(paintToken.cancel ? "interrupted" : "complete");
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
    var sheetOk = hasIdentitySheets(book);
    var settled = false;

    function progress(message) {
      if (onProgress) onProgress(doneCount(book), total, message);
    }

    function finish(status) {
      if (settled) return;
      settled = true;
      setGenerator(book, usedGemini, usedDemo);
      book.forceRepaint = false;
      if (onDone) onDone(book, status);
    }

    function runSheet() {
      if (paintToken.cancel) {
        finish("interrupted");
        return Promise.resolve();
      }
      if (hasIdentitySheets(book)) {
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
      while (i < spreads.length && !book.forceRepaint && spreads[i].leftArt && !spreads[i].textEdited) i += 1;
      if (i >= spreads.length) {
        finish("complete");
        return Promise.resolve();
      }
      progress("絵を描いています（あと " + remainingArt(spreads) + " ページ）");
      if (!sheetOk) {
        paintOneDemo(book, i);
        spreads[i].artSource = "demo";
        spreads[i].textEdited = false;
        usedDemo += 1;
        return wait(20).then(function () { return runImages(i + 1); });
      }
      refreshImagePrompt(book, i);
      var page = book.prompts.pages && book.prompts.pages[i];
      var pageRefs = refsForPage(book, i);
      return generateImage(page && page.image, pageRefs.length ? book.characterSheet : "", {
        refs: pageRefs.length ? pageRefs : null
      }).then(function (url) {
        if (paintToken.cancel) {
          finish("interrupted");
          return;
        }
        if (url) {
          spreads[i].leftArt = url;
          spreads[i].artSource = "gemini";
          spreads[i].textEdited = false;
          usedGemini += 1;
        } else {
          paintOneDemo(book, i);
          spreads[i].artSource = "demo";
          spreads[i].textEdited = false;
          usedDemo += 1;
        }
        return wait(360).then(function () { return runImages(i + 1); });
      });
    }

    progress("世界の見た目をそろえています");
    return lockWorldFromStory(book).then(function () {
      if (paintToken.cancel) {
        finish("interrupted");
        return;
      }
      progress("絵を描いています");
      return runSheet();
    }).catch(function () {
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
      var refs = refsForPage(book, spreadIndex);
      return generateImage(page && page.image, refs.length ? book.characterSheet : "", {
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

    if (hasIdentitySheets(book)) return runImage();
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
    fillMissingReadings: fillMissingReadings,
    lockWorldFromStory: lockWorldFromStory,
    retitleBook: retitleBook,
    paintImages: paintImages,
    paintBook: paintBook,
    paintSpread: paintSpread,
    paintCharacterSheets: paintCharacterSheets,
    paintCharacterSheet: paintCharacterSheet
  };

  global.SBS = SBS;
})(window);
