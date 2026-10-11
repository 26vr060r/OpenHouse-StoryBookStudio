(function (global) {
  var SBS = global.SBS || {};
  var GATE_KEY = "sbs-consent-gate";
  var clockTimer = null;
  var remembered = null;
  var onDone = null;

  function $(id) {
    return document.getElementById(id);
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function nowParts() {
    var d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds()
    };
  }

  function formatWhen(parts) {
    return parts.year + "年" + parts.month + "月" + parts.day + "日 " +
      parts.hour + "時" + parts.minute + "分";
  }

  function formatIso(parts) {
    return parts.year + "-" + pad2(parts.month) + "-" + pad2(parts.day) +
      "T" + pad2(parts.hour) + ":" + pad2(parts.minute) + ":" + pad2(parts.second) +
      "+09:00";
  }

  function itemChecks() {
    return Array.prototype.slice.call(document.querySelectorAll(".consent-item-check"));
  }

  function allItemsOn() {
    var items = itemChecks();
    return items.length > 0 && items.every(function (el) { return el.checked; });
  }

  function refreshWhen() {
    var el = $("consent-when");
    if (el) el.textContent = formatWhen(nowParts());
  }

  function stopClock() {
    if (clockTimer) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  }

  function startClock() {
    stopClock();
    refreshWhen();
    clockTimer = window.setInterval(refreshWhen, 30000);
  }

  function syncAgree() {
    var btn = $("btn-consent-agree");
    var name = $("consent-name");
    var ready = allItemsOn() && !!(name && String(name.value || "").trim());
    if (btn) btn.disabled = !ready;
    var master = $("consent-all");
    if (master && master.checked !== allItemsOn()) master.checked = allItemsOn();
  }

  function setAllItems(on) {
    itemChecks().forEach(function (el) {
      el.checked = !!on;
    });
    var master = $("consent-all");
    if (master) master.checked = !!on;
    syncAgree();
  }

  function resetForm() {
    setAllItems(false);
    var name = $("consent-name");
    if (name) name.value = "";
    refreshWhen();
  }

  function readGate() {
    try {
      var raw = String(window.localStorage.getItem(GATE_KEY) || "").trim();
      if (raw === "off" || raw === "0" || raw === "false") return "off";
      return "on";
    } catch (err) {
      return "on";
    }
  }

  function writeGate(on) {
    try {
      window.localStorage.setItem(GATE_KEY, on ? "on" : "off");
    } catch (err) {
      /* ignore */
    }
  }

  function creatorOf() {
    var name = $("consent-name");
    var parts = nowParts();
    return {
      name: String(name && name.value ? name.value : "").replace(/\s+/g, " ").trim(),
      agreed: true,
      agreedAt: formatIso(parts),
      agreedAtLabel: formatWhen(parts)
    };
  }

  function stamp(book) {
    if (!book || !remembered || !remembered.agreed || !remembered.name) return book;
    book.creator = {
      name: remembered.name,
      agreed: true,
      agreedAt: remembered.agreedAt,
      agreedAtLabel: remembered.agreedAtLabel || ""
    };
    return book;
  }

  function syncGateControl() {
    var gate = $("consent-gate");
    if (gate) gate.checked = readGate() === "on";
  }

  function bind() {
    itemChecks().forEach(function (el) {
      el.addEventListener("change", function () {
        syncAgree();
      });
    });
    var master = $("consent-all");
    if (master) {
      master.addEventListener("change", function () {
        setAllItems(master.checked);
      });
    }
    var name = $("consent-name");
    if (name) {
      name.addEventListener("input", syncAgree);
    }
    var agree = $("btn-consent-agree");
    if (agree) {
      agree.addEventListener("click", function () {
        if (agree.disabled) return;
        var creator = creatorOf();
        if (!creator.name || !allItemsOn()) {
          syncAgree();
          return;
        }
        remembered = creator;
        stopClock();
        var done = onDone;
        onDone = null;
        if (done) done(true, creator);
      });
    }
    var decline = $("btn-consent-decline");
    if (decline) {
      decline.addEventListener("click", function () {
        remembered = null;
        stopClock();
        resetForm();
        var done = onDone;
        onDone = null;
        if (done) done(false, null);
      });
    }
    var gate = $("consent-gate");
    if (gate) {
      gate.addEventListener("change", function () {
        writeGate(gate.checked);
      });
    }
    syncGateControl();
  }

  SBS.Consent = {
    isRequired: function isRequired() {
      return readGate() === "on";
    },
    isOn: function isOn() {
      return readGate() === "on";
    },
    setOn: function setOn(on) {
      writeGate(!!on);
      syncGateControl();
    },
    syncGate: syncGateControl,
    remembered: function rememberedCreator() {
      return remembered;
    },
    forget: function forget() {
      remembered = null;
    },
    stamp: stamp,
    open: function open(done) {
      onDone = typeof done === "function" ? done : null;
      resetForm();
      startClock();
      if (typeof SBS.showScreen === "function") SBS.showScreen("consent");
      else {
        var screen = $("screen-consent");
        if (screen) screen.hidden = false;
      }
    },
    stop: function stop() {
      stopClock();
    },
    bind: bind
  };

  global.SBS = SBS;
})(window);
