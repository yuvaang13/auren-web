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

  // Scroll progress bar (rAF-throttled)
  var progress = document.getElementById("scrollProgress");
  if (progress) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
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
        ? "ON — everything unreachable except what you allow"
        : "OFF — everything reachable as usual";
      if (statusWrap) statusWrap.classList.toggle("off", !demoOn);
      if (demoLog) demoLog.innerHTML = demoOn
        ? "Agent command blocked <span>(cmd_ssh)</span> · file outside mounts denied <span>(fs_denied)</span>"
        : "Protection off — gates open, agent traffic flowing";
    });
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

  // Highlight the download button matching the visitor's OS.
  // Links still work for both — this only adds a visual recommendation.
  try {
    var p = (navigator.platform || "").toLowerCase();
    var ua = (navigator.userAgent || "").toLowerCase();
    var os = null;
    if (p.indexOf("mac") !== -1 || ua.indexOf("mac") !== -1) os = "mac";
    else if (p.indexOf("win") !== -1 || ua.indexOf("windows") !== -1) os = "win";
    if (os) {
      document.querySelectorAll('.btn-os[data-os="' + os + '"]').forEach(function (b) {
        b.classList.add("recommended");
      });
    }
  } catch (err) { /* never break the page for a nicety */ }

  // Exposed for smoke tests — harmless in production.
  try { window.__aurenDemo = { fsVerdict: fsVerdict, cmdVerdict: cmdVerdict }; } catch (err) {}
})();
