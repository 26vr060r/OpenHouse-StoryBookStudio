(function (global) {
  var SBS = global.SBS || {};
  var W = 1200;
  var H = 1600;
  var MESSAGES = [
    "登場人物の色をそろえています",
    "身長のバランスを決めています",
    "同じデザインで絵を描いています",
    "地面の位置をそろえています"
  ];

  var SETTING_SKY = {
    forest: ["#cfe8c4", "#8fbf7a"],
    sea: ["#c9e7f5", "#7eb8d4"],
    town: ["#f3e2c7", "#d9b48a"],
    school: ["#d7e8f5", "#9bb7d4"],
    home: ["#f7e4c8", "#e2c08a"],
    space: ["#1b1433", "#3a2a66"],
    fantasy: ["#e4d4f5", "#b89ad4"],
    custom: ["#efe3c8", "#d4c09a"]
  };

  function poseFor(scene) {
    if (/go|try|path|once|again|play|noon/.test(scene)) return "walk";
    if (/fail|think/.test(scene)) return "sit";
    if (scene === "crisis") return "crouch";
    if (scene === "win") return "cheer";
    if (/home|coda|cover/.test(scene)) return "wave";
    if (/night|dream|look|evening/.test(scene)) return "look";
    if (scene === "spark") return "reach";
    return "stand";
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fillSky(ctx, setting, mood) {
    var pair = SETTING_SKY[setting] || SETTING_SKY.custom;
    if (mood === "night" || setting === "space") pair = SETTING_SKY.space;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pair[0]);
    g.addColorStop(1, pair[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGround(ctx, groundY, setting) {
    ctx.fillStyle = setting === "sea" ? "#5aa0c4" : setting === "space" ? "#2a2048" : "#7a9a4a";
    if (setting === "town" || setting === "school" || setting === "home") ctx.fillStyle = "#c4b49a";
    ctx.beginPath();
    ctx.rect(0, groundY, W, H - groundY);
    ctx.fill();
  }

  function drawSettingProps(ctx, setting, groundY, mood) {
    ctx.save();
    if (setting === "forest") {
      ctx.fillStyle = "#3f6b32";
      [180, 420, 980, 1100].forEach(function (x) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 70, groundY - 280);
        ctx.lineTo(x + 140, groundY);
        ctx.fill();
      });
    } else if (setting === "sea") {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(220, 280, 90, 50, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (setting === "home" || setting === "school") {
      ctx.fillStyle = "#efe6d4";
      roundRect(ctx, 120, groundY - 320, 260, 320, 8);
      ctx.fill();
      ctx.fillStyle = "#c44536";
      ctx.beginPath();
      ctx.moveTo(100, groundY - 320);
      ctx.lineTo(250, groundY - 430);
      ctx.lineTo(400, groundY - 320);
      ctx.fill();
    } else if (setting === "town") {
      ctx.fillStyle = "#d8c4a8";
      [80, 260, 900].forEach(function (x, i) {
        ctx.fillRect(x, groundY - (220 + i * 40), 140, 220 + i * 40);
      });
    } else if (setting === "space" || mood === "night") {
      ctx.fillStyle = "#f7f1c8";
      [[180, 160], [400, 90], [860, 200], [1040, 120]].forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (setting === "fantasy") {
      ctx.fillStyle = "#d8c8ec";
      ctx.fillRect(860, groundY - 360, 160, 360);
      ctx.beginPath();
      ctx.moveTo(840, groundY - 360);
      ctx.lineTo(940, groundY - 470);
      ctx.lineTo(1040, groundY - 360);
      ctx.fill();
    }
    ctx.restore();
  }

  function hasScarf(ch) {
    if (ch.accessories && ch.accessories.scarf) return true;
    return (ch.mustKeep || []).some(function (t) {
      return String(t).indexOf("マフラー") !== -1 || String(t).indexOf("スカーフ") !== -1;
    });
  }

  function scarfColor(ch) {
    return (ch.palette && ch.palette.scarf) || "#c44536";
  }

  function drawScarf(ctx, cx, neckY, headR, color) {
    ctx.save();
    ctx.fillStyle = color || "#c44536";
    ctx.strokeStyle = "#7a2e32";
    ctx.lineWidth = 3;
    roundRect(ctx, cx - headR * 1.05, neckY - 8, headR * 2.1, 28, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.35, neckY + 16);
    ctx.quadraticCurveTo(cx + headR * 1.4, neckY + 50, cx + headR * 0.55, neckY + headR * 2.4);
    ctx.quadraticCurveTo(cx + headR * 1.1, neckY + 70, cx + headR * 0.85, neckY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.15, neckY + 18);
    ctx.quadraticCurveTo(cx + headR * 1.05, neckY + 80, cx + headR * 0.2, neckY + headR * 2.8);
    ctx.quadraticCurveTo(cx + headR * 0.75, neckY + 90, cx + headR * 0.55, neckY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawCharacter(ctx, ch, cx, groundY, pose, ppu) {
    var pal = ch.palette;
    var units = (ch.body && ch.body.heightUnits) || 1;
    var height = units * ppu;
    var kind = ch.kind || "child";
    var isAnimal = kind === "animal";
    var isObject = kind === "object";
    var headR = height * (isAnimal ? 0.22 : 0.16);
    var walk = pose === "walk" ? 14 : 0;
    var sit = pose === "sit" || pose === "crouch" ? height * 0.22 : 0;
    var top = groundY - height + sit;
    var bodyH = height - headR * 2 - 8;
    var bodyW = isAnimal ? headR * 2.2 : headR * 1.7;
    var bodyTop = top + headR * 2 - 6;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#3a2a22";

    if (isObject) {
      ctx.fillStyle = pal.clothesPrimary;
      roundRect(ctx, cx - bodyW, groundY - height * 0.55, bodyW * 2, height * 0.45, 20);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.clothesAccent;
      ctx.beginPath();
      ctx.arc(cx - bodyW * 0.6, groundY - 18, 16, 0, Math.PI * 2);
      ctx.arc(cx + bodyW * 0.6, groundY - 18, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = isAnimal ? pal.hair : pal.clothesPrimary;
    if (pose === "cheer") {
      ctx.beginPath();
      ctx.moveTo(cx - 8, bodyTop + 20);
      ctx.lineTo(cx - 70, bodyTop - 10);
      ctx.lineTo(cx - 50, bodyTop + 8);
      ctx.lineTo(cx + 50, bodyTop + 8);
      ctx.lineTo(cx + 70, bodyTop - 10);
      ctx.lineTo(cx + 8, bodyTop + 20);
      ctx.fill();
      ctx.stroke();
    } else if (pose === "reach") {
      ctx.beginPath();
      ctx.moveTo(cx, bodyTop + 24);
      ctx.lineTo(cx + 80, bodyTop - 30);
      ctx.lineWidth = 14;
      ctx.strokeStyle = isAnimal ? pal.hair : pal.clothesPrimary;
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#3a2a22";
    }

    roundRect(ctx, cx - bodyW / 2, bodyTop, bodyW, Math.max(bodyH, 40), 22);
    ctx.fill();
    ctx.stroke();

    if (!isAnimal) {
      ctx.fillStyle = pal.clothesAccent;
      ctx.fillRect(cx - 10, bodyTop + 12, 20, Math.max(bodyH - 24, 16));
    }

    ctx.fillStyle = isAnimal ? pal.hair : pal.skin;
    ctx.beginPath();
    ctx.arc(cx, top + headR + 4, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (isAnimal) {
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.ellipse(cx - headR * 0.7, top + headR * 0.35, headR * 0.38, headR * 0.42, -0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + headR * 0.7, top + headR * 0.35, headR * 0.38, headR * 0.42, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.skin;
      ctx.beginPath();
      ctx.ellipse(cx, top + headR + 10, headR * 0.42, headR * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.arc(cx, top + headR * 0.7, headR * 0.95, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = pal.eyes;
    ctx.beginPath();
    ctx.arc(cx - headR * 0.32, top + headR + 2, 5, 0, Math.PI * 2);
    ctx.arc(cx + headR * 0.32, top + headR + 2, 5, 0, Math.PI * 2);
    ctx.fill();

    if (hasScarf(ch)) {
      drawScarf(ctx, cx, bodyTop + 2, headR, scarfColor(ch));
    }

    ctx.strokeStyle = isAnimal ? pal.hair : pal.clothesPrimary;
    ctx.lineWidth = 12;
    ctx.beginPath();
    if (pose === "walk") {
      ctx.moveTo(cx - 8, groundY - sit);
      ctx.lineTo(cx - 28 - walk, groundY);
      ctx.moveTo(cx + 8, groundY - sit);
      ctx.lineTo(cx + 32 + walk, groundY);
    } else if (pose === "sit" || pose === "crouch") {
      ctx.moveTo(cx - 12, groundY - 20);
      ctx.lineTo(cx - 50, groundY);
      ctx.moveTo(cx + 12, groundY - 20);
      ctx.lineTo(cx + 50, groundY);
    } else {
      ctx.moveTo(cx - 10, groundY - sit);
      ctx.lineTo(cx - 16, groundY);
      ctx.moveTo(cx + 10, groundY - sit);
      ctx.lineTo(cx + 16, groundY);
    }
    ctx.stroke();
    ctx.restore();
  }

  function layoutCharacters(chars, scene) {
    var n = chars.length || 1;
    var xs = [];
    var i;
    if (n === 1) xs = [0.5];
    else if (n === 2) xs = scene === "meet" ? [0.4, 0.6] : [0.35, 0.65];
    else {
      for (i = 0; i < n; i += 1) xs.push(0.22 + (0.56 * i) / (n - 1));
    }
    return xs;
  }

  function renderSpread(book, spread) {
    var canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext("2d");
    var bible = book.bible || {};
    var setting = (bible.world && bible.world.settingPalette) || "custom";
    var mood = book.intent && book.intent.mood;
    var groundY = Math.round(((bible.world && bible.world.groundLine) || 0.82) * H);
    var ppu = (bible.world && bible.world.pixelsPerUnit) || 220;
    var pose = poseFor(spread.scene);
    var chars = bible.characters || [];
    var xs = layoutCharacters(chars, spread.scene);

    fillSky(ctx, setting, mood);
    drawSettingProps(ctx, setting, groundY, mood);
    drawGround(ctx, groundY, setting);
    chars.forEach(function (ch, i) {
      drawCharacter(ctx, ch, Math.round(xs[i] * W), groundY, pose, ppu);
    });
    return canvas.toDataURL("image/png");
  }

  function openCache() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      var req = indexedDB.open("sbs-demo-art", 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore("spreads");
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { resolve(null); };
    });
  }

  var paintToken = { cancel: false };

  SBS.DemoArt = {
    cancelPaint: function cancelPaint() {
      paintToken.cancel = true;
    },
    paintBook: function paintBook(book, onProgress, onDone) {
      var spreads = book.spreads || [];
      var i = 0;
      paintToken.cancel = false;
      while (i < spreads.length && spreads[i].leftArt) i += 1;

      function tick() {
        if (paintToken.cancel) {
          if (onDone) onDone(book, "interrupted");
          return;
        }
        if (i >= spreads.length) {
          if (onDone) onDone(book, "complete");
          return;
        }
        var msg = MESSAGES[Math.min(i, MESSAGES.length - 1)];
        if (i >= 2) msg = "絵をそろえています（" + (i + 1) + " / " + spreads.length + "）";
        if (onProgress) onProgress(i, spreads.length, msg);
        spreads[i].leftArt = renderSpread(book, spreads[i]);
        i += 1;
        if (onProgress) onProgress(i, spreads.length, msg);
        window.setTimeout(tick, 20);
      }

      if (onProgress) onProgress(i, spreads.length, MESSAGES[0]);
      window.setTimeout(tick, 40);
    },
    cachePut: function cachePut(key, book) {
      openCache().then(function (db) {
        if (!db) return;
        var tx = db.transaction("spreads", "readwrite");
        tx.objectStore("spreads").put({
          title: book.title,
          arts: (book.spreads || []).map(function (s) { return s.leftArt; })
        }, key);
      });
    }
  };

  global.SBS = SBS;
})(window);
