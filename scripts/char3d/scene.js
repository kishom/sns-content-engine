// ネコネコ & イヌイヌ — soft 3D toy renderer (Three.js)
// 仕様の正本: prompts/05-visual.md / docs/character.md
// 座標系: キャラは +z（カメラ）向き。キャラ自身の左 = +x = テクスチャ u=0.5。
//         キャラ自身の右 = -x = u=0.0。正面 = u=0.25。背面 = u=0.75。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

window.__done = false;
window.__err = null;
window.addEventListener('error', (e) => { window.__err = String(e.message || e.error); });

// ---------- palette (05-visual.md の HEX を正とする) ----------
const COL = {
  catBase: '#EFE9DF',
  catPatch: '#BFB4A4',
  dogBase: '#E4C9A0',
  dogEar: '#8F6B44',
  dogPatch: '#C6A880',
  blush: '#F5A9B0',
  dark: '#3A3230',      // 点目
  catMouth: '#8A776A',
  dogMouthLine: '#6B4A2B',
  dogMouthIn: '#7A4F30',
  tongue: '#F2938F',
  innerEar: '#F3BDBE',
  nosePink: '#EF9AA2',
  bgTop: '#FAE7E6',
  bgBottom: '#F4EBDC',
  ground: '#F1E7D6',
};

