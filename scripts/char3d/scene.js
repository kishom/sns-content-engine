// ネコネコ & イヌイヌ — soft 3D toy renderer (Three.js)
// 仕様の正本: prompts/05-visual.md / docs/character.md
// 座標系: キャラは +z（カメラ）向き。キャラ自身の左 = +x = テクスチャ u=0.5。
//         キャラ自身の右 = -x = u=0.0。正面 = u=0.25。背面 = u=0.75。
//
// ★造形・色・柄・質感は Kisho GO 済みの確定版。表情/ポーズ/小道具の追加で
//   これらを変更してはいけない（顔の描画だけを表情で差し替える）。
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
  // --- props (パステル・キャラと馴染むマット) ---
  bowl: '#F3F6F8',
  bowlRim: '#BBD9E8',
  water: '#9CD3E8',
  litterTray: '#B7C7D6',
  litterSand: '#E3D2B2',
  scaleBody: '#E7ECF2',
  scaleDial: '#FBFCFD',
  scaleNeedle: '#9AA7B4',
  crossGreen: '#A9D9B8',   // ★十字は必ず緑/パステル（赤十字標章の使用制限に触れるため赤は厳禁）
  crossGreenDeep: '#8FC7A3',
  sparkle: '#FFF1CF',
  tear: '#BFE3F0',
};

