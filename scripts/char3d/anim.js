// ネコネコ & イヌイヌ — アニメーションレイヤー
// 正本: content/2026-07-22_cat-ckd/05-animate.md（カット別の動作・尺）
//       docs/handoff-video-generation.md（動作プロンプト＝実装すべき動きの仕様）
//
// scene.js（造形・色・柄・質感・顔テクスチャの確定版）を**そのまま土台として import** し、
// group 変換とパーツ変換だけを時刻 t の関数として動かす。造形には一切触れない。
//
// ★決定論: rAF は使わない。animate.mjs が window.__renderFrame(t) を呼ぶたびに
//   「基準ポーズへリセット → t からポーズを算出 → 1フレーム同期描画」を行う。
//   同じ t は常に同じ絵になる（再現性・再レンダリング可能）。
//
// ★ループ可能性: すべての動きは正規化位相 u = (t/duration) mod 1 の関数で、
//   ①sin/cos の整数倍周期 ②両端でゼロになる窓関数 のどちらかしか使わない。
//   → u=0 と u=1 のポーズが厳密に一致する＝音声長に合わせて ffmpeg でループ延長できる。
import * as THREE from 'three';
import {
  scene, camera, renderer,
  buildChar, placeDuo, addSparkles, softMat, makeBodyTexture,
  makeWaterBowl, makeIconPlate, makeCross,
  duoCam, soloCam,
} from './scene.js';

// ============================================================
// 動きの語彙（すべて u ∈ [0,1) のループ位相の関数）
// ============================================================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** 正弦波。k = ループあたりの周期数（整数のみ＝つなぎ目が完全一致） */
const wave = (u, k = 1, ph = 0) => Math.sin(TAU * (k * u + ph));

/** 窓 [a,b] 内の正規化位置 0..1（外は null）。a>0 かつ b<1 にすること＝ループ端を跨がない */
const win = (u, a, b) => (u < a || u > b ? null : (u - a) / (b - a));

/** バウンスの高さ 0..1。k = ループあたりの跳躍回数。u=0 が頂点（速度0）＝ループ端が滑らか */
const bounceH = (u, k, p = 0.7) => Math.pow(Math.abs(Math.cos(Math.PI * k * u)), p);

// キャラの足元が地面から浮かない/めり込まないようにする補正係数
// （group 原点から足裏までの距離。足 y=-1.08・scale.y=0.16 → 約 1.24）
const FOOT = 1.24;

// ------------------------------------------------------------
// リグ: 基準ポーズを記憶し、毎フレームそこへ戻してから差分を積む
// ------------------------------------------------------------
function rig(ch) {
  const parts = ch.userData.parts;
  const base = {
    pos: ch.position.clone(),
    rot: { x: ch.rotation.x, y: ch.rotation.y, z: ch.rotation.z },
    ears: parts.ears.map((e) => ({ x: e.rotation.x, y: e.rotation.y, z: e.rotation.z })),
    tail: parts.tailPivot
      ? { x: parts.tailPivot.rotation.x, y: parts.tailPivot.rotation.y, z: parts.tailPivot.rotation.z }
      : null,
    paw: parts.raisedPaw
      ? { pos: parts.raisedPaw.position.clone(), rotZ: parts.raisedPaw.rotation.z }
      : null,
  };
  return { ch, parts, base, kind: ch.userData.kind, blink: null };
}

function reset(r) {
  r.ch.position.copy(r.base.pos);
  r.ch.rotation.set(r.base.rot.x, r.base.rot.y, r.base.rot.z);
  r.ch.scale.set(1, 1, 1);
  r.parts.ears.forEach((e, i) => e.rotation.set(r.base.ears[i].x, r.base.ears[i].y, r.base.ears[i].z));
  if (r.parts.tailPivot) r.parts.tailPivot.rotation.set(r.base.tail.x, r.base.tail.y, r.base.tail.z);
  if (r.parts.raisedPaw) {
    r.parts.raisedPaw.position.copy(r.base.paw.pos);
    r.parts.raisedPaw.rotation.z = r.base.paw.rotZ;
  }
}

