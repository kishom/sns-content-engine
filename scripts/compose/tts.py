#!/usr/bin/env python3
"""tts.py — pyopenjtalk で 1 セリフ = 1 WAV を合成する下請け（tts.mjs から呼ばれる）。

stdin から JSON を受け取り、stdout に JSON を返す。単体でも叩ける:

    echo '{"outDir":"/tmp/v","jobs":[{"id":"x","text":"ねこ","speed":1.0,"halfTone":0}]}' \
      | python3 scripts/compose/tts.py

入力 job:
  id       : 出力ファイル名（<outDir>/<id>.wav）
  text     : 読み上げる文字列（読み仮名版を渡す想定。tts.mjs が read フィールドを解決済み）
  speed    : 話速（1.0 = 標準。小さいほどゆっくり）
  halfTone : ピッチ（半音単位。負で低く）
  maxPause : セリフ内部の無音の上限（秒）。0 で無効

出力 result:
  id / file / dur（秒）/ sr / kana（pyopenjtalk が実際に読んだ読み＝誤読チェック用）

⚠️ kana は **必ず目視すること**。漢字仮名交じり文は誤読する（例: 「年1〜2回」→「トシイチ〜ニカイ」）。
   誤読は script.config.mjs の `read:` に読み仮名を書いて直す（README「読み仮名の直し方」参照）。
"""
import json
import os
import sys
import wave

import numpy as np
import pyopenjtalk


