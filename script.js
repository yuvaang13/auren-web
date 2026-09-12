// Auren website — progressive enhancement only. No frameworks.
(function () {
  "use strict";

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile menu
  var burger = document.getElementById("burger");
  var menu = document.getElementById("mobileMenu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Reveal on scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  // Scroll progress bar (rAF-throttled) + nav scrolled state
  var progress = document.getElementById("scrollProgress");
  var nav = document.querySelector(".nav");
  if (progress) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Scrollspy: highlight the nav link for the section in view
  var spyLinks = document.querySelectorAll(".nav-links a[href^='#']");
  var spySections = [];
  spyLinks.forEach(function (a) {
    var el = document.querySelector(a.getAttribute("href"));
    if (el) spySections.push({ link: a, el: el });
  });
  if ("IntersectionObserver" in window && spySections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        spySections.forEach(function (s) {
          s.link.classList.toggle("active", s.el === e.target);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    spySections.forEach(function (s) { spy.observe(s.el); });
  }
  // Hero demo toggle + playgrounds share one simulated protection state.
  var demoOn = true;
  var toggle = document.getElementById("demoToggle");
  var statusText = document.getElementById("demoStatusText");
  var statusWrap = document.getElementById("demoStatus");
  var demoLog = document.getElementById("demoLog");
  if (toggle) {
    toggle.addEventListener("click", function () {
      demoOn = !demoOn;
      toggle.classList.toggle("on", demoOn);
      toggle.setAttribute("aria-pressed", demoOn ? "true" : "false");
      if (statusText) statusText.textContent = demoOn
        ? "ON — only what you allow is reachable"
        : "OFF — everything reachable as usual";
      if (statusWrap) statusWrap.classList.toggle("off", !demoOn);
      if (demoLog) demoLog.innerHTML = demoOn
        ? "Agent command blocked <span>(cmd_ssh)</span>"
        : "Protection off — gates open, agent traffic flowing";
    });
  }

  // Rotating blocked-event feed in the hero mock — a subtle sign of life.
  // Skipped for reduced-motion users; pauses when the tab is hidden or
  // protection is previewed OFF (the toggle owns the log in that state).
  var demoLines = [
    "Agent command blocked <span>(cmd_ssh)</span>",
    "DoH bypass killed at firewall <span>(dns_doh)</span>",
    "Credential autofill refused <span>(autofill)</span>",
    "Traversal escape denied <span>(fs_traversal)</span>"
  ];
  var demoIdx = 0;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (demoLog && !reduceMotion) {
    setInterval(function () {
      if (!demoOn || document.hidden) return;
      demoLog.style.opacity = "0";
      setTimeout(function () {
        if (!demoOn || document.hidden) { demoLog.style.opacity = ""; return; }
        demoIdx = (demoIdx + 1) % demoLines.length;
        demoLog.innerHTML = demoLines[demoIdx];
        demoLog.style.opacity = "";
      }, 260);
    }, 4500);
  }

  var FORCED = [".env", ".ssh", ".aws", ".gnupg", ".pem", ".key", "credentials", "id_rsa", "keychain"];

  function forcedHit(p) {
    var low = p.toLowerCase();
    for (var i = 0; i < FORCED.length; i++) {
      if (low.indexOf(FORCED[i]) !== -1) return FORCED[i];
    }
    return null;
  }

  // Lexically collapse a/b, .. and . against the Passwords mount.
  function insideMount(p) {
    var t = p.trim().replace(/\\/g, "/");
    if (/^[a-zA-Z]:/.test(t) || t.charAt(0) === "/" || t.charAt(0) === "~") return false;
    var segs = [];
    var parts = t.split("/");
    if (parts[0] !== "Passwords") return false;
    for (var i = 1; i < parts.length; i++) {
      var s = parts[i];
      if (!s || s === ".") continue;
      if (s === "..") { if (segs.length) segs.pop(); else return false; }
      else segs.push(s);
    }
    return true;
  }

  function fsVerdict(p) {
    if (!p.trim()) return { ok: null, html: "Type a path above — or tap a chip." };
    var hit = forcedHit(p);
    if (hit) return { ok: false, tag: "BLOCKED", types: "forced:" + hit, why: "sensitive pattern — denied even inside the mount" };
    if (/\.\.(?:\/|$)/.test(p.replace(/\\/g, "/")) && !insideMount(p)) {
      return { ok: false, tag: "BLOCKED", types: "traversal", why: "collapses outside the mount — default deny" };
    }
    if (insideMount(p)) return { ok: true, tag: "ALLOWED", types: "inside mount: Passwords", why: "canonical path stays within the workspace" };
    return { ok: false, tag: "BLOCKED", types: "outside mounts", why: "default deny — only Passwords is mounted" };
  }

  function cmdVerdict(raw) {
    var cmd = (raw || "").trim();
    if (!cmd) return { ok: null, html: "Type a command above — or tap a chip." };
    if (!demoOn) return { ok: true, tag: "ALLOWED", types: "protection off", why: "gates open while protection is off" };
    var low = cmd.toLowerCase();
    // File operands first — mirrors the real gate's containment check.
    var toks = cmd.split(/\s+/).slice(1).filter(function (t) {
      return t && t.charAt(0) !== "-" && (t.indexOf("/") !== -1 || t.charAt(0) === "~");
    });
    for (var i = 0; i < toks.length; i++) {
      var r = fsVerdict(toks[i].replace(/^["']|["']$/g, ""));
      if (r.ok === false) return { ok: false, tag: "BLOCKED", types: "fs_denied", why: toks[i] + " — " + r.why };
    }
    var net = null;
    if (/(^|\s)(ssh|scp|sftp|sshfs)( |$)/.test(low)) net = "cmd_ssh";
    else if (/(^|\s)(nc|ncat|telnet|nmap|socat)( |$)/.test(low)) net = "cmd_probe";
    else if (/(^|\s)(curl|wget|aria2c|ftp|rclone)( |$)/.test(low)) net = "cmd_transfer";
    else if (/\/dev\/tcp\//.test(low) || /python\d?\s+-[cC]\s+.*socket/.test(low)) net = "cmd_reverse_shell";
    if (forcedHit(cmd) && /(nc|curl|wget|scp|nc\b|\/dev\/tcp\/|base64)/.test(low)) net = "cmd_exfil";
    if (net) return { ok: false, tag: "BLOCKED", types: net, why: "network-capable command — blocked by default" };
    return { ok: true, tag: "ALLOWED", types: "local + inside mounts", why: "no network signal, files contained" };
  }

  function wirePlayground(formId, inputId, outId, fn, chipAttr) {
    var form = document.getElementById(formId);
    if (!form) return;
    var input = document.getElementById(inputId);
    var out = document.getElementById(outId);
    var render = function (v) {
      var r = fn(v);
      if (r.ok === null) { out.className = "verdict"; out.textContent = r.html; return; }
      out.className = "verdict " + (r.ok ? "allow" : "deny");
      // Restart the entrance animation even when the same verdict repeats
      // (re-setting an identical class list won't retrigger CSS alone).
      out.style.animation = "none";
      void out.offsetWidth;
      out.style.animation = "";
      out.innerHTML = "";
      var tag = document.createElement("span");
      tag.className = "tag"; tag.textContent = r.tag;
      out.appendChild(tag);
      out.appendChild(document.createTextNode(r.why + "  ·  " + r.types));
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); render(input.value); });
    var card = form.closest(".play-card");
    if (card) card.querySelectorAll("[" + chipAttr + "]").forEach(function (b) {
      b.addEventListener("click", function () {
        input.value = b.getAttribute(chipAttr);
        render(input.value);
        input.focus();
      });
    });
    render(input.value);
  }

  wirePlayground("cmdForm", "cmdInput", "cmdVerdict", cmdVerdict, "data-cmd");
  wirePlayground("pathForm", "pathInput", "pathVerdict", fsVerdict, "data-path");

  // Detect the visitor's OS for OS-aware download affordances.
  // Never throws — returns "mac", "win", or null.
  function detectOS() {
    try {
      var p = (navigator.platform || "").toLowerCase();
      var ua = (navigator.userAgent || "").toLowerCase();
      if (p.indexOf("mac") !== -1 || ua.indexOf("mac") !== -1) return "mac";
      if (p.indexOf("win") !== -1 || ua.indexOf("windows") !== -1) return "win";
    } catch (err) { /* never break the page for a nicety */ }
    return null;
  }

  // Highlight the download button matching the visitor's OS.
  // Links still work for both — this only adds a visual recommendation.
  var visitorOS = detectOS();
  if (visitorOS) {
    document.querySelectorAll('.btn-os[data-os="' + visitorOS + '"]').forEach(function (b) {
      b.classList.add("recommended");
    });
  }

  // Download guidance modal: every download click first shows the
  // OS-specific "how to open an unsigned beta build" steps. The modal's
  // own Download button carries the real file URL.
  var dlModal = document.getElementById("dlModal");
  var dlTitle = document.getElementById("dlModalTitle");
  var dlGo = document.getElementById("dlModalGo");
  var dlStepsMac = document.getElementById("dlStepsMac");
  var dlStepsWin = document.getElementById("dlStepsWin");
  var dlLastFocus = null;

  function dlFocusable() {
    if (!dlModal) return [];
    var els = dlModal.querySelectorAll("a[href], button:not([disabled])");
    return Array.prototype.filter.call(els, function (el) {
      return el.offsetParent !== null;
    });
  }

  function openDlModal(os, href) {
    if (!dlModal) return;
    dlLastFocus = document.activeElement;
    var isMac = os !== "win";
    if (dlTitle) dlTitle.textContent = isMac ? "How to open Auren on Mac" : "How to open Auren on Windows";
    if (dlStepsMac) dlStepsMac.hidden = !isMac;
    if (dlStepsWin) dlStepsWin.hidden = isMac;
    if (dlGo) dlGo.setAttribute("href", href);
    dlModal.hidden = false;
    document.body.style.overflow = "hidden";
    var focusables = dlFocusable();
    if (focusables.length) focusables[0].focus();
  }

  function closeDlModal() {
    if (!dlModal || dlModal.hidden) return;
    dlModal.hidden = true;
    document.body.style.overflow = "";
    if (dlLastFocus && dlLastFocus.focus) dlLastFocus.focus();
  }

  if (dlModal) {
    document.querySelectorAll("a[data-dl]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openDlModal(link.getAttribute("data-dl"), link.getAttribute("href"));
      });
    });
    // Nav-pill Download buttons (desktop + mobile) are plain "#download"
    // anchors — a near-invisible jump when already at the top, so they feel
    // dead. Open the same OS-aware guidance modal instead, resolving the
    // real file URL from the matching hero button so links stay in sync.
    // Without JS the href still falls back to the download options.
    document.querySelectorAll("a[data-dl-nav]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var os = detectOS() || "mac";
        var src = document.querySelector('.btn-os[data-os="' + os + '"]');
        openDlModal(os, src ? src.getAttribute("href") : link.getAttribute("href"));
      });
    });
    dlModal.querySelectorAll("[data-dl-close]").forEach(function (el) {
      el.addEventListener("click", closeDlModal);
    });
    if (dlGo) dlGo.addEventListener("click", closeDlModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDlModal();
      // Keep keyboard focus inside the open dialog.
      if (e.key === "Tab" && !dlModal.hidden) {
        var focusables = dlFocusable();
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  // Exposed for smoke tests — harmless in production.
  try { window.__aurenDemo = { fsVerdict: fsVerdict, cmdVerdict: cmdVerdict }; } catch (err) {}
})();