// ★★ 適用順の約束（重要・実測で踏んだ）★★
//   `idle` と `bounce` は **基準ドライバ**＝ scale と position.y を「代入」で上書きする。
//   `surprise` は **加算ドライバ**＝ 現在の scale に「乗算」で乗せる。
//   ∴ 基準ドライバは必ず先に、しかも1体につき1つだけ呼ぶこと。
//   順序を逆にすると bounce が surprise を丸ごと上書きして**びっくりの芝居が消える**
//   （cut-05 で実際に発生。フレームを見るまで気づけなかった）。

/** ぷにぷに待機: ゆっくりした squash-and-stretch の呼吸（全キャラ常時）※基準ドライバ */
function idle(r, u, { k = 3, amp = 0.020, ph = 0 } = {}) {
  const s = wave(u, k, ph);
  const sy = 1 + amp * s;
  const sxz = 1 - amp * 0.55 * s;
  r.ch.scale.set(sxz, sy, sxz);
  r.ch.position.y = r.base.pos.y + FOOT * (sy - 1);
}

/** バウンス: 上下＋着地時の squash（弾性のあるイージング）。idle の代わりに使う ※基準ドライバ */
function bounce(r, u, { k = 3, height = 0.26, squash = 0.09, stretch = 0.07 } = {}) {
  const h = bounceH(u, k);
  const land = Math.pow(clamp(1 - h / 0.30, 0, 1), 1.5);   // 接地付近で 1
  const sy = 1 + stretch * h - squash * land;
  const sxz = 1 - stretch * 0.55 * h + squash * 0.85 * land;
  r.ch.scale.set(sxz, sy, sxz);
  r.ch.position.y = r.base.pos.y + height * h + FOOT * (sy - 1);
}

/** びっくり（ハッと）: 一瞬縮んでから伸び上がる。窓の外では何もしない＝ループ安全
 *  ※加算ドライバ（scale に乗算）＝ idle / bounce の**後**に呼ぶこと。
 *  ※振幅を上げすぎると豆型のシルエットが球に潰れて別キャラに見える（実測 0.14 は強すぎた）。 */
function surprise(r, u, { a = 0.05, b = 0.32, amp = 1 } = {}) {
  const x = win(u, a, b);
  if (x === null) return;
  const v = -Math.sin(TAU * x) * amp;        // 前半 -（縮む）→ 後半 +（伸びる）
  const sy = 1 + 0.115 * v;
  const sxz = 1 - 0.078 * v;
  r.ch.scale.x *= sxz; r.ch.scale.y *= sy; r.ch.scale.z *= sxz;
  r.ch.position.y += 0.32 * Math.max(0, v) + FOOT * (sy - 1);
}

/** 耳が跳ねる（ぱたっ）: 付け根を支点に持ち上げて戻す。times=往復回数 */
function earFlap(r, u, { a, b, amp = 0.42, times = 1 } = {}) {
  const x = win(u, a, b);
  if (x === null) return;
  const env = Math.sin(Math.PI * x);                       // 0→1→0
  const lift = Math.abs(Math.sin(Math.PI * times * x)) * env * amp;
  r.parts.ears.forEach((ear, i) => {
    const sx = i === 0 ? -1 : 1;                           // buildChar は [-1, 1] の順で生成
    // イヌ耳: |rot.z| を小さくすると持ち上がる / ネコ耳: pivot 基準0から外へ倒す
    ear.rotation.z = r.base.ears[i].z - (r.kind === 'inu' ? sx * lift : sx * lift * 0.5);
    ear.rotation.x = r.base.ears[i].x - lift * 0.22;
  });
}

/** 耳の微揺れ（待機時の生き感） */
function earIdle(r, u, { k = 2, amp = 0.05, ph = 0 } = {}) {
  const s = wave(u, k, ph);
  r.parts.ears.forEach((ear, i) => {
    const sx = i === 0 ? -1 : 1;
    ear.rotation.z += -sx * amp * s * (r.kind === 'inu' ? 1 : 0.6);
  });
}

