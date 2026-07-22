/* ============================================================
   adityan.dev — variation switcher
   A floating pill (bottom-right) to click through the design
   variations. Rendered in a shadow root so page styles can't
   leak in and vice-versa. Include on any variation page:
     <script src="switcher.js" defer></script>
   ============================================================ */
(function () {
  "use strict";

  var VARIATIONS = [
    { file: "brutalist.html",    label: "Brutalist",    hue: "#2E4BFF" },
    { file: "terminal.html",     label: "Terminal",     hue: "#3DF58C" },
    { file: "aurora-glass.html", label: "Aurora Glass", hue: "#7C5CFF" },
    { file: "bento.html",        label: "Bento",        hue: "#D6F45A" },
    { file: "y2k.html",          label: "Y2K",          hue: "#FF4ECD" },
    { file: "swiss.html",        label: "Swiss",        hue: "#E4231B" },
    { file: "newsprint.html",    label: "Newsprint",    hue: "#C9A86A" }
  ];

  var current = (location.pathname.split("/").pop() || "").toLowerCase();
  var index = VARIATIONS.findIndex(function (v) { return v.file === current; });
  if (index === -1) index = 0;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- host + shadow root (full style isolation) ----
  var host = document.createElement("div");
  host.id = "variation-switcher";
  host.setAttribute("aria-hidden", "false");
  document.body.appendChild(host);
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var accent = VARIATIONS[index].hue;

  var style = document.createElement("style");
  style.textContent = [
    ":host{all:initial}",
    "*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}",
    ".wrap{position:fixed;right:20px;bottom:20px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;gap:10px}",
    "@media(max-width:520px){.wrap{right:12px;bottom:12px}}",

    /* pill */
    ".pill{display:flex;align-items:center;gap:2px;padding:5px;border-radius:999px;" +
      "background:rgba(18,18,22,.82);-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);" +
      "border:1px solid rgba(255,255,255,.16);box-shadow:0 10px 34px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.3)}",
    ".ico{width:34px;height:34px;border:0;border-radius:999px;background:transparent;color:#EDEDF2;cursor:pointer;" +
      "display:grid;place-items:center;padding:0;transition:background .18s,color .18s,transform .18s}",
    ".ico:hover{background:rgba(255,255,255,.12);color:#fff}",
    ".ico:active{transform:scale(.9)}",
    ".ico svg{width:17px;height:17px;display:block}",
    ".ico:focus-visible,.name:focus-visible,.item:focus-visible{outline:2px solid #fff;outline-offset:2px}",

    ".name{display:flex;align-items:center;gap:9px;border:0;cursor:pointer;color:#EDEDF2;background:transparent;" +
      "padding:6px 14px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:.01em;transition:background .18s}",
    ".name:hover{background:rgba(255,255,255,.1);color:#fff}",
    ".dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;box-shadow:0 0 0 3px rgba(255,255,255,.12)}",
    ".count{font-size:11px;color:#9B9BA6;font-variant-numeric:tabular-nums;font-weight:500}",
    ".chev{width:14px;height:14px;color:#9B9BA6;transition:transform .22s ease}",
    ".wrap.open .chev{transform:rotate(180deg)}",

    /* menu */
    ".menu{width:230px;padding:8px;border-radius:18px;background:rgba(18,18,22,.9);" +
      "-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);" +
      "border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.5);" +
      "transform-origin:bottom right;opacity:0;transform:translateY(8px) scale(.96);pointer-events:none;" +
      "transition:opacity .2s ease,transform .2s cubic-bezier(.2,1,.3,1)}",
    ".wrap.open .menu{opacity:1;transform:none;pointer-events:auto}",
    ".mtitle{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7C7C87;padding:8px 12px 6px;font-weight:600}",
    ".item{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:0;background:transparent;cursor:pointer;" +
      "padding:9px 12px;border-radius:11px;color:#D6D6DE;font-size:14px;font-weight:500;text-decoration:none;transition:background .15s,color .15s}",
    ".item:hover{background:rgba(255,255,255,.09);color:#fff}",
    ".item .idx{font-size:11px;color:#7C7C87;font-variant-numeric:tabular-nums;width:16px;flex:0 0 auto}",
    ".item .sw{width:11px;height:11px;border-radius:4px;flex:0 0 auto}",
    ".item .lbl{margin-right:auto}",
    ".item[aria-current='true']{background:rgba(255,255,255,.11);color:#fff}",
    ".item .check{width:15px;height:15px;opacity:0;flex:0 0 auto}",
    ".item[aria-current='true'] .check{opacity:1}",
    ".sep{height:1px;background:rgba(255,255,255,.1);margin:6px 4px}",
    ".ghost{color:#9B9BA6}",
    ".ghost:hover{color:#fff}"
  ].join("");
  if (reduce) style.textContent += ".menu,.chev,.ico,.name{transition:none!important}";
  root.appendChild(style);

  // ---- icons ----
  function svg(paths, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (extra || "") + ">" + paths + "</svg>";
  }
  var I_PREV = svg('<path d="M15 18l-6-6 6-6"/>');
  var I_NEXT = svg('<path d="M9 18l6-6-6-6"/>');
  var I_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
  var I_CHECK = '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var I_GRID = svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>');

  // ---- markup ----
  var wrap = document.createElement("div");
  wrap.className = "wrap";

  var items = VARIATIONS.map(function (v, i) {
    var cur = i === index ? ' aria-current="true"' : "";
    return '<a class="item" href="' + v.file + '"' + cur + '>' +
      '<span class="idx">' + (i + 1) + '</span>' +
      '<span class="sw" style="background:' + v.hue + '"></span>' +
      '<span class="lbl">' + v.label + '</span>' + I_CHECK + '</a>';
  }).join("");

  wrap.innerHTML =
    '<div class="menu" role="menu" aria-label="Design variations">' +
      '<div class="mtitle">Choose a design</div>' +
      items +
      '<div class="sep"></div>' +
      '<a class="item ghost" href="index.html">' +
        '<span class="idx" style="display:grid;place-items:center">' + I_GRID + '</span>' +
        '<span class="lbl">Gallery — all seven</span></a>' +
    '</div>' +
    '<div class="pill">' +
      '<button class="ico" data-act="prev" aria-label="Previous design" title="Previous (←)">' + I_PREV + '</button>' +
      '<button class="name" data-act="toggle" aria-haspopup="true" aria-expanded="false">' +
        '<span class="dot" style="background:' + accent + '"></span>' +
        '<span class="cur-label">' + VARIATIONS[index].label + '</span>' +
        '<span class="count">' + (index + 1) + "/" + VARIATIONS.length + '</span>' +
        I_CHEV +
      '</button>' +
      '<button class="ico" data-act="next" aria-label="Next design" title="Next (→)">' + I_NEXT + '</button>' +
    '</div>';
  root.appendChild(wrap);

  // ---- behavior ----
  function go(i) {
    var n = (i + VARIATIONS.length) % VARIATIONS.length;
    location.href = VARIATIONS[n].file;
  }
  function toggle(force) {
    var open = force != null ? force : !wrap.classList.contains("open");
    wrap.classList.toggle("open", open);
    root.querySelector(".name").setAttribute("aria-expanded", open ? "true" : "false");
  }

  root.querySelectorAll("[data-act]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      var act = b.getAttribute("data-act");
      if (act === "prev") { e.preventDefault(); go(index - 1); }
      else if (act === "next") { e.preventDefault(); go(index + 1); }
      else if (act === "toggle") { e.preventDefault(); toggle(); }
    });
  });

  // close when clicking outside the switcher
  document.addEventListener("click", function (e) {
    if (!wrap.classList.contains("open")) return;
    if (e.composedPath && e.composedPath().indexOf(host) !== -1) return;
    toggle(false);
  });

  // keyboard: ← / → cycle, Esc closes (ignore while typing in a field)
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "Escape") { toggle(false); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowLeft") { go(index - 1); }
    else if (e.key === "ArrowRight") { go(index + 1); }
  });
})();
