#!/usr/bin/env python3
"""tts.py — 1 セリフ = 1 WAV を合成する下請け（tts.mjs から呼ばれる）。

エンジンは **VOICEVOX CORE**（ニューラル合成）が既定。取得できていない環境では
pyopenjtalk（Open JTalk / HTS）にフォールバックする。

stdin から JSON を受け取り、stdout に JSON を返す。単体でも叩ける:

    echo '{"outDir":"/tmp/v","jobs":[{"id":"x","text":"ねこ","styleId":3}]}' \
      | .venv-voicevox/bin/python scripts/compose/tts.py

入力 job（VOICEVOX）:
  id            : 出力ファイル名（<outDir>/<id>.wav）
  text          : 読み上げる文字列（読み仮名版を渡す想定。tts.mjs が read フィールドを解決済み）
  styleId       : VOICEVOX のスタイルID（話者＝キャラ。`--speakers` で一覧が出る）
  speedScale    : 話速（1.0 = 標準。大きいほど速い）
  pitchScale    : ピッチ（0 = 標準。±0.05 程度で十分効く）
  intonationScale : 抑揚の強さ（1.0 = 標準。大きいほど起伏が大きい）
  pauseScale    : 読点「、」の無音を何倍にするか（1.0 = 標準。0.5 で半分）
  prePhonemeLength / postPhonemeLength : 前後の余白（秒）

⚠️ 間（ま）はエンジン側の pauseScale / pre / post で作る。**波形の無音を後から
   削る方式（旧 compress_pauses）は子音の立ち上がりを削る危険があるので使わない。**

出力 result:
  id / file / dur（秒）/ sr / kana（実際に読んだ読み＝誤読チェック用）/ mora（モーラ数）

⚠️ kana は **必ず目視すること**。漢字仮名交じり文は誤読する（例: 「年1〜2回」→「トシイチ〜ニカイ」）。
   誤読は script.config.mjs の `read:` に読み仮名を書いて直す（README「読み仮名の直し方」参照）。

⚠️ mora は「速すぎ／遅すぎ」を客観的に判断するための指標。日本語の自然な発話は
   おおむね **6〜8 モーラ/秒**（アナウンサーの朗読で 7.5 前後、早口で 9〜10）。
   話速をいじったら必ず tts.mjs のログでモーラ率を確認すること。
"""
import json
import os
import sys
import wave

import numpy as np

# ── VOICEVOX CORE の場所（リポジトリ直下に配置。README「VOICEVOX の入れ方」参照）──
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VV_DIR = os.path.join(REPO, ".voicevox")
VV_ORT = os.path.join(VV_DIR, "lib", "libonnxruntime.so.1.13.1")
VV_DICT = os.path.join(VV_DIR, "open_jtalk_dic_utf_8-1.11")

_core = None
_loaded_styles = set()


def voicevox_available() -> bool:
    """VOICEVOX を使えるかどうか。

    ⚠️ ここで素の `import voicevox_core` を試してはいけない。voicevox_core は import 時に
       `_rust.abi3.so` を読み、それが libonnxruntime.so.1.13.1 を要求するため、
       ONNX Runtime を先に開いていないと必ず ImportError になる（＝「入っているのに
       入っていない」と誤判定する）。存在チェックは find_spec で十分。
    """
    import importlib.util
    if not (os.path.exists(VV_ORT) and os.path.isdir(VV_DICT)):
        return False
    return importlib.util.find_spec("voicevox_core") is not None


def get_core():
    """VOICEVOX CORE を遅延初期化する（import 時点では触らない＝f0/mix モードを軽くするため）。"""
    global _core
    if _core is not None:
        return _core
    import ctypes
    # _rust.abi3.so が libonnxruntime.so.1.13.1 を SONAME で要求するので先に RTLD_GLOBAL で開く。
    # （LD_LIBRARY_PATH を呼び出し側に強制しないための措置）
    ctypes.CDLL(VV_ORT, mode=ctypes.RTLD_GLOBAL)
    from voicevox_core import AccelerationMode, VoicevoxCore
    _core = VoicevoxCore(acceleration_mode=AccelerationMode.CPU, open_jtalk_dict_dir=VV_DICT)
    return _core


def write_wav(path: str, x: np.ndarray, sr: int) -> None:
    """float/int16 の 1ch 配列を 16bit PCM WAV で書き出す。"""
    peak = float(np.max(np.abs(x))) if x.size else 0.0
    if peak > 0:
        # クリップ回避のうえ -3dBFS 程度に揃える（最終段で loudnorm するので大まかでよい）
        x = x / peak * 0.7
    write_wav_nonorm(path, x, sr)