// ---------- face / pattern texture (equirect canvas on the body sphere) ----------
// canvas 4096x2048, u: x/4096, v(=theta/PI from top): y/2048
// front x=1024 (u=.25) / char-LEFT x=2048 (u=.5) / back x=3072 / char-RIGHT x=0
function makeBodyTexture(kind) {
  const W = 4096, H = 2048;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const FX = 1024; // front center x

  // sinθ 補正: 球の緯度で横方向のpxスケールが変わるため、丸を丸に見せる補正
  const sinAt = (y) => Math.max(0.28, Math.sin((y / H) * Math.PI));
  const ell = (x, y, rw, rh, color, rot = 0, alpha = 1) => {
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y); g.rotate(rot);
    g.scale(1 / sinAt(y), 1);
    g.fillStyle = color;
    g.beginPath(); g.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  const softEll = (x, y, rw, rh, color, alpha) => {
    g.save();
    g.translate(x, y);
    g.scale(1 / sinAt(y), 1);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, Math.max(rw, rh));
    grad.addColorStop(0, color);
    grad.addColorStop(0.65, color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = alpha;
    g.fillStyle = grad;
    g.beginPath(); g.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };

  // base
  g.fillStyle = kind === 'neko' ? COL.catBase : COL.dogBase;
  g.fillRect(0, 0, W, H);

  // subtle velvety speckle (微起毛の気配・ごく薄く)
  g.globalAlpha = 0.05;
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    g.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#B9A88F';
    g.fillRect(x, y, 2.5, 2.5);
  }
  g.globalAlpha = 1;

  if (kind === 'neko') {
    // ★ 灰ぶち: キャラ自身の左耳側の頭部 (front u=.25 と char-left u=.5 の間の上部)
    // 有機的なブロブ = 楕円3枚重ね（前面に垂れて「前髪」にならないよう左上に集約）
    ell(1880, 290, 420, 220, COL.catPatch, 0.10);
    ell(1640, 370, 260, 170, COL.catPatch, 0.30);
    ell(2080, 400, 250, 190, COL.catPatch, -0.15);
    // ★ ボディ斑1つ: キャラ自身の右下 (u≈0.16 = 右前下・正面から見える位置)
    ell(640, 1310, 190, 135, COL.catPatch, 0.35);
  } else {
    // ★ イヌ: 左下背中の柄 (char-left u=.5 と back u=.75 の間の下部・3/4でちら見えする前寄り)
    ell(2350, 1400, 240, 170, COL.dogPatch, -0.3);
    // まゆ点2つ（目の上・こげ茶）
    ell(FX - 150, 568, 30, 30, COL.dogEar);
    ell(FX + 150, 568, 30, 30, COL.dogEar);
  }

  // ---- 顔 (front center FX) ----
  // 点目（黒・小さく）+ 小さなハイライト
  const eyeY = 655, eyeDX = 150, eyeR = 36;
  ell(FX - eyeDX, eyeY, eyeR, eyeR, COL.dark);
  ell(FX + eyeDX, eyeY, eyeR, eyeR, COL.dark);
  ell(FX - eyeDX - 11, eyeY - 12, 9, 9, 'rgba(255,255,255,.85)');
  ell(FX + eyeDX - 11, eyeY - 12, 9, 9, 'rgba(255,255,255,.85)');

  // チーク（両頬・ソフトピンク）
  softEll(FX - 330, 770, 95, 62, COL.blush, 0.65);
  softEll(FX + 330, 770, 95, 62, COL.blush, 0.65);

  if (kind === 'neko') {
    // ピンクの小さな三角鼻（角丸）
    g.save();
    g.translate(FX, 728); g.scale(1 / sinAt(728), 1);
    g.fillStyle = COL.nosePink;
    g.lineJoin = 'round'; g.lineWidth = 14; g.strokeStyle = COL.nosePink;
    g.beginPath();
    g.moveTo(-26, -12); g.lineTo(26, -12); g.lineTo(0, 20); g.closePath();
    g.fill(); g.stroke();
    g.restore();
    // ω の口
    g.save();
    g.translate(FX, 782); g.scale(1 / sinAt(782), 1);
    g.strokeStyle = COL.catMouth; g.lineWidth = 11; g.lineCap = 'round';
    g.beginPath(); g.arc(-30, 0, 30, Math.PI * 0.15, Math.PI * 0.92); g.stroke();
    g.beginPath(); g.arc(30, 0, 30, Math.PI * 0.08, Math.PI * 0.85); g.stroke();
    g.restore();
  } else {
    // こげ茶の楕円鼻
    ell(FX, 712, 46, 32, '#5C4530');
    ell(FX - 12, 702, 11, 8, 'rgba(255,255,255,.55)');
    // 開いたにこにこ口（半円オープンスマイル + 舌）
    g.save();
    g.translate(FX, 768); g.scale(1 / sinAt(800), 1);
    g.fillStyle = COL.dogMouthIn;
    g.beginPath(); g.arc(0, 0, 88, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.fill();
    // 舌
    g.beginPath();
    g.save(); g.beginPath(); g.arc(0, 0, 88, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.clip();
    g.fillStyle = COL.tongue;
    g.beginPath(); g.ellipse(0, 78, 52, 42, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    // 口の縁を柔らかく
    g.strokeStyle = COL.dogMouthLine; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, 88, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ---------- geometry helpers ----------
function beanGeometry() {
  // 豆型（下ぶくれ・上すぼみ）を球の頂点変形でベイク。幅:高さ ≈ 1:1.2
  const geo = new THREE.SphereGeometry(1, 160, 120);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const bulge = 1 + 0.20 * Math.max(0, -y);   // 下ぶくれ
    const taper = 1 - 0.075 * Math.max(0, y);   // 上をわずかに細く
    x *= bulge * taper; z *= bulge * taper;
    p.setXYZ(i, x * 1.0, y * 1.14, z * 0.95);
  }
  geo.computeVertexNormals();
  return geo;
}

function catEarGeometry() {
  // 丸みのある三角耳: LatheGeometry（pow<1 で先端が丸い三角）
  const pts = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = 0.44 * Math.pow(1 - t, 0.55) + 0.001;
    pts.push(new THREE.Vector2(r, t * 0.55));
  }
  const geo = new THREE.LatheGeometry(pts, 48);
  geo.scale(1, 1, 0.5); // 前後を薄く
  return geo;
}

function softMat(color, opts = {}) {
  // マット（クレイ/ソフビ）+ sheen（微起毛のベルベット感）。光沢NG。
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.97,
    metalness: 0,
    sheen: 0.55,
    sheenRoughness: 0.9,
    sheenColor: new THREE.Color('#FFFFFF'),
    ...opts,
  });
}

