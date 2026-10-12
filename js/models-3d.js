/* AM Interiors — Catalogue des modèles 3D et mise en scène commune
   (hero de l'accueil + visite 3D). Pour ajouter une création :
   1. déposer le fichier .glb dans /models
   2. ajouter une entrée dans MODELS ci-dessous (spawn = point de départ de la visite). */
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export const MODELS = [
  {
    id: "matzav-zor",
    title: "Matzav Zor — l'accueil",
    place: "Restaurant immersif · Nanterre",
    text: "Comptoir en marbre clair, verrière à résille métallique noire et éclairage indirect : entrez dans l'accueil du restaurant.",
    src: "models/matzav-zor-accueil.glb",
    cover: "images/matzav-3d-2.jpg",
    project: "projet-matzav-zor.html",
    upAxis: "y",                      // "z" si le fichier est exporté avec Z vertical
    flipV: true,                      // textures à l'envers à l'export : on les retourne
    // Façade du comptoir : marbre propre (l'image du fichier, étirée, contenait déjà le texte
    // du logo en double) ; le logo net du modèle reste posé par-dessus.
    cleanMarble: ["facade_marbre_comptoir"],
    spawn: [0.4, 1.62, 2.35],         // point de départ de la visite (x, hauteur des yeux, z)
    lookAt: [0, 1.25, -1.5],
    hero: { target: [-0.1, 1.35, -1.2], radius: 8.4, azimuth: 0.28, elevation: 0.1 },
  },
];

export function getModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0];
}

/* ---------- Rendu ---------- */
export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

/* ---------- Chargement + habillage ---------- */
export async function buildScene(renderer, model, { background = "#2a2119" } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(background, 14, 40);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const gltf = await new GLTFLoader().parseAsync(await loadBytes(model.src), "");
  const root = gltf.scene;
  if (model.upAxis === "z") root.rotation.x = -Math.PI / 2;
  scene.add(root);
  root.updateMatrixWorld(true);

  const tex = textures();
  const lights = [];

  // Verrière : le modèle n'a que les montants ; on pose une vitre entre eux.
  addGlass(root);

  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const n = o.name || "";
    const clean = (model.cleanMarble || []).includes(n);
    if (o.material && o.material.map && !clean) {
      // Matière texturée fournie par le modèle (marbre, sol, logos…) : on la garde.
      // Le fichier ne fournit pas de normales : on les calcule pour que la lumière s'y pose.
      if (!o.geometry.getAttribute("normal")) o.geometry.computeVertexNormals();
      if (model.flipV) flipV(o.geometry);
      o.material = texturedMaterial(o);
    } else {
      // Faces nettes + coordonnées UV en mètres (projection par face), pour poser des matières.
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      g.computeVertexNormals();
      boxUV(g);
      o.geometry = g;
      o.material = clean
        ? new THREE.MeshStandardMaterial({ map: tex.marble, color: "#f4efe9", roughness: 0.22, envMapIntensity: 0.9 })
        : materialFor(o, tex);
    }
    if (GLASS.test(n)) { o.castShadow = false; o.renderOrder = 2; }
    if (LIGHT.test(n) || /logo|texture/.test(n)) o.castShadow = false;
  });

  // Lumières d'ambiance : sources réelles le long des bandeaux lumineux du modèle.
  root.traverse((o) => {
    if (!o.isMesh || !LIGHT.test(o.name)) return;
    const box = new THREE.Box3().setFromObject(o);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const n = Math.max(1, Math.round(Math.max(size.x, size.z) / 1.6));
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const p = new THREE.PointLight("#ffc98a", 0, 4.5, 2);
      p.position.set(
        size.x > size.z ? box.min.x + 0.3 + t * (size.x - 0.6) : c.x,
        UNDER.test(o.name) ? c.y + 0.05 : c.y - 0.15,
        size.z >= size.x ? box.min.z + 0.3 + t * (size.z - 0.6) : c.z + 0.25
      );
      p.userData.base = UNDER.test(o.name) ? 0.9 : 2.4;
      scene.add(p);
      lights.push(p);
    }
  });

  // Extérieur sobre derrière la verrière : trottoir, quelques arbres.
  const bounds = new THREE.Box3().setFromObject(root);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: "#8d867c", roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = bounds.min.y - 0.01;
  ground.receiveShadow = true;
  scene.add(ground);
  const leaf = new THREE.MeshStandardMaterial({ color: "#56603f", roughness: 0.85 });
  const bark = new THREE.MeshStandardMaterial({ color: "#4a3a2c", roughness: 0.9 });
  [[-8, -3], [-9.5, 2], [-8.2, 6.5]].forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 10), bark);
    trunk.position.set(x, 1.3, z);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), leaf);
    crown.position.set(x, 3.3, z);
    crown.scale.set(1, 1.2, 1);
    [trunk, crown].forEach((m) => { m.castShadow = true; scene.add(m); });
  });

  const hemi = new THREE.HemisphereLight("#fff4e4", "#5a4632", 0);
  const sun = new THREE.DirectionalLight("#ffe2bd", 0);
  sun.position.set(-12, 9, 6);
  sun.target.position.set(0.5, 0, -1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  const LEVELS = { hemi: 0.55, sun: 2.6 };
  function setIntensity(k) {
    hemi.intensity = LEVELS.hemi * k;
    sun.intensity = LEVELS.sun * k;
    lights.forEach((l) => (l.intensity = l.userData.base * k));
  }
  setIntensity(1);

  return { scene, root, bounds, colliders: colliders(root), setIntensity };
}

