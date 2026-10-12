/* AM Interiors — Visite 3D à hauteur d'œil.
   Regarder : glisser (souris ou doigt). Se déplacer : ZQSD / WASD / flèches,
   boutons à l'écran, ou toucher le sol pour s'y rendre. Murs et mobilier bloquent le passage. */
import * as THREE from "./vendor/three.module.min.js";
import { MODELS, getModel, createRenderer, buildScene } from "./models-3d.js";

const root = document.querySelector("[data-visit]");
if (root) start(root);

function start(root) {
  const list = root.querySelector("[data-visit-list]");
  const viewer = root.querySelector("[data-visit-viewer]");

  // Liste des créations visitables
  list.innerHTML = MODELS.map((m) => `
    <article class="visit-card">
      <img src="${m.cover}" alt="" loading="lazy" />
      <div class="visit-card-body">
        <p class="project-tag">${m.place}</p>
        <h3 class="project-title">${m.title}</h3>
        <p class="project-meta">${m.text}</p>
        <p class="visit-card-actions">
          <a class="btn btn-primary" href="?m=${m.id}#visite" data-open="${m.id}">Entrer dans la visite</a>
          <a class="btn btn-ghost" href="${m.project}">Voir le projet</a>
        </p>
      </div>
    </article>`).join("") + `
    <article class="visit-card visit-card--soon">
      <div class="visit-card-body">
        <p class="project-tag">Bientôt</p>
        <h3 class="project-title">D'autres créations à visiter</h3>
        <p class="project-meta">Les prochains projets d'Alon seront ajoutés ici, à parcourir pièce par pièce.</p>
      </div>
    </article>`;

  let session = null;
  const open = (id) => {
    if (session) session.dispose();
    viewer.hidden = false;
    viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    session = openViewer(viewer, getModel(id));
  };
  list.addEventListener("click", (e) => {
    const a = e.target.closest("[data-open]");
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, "", `?m=${a.dataset.open}#visite`);
    open(a.dataset.open);
  });
  viewer.querySelector("[data-visit-close]").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    if (session) session.dispose();
    session = null;
    viewer.hidden = true;
    history.replaceState(null, "", location.pathname);
    list.scrollIntoView({ behavior: "smooth" });
  });
  const id = new URLSearchParams(location.search).get("m");
  if (id) open(id);
}

