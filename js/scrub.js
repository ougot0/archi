/* AM Interiors — Ouverture de l'accueil : le plan se dessine avec le défilement.
   Aucune lecture automatique : la position de scroll est la seule chose qui fait avancer
   l'image (image 0 = état d'arrivée). Le texte suit par « temps », un seul à la fois.
   - Grand écran : une vidéo horizontale (media/blueprint.mp4) dont on déplace la tête de lecture.
   - Téléphone : une suite d'images verticales (media/m/) dessinée dans un canvas — fiable sur
     iPhone, où les sauts dans une vidéo sont souvent ignorés, et cadrée pour l'écran en hauteur. */
(function () {
  "use strict";

  var track = document.querySelector("[data-scrub]");
  if (!track) return;
  var sticky = track.querySelector(".scrub-sticky");
  var video = track.querySelector("[data-scrub-video]");
  var beats = [].slice.call(track.querySelectorAll("[data-beat]"));
  var rail = document.querySelector("[data-scrub-rail]");
  var fill = document.querySelector("[data-scrub-fill]");
  var label = document.querySelector("[data-scrub-label]");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width: 767px), (orientation: portrait) and (pointer: coarse)").matches;

  // Fenêtres de progression de chaque temps (accueil, puis 01 → 04).
  var WINDOWS = [[0, 0.06], [0.06, 0.28], [0.30, 0.52], [0.54, 0.76], [0.78, 1.01]];

  var progress = 0, raf = 0, active = -1;
  var source = mobile ? frames() : movie();

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function measure() {
    var r = track.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    progress = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    source.setTarget(progress);
    if (fill) fill.style.height = (progress * 100).toFixed(2) + "%";
    var inside = r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
    if (rail) rail.classList.toggle("is-on", inside);
    document.body.classList.toggle("in-scrub", r.bottom > window.innerHeight * 0.6);
    setBeat();
  }

  function setBeat() {
    var idx = -1;
    for (var i = 0; i < WINDOWS.length; i++) {
      if (progress >= WINDOWS[i][0] && progress < WINDOWS[i][1]) { idx = i; break; }
    }
    if (idx === active) return;
    active = idx;
    beats.forEach(function (b, i) { b.classList.toggle("is-active", i === idx); });
    if (label && idx >= 0) label.textContent = beats[idx].getAttribute("data-beat");
  }

  // Amortissement commun : l'image rattrape le scroll en douceur, comme une main qui dessine.
  function loop() {
    raf = 0;
    if (source.step(reduced ? 1 : 0.1)) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  /* ---------- Grand écran : vidéo ---------- */
  function movie() {
    var target = 0, current = 0, ready = false;
    if (video && !video.getAttribute("src")) video.src = video.getAttribute("data-src");
    function seek(t) { try { video.currentTime = t; } catch (e) { /* refus avant chargement */ } }
    function onMeta() {
      if (!isFinite(video.duration) || !video.duration) return;
      ready = true;
      target = progress * video.duration;
      current = target;
      seek(current);
    }
    if (video) {
      if (video.readyState >= 1) onMeta();
      video.addEventListener("loadedmetadata", onMeta);
      video.addEventListener("loadeddata", kick);
      video.addEventListener("canplay", kick);
    }
    return {
      setTarget: function (p) { if (ready) target = p * video.duration; },
      step: function (k) {
        if (!ready || video.readyState < 2) return false; // reprise à « loadeddata »
        current += (target - current) * k;
        if (Math.abs(target - current) > 0.01) { seek(current); return true; }
        current = target; seek(current); return false;
      }
    };
  }

  /* ---------- Téléphone : suite d'images dans un canvas ---------- */
  function frames() {
    var N = 120, imgs = new Array(N), target = 0, current = 0, drawn = -1;
    if (video) video.remove();
    var canvas = document.createElement("canvas");
    canvas.className = "scrub-video";
    canvas.setAttribute("aria-hidden", "true");
    sticky.insertBefore(canvas, sticky.firstChild);
    var ctx = canvas.getContext("2d");

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(sticky.clientWidth * dpr);
      canvas.height = Math.round(sticky.clientHeight * dpr);
      drawn = -1;
      draw();
    }
    function url(i) { return "media/m/f" + ("000" + i).slice(-3) + ".jpg"; }
    function load(i) {
      var im = new Image();
      im.decoding = "async";
      im.onload = function () { imgs[i] = im; if (drawn !== Math.round(current)) draw(); };
      im.src = url(i);
    }
    // Image d'arrivée d'abord, puis une image sur 8, sur 4…, puis le reste.
    var order = [0], seen = { 0: true };
    for (var s = 8; s >= 1; s = s / 2) for (var i = 0; i < N; i += s) if (!seen[i]) { seen[i] = true; order.push(i); }
    var q = 0;
    (function next() {
      for (var k = 0; k < 6 && q < order.length; k++) load(order[q++]);
      if (q < order.length) setTimeout(next, 100);
    })();

    function nearest(i) {
      for (var d = 0; d < N; d++) {
        if (imgs[i - d]) return imgs[i - d];
        if (imgs[i + d]) return imgs[i + d];
      }
      return null;
    }
    function draw() {
      var i = clamp(Math.round(current), 0, N - 1);
      if (i === drawn) return;
      var im = imgs[i] || nearest(i);
      if (!im) return;
      drawn = imgs[i] ? i : -1;
      var cw = canvas.width, ch = canvas.height, sc = Math.max(cw / im.width, ch / im.height);
      var w = im.width * sc, h = im.height * sc;
      ctx.fillStyle = "#0c0f13";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(im, (cw - w) / 2, 0, w, h); // calé en haut : le texte occupe le bas
    }
    window.addEventListener("resize", size);
    size();
    return {
      setTarget: function (p) { target = p * (N - 1); },
      step: function (k) {
        current += (target - current) * k;
        if (Math.abs(target - current) > 0.05) { draw(); return true; }
        current = target; draw(); return false;
      }
    };
  }

  window.addEventListener("scroll", function () { measure(); kick(); }, { passive: true });
  window.addEventListener("resize", function () { measure(); kick(); });
  measure();
  kick();
})();