// ---------- deterministic RNG（微起毛スペックルの再現性のため） ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- face / pattern texture (equirect canvas on the body sphere) ----------
// canvas 4096x2048, u: x/4096, v(=theta/PI from top): y/2048
// front x=1024 (u=.25) / char-LEFT x=2048 (u=.5) / back x=3072 / char-RIGHT x=0
//
// expr: neko = neutral | nonbiri | doya | shinpai | yareyare | niko
//       inu  = neutral | egao | zenryoku | shombori | hatto | niko
function makeBodyTexture(kind, expr = 'neutral') {
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
  // ローカル座標で描くためのペン（sinθ補正込み）
  const pen = (x, y, fn) => {
    g.save();
    g.translate(x, y); g.scale(1 / sinAt(y), 1);
    g.lineCap = 'round'; g.lineJoin = 'round';
    fn(g);
    g.restore();
  };

  // base
  g.fillStyle = kind === 'neko' ? COL.catBase : COL.dogBase;
  g.fillRect(0, 0, W, H);

  // subtle velvety speckle (微起毛の気配・ごく薄く / seed固定で再現可能)
  const rnd = mulberry32(kind === 'neko' ? 1337 : 7331);
  g.globalAlpha = 0.05;
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * W, y = rnd() * H;
    g.fillStyle = rnd() > 0.5 ? '#FFFFFF' : '#B9A88F';
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
  }

  // ---- 顔 (front center FX) ----
  const eyeY = 655, eyeDX = 150, eyeR = 36;

  // --- 目のバリエーション ---
  const eyeDot = (dx, r = eyeR, hl = 9, squashY = 1) => {
    ell(FX + dx, eyeY, r, r * squashY, COL.dark);
    ell(FX + dx - 11, eyeY - 12, hl, hl, 'rgba(255,255,255,.85)');
  };
  const eyeSparkleDot = (dx) => {
    ell(FX + dx, eyeY, 40, 40, COL.dark);
    ell(FX + dx - 12, eyeY - 14, 13, 13, 'rgba(255,255,255,.9)');
    ell(FX + dx + 13, eyeY + 11, 7, 7, 'rgba(255,255,255,.6)');
  };
  const eyeWide = (dx) => {
    ell(FX + dx, eyeY, 47, 47, COL.dark);
    ell(FX + dx - 14, eyeY - 16, 15, 15, 'rgba(255,255,255,.9)');
    ell(FX + dx + 15, eyeY + 14, 8, 8, 'rgba(255,255,255,.55)');
  };
  // 半目（のんびり）: 横長のレンズ型。
  // ※実測の教訓 — まぶた線を足す/上辺を直線で切ると「怒り眉・ガン見」に見える。
  //   上下とも丸いレンズ形にすると眠たげ・穏やかに読める。
  const eyeHalf = (dx) => {
    ell(FX + dx, eyeY + 6, 38, 15, COL.dark);
    ell(FX + dx - 13, eyeY + 2, 7, 5, 'rgba(255,255,255,.75)');
  };
  // 下がり目（心配）: 点目 + 外側が下がったまぶた
  const eyeSad = (dx, outer) => {
    ell(FX + dx, eyeY + 8, 33, 31, COL.dark);
    ell(FX + dx - 10, eyeY - 2, 9, 9, 'rgba(255,255,255,.85)');
    pen(FX + dx, eyeY, (g) => {
      g.strokeStyle = COL.dark; g.lineWidth = 10;
      g.beginPath();
      g.moveTo(outer * 46, -16);                          // 外側 = 低い
      g.quadraticCurveTo(outer * 6, -48, outer * -40, -44); // 内側 = 高い
      g.stroke();
    });
  };
  // 無表情な棒目（やれやれ）
  const eyeFlat = (dx) => {
    pen(FX + dx, eyeY, (g) => {
      g.strokeStyle = COL.dark; g.lineWidth = 13;
      g.beginPath(); g.moveTo(-34, 0); g.lineTo(34, 0); g.stroke();
    });
  };
  // ∩ = にっこり閉じ目
  const eyeArcUp = (dx) => {
    pen(FX + dx, eyeY, (g) => {
      g.strokeStyle = COL.dark; g.lineWidth = 13;
      g.beginPath(); g.arc(0, 14, 34, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
    });
  };
  // ∪ = 下がり目（心配）
  const eyeArcDown = (dx) => {
    pen(FX + dx, eyeY, (g) => {
      g.strokeStyle = COL.dark; g.lineWidth = 13;
      g.beginPath(); g.arc(0, -14, 34, Math.PI * 0.12, Math.PI * 0.88); g.stroke();
    });
  };
  // 涙目（しょんぼり）: side = -1 左目 / +1 右目（外側に涙）
  const eyeTeary = (dx, side) => {
    ell(FX + dx, eyeY + 4, 33, 30, COL.dark);
    ell(FX + dx - 10, eyeY - 6, 10, 10, 'rgba(255,255,255,.85)');
    ell(FX + dx + side * 42, eyeY + 46, 16, 23, COL.tear, 0, 0.85);
    ell(FX + dx + side * 42 - 5, eyeY + 40, 5, 7, 'rgba(255,255,255,.7)');
  };

  // --- 口のバリエーション（ネコ） ---
  const mouthOmega = (y = 782, r = 30) => {
    pen(FX, y, (g) => {
      g.strokeStyle = COL.catMouth; g.lineWidth = 11;
      g.beginPath(); g.arc(-r, 0, r, Math.PI * 0.15, Math.PI * 0.92); g.stroke();
      g.beginPath(); g.arc(r, 0, r, Math.PI * 0.08, Math.PI * 0.85); g.stroke();
    });
  };
  const mouthSmug = () => {  // どや顔: 片側だけ上がった自信の笑み
    pen(FX, 788, (g) => {
      g.strokeStyle = COL.catMouth; g.lineWidth = 12;
      g.beginPath();
      g.moveTo(-48, -8);
      g.quadraticCurveTo(-8, 32, 44, -26);
      g.stroke();
    });
  };
  const mouthFlat = () => {
    pen(FX, 790, (g) => {
      g.strokeStyle = COL.catMouth; g.lineWidth = 11;
      g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.stroke();
    });
  };
  const mouthWavy = () => {  // 心配のもにょっとした口
    pen(FX, 788, (g) => {
      g.strokeStyle = COL.catMouth; g.lineWidth = 10;
      g.beginPath();
      g.moveTo(-34, 4);
      g.quadraticCurveTo(-17, -12, 0, 2);
      g.quadraticCurveTo(17, 16, 34, 0);
      g.stroke();
    });
  };

  // --- 口のバリエーション（イヌ） ---
  const mouthOpen = (r = 88, y = 768, tongueR = [52, 42], tongueY = 78) => {
    pen(FX, y, (g) => {
      g.fillStyle = COL.dogMouthIn;
      g.beginPath(); g.arc(0, 0, r, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.fill();
      g.save();
      g.beginPath(); g.arc(0, 0, r, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.clip();
      g.fillStyle = COL.tongue;
      g.beginPath(); g.ellipse(0, tongueY, tongueR[0], tongueR[1], 0, 0, Math.PI * 2); g.fill();
      g.restore();
      g.strokeStyle = COL.dogMouthLine; g.lineWidth = 8;
      g.beginPath(); g.arc(0, 0, r, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    });
  };
  const mouthO = () => {   // ハッと気づき: 小さく開いた口（鼻とくっつくと鼻づらに見えるので下げる）
    pen(FX, 806, (g) => {
      g.fillStyle = COL.dogMouthIn;
      g.beginPath(); g.ellipse(0, 0, 31, 36, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = COL.dogMouthLine; g.lineWidth = 7;
      g.beginPath(); g.ellipse(0, 0, 31, 36, 0, 0, Math.PI * 2); g.stroke();
    });
  };
  // 舌を出す（満面の笑み用・口の下縁からのぞかせる）
  const tongueOut = (y, w, h) => {
    pen(FX, y, (g) => {
      g.fillStyle = COL.tongue;
      g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(107,74,43,.30)'; g.lineWidth = 5;
      g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.stroke();
    });
  };
  const mouthFrown = () => {
    pen(FX, 800, (g) => {
      g.strokeStyle = COL.dogMouthLine; g.lineWidth = 10;
      g.beginPath(); g.arc(0, 30, 40, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    });
  };

  // --- まゆ点（イヌのみ・位置で感情を出す） ---
  const dogBrows = (y = 568, dx = 150, r = 30) => {
    ell(FX - dx, y, r, r, COL.dogEar);
    ell(FX + dx, y, r, r, COL.dogEar);
  };

  // チーク（両頬・ソフトピンク）— 全表情共通
  const blush = (y = 770) => {
    softEll(FX - 330, y, 95, 62, COL.blush, 0.65);
    softEll(FX + 330, y, 95, 62, COL.blush, 0.65);
  };

  if (kind === 'neko') {
    switch (expr) {
      case 'nonbiri':  eyeHalf(-eyeDX); eyeHalf(eyeDX); break;
      case 'doya':     eyeDot(-eyeDX, eyeR, 9, 0.82); eyeDot(eyeDX, eyeR, 9, 0.82); break;
      case 'shinpai':  eyeSad(-eyeDX, -1); eyeSad(eyeDX, 1); break;
      case 'yareyare': eyeFlat(-eyeDX); eyeFlat(eyeDX); break;
      case 'niko':     eyeArcUp(-eyeDX); eyeArcUp(eyeDX); break;
      default:         eyeDot(-eyeDX); eyeDot(eyeDX); break;
    }
    blush();
    // ピンクの小さな三角鼻（角丸）
    g.save();
    g.translate(FX, 728); g.scale(1 / sinAt(728), 1);
    g.fillStyle = COL.nosePink;
    g.lineJoin = 'round'; g.lineWidth = 14; g.strokeStyle = COL.nosePink;
    g.beginPath();
    g.moveTo(-26, -12); g.lineTo(26, -12); g.lineTo(0, 20); g.closePath();
    g.fill(); g.stroke();
    g.restore();
    // 口
    switch (expr) {
      case 'nonbiri':  mouthOmega(784, 34); break;   // ゆるい微笑
      case 'doya':     mouthSmug(); break;
      case 'shinpai':  mouthWavy(); break;
      case 'yareyare': mouthFlat(); break;
      case 'niko':     mouthOmega(782, 32); break;
      default:         mouthOmega(); break;
    }
  } else {
    switch (expr) {
      case 'egao':     eyeSparkleDot(-eyeDX); eyeSparkleDot(eyeDX); dogBrows(560, 155, 31); break;
      case 'zenryoku': eyeDot(-eyeDX, 38); eyeDot(eyeDX, 38); dogBrows(552, 152); break;
      case 'shombori': eyeTeary(-eyeDX, -1); eyeTeary(eyeDX, 1); dogBrows(548, 112, 27); break;
      case 'hatto':    eyeWide(-eyeDX); eyeWide(eyeDX); dogBrows(528, 158, 31); break;
      case 'niko':     eyeArcUp(-eyeDX); eyeArcUp(eyeDX); dogBrows(566, 150); break;
      default:         eyeDot(-eyeDX); eyeDot(eyeDX); dogBrows(); break;
    }
    blush();
    // こげ茶の楕円鼻
    ell(FX, 712, 46, 32, '#5C4530');
    ell(FX - 12, 702, 11, 8, 'rgba(255,255,255,.55)');
    switch (expr) {
      case 'egao':     mouthOpen(106, 772, [64, 52], 92); tongueOut(866, 44, 30); break;
      case 'zenryoku': mouthOpen(98, 770, [58, 47], 85); break;
      case 'shombori': mouthFrown(); break;
      case 'hatto':    mouthO(); break;
      case 'niko':     mouthOpen(94, 770, [56, 45], 82); break;
      default:         mouthOpen(); break;
    }
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

// 角丸ボックス（小道具用・キャラのぷに感に合わせて角は必ず丸める）
function roundedBoxGeometry(w, h, d, r, seg = 6) {
  const geo = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const ex = w / 2 - r, ey = h / 2 - r, ez = d / 2 - r;
  const p = geo.attributes.position;
  const v = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    q.set(
      Math.max(-ex, Math.min(ex, v.x)),
      Math.max(-ey, Math.min(ey, v.y)),
      Math.max(-ez, Math.min(ez, v.z))
    );
    const dir = v.clone().sub(q);
    if (dir.lengthSq() > 1e-9) dir.normalize().multiplyScalar(r).add(q);
    else dir.copy(v);
    p.setXYZ(i, dir.x, dir.y, dir.z);
  }
  geo.computeVertexNormals();
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

// ---------- props（すべてシンプルなプリミティブ・マット質感でキャラに馴染ませる） ----------
function makeWaterBowl() {
  const grp = new THREE.Group();
  // 陶器のボウル（Lathe の断面: 外側を上がって縁を越え内側を戻る）
  const prof = [
    [0.00, 0.000], [0.34, 0.005], [0.55, 0.055], [0.66, 0.200], [0.70, 0.300],
    [0.62, 0.305], [0.52, 0.190], [0.34, 0.100], [0.00, 0.085],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 64),
    softMat(COL.bowl, { side: THREE.DoubleSide })
  );
  bowl.castShadow = true; bowl.receiveShadow = true;
  grp.add(bowl);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.665, 0.03, 16, 64).rotateX(Math.PI / 2),
    softMat(COL.bowlRim)
  );
  rim.position.y = 0.302;
  grp.add(rim);
  // 水面（少しだけ滑らかにして水らしく・テカらせない）
  // ※白に近い水色だと器と同化して「空の皿」に見える（実測）→ 水色をしっかり乗せる
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 48).rotateX(-Math.PI / 2),
    softMat(COL.water, { roughness: 0.5, sheen: 0.3 })
  );
  water.position.y = 0.225;
  grp.add(water);
  return grp;
}

function makeLitterBox() {
  const grp = new THREE.Group();
  const tray = new THREE.Mesh(roundedBoxGeometry(1.12, 0.34, 0.86, 0.11, 8), softMat(COL.litterTray));
  tray.position.y = 0.17;
  tray.castShadow = true; tray.receiveShadow = true;
  grp.add(tray);
  const sand = new THREE.Mesh(roundedBoxGeometry(0.92, 0.10, 0.68, 0.05, 6), softMat(COL.litterSand));
  sand.position.y = 0.33;
  grp.add(sand);
  return grp;
}

function makeWeighScale() {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(roundedBoxGeometry(0.98, 0.20, 0.98, 0.08, 8), softMat(COL.scaleBody));
  body.position.y = 0.10;
  body.castShadow = true; body.receiveShadow = true;
  grp.add(body);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.045, 48), softMat(COL.scaleDial));
  dial.position.y = 0.215;
  grp.add(dial);
  // 針（文字は入れない = アイコンの文字化NG対策）
  const needle = new THREE.Mesh(roundedBoxGeometry(0.03, 0.02, 0.22, 0.012, 4), softMat(COL.scaleNeedle));
  needle.position.set(0.045, 0.243, -0.075);
  needle.rotation.y = 0.42;
  grp.add(needle);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 16), softMat(COL.scaleNeedle));
  hub.position.set(0, 0.245, 0);
  grp.add(hub);
  return grp;
}

