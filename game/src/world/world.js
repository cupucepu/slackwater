// The harbor itself: renderer, scene, lights, ground, walls, water,
// docks and the core mesh. All art is procedural geometry and canvas
// textures — no external files. Exported for the game logic to use.
import * as THREE from 'three';
import { rnd, cl, COL } from '../core/util.js';

// ---- renderer / scene
export const R = new THREE.WebGLRenderer({ antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.setSize(innerWidth, innerHeight);
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 1.15;
document.body.prepend(R.domElement);
export const S = new THREE.Scene();
S.background = new THREE.Color(0x0e1a24);
S.fog = new THREE.Fog(0x0e1a24, 16, 70);
export const cam = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .05, 120);
S.add(cam);
S.add(new THREE.HemisphereLight(0x9fd8ff, 0x1a2a22, 1.4));
export const sun = new THREE.DirectionalLight(0xffd9a0, 2.6);
sun.position.set(20, 30, 10);
S.add(sun);

// A speckled canvas texture: base colour c1, n flecks of c2, tiled rep times.
export function tex(c1, c2, n, rep) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = c1; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < n; i++) {
    g.fillStyle = c2; g.globalAlpha = rnd() * .35;
    g.fillRect(rnd() * 128, rnd() * 128, rnd() * 14 + 2, rnd() * 14 + 2);
  }
  g.globalAlpha = .5; g.strokeStyle = '#0008'; g.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const wallMat = new THREE.MeshStandardMaterial({ map: tex('#6a7b84', '#2b343a', 160, 1), roughness: .85 });

// Ground height: a dredged basin channel down the middle (x near 0,
// z within ±26), smoothstepped to flat ground at the edges.
export const gh = (x, z) => {
  const a = cl((7 - Math.abs(x)) / 3, 0, 1), b = cl((26 - Math.abs(z)) / 4, 0, 1), t = Math.min(a, b);
  return -1.5 * t * t * (3 - 2 * t);
};

{ // displaced ground plane (80 x 80, 80 x 80 segments)
  const g = new THREE.PlaneGeometry(80, 80, 80, 80);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, gh(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  S.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex('#46544e', '#212b28', 220, 10), roughness: .95 })));
}

// Colliders: every box is both a mesh and a {x0,x1,z0,z1,h} entry in B.
export const B = [];
function box(x, z, w, d, h) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  m.position.set(x, h / 2, z);
  S.add(m);
  B.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}
box(0, -39, 80, 2, 6); box(0, 39, 80, 2, 6); box(-39, 0, 2, 80, 6); box(39, 0, 2, 80, 6);
[[-14, -10, 4, 2, 2.2], [14, 10, 4, 2, 2.2], [-16, 14, 2, 5, 2.2], [16, -14, 2, 5, 2.2],
 [-24, 0, 3, 3, 2.6], [24, 0, 3, 3, 2.6], [-12, -29, 6, 2, 2.4], [12, 29, 6, 2, 2.4],
 [0, -30, 2, 5, 2.2], [0, 30, 2, 5, 2.2], [-20, -22, 2, 2, 3], [20, 22, 2, 2, 3]
].forEach(b => box(...b));

// The tide: a translucent water plane over the basin channel.
// Its y is driven by the tide level every frame (see match/rounds.js).
export const water = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 52),
  new THREE.MeshStandardMaterial({ color: 0x2a8fb0, transparent: true, opacity: .72, roughness: .1, metalness: .2 }));
water.rotation.x = -Math.PI / 2;
S.add(water);

// Delivery rings: the two docks (HG south, SC north).
for (const z of [-33, 33]) {
  const r = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3, 40),
    new THREE.MeshBasicMaterial({ color: COL[z > 0 ? 1 : 0], side: 2 }));
  r.rotation.x = -Math.PI / 2;
  r.position.set(0, .05, z);
  S.add(r);
}

// The core: a glowing octahedron that bobs above the basin.
export const coreMesh = new THREE.Mesh(
  new THREE.OctahedronGeometry(.35),
  new THREE.MeshStandardMaterial({ color: 0x66ffe0, emissive: 0x33ddb0, emissiveIntensity: 1.5 }));
S.add(coreMesh);

// First-person gun viewmodel (a dark box, kicked back on each shot).
export const gun = new THREE.Mesh(
  new THREE.BoxGeometry(.08, .1, .5),
  new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: .5, metalness: .4 }));
cam.add(gun);
gun.position.set(.22, -.2, -.5);

// ---- harbor dressing (visuals; only the silos block movement) ----
// A collider without a box mesh, for round props (silos).
function addCollider(x, z, w, d, h) {
  B.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}

const woodMat = new THREE.MeshStandardMaterial({ map: tex('#8a6a44', '#5e4630', 120, 2), roughness: .9 });
const rustMat = new THREE.MeshStandardMaterial({ map: tex('#7a4a38', '#4a2c22', 140, 1), roughness: .8, metalness: .3 });
const saltMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: .95 });

// Silos: tall rusted cylinders at the four corners (with box colliders).
const siloTops = [];
for (const [x, z] of [[-32, -32], [32, -32], [-32, 32], [32, 32]]) {
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 8, 16), rustMat);
  silo.position.set(x, 4, z);
  S.add(silo);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 16), rustMat);
  cap.position.set(x, 8.6, z);
  S.add(cap);
  addCollider(x, z, 4.4, 4.4, 8);
  siloTops.push(new THREE.Vector3(x, 8.4, z));
}

// Dock platforms: wooden planks under each delivery ring, with posts.
for (const z of [-33, 33]) {
  const deck = new THREE.Mesh(new THREE.BoxGeometry(11, .18, 7), woodMat);
  deck.position.set(0, .09, z);
  S.add(deck);
  for (const [px, pz] of [[-5, -3], [5, -3], [-5, 3], [5, 3]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 2.4, 8), woodMat);
    post.position.set(px, 1.2, z + pz);
    S.add(post);
  }
}

// Pipes along the east and west walls, high up.
for (const x of [-37.5, 37.5]) {
  for (const [y, r] of [[2.6, .28], [3.4, .2]]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 64, 10), rustMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, y, 0);
    S.add(pipe);
  }
}

// Cables strung between the silo tops, sagging in the middle.
for (const [a, b] of [[0, 1], [2, 3]]) {
  const curve = new THREE.QuadraticBezierCurve3(
    siloTops[a],
    siloTops[a].clone().lerp(siloTops[b], .5).add(new THREE.Vector3(0, -2.5, 0)),
    siloTops[b]);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)),
    new THREE.LineBasicMaterial({ color: 0x2a343a }));
  S.add(line);
}

// Salt piles: white cones at the far corners, beyond the patrol lanes.
for (const [x, z] of [[-35, -35], [35, -35], [-35, 35], [35, 35]]) {
  const pile = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.4, 12), saltMat);
  pile.position.set(x, .7, z);
  S.add(pile);
}

// Lamp posts at the docks: warm light pools where the core is delivered.
for (const [x, z] of [[-6, -36], [6, -36], [-6, 36], [6, 36]]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 3.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a343a, roughness: .7, metalness: .5 }));
  pole.position.set(x, 1.7, z);
  S.add(pole);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffc978 }));
  bulb.position.set(x, 3.5, z);
  S.add(bulb);
  const light = new THREE.PointLight(0xffb347, 14, 20, 2);
  light.position.set(x, 3.4, z);
  S.add(light);
}