// ---------- character builders ----------
function buildChar(kind) {
  const grp = new THREE.Group();
  const baseHex = kind === 'neko' ? COL.catBase : COL.dogBase;

  const body = new THREE.Mesh(beanGeometry(), softMat('#FFFFFF', { map: makeBodyTexture(kind) }));
  body.castShadow = true; body.receiveShadow = true;
  grp.add(body);

  const limbMat = softMat(baseHex);

  // 手（前脚）: 小さな短い手 = ぷにサイズの楕円球（体に密着）
  for (const sx of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), limbMat);
    paw.scale.set(0.21, 0.18, 0.19);
    paw.position.set(sx * 0.46, -0.64, 0.66);
    paw.castShadow = true;
    grp.add(paw);
  }
  // 足: 底の前寄りにちょこん（体に密着）
  for (const sx of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), limbMat);
    foot.scale.set(0.29, 0.16, 0.33);
    foot.position.set(sx * 0.34, -1.08, 0.34);
    foot.castShadow = true;
    grp.add(foot);
  }

  if (kind === 'neko') {
    // 耳: 丸三角。★キャラ自身の左耳(+x)だけ灰ぶち色
    const earGeo = catEarGeometry();
    const innerGeo = catEarGeometry();
    for (const sx of [-1, 1]) {
      const isLeftEar = sx > 0; // char's LEFT = +x
      const ear = new THREE.Mesh(earGeo, softMat(isLeftEar ? COL.catPatch : COL.catBase));
      ear.position.set(sx * 0.44, 0.86, -0.02);
      ear.rotation.z = -sx * 0.42; // 外側へ傾け
      ear.castShadow = true;
      grp.add(ear);
      const inner = new THREE.Mesh(innerGeo, softMat(COL.innerEar));
      inner.scale.set(0.5, 0.55, 0.35);
      inner.position.set(sx * 0.455, 0.89, 0.12);
      inner.rotation.z = -sx * 0.42;
      grp.add(inner);
    }
    // ★ しっぽ: キャラ自身の右側(-x)にカール
    const pts = [
      new THREE.Vector3(-0.30, -0.92, -0.50),
      new THREE.Vector3(-0.82, -0.72, -0.42),
      new THREE.Vector3(-1.18, -0.28, -0.30),
      new THREE.Vector3(-1.02, 0.18, -0.22),
      new THREE.Vector3(-0.68, 0.34, -0.18),
      new THREE.Vector3(-0.52, 0.10, -0.16),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.12, 24, false), limbMat);
    tail.castShadow = true;
    grp.add(tail);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.125, 32, 24), softMat(COL.catPatch));
    tip.position.copy(pts[pts.length - 1]);
    grp.add(tip);
  } else {
    // ★ こげ茶の垂れ耳（両側）: 平たい楕円をサイドに垂らす
    const earMat = softMat(COL.dogEar);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), earMat);
      ear.scale.set(0.26, 0.52, 0.19);
      ear.position.set(sx * 0.76, 0.55, 0.03);
      // ★上端を頭頂側・下端を外側下へ = 垂れ耳（符号を外向きにすると翼になるので注意）
      ear.rotation.z = sx * 0.78;
      ear.rotation.y = sx * 0.10;
      ear.castShadow = true;
      grp.add(ear);
    }
    // ★ しっぽ: キャラ自身の左側(+x)後方に小さく
    const tail = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), limbMat);
    tail.scale.set(0.11, 0.26, 0.11);
    tail.position.set(0.52, -0.42, -0.80);
    tail.rotation.z = -0.85;
    tail.rotation.x = -0.35;
    tail.castShadow = true;
    grp.add(tail);
  }

  grp.position.y = 1.22; // 接地
  return grp;
}

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// パステル背景（上ピンク→下クリームのグラデ）
{
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, COL.bgTop);
  gr.addColorStop(1, COL.bgBottom);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  const bg = new THREE.CanvasTexture(c);
  bg.colorSpace = THREE.SRGBColorSpace;
  scene.background = bg;
}
scene.fog = new THREE.Fog(new THREE.Color(COL.bgBottom), 14, 34);