// ★ 十字アイコンは必ず緑/パステル（赤十字標章の使用制限に触れるため赤は絶対に使わない）
function makeCross() {
  const grp = new THREE.Group();
  const mat = softMat(COL.crossGreen);
  const barH = new THREE.Mesh(roundedBoxGeometry(0.92, 0.30, 0.22, 0.10, 6), mat);
  const barV = new THREE.Mesh(roundedBoxGeometry(0.30, 0.92, 0.22, 0.10, 6), mat);
  grp.add(barH, barV);
  return grp;
}

// アイコンプレート（角丸の板 + ミニ小道具）= 浮かぶピクトに見せる
// 実測の教訓: ①板が白いと中身と同化して真っ白なカードに見える → パステルで色差をつける
//             ②カメラより高い位置に置くと器/トイレ/体重計を「下から」見ることになり中身が読めない
//               → 小道具だけ手前に倒して（rotation.x）中身をカメラへ向ける
function makeIconPlate(kind) {
  const tint = { water: '#D5EAF6', litter: '#EDE3D2', scale: '#F3DFE6' }[kind] || '#FFFFFF';
  const grp = new THREE.Group();
  const plate = new THREE.Mesh(roundedBoxGeometry(1.32, 1.32, 0.20, 0.38, 8), softMat(tint));
  plate.castShadow = true;
  grp.add(plate);
  const inner = kind === 'water' ? makeWaterBowl() : kind === 'litter' ? makeLitterBox() : makeWeighScale();
  inner.scale.setScalar(0.82);
  inner.position.set(0, -0.16, 0.22);
  inner.rotation.x = 0.55;
  grp.add(inner);
  grp.rotation.y = -0.10;
  return grp;
}

