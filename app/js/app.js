(function (global) {
  var SBS = global.SBS || {};

  function isKiosk() {
    try {
      return /(?:^|[?&])kiosk=1(?:&|$)/.test(location.search);
    } catch (err) {
      return false;
    }
  }

  function showSoon(featureName) {
    var dialog = document.getElementById("soon-dialog");
    var body = document.getElementById("soon-message");
    if (!dialog || !body) {
      window.alert(featureName + "は次のスプリントでつながります。");
      return;
    }
    body.textContent =
      featureName +
      "はまだつながっていません。Sprint 02 以降で、条件入力から絵本生成まで順に載せます。";
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeSoon() {
    var dialog = document.getElementById("soon-dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  SBS.initHome = function initHome() {
    if (isKiosk()) {
      document.body.classList.add("kiosk");
    }

    var make = document.getElementById("btn-make");
    var omakase = document.getElementById("btn-omakase");
    var library = document.getElementById("btn-library");
    var gear = document.getElementById("btn-gear");
    var close = document.getElementById("btn-soon-close");

    if (make) make.addEventListener("click", function () { showSoon("絵本をつくる"); });
    if (omakase) omakase.addEventListener("click", function () { showSoon("おまかせで一冊"); });
    if (library) library.addEventListener("click", function () { showSoon("書庫"); });
    if (gear) gear.addEventListener("click", function () { showSoon("運営者設定"); });
    if (close) close.addEventListener("click", closeSoon);
  };

  global.SBS = SBS;
})(window);