// environment (やわらかいスタジオ環境光)
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.26;
}

// lights: key + fill + rim
const key = new THREE.DirectionalLight('#FFF3E4', 2.0);
key.position.set(2.6, 4.6, 3.6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -5; key.shadow.camera.right = 5;
key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
key.shadow.camera.near = 1; key.shadow.camera.far = 20;
key.shadow.radius = 14; key.shadow.blurSamples = 24;
key.shadow.bias = -0.0004;
scene.add(key);

const fill = new THREE.DirectionalLight('#E9F0FB', 0.65);
fill.position.set(-3.6, 1.6, 2.6);
scene.add(fill);

const rim = new THREE.DirectionalLight('#FFEFF4', 1.5);
rim.position.set(-0.6, 3.4, -4.6);
scene.add(rim);

scene.add(new THREE.HemisphereLight('#FFF6EC', '#E5D3BE', 0.42));

// ground（背景下端と同色でシームレス・やわらか接地影）
{
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: COL.ground, roughness: 1 })
  );
  ground.receiveShadow = true;
  scene.add(ground);
}

// ---------- shots ----------
const params = new URLSearchParams(location.search);
const shot = params.get('shot') || 'hero_duo';

const camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 0.1, 100);

function setupShot(name) {
  if (name === 'hero_duo' || name === 'duo_vertical') {
    const neko = buildChar('neko');
    const inu = buildChar('inu');
    neko.position.x = -1.22;
    inu.position.x = 1.22;
    // 少し内側に寄り添う（かわいさ・一体感）
    neko.rotation.z = -0.045;
    inu.rotation.z = 0.045;
    neko.rotation.y = 0.10;   // 顔をわずかに相方へ
    inu.rotation.y = -0.10;
    scene.add(neko, inu);
    if (name === 'hero_duo') {
      // 正面やや斜め = カメラをわずかに右へ（ネコの左灰ぶちが見える側）
      camera.position.set(0.55, 1.95, 10.4);
      camera.lookAt(0.05, 1.15, 0);
    } else {
      // 9:16 上部にテロップ余白 → 注視点を上げてキャラをフレーム下部へ
      camera.position.set(0.3, 2.3, 13.2);
      camera.lookAt(0.02, 2.6, 0);
    }
  } else if (name === 'nekoneko_front') {
    const neko = buildChar('neko');
    neko.rotation.y = -0.40; // 3/4ビュー: キャラ自身の左側（灰ぶち）を見せる
    scene.add(neko);
    camera.position.set(0.15, 1.9, 8.6);
    camera.lookAt(0, 1.15, 0);
  } else if (name === 'inuinu_front') {
    const inu = buildChar('inu');
    inu.rotation.y = -0.35; // 3/4ビュー: 左下背中の柄がちら見えする側
    scene.add(inu);
    camera.position.set(0.15, 1.9, 8.6);
    camera.lookAt(0, 1.15, 0);
  } else if (name.startsWith('neko_yaw_') || name.startsWith('inu_yaw_')) {
    // デバッグ用ターンテーブル: 柄の位置検証
    const kind = name.startsWith('neko') ? 'neko' : 'inu';
    const deg = parseFloat(name.split('_').pop()) || 0;
    const ch = buildChar(kind);
    ch.rotation.y = (deg * Math.PI) / 180;
    scene.add(ch);
    camera.position.set(0, 1.9, 8.6);
    camera.lookAt(0, 1.15, 0);
  } else {
    window.__err = 'unknown shot: ' + name;
  }
}
setupShot(shot);

// 数フレーム回してから完了フラグ（シェーダコンパイル/シャドウ安定用）
// ※ヘッドレスでは rAF が発火しないことがあるため同期レンダリング
try {
  for (let i = 0; i < 6; i++) renderer.render(scene, camera);
  window.__done = true;
} catch (e) {
  window.__err = String(e && e.message || e);
}