// キラッ = カメラ向きの4方向スター（板）。
// ※実測の教訓 — 立体（八面体等）でキラキラを作るとライティングで灰色に沈み「紙片/ゴミ」に見える。
//   ライト非依存の MeshBasicMaterial + 透過テクスチャにすると暖色のキラキラとして読める。
let _sparkleTex = null;
function sparkleTexture() {
  if (_sparkleTex) return _sparkleTex;
  const S = 256, c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  const cx = S / 2;
  const gr = g.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gr.addColorStop(0, 'rgba(255,246,214,0.90)');
  gr.addColorStop(0.22, 'rgba(255,238,190,0.38)');
  gr.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  const R = cx * 0.94, w = cx * 0.30;
  g.fillStyle = 'rgba(255,250,232,0.95)';
  g.beginPath();
  g.moveTo(cx, cx - R);
  g.quadraticCurveTo(cx + w * 0.35, cx - w * 0.35, cx + R, cx);
  g.quadraticCurveTo(cx + w * 0.35, cx + w * 0.35, cx, cx + R);
  g.quadraticCurveTo(cx - w * 0.35, cx + w * 0.35, cx - R, cx);
  g.quadraticCurveTo(cx - w * 0.35, cx - w * 0.35, cx, cx - R);
  g.fill();
  _sparkleTex = new THREE.CanvasTexture(c);
  _sparkleTex.colorSpace = THREE.SRGBColorSpace;
  return _sparkleTex;
}
function makeSparkle(size = 1) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.78 * size, 0.78 * size),
    new THREE.MeshBasicMaterial({ map: sparkleTexture(), transparent: true, depthWrite: false })
  );
}