/** しっぽ振り（イヌ）: 付け根を支点に左右へ */
function tailWag(r, u, { k = 8, amp = 0.42 } = {}) {
  if (!r.parts.tailPivot) return;
  const s = wave(u, k);
  r.parts.tailPivot.rotation.y = r.base.tail.y + amp * s;
  r.parts.tailPivot.rotation.z = r.base.tail.z + amp * 0.28 * Math.abs(s);
}

/** うなずき: 前傾→戻るを times 回。lean = 常時の前傾量 */
function nod(r, u, { a = 0.10, b = 0.78, times = 2, amp = 0.20, lean = 0.06 } = {}) {
  r.ch.rotation.x = r.base.rot.x + lean;
  const x = win(u, a, b);
  if (x === null) return;
  const n = (1 - Math.cos(TAU * times * x)) / 2;           // 両端 0・times 回の山
  r.ch.rotation.x += amp * n;
}

/** 首かしげ / 体の揺れ（ロールは ±0.15rad 以内に抑える＝顔テクスチャが破綻しない範囲） */
function sway(r, u, { k = 1, roll = 0.070, shiftX = 0.06, ph = 0 } = {}) {
  const s = wave(u, k, ph);
  r.ch.rotation.z = clamp(r.base.rot.z + roll * s, -0.15, 0.15);
  r.ch.position.x = r.base.pos.x + shiftX * s;
}

/** 手を上げて揺らす（解説の仕草） */
function pawWave(r, u, { k = 2, amp = 0.07, roll = 0.14, ph = 0 } = {}) {
  if (!r.parts.raisedPaw) return;
  const s = wave(u, k, ph);
  r.parts.raisedPaw.position.y = r.base.paw.pos.y + amp * s;
  r.parts.raisedPaw.rotation.z = r.base.paw.rotZ + roll * s;
}

/** 手でトン（強調・数える）: 窓ごとに手をすとんと落として戻す */
function pawTap(r, u, windows, { depth = 0.38 } = {}) {
  if (!r.parts.raisedPaw) return;
  let d = 0;
  for (const [a, b] of windows) {
    const x = win(u, a, b);
    if (x !== null) d = Math.max(d, Math.sin(Math.PI * x));
  }
  if (!d) return;
  r.parts.raisedPaw.position.y -= depth * d;               // pawTap:true 相当（0.02 → -0.36）
  r.parts.raisedPaw.rotation.z += 0.20 * d;
}

/** まばたき: 閉じ目の表情テクスチャを貼った同形状メッシュと表示を入れ替える（造形は不変） */
function addBlink(ch, kind, closedExpr) {
  const body = ch.userData.parts.body;
  const alt = new THREE.Mesh(body.geometry, softMat('#FFFFFF', { map: makeBodyTexture(kind, closedExpr) }));
  alt.castShadow = true; alt.receiveShadow = true;
  alt.visible = false;
  body.parent.add(alt);
  return { open: body, closed: alt };
}
/** windows は必ず 0 < a < b < 1（ループ端では必ず目を開けている） */
function blink(r, u, windows) {
  if (!r.blink) return;
  const closed = windows.some(([a, b]) => u >= a && u <= b);
  r.blink.open.visible = !closed;
  r.blink.closed.visible = closed;
}

/** キラキラ: スケール＋透明度の明滅（位相をずらす）
 *  ★実測: 振幅を大きくすると確定静止画より大きい白い塊になって「紙片」に見える。
 *    静止画（scale=1・不透明）を上限として、そこから控えめに絞る方向でしか動かさない。 */
function twinkle(sparkles, u, { k = 2 } = {}) {
  sparkles.forEach((sp, i) => {
    const s = 0.5 * (1 + wave(u, k, i / sparkles.length));
    sp.material.opacity = 0.55 + 0.45 * s;
    const sc = 0.86 + 0.20 * s;
    sp.scale.set(sc, sc, sc);
  });
}

