(function (global) {
  var SBS = global.SBS || {};

  function isKiosk() {
    try {
      return /(?:^|[?&])kiosk=1(?:&|$)/.test(location.search);
    } catch (err) {
      return false;
    }
  }

  function isStudio() {
    try {
      return /(?:^|[?&])studio=1(?:&|$)/.test(location.search);
    } catch (err) {
      return false;
    }
  }

  SBS.isKiosk = isKiosk;
  SBS.isStudio = isStudio;

  function $(id) {
    return document.getElementById(id);
  }

  function showSoon(featureName, extra) {
    var dialog = $("soon-dialog");
    var body = $("soon-message");
    var text = extra || (featureName + "はまだつながっていません。次のスプリントで載せます。");
    if (!dialog || !body) {
      window.alert(text);
      return;
    }
    body.textContent = text;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeSoon() {
    var dialog = $("soon-dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function showScreen(name) {
    var home = $("screen-home");
    var wizard = $("screen-wizard");
    var lede = $("page-lede");
    if (home) home.hidden = name !== "home";
    if (wizard) wizard.hidden = name !== "wizard";
    if (lede) {
      lede.textContent = name === "wizard"
        ? "選んだことは、あとから物語と插絵の材料になります。"
        : "テーマや登場人物を選んで、見開き24ページの絵本をつくるスタジオです。";
    }
  }

  function startWizard(seed) {
    showScreen("wizard");
    SBS.Wizard.start(seed);
  }

  SBS.init = function init() {
    if (isKiosk()) document.body.classList.add("kiosk");

    $("btn-make").addEventListener("click", function () {
      startWizard(null);
    });
    $("btn-omakase").addEventListener("click", function () {
      startWizard(SBS.OMAKASE);
    });
    $("btn-library").addEventListener("click", function () {
      showSoon("書庫");
    });
    $("btn-gear").addEventListener("click", function () {
      showSoon("運営者設定");
    });
    $("btn-soon-close").addEventListener("click", closeSoon);

    $("btn-wizard-back").addEventListener("click", function () {
      var where = SBS.Wizard.back();
      if (where === "home") showScreen("home");
    });
    $("btn-wizard-next").addEventListener("click", function () {
      var intent = SBS.Wizard.next();
      if (intent) {
        showSoon(
          "絵本の生成",
          "条件はそろいました。物語と插絵は Sprint 03 以降でつながります。"
        );
      }
    });
    $("btn-add-character").addEventListener("click", function () {
      SBS.Wizard.addCharacter();
    });
    $("title-input").addEventListener("input", function () {
      SBS.Wizard.markTitleTouched();
    });
    $("furigana-input").addEventListener("change", function () {
      SBS.Wizard.markFuriganaTouched();
    });
  };

  global.SBS = SBS;
})(window);