// ---------- character builders ----------
// opts: { expr, pawRaise: 'left'|'right'|null, pawTap: bool, earDroop, earUp,
//         bounce: 0..1（正で浮き上がり＋縦ストレッチ）, tilt（rad・体の傾き）, nod（rad・前傾/うなずき） }
function buildChar(kind, opts = {}) {
  const {
    expr = 'neutral', pawRaise = null, pawTap = false,
    earDroop = false, earUp = false, bounce = 0, tilt = 0, nod = 0,
  } = opts;

  const grp = new THREE.Group();
  const baseHex = kind === 'neko' ? COL.catBase : COL.dogBase;

  const body = new THREE.Mesh(beanGeometry(), softMat('#FFFFFF', { map: makeBodyTexture(kind, expr) }));
  body.castShadow = true; body.receiveShadow = true;
  grp.add(body);

  const limbMat = softMat(baseHex);

  // 手（前脚）: 小さな短い手 = ぷにサイズの楕円球（体に密着）
  // pawRaise 指定時は該当側の手を体側面の高い位置へ（「説明する仕草」）
  const raiseSide = pawRaise === 'left' ? 1 : pawRaise === 'right' ? -1 : 0; // char-left = +x
  for (const sx of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), limbMat);
    paw.scale.set(0.21, 0.18, 0.19);
    if (sx === raiseSide) {
      // 体表に沿って上げた手（頬の少し下・カメラ側）。少し大きめにして「上げている」を読ませる
      paw.position.set(sx * 0.86, pawTap ? -0.36 : 0.02, 0.50);
      paw.rotation.z = -sx * 0.55;
      paw.scale.set(0.24, 0.21, 0.22);
    } else {
      paw.position.set(sx * 0.46, -0.64, 0.66);
    }
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
      // しょんぼり = さらに垂れる / 全力(耳がはねる) = 少し持ち上がる
      const droop = earDroop ? 0.30 : earUp ? -0.26 : 0;
      ear.position.set(sx * (0.76 + (earDroop ? 0.02 : 0)), 0.55 - (earDroop ? 0.14 : 0) + (earUp ? 0.10 : 0), 0.03);
      // ★上端を頭頂側・下端を外側下へ = 垂れ耳（符号を外向きにすると翼になるので注意）
      ear.rotation.z = sx * (0.78 + droop);
      ear.rotation.y = sx * 0.10;
      ear.castShadow = true;
      grp.add(ear);
    }
    // ★ しっぽ: キャラ自身の左側(+x)後方に小さく
    const tail = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), limbMat);
    tail.scale.set(0.11, 0.26, 0.11);
    tail.position.set(0.52, -0.42, -0.80);
    tail.rotation.z = -0.85 + (bounce > 0 ? 0.28 : 0);
    tail.rotation.x = -0.35;
    tail.castShadow = true;
    grp.add(tail);
  }

  grp.position.y = 1.22; // 接地
  // --- ポーズ（造形は変えず group 変換のみ） ---
  if (bounce > 0) {
    grp.position.y += 0.26 * bounce;                     // 跳ねて浮く
    grp.scale.set(1 - 0.05 * bounce, 1 + 0.07 * bounce, 1 - 0.05 * bounce); // ストレッチ
  }
  if (tilt) grp.rotation.z = tilt;
  if (nod) grp.rotation.x = nod;
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

