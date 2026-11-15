/* AM Interiors — Ouverture de l'accueil : la vidéo du plan avance avec le défilement.
   Aucune lecture automatique : la position de scroll est la seule chose qui fait bouger
   la vidéo (image 0 = état d'arrivée). Le texte suit par « temps », un seul à la fois. */
(function () {
  "use strict";

  var track = document.querySelector("[data-scrub]");
  if (!track) return;
  var video = track.querySelector("[data-scrub-video]");
  var beats = [].slice.call(track.querySelectorAll("[data-beat]"));
  var rail = document.querySelector("[data-scrub-rail]");
  var fill = document.querySelector("[data-scrub-fill]");
  var label = document.querySelector("[data-scrub-label]");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fenêtres de progression de chaque temps (accueil, puis 01 → 04).
  var WINDOWS = [[0, 0.06], [0.06, 0.28], [0.30, 0.52], [0.54, 0.76], [0.78, 1.01]];

  var progress = 0, target = 0, current = 0, ready = false, raf = 0, active = -1;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function measure() {
    var r = track.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    progress = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    if (ready) target = progress * video.duration;
    if (fill) fill.style.height = (progress * 100).toFixed(2) + "%";
    if (rail) rail.classList.toggle("is-on", r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5);
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

  function seek(t) {
    try { video.currentTime = t; } catch (e) { /* iOS peut refuser avant le chargement */ }
  }

  function loop() {
    raf = 0;
    if (!ready) return;
    if (reduced) { current = target; seek(current); return; }
    // Amortissement : la vidéo rattrape le scroll en douceur, comme une main qui dessine.
    current += (target - current) * 0.1;
    if (video.readyState < 2) return; // pas encore d'image : on reprend à « loadeddata »
    if (Math.abs(target - current) > 0.01) {
      seek(current);
      raf = requestAnimationFrame(loop);
    } else {
      current = target;
      seek(current);
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  function onMeta() {
    if (!isFinite(video.duration) || !video.duration) return;
    ready = true;
    measure();
    current = target;
    seek(current);
  }

  if (video) {
    if (video.readyState >= 1) onMeta();
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("loadeddata", kick);
    video.addEventListener("canplay", kick);
  }

  window.addEventListener("scroll", function () { measure(); kick(); }, { passive: true });
  window.addEventListener("resize", function () { measure(); kick(); });
  measure();
})();