def write_wav(path: str, x: np.ndarray, sr: int) -> None:
    """float/int16 の 1ch 配列を 16bit PCM WAV で書き出す。"""
    peak = float(np.max(np.abs(x))) if x.size else 0.0
    if peak > 0:
        # クリップ回避のうえ -3dBFS 程度に揃える（最終段で loudnorm するので大まかでよい）
        x = x / peak * 0.7
    pcm = np.clip(x * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def trim_silence(x: np.ndarray, sr: int, pad: float = 0.03, thresh: float = 0.01) -> np.ndarray:
    """前後の無音を落とす（HTS合成は前後に sil 区間が付く）。

    間の長さは tts.mjs 側の GAP で統一したいので、素材側の無音はここで取り除く。
    pad 秒だけ残して切る（子音の立ち上がりを削らないため）。
    """
    if x.size == 0:
        return x
    amp = np.abs(x)
    loud = np.flatnonzero(amp > thresh * float(amp.max()))
    if loud.size == 0:
        return x
    p = int(pad * sr)
    return x[max(0, loud[0] - p): min(x.size, loud[-1] + p)]


def compress_pauses(x: np.ndarray, sr: int, max_pause: float, thresh: float = 0.01) -> np.ndarray:
    """セリフ内部の長すぎる無音を max_pause 秒まで詰める。

    Open JTalk は読点「、」で 0.5〜0.65 秒の間を入れる。ショート動画では
    これが積み重なると「間延び」して見えるので、句読点の呼吸は残しつつ短くする。
    """
    if x.size == 0 or max_pause <= 0:
        return x
    amp = np.abs(x)
    quiet = amp <= thresh * float(amp.max())
    keep = np.ones(x.size, dtype=bool)
    limit = int(max_pause * sr)
    i = 0
    while i < x.size:
        if not quiet[i]:
            i += 1
            continue
        j = i
        while j < x.size and quiet[j]:
            j += 1
        if j - i > limit:
            # 無音区間の中央を削り、前後に limit/2 ずつ残す（立ち上がり／余韻を壊さない）
            half = limit // 2
            keep[i + half: j - (limit - half)] = False
        i = j
    return x[keep]


def read_wav(path: str):
    """16bit PCM mono WAV を float 配列で読む。"""
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    return x, sr


def mix(spec: dict) -> None:
    """セグメントを絶対時刻に並べて 1 本のトラックにする（重なりは無い前提の単純加算）。

    ffmpeg の amix を使わないのは、この同梱ビルド（2018年版）に normalize オプションが無く
    入力数でレベルが下がるため。numpy で置くほうがサンプル単位で正確。
    """
    sr = int(spec.get("sr", 48000))
    total = int(round(float(spec["total"]) * sr))
    buf = np.zeros(total, dtype=np.float64)
    for p in spec["place"]:
        x, xsr = read_wav(p["file"])
        if xsr != sr:
            raise SystemExit(f"サンプリングレート不一致: {p['file']} = {xsr} (期待 {sr})")
        at = int(round(float(p["at"]) * sr))
        end = min(at + x.size, total)
        if end <= at:
            continue
        if at + x.size > total:
            print(f"警告: {p['file']} が全体尺からはみ出す（切り詰め）", file=sys.stderr)
        buf[at:end] += x[: end - at]
    peak = float(np.max(np.abs(buf))) if buf.size else 0.0
    if peak > 0.98:
        buf = buf / peak * 0.98
    write_wav_nonorm(spec["out"], buf, sr)
    json.dump({"out": spec["out"], "dur": total / sr, "peak": peak}, sys.stdout)


def write_wav_nonorm(path: str, x: np.ndarray, sr: int) -> None:
    pcm = np.clip(x * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def yin_f0(x: np.ndarray, sr: int, fmin: float = 60, fmax: float = 500, thresh: float = 0.15) -> float:
    """YIN（累積平均正規化差分）でF0の中央値を出す。

    ⚠️ 素朴な自己相関のピーク取りは倍音を掴んでオクターブを誤り、
       「2キャラのピッチ差が 0.4 半音しかない」といった誤った結論になる（実際にやらかした）。
       声の作り分けを検証するときは必ずこちらを使う。
    """
    win = int(0.045 * sr)
    hop = int(0.03 * sr)
    tmax, tmin = int(sr / fmin), int(sr / fmax)
    out = []
    for i in range(0, len(x) - win - tmax, hop):
        fr = x[i:i + win]
        if np.sqrt(np.mean(fr ** 2)) < 0.03:
            continue
        d = np.empty(tmax)
        for tau in range(1, tmax):
            diff = fr - x[i + tau:i + tau + win]
            d[tau] = np.dot(diff, diff)
        d[0] = 1
        cs = np.cumsum(d[1:])
        dp = np.ones(tmax)
        dp[1:] = d[1:] * np.arange(1, tmax) / np.maximum(cs, 1e-12)
        cand = [t for t in range(tmin, tmax) if dp[t] < thresh]
        tau = cand[0] if cand else int(np.argmin(dp[tmin:tmax])) + tmin
        out.append(sr / tau)
    return float(np.median(out)) if out else 0.0


def f0_report(spec: dict) -> None:
    """話者ごとのF0中央値を出して、2キャラが実際に聞き分けられるかを数値で確認する。"""
    per = {}
    for g in spec["groups"]:
        vals = []
        for f in g["files"]:
            x, sr = read_wav(f)
            v = yin_f0(x, sr)
            if v:
                vals.append(v)
        per[g["name"]] = float(np.median(vals)) if vals else 0.0
    names = list(per)
    semitones = None
    if len(names) == 2 and all(per[n] > 0 for n in names):
        semitones = 12 * float(np.log2(per[names[1]] / per[names[0]]))
    json.dump({"f0": per, "semitones": semitones}, sys.stdout, ensure_ascii=False)


def main() -> None:
    spec = json.load(sys.stdin)
    if spec.get("mode") == "mix":
        mix(spec)
        return
    if spec.get("mode") == "f0":
        f0_report(spec)
        return
    out_dir = spec["outDir"]
    os.makedirs(out_dir, exist_ok=True)

    results = []
    for job in spec["jobs"]:
        text = job["text"]
        x, sr = pyopenjtalk.tts(
            text,
            speed=float(job.get("speed", 1.0)),
            half_tone=float(job.get("halfTone", 0.0)),
        )
        x = np.asarray(x, dtype=np.float64)
        if x.max() > 1.5 or x.min() < -1.5:  # pyopenjtalk は int16 スケールで返す
            x = x / 32768.0
        x = trim_silence(x, sr)
        x = compress_pauses(x, sr, float(job.get("maxPause", 0.0)))
        path = os.path.join(out_dir, f"{job['id']}.wav")
        write_wav(path, x, sr)
        results.append({
            "id": job["id"],
            "file": path,
            "dur": len(x) / sr,
            "sr": sr,
            "text": text,
            "kana": pyopenjtalk.g2p(text, kana=True),
        })

    json.dump({"results": results}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
