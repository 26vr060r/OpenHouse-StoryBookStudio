(function (global) {
  var SBS = global.SBS || {};

  function overflows(el, tate) {
    if (!el) return false;
    if (tate) return el.scrollWidth > el.clientWidth + 2;
    return el.scrollHeight > el.clientHeight + 2;
  }

  function apply(el, size, lead, gap, pad) {
    el.style.setProperty("--page-size", size + "px");
    el.style.setProperty("--page-lead", String(lead));
    el.style.setProperty("--page-gap", gap + "em");
    el.style.setProperty("--page-pad", pad + "em");
  }

  function fit(el, opts) {
    if (!el || el.clientHeight < 8 || el.clientWidth < 8) return;
    opts = opts || {};
    var tate = !!(el.classList.contains("tate") || opts.tate);
    var min = opts.min || 11;
    var max = opts.max || 20;
    var lead = tate ? 1.85 : 1.95;
    var gap = 0.5;
    var pad = 0.55;
    var lo = min;
    var hi = max;
    var best = min;
    var i;
    var mid;
    apply(el, max, lead, gap, pad);
    if (!overflows(el, tate)) return;
    for (i = 0; i < 14; i += 1) {
      mid = (lo + hi) / 2;
      apply(el, mid, lead, gap, pad);
      if (overflows(el, tate)) hi = mid;
      else {
        best = mid;
        lo = mid;
      }
    }
    apply(el, best, lead, gap, pad);
    if (overflows(el, tate)) {
      apply(el, best, tate ? 1.52 : 1.58, 0.28, 0.32);
    }
    if (overflows(el, tate)) {
      apply(el, min, 1.45, 0.2, 0.25);
    }
  }

  function fitAll(root, selector) {
    var host = root && root.querySelectorAll ? root : document;
    var nodes = host.querySelectorAll(selector || ".right-page, .print-page.right, .print-leaf.text");
    var i;
    for (i = 0; i < nodes.length; i += 1) fit(nodes[i]);
  }

  function afterLayout(fn) {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(fn);
      });
    });
  }

  SBS.PageFit = {
    fit: fit,
    fitAll: fitAll,
    afterLayout: afterLayout
  };

  global.SBS = SBS;
})(window);
