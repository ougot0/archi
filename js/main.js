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