// 2キャラ 9:16 の標準カメラ（上部にテロップ余白・キャラは下寄り）
// ※ z=13.2/camera.x=0.3 だとネコのしっぽ側（画面左）が切れる（実測）→ 引いて中央寄せ
function duoCam(z = 14.0, lookY = 2.62) {
  camera.position.set(0.05, 2.3, z);
  camera.lookAt(0.05, lookY, 0);
}
// 単体 9:16 の標準カメラ
function soloCam(z = 10.0, lookY = 2.15) {
  camera.position.set(0.05, 2.0, z);
  camera.lookAt(0, lookY, 0);
}

// 2キャラ配置（★ネコ左・イヌ右を厳守。この関数以外で配置しない）
// offsetX: ネコのしっぽが画面左にはみ出すぶん、ペア全体をわずかに右へ寄せる
function placeDuo(nekoOpts, inuOpts, { spread = 1.16, faceIn = true, offsetX = 0.12 } = {}) {
  const neko = buildChar('neko', nekoOpts);
  const inu = buildChar('inu', inuOpts);
  neko.position.x = -spread + offsetX;
  inu.position.x = spread + offsetX;
  neko.rotation.z += -0.045;
  inu.rotation.z += 0.045;
  if (faceIn) {
    neko.rotation.y = 0.10;   // 顔をわずかに相方へ
    inu.rotation.y = -0.10;
  }
  scene.add(neko, inu);
  return { neko, inu };
}

function addSparkles(list) {
  for (const [x, y, z, s] of list) {
    const sp = makeSparkle(s);
    sp.position.set(x, y, z);
    sp.rotation.z = (x + y) * 0.7;
    scene.add(sp);
  }
}

