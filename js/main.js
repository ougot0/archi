/* Alon Marec — Architecture d'intérieur
   Interactions légères, sans dépendance. */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Année ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header : bordure au scroll ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Menu mobile ---- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Apparition au scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Compteurs animés ---- */
  var counters = document.querySelectorAll(".stat-num");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) { el.textContent = target + suffix; return; }
    var duration = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---- Filtres projets ---- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll("[data-category]");
  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        projectCards.forEach(function (card) {
          var show = cat === "all" || card.getAttribute("data-category") === cat;
          card.classList.toggle("hidden", !show);
        });
      });
    });
  }

  /* ---- Accordéon FAQ ---- */
  var faqQuestions = document.querySelectorAll(".faq-q");
  faqQuestions.forEach(function (q) {
    q.addEventListener("click", function () {
      var expanded = q.getAttribute("aria-expanded") === "true";
      var answer = document.getElementById(q.getAttribute("aria-controls"));
      q.setAttribute("aria-expanded", String(!expanded));
      if (answer) answer.style.maxHeight = expanded ? null : answer.scrollHeight + "px";
    });
  });

  /* ---- Formulaire de contact ---- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  function setError(field, on) {
    var w = field.closest(".field");
    if (w) w.classList.toggle("has-error", on);
  }
  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var required = form.querySelectorAll("[required]");
      var valid = true;
      required.forEach(function (f) {
        var empty = f.type === "checkbox" ? !f.checked : !f.value.trim();
        setError(f, empty);
        if (empty) valid = false;
      });
      var email = form.querySelector('input[type="email"]');
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        setError(email, true); valid = false;
      }
      if (!valid) {
        status.textContent = "Merci de compléter les champs obligatoires.";
        status.className = "form-status is-error";
        return;
      }
      status.textContent = "Merci ! Votre demande a bien été envoyée. Je vous réponds sous 48 h.";
      status.className = "form-status is-ok";
      form.reset();
    });
    form.addEventListener("input", function (e) {
      if (e.target.closest(".field")) setError(e.target, false);
    });
  }

  /* ---- Cartes en relief : inclinaison 3D qui suit le pointeur ---- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !prefersReduced) {
    var tiltEls = document.querySelectorAll(".project, .feature, .price-card, .step, .project-hero, .gallery-media, .about-photo");
    tiltEls.forEach(function (el) {
      el.classList.add("tilt");
      var max = el.classList.contains("project-hero") ? 4 : 9;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        el.classList.add("is-tilting");
        el.style.setProperty("--rx", ((0.5 - y) * max).toFixed(2) + "deg");
        el.style.setProperty("--ry", ((x - 0.5) * max * 1.3).toFixed(2) + "deg");
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        el.style.setProperty("--px", (x - 0.5).toFixed(3));
        el.style.setProperty("--py", (y - 0.5).toFixed(3));
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("is-tilting");
        ["--rx", "--ry", "--px", "--py"].forEach(function (k) { el.style.removeProperty(k); });
      });
    });
  }

  /* ---- Vue éclatée plan → matériaux → rendu, pilotée par le scroll ---- */
  var stage = document.querySelector("[data-depth-stage]");
  if (stage) {
    if (prefersReduced) {
      stage.style.setProperty("--p", "1");
    } else {
      var ticking = false;
      var updateDepth = function () {
        ticking = false;
        var r = stage.getBoundingClientRect();
        var vh = window.innerHeight || 1;
        var p = Math.min(Math.max((vh * 0.92 - r.top) / (vh * 0.65), 0), 1);
        stage.style.setProperty("--p", p.toFixed(3));
      };
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(updateDepth); }
      }, { passive: true });
      window.addEventListener("resize", updateDepth);
      updateDepth();
      if (finePointer) {
        stage.addEventListener("pointermove", function (e) {
          var r = stage.getBoundingClientRect();
          stage.style.setProperty("--rx", (((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(2) + "deg");
          stage.style.setProperty("--rz", (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2) + "deg");
        });
        stage.addEventListener("pointerleave", function () {
          stage.style.removeProperty("--rx");
          stage.style.removeProperty("--rz");
        });
      }
    }
  }

  /* ---- Bandeau cookies ---- */
  var banner = document.getElementById("cookie-banner");
  if (banner) {
    var KEY = "am_cookie_choice";
    var stored = null;
    try { stored = window.localStorage.getItem(KEY); } catch (e) {}
    if (!stored) banner.classList.add("is-visible");
    banner.addEventListener("click", function (e) {
      var choice = e.target.getAttribute && e.target.getAttribute("data-cookie");
      if (!choice) return;
      try { window.localStorage.setItem(KEY, choice); } catch (err) {}
      banner.classList.remove("is-visible");
    });
  }
})();