/** 小道具のふわふわ上下（位相をずらす） */
function floatProp(obj, base, u, { k = 1, amp = 0.10, ph = 0, roll = 0.03 } = {}) {
  obj.position.y = base.y + amp * wave(u, k, ph);
  obj.rotation.z = base.rotZ + roll * wave(u, k, ph + 0.25);
}
const snapshot = (o) => ({ y: o.position.y, rotZ: o.rotation.z });

// ============================================================
// カット定義（構図・カメラ・小道具は静止画 CUTS と同一。動きだけを足す）
// 尺は 05-animate.md のカット別
// ============================================================
const CUTS = {
  // 0-3s フック: 犬が全力で喜ぶ / 猫がやれやれ / 水皿は1つだけ
  'cut-01': () => {
    const { neko, inu } = placeDuo(
      { expr: 'yareyare' },
      { expr: 'zenryoku', earUp: true, tilt: -0.06 }
    );
    const bowl = makeWaterBowl();
    bowl.position.set(-0.05, 0, 1.45);
    bowl.scale.setScalar(0.95);
    scene.add(bowl);
    const sp = addSparkles([[1.78, 3.34, 0.5, 1.0], [1.95, 2.66, 0.3, 0.7], [1.32, 3.78, 0.0, 0.65]]);
    duoCam();

    const rn = rig(neko), ri = rig(inu);
    return {
      duration: 4,
      update(u) {
        reset(rn); reset(ri);
        // ネコ: 呆れた無反応。呼吸だけ＋ごくわずかな重心移動
        idle(rn, u, { k: 2, amp: 0.018 });
        sway(rn, u, { k: 1, roll: 0.022, shiftX: 0.020 });
        earIdle(rn, u, { k: 2, amp: 0.030 });
        // イヌ: 全力で跳ねる（4回/4秒）＋しっぽ高速＋耳が跳ねる
        bounce(ri, u, { k: 4, height: 0.30, squash: 0.085, stretch: 0.070 });
        tailWag(ri, u, { k: 12, amp: 0.46 });
        earIdle(ri, u, { k: 4, amp: 0.16 });
        twinkle(sp, u, { k: 2 });
      },
    };
  },

  // 3-7s 水皿アップ・猫がのんびり（猫単体・ゆっくり左右に揺れる＋スローまばたき）
  'cut-02': () => {
    const neko = buildChar('neko', { expr: 'nonbiri' });
    neko.position.x = -0.34;
    neko.rotation.y = -0.18;
    scene.add(neko);
    const bowl = makeWaterBowl();
    bowl.position.set(0.55, 0, 1.55);
    bowl.scale.setScalar(1.05);
    scene.add(bowl);
    soloCam(10.2, 2.20);

    const rn = rig(neko);
    rn.blink = addBlink(neko, 'neko', 'niko');   // 'niko' = ∩ の閉じ目（口はほぼ同形）
    return {
      duration: 5,
      update(u) {
        reset(rn);
        idle(rn, u, { k: 2, amp: 0.022 });
        sway(rn, u, { k: 1, roll: 0.080, shiftX: 0.075 });
        earIdle(rn, u, { k: 2, amp: 0.045 });
        blink(rn, u, [[0.30, 0.36], [0.74, 0.80]]);   // スローまばたき（各 0.3秒）
      },
    };
  },

  // 7-12s 犬がびっくり / 猫が真顔で強調（前傾＋手でトン）
  'cut-03': () => {
    const { neko, inu } = placeDuo(
      { expr: 'neutral', pawRaise: 'left', nod: 0.07 },
      { expr: 'hatto', earUp: true }
    );
    duoCam(13.8, 2.58);

    const rn = rig(neko), ri = rig(inu);
    return {
      duration: 6,
      update(u) {
        reset(rn); reset(ri);
        // ネコ: 呼吸 + 前傾を保ったまま 2回「トン」と手で強調
        idle(rn, u, { k: 3, amp: 0.018 });
        nod(rn, u, { a: 0.10, b: 0.52, times: 1, amp: 0.075, lean: 0 });
        pawWave(rn, u, { k: 3, amp: 0.035, roll: 0.07 });
        pawTap(rn, u, [[0.14, 0.30], [0.34, 0.50]]);
        // イヌ: ハッと驚く → 耳がぱたっ → 小さく跳ねて落ち着く
        idle(ri, u, { k: 3, amp: 0.016 });
        surprise(ri, u, { a: 0.04, b: 0.30 });
        earFlap(ri, u, { a: 0.06, b: 0.34, amp: 0.46, times: 2 });
        tailWag(ri, u, { k: 6, amp: 0.26 });
      },
    };
  },

  // 12-19s 猫がどや顔で解説（猫単体・手を上げてゆらす＋首かしげ）
  'cut-04': () => {
    const neko = buildChar('neko', { expr: 'doya', pawRaise: 'left', tilt: -0.07 });
    neko.rotation.y = -0.26;
    scene.add(neko);
    soloCam(9.7, 2.10);

    const rn = rig(neko);
    return {
      duration: 6,
      update(u) {
        reset(rn);
        idle(rn, u, { k: 3, amp: 0.020 });
        sway(rn, u, { k: 1, roll: 0.055, shiftX: 0.030 });   // 首かしげ（base -0.07 と合わせ ±0.125）
        pawWave(rn, u, { k: 3, amp: 0.075, roll: 0.16 });    // 説明する手のゆらし
        earIdle(rn, u, { k: 3, amp: 0.040 });
      },
    };
  },

  // 19-27s 犬がハッ / 猫がどや顔で3つ数える + 3アイコン（水皿・トイレ・体重計）
  'cut-05': () => {
    const { neko, inu } = placeDuo(
      { expr: 'doya', pawRaise: 'left' },
      { expr: 'hatto', earUp: true }
    );
    const kinds = ['water', 'litter', 'scale'];
    const pos = [[-1.25, 3.34, 1.3], [0.25, 3.60, 1.3], [1.62, 3.30, 1.3]];
    const icons = kinds.map((k, i) => {
      const ic = makeIconPlate(k);
      ic.position.set(...pos[i]);
      ic.scale.setScalar(0.82);
      ic.rotation.z = (i - 1) * 0.05;
      scene.add(ic);
      return { obj: ic, base: snapshot(ic) };
    });
    duoCam(14.0, 2.92);

    const rn = rig(neko), ri = rig(inu);
    return {
      duration: 7,
      update(u) {
        reset(rn); reset(ri);
        // ネコ: 呼吸しながら手で3回数える（①水 ②おしっこ ③体重）
        idle(rn, u, { k: 3, amp: 0.018 });
        sway(rn, u, { k: 1, roll: 0.035, shiftX: 0.025 });
        pawWave(rn, u, { k: 3, amp: 0.030, roll: 0.06 });
        pawTap(rn, u, [[0.16, 0.28], [0.34, 0.46], [0.52, 0.64]], { depth: 0.34 });
        // イヌ: ハッと気づく → 小さく跳ねる
        // ★ bounce（基準ドライバ）を先に、surprise（加算）を後に。
        //   逆順にすると bounce が surprise を上書きして「ハッ」が消える（実測で踏んだ）
        bounce(ri, u, { k: 3, height: 0.13, squash: 0.055, stretch: 0.045 });
        surprise(ri, u, { a: 0.03, b: 0.26 });
        earFlap(ri, u, { a: 0.05, b: 0.30, amp: 0.38, times: 1 });
        tailWag(ri, u, { k: 7, amp: 0.32 });
        // アイコン: 位相をずらしてふわふわ
        icons.forEach((ic, i) => floatProp(ic.obj, ic.base, u, { k: 1, amp: 0.11, ph: i / 3, roll: 0.035 }));
      },
    };
  },

  // 27-33s 猫がのんびり揺れる / 犬がこくりと2回うなずく + やわらかい緑の十字
  'cut-06': () => {
    const { neko, inu } = placeDuo({ expr: 'nonbiri' }, { expr: 'neutral' });
    const cross = makeCross();
    cross.position.set(0.20, 3.60, -1.7);
    cross.scale.setScalar(1.0);
    cross.rotation.z = 0.06;
    scene.add(cross);
    const crossBase = snapshot(cross);
    duoCam(13.9, 2.74);

    const rn = rig(neko), ri = rig(inu);
    rn.blink = addBlink(neko, 'neko', 'niko');
    return {
      duration: 6,
      update(u) {
        reset(rn); reset(ri);
        // ネコ: ゆったり左右に揺れる＋スローまばたき
        idle(rn, u, { k: 3, amp: 0.020 });
        sway(rn, u, { k: 1, roll: 0.070, shiftX: 0.065 });
        earIdle(rn, u, { k: 3, amp: 0.040 });
        blink(rn, u, [[0.26, 0.32], [0.70, 0.76]]);
        // イヌ: ゆっくり2回うなずく（納得）
        idle(ri, u, { k: 3, amp: 0.018 });
        nod(ri, u, { a: 0.12, b: 0.74, times: 2, amp: 0.19, lean: 0.055 });
        earIdle(ri, u, { k: 3, amp: 0.055 });
        tailWag(ri, u, { k: 4, amp: 0.22 });
        floatProp(cross, crossBase, u, { k: 1, amp: 0.09, roll: 0.030 });
      },
    };
  },

  // 33-40s 2人で笑顔・ふわっと同期して跳ねる
  'cut-07': () => {
    const { neko, inu } = placeDuo(
      { expr: 'niko', tilt: 0.04 },
      { expr: 'niko', tilt: -0.04, earUp: true }
    );
    const sp = addSparkles([
      [-1.85, 3.30, 0.3, 0.85], [-1.15, 3.80, -0.3, 0.6], [0.20, 3.42, 0.5, 0.7],
      [1.42, 3.86, -0.2, 0.75], [1.86, 3.12, 0.4, 0.95],
    ]);
    duoCam(13.9, 2.76);

    const rn = rig(neko), ri = rig(inu);
    return {
      duration: 6,
      update(u) {
        reset(rn); reset(ri);
        // 2人で同位相にふわっと跳ねる（イヌのほうが高く元気に）
        bounce(rn, u, { k: 3, height: 0.17, squash: 0.075, stretch: 0.055 });
        bounce(ri, u, { k: 3, height: 0.26, squash: 0.095, stretch: 0.075 });
        earIdle(rn, u, { k: 3, amp: 0.045 });
        earIdle(ri, u, { k: 3, amp: 0.10 });
        tailWag(ri, u, { k: 9, amp: 0.40 });
        twinkle(sp, u, { k: 3 });
      },
    };
  },
};

// ============================================================
// 実行: animate.mjs から window.__renderFrame(t) を呼ばれる
// ============================================================
const params = new URLSearchParams(location.search);
const shotName = params.get('shot') || 'cut-01';

try {
  if (!CUTS[shotName]) throw new Error('unknown animated cut: ' + shotName);
  const cut = CUTS[shotName]();
  const FPS = Number(params.get('fps')) || 30;

  window.__animMeta = { shot: shotName, duration: cut.duration, fps: FPS, frames: Math.round(cut.duration * FPS) };

  window.__renderFrame = (t) => {
    const u = ((t / cut.duration) % 1 + 1) % 1;    // 位相 [0,1)
    cut.update(u);
    renderer.render(scene, camera);
    return u;
  };

  // シェーダコンパイル / シャドウ安定のため数フレーム空回し（撮影はしない）
  for (let i = 0; i < 4; i++) window.__renderFrame(0);
  window.__animReady = true;
  window.__done = true;
} catch (e) {
  window.__err = String((e && e.message) || e);
}
