/* AM Interiors — Hero de l'accueil : modèle 3D temps réel (accueil Matzav Zor).
   La caméra tourne doucement autour du modèle en suivant le curseur et avance au scroll.
   Repli : si WebGL ou le modèle est indisponible, l'image de fond du hero reste affichée. */
import * as THREE from "./vendor/three.module.min.js";
import { MODELS, createRenderer, buildScene } from "./models-3d.js";

const hero = document.querySelector("[data-hero-3d]");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (hero) {
  init(hero).catch((err) => console.warn("Scène 3D désactivée :", err));
}

async function init(hero) {
  const model = MODELS.find((m) => m.id === hero.getAttribute("data-hero-model")) || MODELS[0];

  const canvas = document.createElement("canvas");
  canvas.className = "hero-3d-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

  const renderer = createRenderer(canvas);
  const { scene, setIntensity } = await buildScene(renderer, model);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

  const h = model.hero;
  const target = new THREE.Vector3(...h.target);
  const state = { az: h.azimuth, el: h.elevation, r: h.radius };
  const goal = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let scrollP = 0;
  let intro = prefersReduced ? 1 : 0;
  const t0 = performance.now();

  function layout() {
    const w = hero.clientWidth, hh = hero.clientHeight;
    renderer.setSize(w, hh, false);
    camera.aspect = w / hh;
    const narrow = camera.aspect < 1;
    camera.fov = narrow ? 52 : 34;
    state.r = narrow ? h.radius + 2.5 : h.radius;
    target.y = narrow ? h.target[1] - 0.9 : h.target[1]; // écran étroit : on remonte le modèle dans le cadre
    camera.updateProjectionMatrix();
  }

  function placeCamera(time) {
    const ease = 1 - Math.pow(1 - intro, 3);
    const sway = prefersReduced ? 0 : Math.sin(time * 0.00016) * 0.06;
    const az = state.az + cur.x * 0.28 + sway + (1 - ease) * 0.6;
    const el = state.el + cur.y * 0.06 + (1 - ease) * 0.22;
    const r = state.r - scrollP * 2.2 + (1 - ease) * 3;
    camera.position.set(
      target.x + r * Math.sin(az) * Math.cos(el),
      Math.min(target.y + r * Math.sin(el), 3.2),
      target.z + r * Math.cos(az) * Math.cos(el)
    );
    camera.lookAt(target.x, target.y + scrollP * 0.2, target.z);
    setIntensity(ease);
  }

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = hero.getBoundingClientRect();
    goal.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    goal.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener("pointerleave", () => { goal.x = 0; goal.y = 0; });
  window.addEventListener("scroll", () => {
    scrollP = Math.min(Math.max(window.scrollY / (hero.offsetHeight || 1), 0), 1);
  }, { passive: true });

  let visible = true, raf = 0;
  function frame(time) {
    raf = 0;
    if (intro < 1) intro = Math.min((time - t0) / 2400, 1);
    cur.x += (goal.x - cur.x) * 0.05;
    cur.y += (goal.y - cur.y) * 0.05;
    placeCamera(time);
    renderer.render(scene, camera);
    if (!prefersReduced && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  window.addEventListener("resize", () => { layout(); kick(); });

  layout();
  kick();
  requestAnimationFrame(() => hero.classList.add("is-3d"));
}