/* Le fichier est lu d'un bloc puis décodé : aucune requête secondaire.
   Un modèle peut aussi être fourni encodé en base64 (« .glb.txt ») pour les
   hébergeurs qui ne servent pas le type .glb. */
async function loadBytes(src) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src} : ${res.status}`);
  if (!/\.txt$/.test(src)) return res.arrayBuffer();
  const bin = atob((await res.text()).trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/* ---------- Matières ----------
   Les noms d'éléments sont reconnus en anglais ou en français. */
const LIGHT = /light|led/i;
const UNDER = /under|sous/i;
const GLASS = /glazing_plane|vitre/i;
const DARK_METAL = /trim|frame|mullion|diagonal|seam|montant|traverse|contreventement|cadre|ornement|plinthe|pied_/i;

function texturedMaterial(mesh) {
  const src = mesh.material, n = mesh.name || "";
  const isLogo = /logo/i.test(n);
  const m = new THREE.MeshStandardMaterial({
    map: src.map,
    color: isLogo ? "#151413" : "#ffffff",
    roughness: /marbre|marble/i.test(n) ? 0.25 : /sol|floor/i.test(n) ? 0.6 : 0.9,
    transparent: isLogo,
    alphaTest: isLogo ? 0.35 : 0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.7,
  });
  m.map = src.map.clone();
  m.map.colorSpace = THREE.SRGBColorSpace;
  m.map.anisotropy = 8;
  fitTexture(mesh.geometry, m.map, "cover");
  return m;
}

/* Respecte les proportions de l'image sur la surface (sinon le fichier l'étire) :
   « cover » recadre au centre, « contain » montre l'image entière (logos transparents). */
function fitTexture(g, map, mode) {
  const p = g.getAttribute("position"), uv = g.getAttribute("uv"), img = map.image;
  if (!p || !uv || !img || !img.width) return;
  const find = (u, v) => {
    for (let i = 0; i < uv.count; i++) if (Math.abs(uv.getX(i) - u) < 1e-3 && Math.abs(uv.getY(i) - v) < 1e-3) return i;
    return -1;
  };
  const a = find(0, 0), b = find(1, 0), c = find(0, 1);
  if (a < 0 || b < 0 || c < 0) return;
  const P = (i) => new THREE.Vector3().fromBufferAttribute(p, i);
  const surf = P(a).distanceTo(P(b)) / P(a).distanceTo(P(c));
  const pic = img.width / img.height;
  if (!isFinite(surf) || Math.abs(surf / pic - 1) < 0.03) return;
  const r = surf / pic; // > 1 : surface plus allongée que l'image
  if (mode === "cover") {
    if (r > 1) map.repeat.set(1, 1 / r); else map.repeat.set(r, 1);
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    if (r > 1) map.repeat.set(r, 1); else map.repeat.set(1, 1 / r);
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  }
  map.offset.set((1 - map.repeat.x) / 2, (1 - map.repeat.y) / 2);
  map.needsUpdate = true;
}

/* Certains exports (trimesh) placent l'origine des UV en bas : on retourne V. */
const flipped = new WeakSet(); // un même jeu d'UV peut être partagé par plusieurs éléments
function flipV(g) {
  const uv = g.getAttribute("uv");
  if (!uv || flipped.has(uv)) return;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  uv.needsUpdate = true;
  flipped.add(uv);
}

function addGlass(root) {
  const box = new THREE.Box3();
  root.traverse((o) => { if (o.isMesh && /vitrage/i.test(o.name)) box.expandByObject(o); });
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const glass = new THREE.Mesh(
    size.x < size.z ? new THREE.BoxGeometry(0.02, size.y, size.z) : new THREE.BoxGeometry(size.x, size.y, 0.02),
    new THREE.MeshStandardMaterial()
  );
  glass.name = "vitre";
  glass.position.copy(root.worldToLocal(c.clone()));
  root.add(glass);
  root.updateMatrixWorld(true);
}

function materialFor(mesh, tex) {
  const n = mesh.name || "";
  const vc = mesh.geometry.getAttribute("color");
  const base = new THREE.Color(1, 1, 1);
  if (vc) base.setRGB(vc.getX(0), vc.getY(0), vc.getZ(0), THREE.SRGBColorSpace);

  if (GLASS.test(n)) {
    return new THREE.MeshPhysicalMaterial({
      color: "#a9c2c6", transparent: true, opacity: 0.16, roughness: 0.05,
      metalness: 0, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.2,
    });
  }
  if (LIGHT.test(n)) {
    return new THREE.MeshStandardMaterial({ color: "#ffe2b8", emissive: "#ffc27a", emissiveIntensity: 3 });
  }
  if (/ecran/i.test(n)) {
    return new THREE.MeshStandardMaterial({ color: "#1d1f22", roughness: 0.25, metalness: 0.3 });
  }
  if (/marble|reception_marble/.test(n)) {
    return new THREE.MeshStandardMaterial({ map: tex.marble, color: base.clone().lerp(new THREE.Color("#ffffff"), 0.35), roughness: 0.22, envMapIntensity: 0.9 });
  }
  if (n === "floor") {
    return new THREE.MeshStandardMaterial({ map: tex.concrete, color: "#d9cfc2", roughness: 0.55, envMapIntensity: 0.6 });
  }
  if (n === "ceiling") {
    return new THREE.MeshStandardMaterial({ color: "#d8d0c6", roughness: 0.95 });
  }
  if (DARK_METAL.test(n)) {
    return new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.4, metalness: 0.6 });
  }
  return new THREE.MeshStandardMaterial({ color: base, roughness: 0.6 });
}

function textures() {
  return { marble: canvasTex(marble, 1.6), concrete: canvasTex(concrete, 2.5) };
}
function canvasTex(draw, metersPerTile) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  draw(c.getContext("2d"), 1024);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / metersPerTile, 1 / metersPerTile);
  t.anisotropy = 8;
  return t;
}
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
function marble(g, s) {
  const r = rng(11);
  g.fillStyle = "#f1ece6"; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 26; i++) {
    let x = r() * s, y = r() * s;
    const w = 0.6 + r() * 2.2;
    g.strokeStyle = `rgba(${110 + r() * 40},${105 + r() * 35},${100 + r() * 30},${0.12 + r() * 0.35})`;
    g.lineWidth = w;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (r() - 0.35) * 120; y += (r() - 0.5) * 90; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 0.06;
  for (let i = 0; i < 4000; i++) { g.fillStyle = r() > 0.5 ? "#ffffff" : "#b9b0a6"; g.fillRect(r() * s, r() * s, 2, 2); }
  g.globalAlpha = 1;
}
function concrete(g, s) {
  const r = rng(5);
  g.fillStyle = "#cfc6ba"; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const rad = 10 + r() * 60;
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, rad);
    const v = 175 + r() * 50;
    grd.addColorStop(0, `rgba(${v},${v - 6},${v - 14},0.10)`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.save(); g.translate(r() * s, r() * s); g.fillStyle = grd; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore();
  }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(80,70,60,${r() * 0.12})`; g.fillRect(r() * s, r() * s, 1.5, 1.5); }
}

/* UV en mètres, projetés sur l'axe dominant de chaque face (géométrie non indexée). */
function boxUV(g) {
  const p = g.getAttribute("position"), n = g.getAttribute("normal");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = p.getY(i); v = p.getZ(i); }
    else if (ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/* Boîtes de collision (murs, comptoir…) en repère monde, pour la visite. */
function colliders(root) {
  const out = [];
  root.traverse((o) => {
    if (!o.isMesh || /floor|ceiling|light|trim|seam|sol|plafond|led|logo|joint|texture|plinthe/i.test(o.name)) return;
    const b = new THREE.Box3().setFromObject(o);
    if (b.max.y < 0.3 || b.min.y > 1.9) return; // hors de la hauteur du corps
    out.push(b);
  });
  return out;
}
