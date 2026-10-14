// Prépare un export SimLab pour le web : recadrage, portes isolées (nom « DOOR_… »), noms des autres
// objets effacés pour que « optimize --join » puisse les fusionner par matière.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
const [,, inp, out, cropJson] = process.argv;
const crop = cropJson ? JSON.parse(cropJson) : null;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const DOOR = /porte|door|puerta|porta|t[üu]r|charni|hinge|poign|handle|deur/i;
const dec = (n) => { try { return decodeURIComponent(n.replace(/=_UTF-8_Q_|_=$/g, '').replace(/=([0-9A-F]{2})/g, '%$1')); } catch { return n; } };
const parentOf = new Map();
for (const n of doc.getRoot().listNodes()) for (const c of n.listChildren()) parentOf.set(c, n);
const named = (n) => { for (let o = n; o; o = parentOf.get(o)) if (DOOR.test(dec(o.getName() || ''))) return true; return false; };
let removed = 0, doors = 0;
for (const n of doc.getRoot().listNodes()) {
  if (!n.getMesh()) continue;
  const b = getBounds(n);
  const s = [b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]];
  const c = [(b.max[0]+b.min[0])/2, (b.max[2]+b.min[2])/2];
  if (crop && (c[0] < crop.min[0] || c[0] > crop.max[0] || c[1] < crop.min[1] || c[1] > crop.max[1])) { n.setMesh(null); removed++; continue; }
  const thin = Math.min(s[0], s[2]), wide = Math.max(s[0], s[2]);
  const shape = thin < 0.12 && wide > 0.55 && wide < 1.3 && s[1] > 1.7 && s[1] < 2.6;
  if (named(n) || shape) { n.setName('DOOR_' + doors++); }
}
for (const n of doc.getRoot().listNodes()) if (!/^DOOR_/.test(n.getName() || '')) n.setName('');
for (const m of doc.getRoot().listMeshes()) m.setName('');
await doc.transform(prune());
await io.write(out, doc);
console.log('removed', removed, 'doors', doors);