function openViewer(viewer, model) {
  const stage = viewer.querySelector("[data-visit-stage]");
  const title = viewer.querySelector("[data-visit-title]");
  const loading = viewer.querySelector("[data-visit-loading]");
  const help = viewer.querySelector("[data-visit-help]");
  title.textContent = model.title;
  loading.hidden = false;
  loading.textContent = "Chargement du modèle…";

  const canvas = document.createElement("canvas");
  canvas.className = "visit-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", `Visite 3D : ${model.title}. Glissez pour regarder, flèches ou ZQSD pour avancer.`);
  stage.prepend(canvas);

  let renderer;
  try { renderer = createRenderer(canvas); }
  catch (err) { loading.textContent = "Votre navigateur ne permet pas l'affichage 3D (WebGL)."; return { dispose() { canvas.remove(); } }; }

  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 80);
  const pos = new THREE.Vector3(...model.spawn);
  const eye = model.spawn[1];
  const look = new THREE.Vector3(...model.lookAt).sub(pos);
  let yaw = Math.atan2(-look.x, -look.z);
  let pitch = Math.atan2(look.y, Math.hypot(look.x, look.z));
  const keys = new Set();
  const pad = { f: 0, s: 0 };
  let walkTo = null, world = null, raf = 0, alive = true, bob = 0, last = performance.now();
  const ray = new THREE.Raycaster();
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 40), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.8, depthWrite: false }));
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;

  buildScene(renderer, model, { background: "#d9d1c4" }).then((w) => {
    if (!alive) return;
    world = w;
    world.scene.add(marker);
    world.floor = [];
    world.root.traverse((o) => { if (o.isMesh && /floor/.test(o.name)) world.floor.push(o); });
    loading.hidden = true;
    help.hidden = false;
    canvas.focus({ preventScroll: true });
    resize();
    loop();
  }).catch(() => { loading.textContent = "Impossible de charger ce modèle pour le moment."; });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 80 : 70;
    camera.updateProjectionMatrix();
  }

  /* ---- Regarder : glisser ---- */
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
    help.hidden = true;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const k = e.pointerType === "touch" ? 0.005 : 0.0038;
    yaw += (e.clientX - drag.x) * k;
    pitch = Math.max(-1.1, Math.min(1.1, pitch + (e.clientY - drag.y) * k));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
    drag = null;
    if (moved < 6 && world) tapToWalk(e);
  });

  function tapToWalk(e) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(world.floor, false)[0];
    if (!hit || hit.distance > 14) return;
    walkTo = hit.point.clone();
    marker.position.set(hit.point.x, hit.point.y + 0.01, hit.point.z);
    marker.visible = true;
  }

  /* ---- Se déplacer : clavier (position physique : ZQSD en AZERTY = WASD en QWERTY) ---- */
  const onKey = (down) => (e) => {
    if (!viewer.contains(document.activeElement) && document.activeElement !== document.body) return;
    const map = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r", ShiftLeft: "run", ShiftRight: "run" };
    const k = map[e.code];
    if (!k) return;
    e.preventDefault();
    down ? keys.add(k) : keys.delete(k);
    if (down) { walkTo = null; marker.visible = false; help.hidden = true; }
  };
  const kd = onKey(true), ku = onKey(false);
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);

  /* ---- Boutons tactiles ---- */
  viewer.querySelectorAll("[data-move]").forEach((b) => {
    const [axis, val] = b.dataset.move.split(":");
    const set = (v) => (e) => { e.preventDefault(); pad[axis] = v ? Number(val) : 0; walkTo = null; marker.visible = false; help.hidden = true; };
    b.onpointerdown = set(true);
    b.onpointerup = b.onpointerleave = b.onpointercancel = set(false);
  });
  viewer.querySelector("[data-visit-reset]").onclick = () => {
    pos.set(...model.spawn);
    const l = new THREE.Vector3(...model.lookAt).sub(pos);
    yaw = Math.atan2(-l.x, -l.z); pitch = Math.atan2(l.y, Math.hypot(l.x, l.z));
    walkTo = null; marker.visible = false;
  };
  const fsBtn = viewer.querySelector("[data-visit-fullscreen]");
  fsBtn.onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else viewer.requestFullscreen?.().catch(() => {});
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  /* ---- Collisions ---- */
  const R = 0.3;
  function blocked(x, z) {
    const b = world.bounds;
    if (x < b.min.x + R || x > b.max.x - R || z < b.min.z + R || z > b.max.z - 0.2) return true;
    return world.colliders.some((c) => x > c.min.x - R && x < c.max.x + R && z > c.min.z - R && z < c.max.z + R);
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    let f = (keys.has("f") ? 1 : 0) - (keys.has("b") ? 1 : 0) + pad.f;
    let s = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0) + pad.s;
    if (pad.s && !keys.size) { yaw -= pad.s * dt * 1.4; s = 0; } // boutons ◀ ▶ : tourner sur place
    const speed = keys.has("run") ? 3.2 : 1.7;
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();

    if (walkTo) {
      const d = new THREE.Vector3(walkTo.x - pos.x, 0, walkTo.z - pos.z);
      if (d.length() < 0.08) { walkTo = null; marker.visible = false; }
      else {
        move.copy(d.normalize()).multiplyScalar(speed * dt);
        const targetYaw = Math.atan2(-d.x, -d.z);
        let dy = targetYaw - yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        yaw += dy * Math.min(1, dt * 3);
      }
    } else if (f || s) {
      move.addScaledVector(fwd, f).addScaledVector(right, s);
      if (move.lengthSq() > 1) move.normalize();
      move.multiplyScalar(speed * dt);
    }
    if (move.lengthSq()) {
      const nx = pos.x + move.x, nz = pos.z + move.z;
      let moved = false;
      if (!blocked(nx, pos.z)) { pos.x = nx; moved = true; }
      if (!blocked(pos.x, nz)) { pos.z = nz; moved = true; }
      if (!moved && walkTo) { walkTo = null; marker.visible = false; }
      bob += dt * 9;
    }
    marker.material.opacity = 0.55 + Math.sin(now * 0.008) * 0.25;

    camera.position.set(pos.x, eye + Math.sin(bob) * 0.012, pos.z);
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    renderer.render(world.scene, camera);
  }

  return {
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      renderer.dispose();
      canvas.remove();
      help.hidden = true;
    },
  };
}
