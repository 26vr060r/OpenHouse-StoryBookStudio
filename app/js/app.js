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
    var book = $("screen-book");
    var gen = $("screen-generating");
    var lede = $("page-lede");
    if (home) home.hidden = name !== "home";
    if (wizard) wizard.hidden = name !== "wizard";
    if (book) book.hidden = name !== "book";
    if (gen) gen.hidden = name !== "generating";
    if (lede) {
      if (name === "wizard") lede.textContent = "選んだことは、あとから物語と插絵の材料になります。";
      else if (name === "book") lede.textContent = "左が插絵、右が文章です。キャラの見た目は全ページでそろえています。";
      else if (name === "generating") lede.textContent = "いま、絵本を組み立てています。";
      else lede.textContent = "テーマや登場人物を選んで、見開き24ページの絵本をつくるスタジオです。";
    }
  }

  function startWizard(seed) {
    showScreen("wizard");
    SBS.Wizard.start(seed);
  }

  function openBook(intent) {
    showScreen("generating");
    $("gen-message").textContent = "登場人物の色をそろえています";
    window.setTimeout(function () {
      try {
        var bible = SBS.Bible.fromIntent(intent);
        var nextBook = SBS.Story.build(intent, bible);
        if (!SBS.PromptTemplates || !SBS.PromptCompiler) {
          throw new Error("prompt compiler missing");
        }
        SBS.PromptCompiler.compile(intent, bible, nextBook);
        SBS.DemoArt.paintBook(nextBook, function (done, total, message) {
          $("gen-message").textContent = message;
        }, function (finished) {
          SBS.DemoArt.cachePut(finished.title, finished);
          showScreen("book");
          SBS.Viewer.open(finished);
        });
      } catch (err) {
        showScreen("home");
        showSoon("絵本", "絵本を開けませんでした。ページを再読み込みして、もう一度試してください。");
      }
    }, 60);
  }

  SBS.init = function init() {
    if (isKiosk()) document.body.classList.add("kiosk");

    $("btn-make").addEventListener("click", function () {
      startWizard(null);
    });
    $("btn-omakase").addEventListener("click", function () {
      openBook(SBS.intentFromSeed(SBS.OMAKASE));
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
      if (intent) openBook(intent);
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
    $("btn-book-home").addEventListener("click", function () {
      showScreen("home");
    });
    $("btn-prompt-zip").addEventListener("click", function () {
      var current = SBS.Viewer.current();
      if (!current || !SBS.PromptCompiler.downloadZip(current)) {
        showSoon("プロンプト", "先に絵本をつくってから保存してください。");
      }
    });
    SBS.Viewer.bind();
  };

  global.SBS = SBS;
})(window);