const CUTS = {
  // 0-3s フック: 犬が全力で喜ぶ / 猫がやれやれ / 水皿は1つだけ
  'cut-01': () => {
    placeDuo({ expr: 'yareyare' }, { expr: 'zenryoku', bounce: 1, earUp: true, tilt: -0.06 });
    const bowl = makeWaterBowl();
    bowl.position.set(-0.05, 0, 1.45);
    bowl.scale.setScalar(0.95);
    scene.add(bowl);
    addSparkles([[1.78, 3.34, 0.5, 1.0], [1.95, 2.66, 0.3, 0.7], [1.32, 3.78, 0.0, 0.65]]);
    duoCam();
  },
  // 3-7s 水皿アップ・猫がのんびり（猫単体）
  'cut-02': () => {
    const neko = buildChar('neko', { expr: 'nonbiri' });
    neko.position.x = -0.34;
    neko.rotation.y = -0.18;
    scene.add(neko);
    const bowl = makeWaterBowl();
    bowl.position.set(0.55, 0, 1.55);   // 手前（フォアグラウンド）に1つだけ
    bowl.scale.setScalar(1.05);
    scene.add(bowl);
    soloCam(10.2, 2.20);
  },
  // 7-12s 犬がびっくり / 猫が真顔で強調（前傾＋手でトン）
  'cut-03': () => {
    placeDuo(
      { expr: 'neutral', pawRaise: 'left', pawTap: true, nod: 0.07 }, // 相方（右）へ向けて手を出す
      { expr: 'hatto', bounce: 0.45, earUp: true }
    );
    duoCam(13.8, 2.58);
  },
  // 12-19s 猫がどや顔で解説（猫単体・手を上げる）
  'cut-04': () => {
    const neko = buildChar('neko', { expr: 'doya', pawRaise: 'left', tilt: -0.07 });
    neko.rotation.y = -0.26;
    scene.add(neko);
    soloCam(9.7, 2.10);
  },
  // 19-27s 犬がハッ / 猫がどや顔 + 3アイコン（水皿・トイレ・体重計）
  'cut-05': () => {
    placeDuo(
      { expr: 'doya', pawRaise: 'left' },
      { expr: 'hatto', bounce: 0.55, earUp: true }
    );
    const icons = ['water', 'litter', 'scale'];
    const pos = [[-1.25, 3.34, 1.3], [0.25, 3.60, 1.3], [1.62, 3.30, 1.3]];
    icons.forEach((k, i) => {
      const ic = makeIconPlate(k);
      ic.position.set(...pos[i]);
      ic.scale.setScalar(0.82);
      ic.rotation.z = (i - 1) * 0.05;
      scene.add(ic);
    });
    duoCam(14.0, 2.92);
  },
  // 27-33s 猫がのんびり / 犬がこくり + やわらかい緑の十字（★赤十字は厳禁）
  'cut-06': () => {
    placeDuo({ expr: 'nonbiri' }, { expr: 'neutral', nod: 0.16 });
    const cross = makeCross();
    cross.position.set(0.20, 3.60, -1.7);
    cross.scale.setScalar(1.0);
    cross.rotation.z = 0.06;
    scene.add(cross);
    duoCam(13.9, 2.74);
  },
  // 33-40s 2人で笑顔・ふわっと跳ねる（チェックリスト再掲は合成レイヤー）
  'cut-07': () => {
    placeDuo(
      { expr: 'niko', bounce: 0.5, tilt: 0.04 },
      { expr: 'niko', bounce: 0.75, tilt: -0.04, earUp: true }
    );
    addSparkles([
      [-1.85, 3.30, 0.3, 0.85], [-1.15, 3.80, -0.3, 0.6], [0.20, 3.42, 0.5, 0.7],
      [1.42, 3.86, -0.2, 0.75], [1.86, 3.12, 0.4, 0.95],
    ]);
    duoCam(13.9, 2.76);
  },
};

// 表情バリエーション（05-visual.md 準拠・ポーズも表情定義に含む）
const EXPR_POSE = {
  neko: {
    nonbiri:  {},
    doya:     { pawRaise: 'left', tilt: -0.06 },   // 相方側（画面右）へ手を上げる
    shinpai:  { tilt: 0.11 },
    yareyare: {},
  },
  inu: {
    egao:     {},
    zenryoku: { bounce: 1, earUp: true, tilt: -0.05 },
    shombori: { earDroop: true, nod: 0.10 },
    hatto:    { bounce: 0.35, earUp: true },
  },
};

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
  } else if (CUTS[name]) {
    CUTS[name]();
  } else if (name.startsWith('expr_')) {
    // expr_<neko|inu>_<表情>
    const [, kind, expr] = name.split('_');
    if (!EXPR_POSE[kind] || !EXPR_POSE[kind][expr]) { window.__err = 'unknown expression: ' + name; return; }
    const ch = buildChar(kind, { expr, ...EXPR_POSE[kind][expr] });
    // 3/4ビュー（柄の識別性を保ちつつ表情が読める角度）
    ch.rotation.y = kind === 'neko' ? -0.28 : -0.26;
    scene.add(ch);
    camera.position.set(0.05, 1.90, 8.4);
    camera.lookAt(0, 1.28, 0);
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
