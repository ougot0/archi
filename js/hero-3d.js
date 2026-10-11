/* AM Studio — Scène 3D temps réel du hero (Three.js, sans build).
   Un séjour modélisé dans la charte : crème, noyer, bronze, beige.
   Repli : si WebGL est indisponible, l'image de fond du hero reste affichée. */
import * as THREE from "./vendor/three.module.min.js";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";

const hero = document.querySelector("[data-hero-3d]");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (hero) {
  try {
    init(hero);
  } catch (err) {
    // WebGL indisponible : on garde le visuel statique.
    console.warn("Scène 3D désactivée :", err);
  }
}

function init(hero) {
  /* ---------- Rendu ---------- */
  const canvas = document.createElement("canvas");
  canvas.className = "hero-3d-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#2a2119");
  scene.fog = new THREE.Fog("#2a2119", 11, 22);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);

  /* ---------- Matériaux (charte) ---------- */
  const mat = (color, roughness = 0.85, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
  const M = {
    wall: mat("#e8dfcf", 0.95),
    niche: mat("#c6ae94", 0.9),
    floor: new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.62 }),
    boucle: mat("#e3d8c6", 1),
    boucleDark: mat("#d2c3ab", 1),
    walnut: mat("#5a4632", 0.55),
    travertine: mat("#d6c2a4", 0.75),
    bronze: mat("#957250", 0.35, { metalness: 0.75 }),
    rug: mat("#b49a7c", 1),
    terracotta: mat("#a8664a", 0.85),
    leaf: mat("#56603f", 0.7, { side: THREE.DoubleSide }),
    ink: mat("#1c1712", 0.6),
    opal: new THREE.MeshStandardMaterial({ color: "#fff3e0", emissive: "#ffd49a", emissiveIntensity: 1.6, roughness: 0.4 }),
    sky: new THREE.MeshBasicMaterial({ color: "#fff1dc", fog: false }),
  };

  const room = new THREE.Group();
  scene.add(room);
  const add = (geo, material, x, y, z, parent = room) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  /* ---------- Architecture ---------- */
  const H = 3.3; // hauteur sous plafond
  const floor = add(new THREE.PlaneGeometry(14, 12), M.floor, 0.5, 0, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;

  // Mur du fond avec niche en arche
  const back = new THREE.Shape();
  back.moveTo(-5, 0); back.lineTo(6, 0); back.lineTo(6, H); back.lineTo(-5, H); back.closePath();
  const arch = new THREE.Path();
  const aX = 1.35, aW = 0.85, aBase = 0.55, aTop = 2.15;
  arch.moveTo(aX - aW, aBase); arch.lineTo(aX + aW, aBase); arch.lineTo(aX + aW, aTop);
  arch.absarc(aX, aTop, aW, 0, Math.PI, false); arch.lineTo(aX - aW, aBase);
  back.holes.push(arch);
  const backWall = add(new THREE.ExtrudeGeometry(back, { depth: 0.3, bevelEnabled: false }), M.wall, 0, 0, -3.3);
  backWall.castShadow = false;
  add(new THREE.PlaneGeometry(2 * aW + 0.2, 3), M.niche, aX, 1.5, -3.25).castShadow = false;
  // Tablette et objets dans la niche
  add(new THREE.BoxGeometry(2 * aW, 0.05, 0.3), M.walnut, aX, 1.2, -3.12);
  add(new THREE.CylinderGeometry(0.09, 0.13, 0.42, 32), M.terracotta, aX - 0.35, 1.435, -3.12);
  add(new THREE.SphereGeometry(0.13, 32, 16), M.travertine, aX + 0.3, 1.355, -3.12);
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 24), M.ink, aX + 0.02, 1.355, -3.14);

  // Mur gauche avec grande fenêtre (la lumière du soleil entre par là)
  const left = new THREE.Shape();
  left.moveTo(-6, 0); left.lineTo(4, 0); left.lineTo(4, H); left.lineTo(-6, H); left.closePath();
  const win = new THREE.Path();
  win.moveTo(-0.2, 0.35); win.lineTo(1.5, 0.35); win.lineTo(1.5, 2.75); win.lineTo(-0.2, 2.75); win.closePath();
  left.holes.push(win);
  const leftWall = add(new THREE.ExtrudeGeometry(left, { depth: 0.3, bevelEnabled: false }), M.wall, -4.2, 0, 0);
  leftWall.rotation.y = Math.PI / 2;
  // Menuiserie de la fenêtre (meneaux fins noirs) + ciel
  const winFrame = new THREE.Group();
  winFrame.position.set(-4.05, 0, 0);
  room.add(winFrame);
  add(new THREE.BoxGeometry(0.04, 2.4, 0.04), M.ink, 0, 1.55, -0.65, winFrame);
  add(new THREE.BoxGeometry(0.04, 0.04, 1.7), M.ink, 0, 1.75, -0.65, winFrame);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), M.sky);
  sky.position.set(-5.2, 1.6, -0.6);
  sky.rotation.y = Math.PI / 2;
  room.add(sky);
  // Plinthes
  add(new THREE.BoxGeometry(11, 0.08, 0.02), M.walnut, 0.5, 0.04, -2.99).castShadow = false;

  /* ---------- Mobilier ---------- */
  // Tapis
  const rug = add(new RoundedBoxGeometry(3.4, 0.02, 2.4, 2, 0.01), M.rug, 1.0, 0.01, -0.55);
  rug.castShadow = false;

  // Canapé bouclé
  const sofa = new THREE.Group();
  sofa.position.set(1.05, 0, -2.1);
  room.add(sofa);
  add(new RoundedBoxGeometry(2.7, 0.36, 0.98, 4, 0.12), M.boucleDark, 0, 0.24, 0, sofa);
  add(new RoundedBoxGeometry(2.7, 0.62, 0.28, 4, 0.13), M.boucle, 0, 0.62, -0.36, sofa);
  add(new RoundedBoxGeometry(1.28, 0.16, 0.78, 4, 0.07), M.boucle, -0.66, 0.5, 0.06, sofa);
  add(new RoundedBoxGeometry(1.28, 0.16, 0.78, 4, 0.07), M.boucle, 0.66, 0.5, 0.06, sofa);
  add(new RoundedBoxGeometry(0.42, 0.42, 0.14, 4, 0.06), M.terracotta, -0.95, 0.74, -0.14, sofa).rotation.z = 0.12;
  add(new RoundedBoxGeometry(0.4, 0.4, 0.14, 4, 0.06), M.travertine, 0.98, 0.73, -0.14, sofa).rotation.z = -0.1;
  [-1.2, 1.2].forEach((x) => add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), M.walnut, x, 0.04, 0.32, sofa));

  // Table basse en travertin + objets
  const table = new THREE.Group();
  table.position.set(1.0, 0, -0.45);
  room.add(table);
  add(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 64), M.travertine, 0, 0.36, 0, table);
  add(new THREE.CylinderGeometry(0.34, 0.4, 0.32, 48), M.travertine, 0, 0.16, 0, table);
  add(new THREE.SphereGeometry(0.16, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.bronze, 0.18, 0.56, 0.08, table);
  add(new THREE.BoxGeometry(0.34, 0.05, 0.26), M.ink, -0.2, 0.425, -0.05, table).rotation.y = 0.3;
  add(new THREE.BoxGeometry(0.3, 0.04, 0.22), M.niche, -0.2, 0.47, -0.05, table).rotation.y = 0.18;

  // Fauteuil en noyer
  const chair = new THREE.Group();
  chair.position.set(-1.45, 0, -0.35);
  chair.rotation.y = 0.75;
  room.add(chair);
  add(new RoundedBoxGeometry(0.82, 0.1, 0.8, 3, 0.04), M.walnut, 0, 0.32, 0, chair);
  add(new RoundedBoxGeometry(0.78, 0.16, 0.72, 4, 0.07), M.boucle, 0, 0.45, 0.02, chair);
  const chairBack = add(new RoundedBoxGeometry(0.78, 0.62, 0.14, 4, 0.06), M.boucle, 0, 0.78, -0.34, chair);
  chairBack.rotation.x = -0.18;
  [[-0.36, -0.34], [0.36, -0.34], [-0.36, 0.34], [0.36, 0.34]].forEach(([x, z]) =>
    add(new THREE.CylinderGeometry(0.025, 0.02, 0.3, 12), M.walnut, x, 0.14, z, chair));

  // Buffet en noyer + œuvre (rendu AM Studio en guise de tableau)
  const sideboard = new THREE.Group();
  sideboard.position.set(-1.9, 0, -2.75);
  room.add(sideboard);
  add(new THREE.BoxGeometry(1.9, 0.58, 0.44), M.walnut, 0, 0.42, 0, sideboard);
  for (let i = -3; i <= 3; i++) add(new THREE.BoxGeometry(0.012, 0.5, 0.01), M.ink, i * 0.25, 0.42, 0.225, sideboard);
  add(new THREE.CylinderGeometry(0.1, 0.07, 0.34, 24), M.travertine, 0.62, 0.88, 0, sideboard);
  const art = new THREE.Group();
  art.position.set(-1.9, 1.85, -2.98);
  room.add(art);
  add(new THREE.BoxGeometry(1.32, 0.98, 0.04), M.walnut, 0, 0, 0, art);
  const artMat = new THREE.MeshStandardMaterial({ color: "#8a7560", roughness: 0.8 });
  add(new THREE.PlaneGeometry(1.18, 0.84), artMat, 0, 0, 0.022, art).castShadow = false;
  new THREE.TextureLoader().load(hero.getAttribute("data-hero-art") || "images/zohar-card.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    artMat.map = tex;
    artMat.color.set("#ffffff");
    artMat.needsUpdate = true;
  });

  // Lampadaire globe (clin d'œil à la série Orba)
  const lamp = new THREE.Group();
  lamp.position.set(2.95, 0, -2.45);
  room.add(lamp);
  add(new THREE.CylinderGeometry(0.17, 0.19, 0.03, 40), M.bronze, 0, 0.015, 0, lamp);
  add(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 12), M.bronze, 0, 0.74, 0, lamp);
  const globe = add(new THREE.SphereGeometry(0.21, 40, 20), M.opal, 0, 1.6, 0, lamp);
  globe.castShadow = false;
  const lampLight = new THREE.PointLight("#ffc98a", 0, 7, 2);
  lampLight.position.set(0, 1.6, 0.05);
  lamp.add(lampLight);

  // Suspension au-dessus de la table
  add(new THREE.CylinderGeometry(0.004, 0.004, 1.1, 6), M.ink, 1.0, H - 0.55, -0.45).castShadow = false;
  const pendant = add(new THREE.SphereGeometry(0.17, 40, 20), M.opal, 1.0, H - 1.15, -0.45);
  pendant.scale.y = 0.72;
  pendant.castShadow = false;
  const pendantLight = new THREE.PointLight("#ffd29a", 0, 5, 2);
  pendantLight.position.set(1.0, H - 1.3, -0.45);
  room.add(pendantLight);

  // Plante en pot
  const plant = new THREE.Group();
  plant.position.set(-3.35, 0, -2.45);
  room.add(plant);
  add(new THREE.CylinderGeometry(0.26, 0.2, 0.5, 32), M.terracotta, 0, 0.25, 0, plant);
  add(new THREE.CylinderGeometry(0.015, 0.02, 1.0, 8), M.walnut, 0, 0.95, 0, plant);
  const leafGeo = new THREE.SphereGeometry(0.2, 16, 10);
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996, h = 0.85 + (i % 7) * 0.13;
    const leaf = add(leafGeo, M.leaf, Math.cos(a) * 0.32, h, Math.sin(a) * 0.32, plant);
    leaf.scale.set(1.25, 0.18, 0.55);
    leaf.rotation.set(0.3 * Math.sin(i), -a, 0.5);
  }

  /* ---------- Lumières ---------- */
  const hemi = new THREE.HemisphereLight("#fff4e4", "#6b5138", 0.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffd9ad", 0);
  sun.position.set(-9, 5.2, 0.4);
  sun.target.position.set(0.5, 0, -0.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 22;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#cfd8ff", 0);
  fill.position.set(6, 4, 8);
  scene.add(fill);

  const LIGHTS = { hemi: 0.75, sun: 3.2, fill: 0.35, lamp: 2.2, pendant: 1.4 };

  /* ---------- Caméra : orbite douce pilotée par le pointeur et le scroll ---------- */
  const target = new THREE.Vector3(0.35, 1.05, -1.1);
  const state = { az: 0.5, el: 0.2, r: 7.0 };
  const goal = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let scrollP = 0;
  let intro = prefersReduced ? 1 : 0;
  const t0 = performance.now();

  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Écran étroit : on élargit le champ et on décale la cible pour garder le salon lisible.
    const narrow = camera.aspect < 1;
    camera.fov = narrow ? 50 : 36;
    state.r = narrow ? 8.2 : 7.0;
    target.x = narrow ? 0.6 : 0.05;
    target.y = narrow ? 0.35 : 1.05;
    camera.updateProjectionMatrix();
  }

  function placeCamera(time) {
    const ease = 1 - Math.pow(1 - intro, 3);
    const sway = prefersReduced ? 0 : Math.sin(time * 0.00018) * 0.05;
    const az = state.az + cur.x * 0.24 + sway + (1 - ease) * 0.55;
    const el = state.el + cur.y * 0.08 + (1 - ease) * 0.25;
    const r = state.r - scrollP * 1.6 + (1 - ease) * 2.5;
    camera.position.set(
      target.x + r * Math.sin(az) * Math.cos(el),
      target.y + r * Math.sin(el),
      target.z + r * Math.cos(az) * Math.cos(el)
    );
    camera.lookAt(target.x, target.y + scrollP * 0.25, target.z);

    hemi.intensity = LIGHTS.hemi * ease;
    sun.intensity = LIGHTS.sun * ease;
    fill.intensity = LIGHTS.fill * ease;
    lampLight.intensity = LIGHTS.lamp * ease;
    pendantLight.intensity = LIGHTS.pendant * ease;
  }

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = hero.getBoundingClientRect();
    goal.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    goal.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener("pointerleave", () => { goal.x = 0; goal.y = 0; });

  function onScroll() {
    const h = hero.offsetHeight || 1;
    scrollP = Math.min(Math.max(window.scrollY / h, 0), 1);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Boucle (en pause hors écran / onglet masqué) ---------- */
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
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) kick(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  window.addEventListener("resize", () => { layout(); kick(); });

  layout();
  kick();
  // On révèle le canvas une fois la première image rendue.
  requestAnimationFrame(() => hero.classList.add("is-3d"));
}

/* Parquet en lames, dessiné à la volée (pas d'image à charger). */
function plankTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const g = c.getContext("2d");
  const rows = 8, rowH = c.height / rows;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 400;
    while (x < c.width) {
      const len = 300 + rnd() * 320;
      const l = 54 + rnd() * 8;
      g.fillStyle = `hsl(${30 + rnd() * 6}, ${32 + rnd() * 8}%, ${l}%)`;
      g.fillRect(x, r * rowH, len, rowH);
      g.strokeStyle = "rgba(60,40,22,0.10)";
      g.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const y = r * rowH + rnd() * rowH;
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + len * 0.3, y + 4, x + len * 0.6, y - 4, x + len, y); g.stroke();
      }
      g.fillStyle = "rgba(40,26,14,0.45)";
      g.fillRect(x, r * rowH, 2, rowH);
      x += len;
    }
    g.fillStyle = "rgba(40,26,14,0.5)";
    g.fillRect(0, r * rowH, c.width, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3.5, 3.5);
  tex.rotation = Math.PI / 2;
  tex.anisotropy = 8;
  return tex;
}