def write_wav_nonorm(path: str, x: np.ndarray, sr: int) -> None:
    pcm = np.clip(x * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def trim_silence(x: np.ndarray, sr: int, pad: float = 0.02, thresh: float = 0.01) -> np.ndarray:
    """前後の無音を落とす。

    間の長さは tts.mjs 側の GAP で統一したいので、素材側の余白はここで取り除く。
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


def read_wav(path: str):
    """16bit PCM mono WAV を float 配列で読む。"""
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    return x, sr


def wav_bytes_to_array(b: bytes):
    """VOICEVOX が返す WAV バイト列を float 配列にする。"""
    import io
    with wave.open(io.BytesIO(b), "rb") as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        raw = w.readframes(w.getnframes())
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    return x, sr


def synth_voicevox(job: dict, sr: int):
    """AudioQuery を作って韻律を調整してから合成する。

    speed_scale で話速、pause_mora.vowel_length で読点の間を直接いじる。
    ⚠️ 「合成してから波形を切る」のではなく **合成前のクエリを直す**のが要点。
       音素長そのものが変わるので、早口にしても音が痩せない。
    """
    core = get_core()
    style = int(job["styleId"])
    if style not in _loaded_styles:
        core.load_model(style)
        _loaded_styles.add(style)

    q = core.audio_query(job["text"], style)
    q.speed_scale = float(job.get("speedScale", 1.0))
    q.pitch_scale = float(job.get("pitchScale", 0.0))
    q.intonation_scale = float(job.get("intonationScale", 1.0))
    q.volume_scale = float(job.get("volumeScale", 1.0))
    q.pre_phoneme_length = float(job.get("prePhonemeLength", 0.02))
    q.post_phoneme_length = float(job.get("postPhonemeLength", 0.05))
    q.output_sampling_rate = sr
    q.output_stereo = False

    # 読点の間を詰める。pause_mora はアクセント句の切れ目に入る無音モーラ。
    pause_scale = float(job.get("pauseScale", 1.0))
    if abs(pause_scale - 1.0) > 1e-9:
        for ap in q.accent_phrases:
            if ap.pause_mora is not None:
                ap.pause_mora.vowel_length *= pause_scale

    # 読み（カナ）とモーラ数をクエリから復元する＝実際に合成された読みそのもの
    kana_parts, mora = [], 0
    for ap in q.accent_phrases:
        kana_parts.append("".join(m.text for m in ap.moras))
        mora += len(ap.moras)
        if ap.pause_mora is not None:
            kana_parts.append("、")
    wav = core.synthesis(q, style)
    x, out_sr = wav_bytes_to_array(wav)
    return x, out_sr, "".join(kana_parts), mora


def synth_openjtalk(job: dict):
    """フォールバック: pyopenjtalk（Open JTalk / HTS mei_normal）。

    VOICEVOX CORE が置かれていない環境でもパイプラインが通るように残してある。
    音質はニューラル合成に大きく劣る（棒読み）ので、常用しないこと。
    """
    import pyopenjtalk
    x, sr = pyopenjtalk.tts(
        job["text"],
        speed=float(job.get("speed", 1.0)),
        half_tone=float(job.get("halfTone", 0.0)),
    )
    x = np.asarray(x, dtype=np.float64)
    if x.max() > 1.5 or x.min() < -1.5:  # pyopenjtalk は int16 スケールで返す
        x = x / 32768.0
    kana = pyopenjtalk.g2p(job["text"], kana=True)
    return x, sr, kana, len(kana.replace("、", "").replace("・", ""))


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


def list_speakers() -> None:
    """利用できる話者・スタイルの一覧（styleId を調べる用）。"""
    get_core()
    import voicevox_core
    for m in voicevox_core.METAS:
        styles = ", ".join(f"{s.name}={s.id}" for s in m.styles if s.id < 3000)
        print(f"{m.name}\t{styles}")


def main() -> None:
    if "--speakers" in sys.argv:
        list_speakers()
        return
    if "--check" in sys.argv:
        print("voicevox" if voicevox_available() else "openjtalk")
        return

    spec = json.load(sys.stdin)
    mode = spec.get("mode")
    if mode == "mix":
        mix(spec)
        return
    if mode == "f0":
        f0_report(spec)
        return

    engine = spec.get("engine", "voicevox")
    if engine == "voicevox" and not voicevox_available():
        raise SystemExit(
            "VOICEVOX CORE が見つからない。README「VOICEVOX の入れ方」を実行するか、"
            "engine:'openjtalk' で呼ぶこと。"
        )
    sr = int(spec.get("sr", 48000))
    out_dir = spec["outDir"]
    os.makedirs(out_dir, exist_ok=True)

    results = []
    for job in spec["jobs"]:
        if engine == "voicevox":
            x, out_sr, kana, mora = synth_voicevox(job, sr)
        else:
            x, out_sr, kana, mora = synth_openjtalk(job)
        x = trim_silence(x, out_sr)
        path = os.path.join(out_dir, f"{job['id']}.wav")
        write_wav(path, x, out_sr)
        dur = len(x) / out_sr
        results.append({
            "id": job["id"],
            "file": path,
            "dur": dur,
            "sr": out_sr,
            "text": job["text"],
            "kana": kana,
            "mora": mora,
            "moraPerSec": (mora / dur) if dur > 0 else 0.0,
        })

    json.dump({"engine": engine, "results": results}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
