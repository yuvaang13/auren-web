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
})();
