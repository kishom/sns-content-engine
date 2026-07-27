# 03-evidence — エビデンス検証記録（犬の歯周病リール）

**対象テーマ:** 犬の歯周病（periodontal disease in dogs）
**検証日:** 2026-07-27
**検証者:** clinical-evidence-writer（獣医療エビデンス・ライター）
**対象種:** **犬（*Canis lupus familiaris*）のみ。** 猫・その他の種には適用しない。人の歯周病の知見は本記録に一切持ち込んでいない（→ §7-3）。
**工程上の位置:** `02-script` を**書く前**の先行検証（`docs/evidence-workflow.md` の初の「前倒し適用」）。
**本セッションの内訳:** **A=0件 / B=17件 / C=6件**（判定不能・要分割を含め全23主張）

---

## 0. この検証の限界（最初に読むこと・省略不可）

### 0-1. 一次資料への直接アクセスは**1件もできなかった**（前回と同じ）

作業冒頭に、本テーマで最も重要な4ホストへ WebFetch を試行した。**4件すべて HTTP 403（組織のegressポリシーによる遮断）**。

| ホスト | 用途 | 結果 | 試行日 |
|---|---|---|---|
| `avdc.org` | AVDC ポジションステートメント（無麻酔スケーリング） | ❌ 403 | 2026-07-27 |
| `wsava.org` | WSAVA Global Dental Guidelines 2020 | ❌ 403 | 2026-07-27 |
| `todaysveterinarypractice.com` | 臨床レビュー（前回「到達しやすい傾向」と記録した先） | ❌ 403 | 2026-07-27 |
| `www.aaha.org` | AAHA 2019 Dental Care Guidelines | ❌ 403 | 2026-07-27 |

→ **前回（2026-07-22 猫CKD）から状況は変わっていない。** `evidence-workflow.md` §6 の到達実績表に、上記4ホストを「❌ 403（2026-07-27 実測）」として追記すること。特に **Today's Veterinary Practice の「未試行／到達しやすい傾向」という記載は誤り**なので修正が必要。

`/root/.ccr/README.md` の規定により 403 は組織ポリシーによる拒否であり**迂回しない**。本検証で使えた手段は **WebSearch（検索結果とその要約）のみ**。

### 0-2. したがって**判定Aは1件も付かない**

本記録に出てくる英文・和文は、すべて**検索エンジンが返した要約・スニペット**であり、**原典を開いて照合したものではない**。

- 本記録の記述を、**原文の逐語引用として台本・キャプション・公開物に転記してはならない**。
- 併記したURLは「そこにありそう」という当たり付けであり、**開いて確認していない**。
- 同趣旨が複数クエリで返っても、**同一の二次ページを情報源にしている可能性**は消えない。

> **この記録の正しい使い方:** 「どの主張が使えて、どの主張が地雷か」の切り分け（→ §4）と、台本の構成方針の決定（→ §5）まで。原典確定は egress 開通後（→ §6）。

### 0-3. 本テーマ固有の注意（前回より難易度が高い理由）

犬の歯周病は **①「よく引用されるが出典を辿れない数字」の巣窟**であり、**②規制・法令が絡み（無麻酔スケーリング）**、**③商業インセンティブが強い**（デンタルガム・サプリ・無麻酔サービス・シーウィード製品等）。検索結果の上位が**商用サイトで埋まる度合いが猫CKDより明確に高かった**。この3点が、本記録でC判定が6件に増えた主因。

---

## 1. 判定基準（workflow §3 に準拠）

| 判定 | 定義 | 台本での扱い |
|---|---|---|
| **A** | 一次資料に**実アクセスして**該当記述を確認。原文引用を保持 | 限定なしで使える（対象種の併記は必須） |
| **B** | 到達できていないが、検索結果が一次資料由来として提示した記述があり複数経路で整合。**原文照合は未了** | ヘッジ表現つきで使える。断定にしない |
| **C** | 一次資料が見つからない／二次情報しか出てこない／**反証寄りの情報がある**／**出典間で桁が動く** | **台本から削るか主張を弱める。** 獣医師レビュー無しに公開しない |

---

## 2. 主張一覧（サマリー）

> 依頼で提示された7つの出発点は、検証の過程で**23主張に分解**された（数字は必ず単独主張として立てる／列挙は要素ごとに割る、の原則による）。

| # | 主張（すべて対象種＝犬） | 判定 | 台本 | 一言 |
|---|---|---|---|---|
| 1a | 犬の歯周病は成犬でとても多い（最も多い口腔疾患のひとつ） | **B** | ○ | 質的表現なら安全 |
| 1b | **「3歳以上の80%（8割・大半）」という具体数字** | **C** | ✕ | **一次資料に辿れない。出典間で12.5%〜100%。→ §3-1b 必読** |
| 1c | 歯周病変の割合は「何を数えるか」で大きく変わる | **B** | △ | 台本には重いが、企画判断の前提として重要 |
| 2 | 口臭は歯周病のサインのことがある | **B** | ○ | 入口として最適。断定はしない |
| 3 | 口臭の主因は歯垢中の細菌が出す揮発性硫黄化合物 | **B** | △ | 尺があれば。無くても成立 |
| 4a | 初期の歯肉炎は可逆（元に戻りうる） | **B** | ○ | **本テーマの希望パート。強く推奨** |
| 4b | 進行した歯周炎（付着・骨の喪失）は不可逆 | **B** | ○ | 4a とセットで初めて意味を持つ |
| 5 | 犬は口の痛みを表に出しにくく、進行しても普通に食べていることがある | **C** | △ | 一次資料が取れず。**弱めるか 6a に置換** |
| 6a | 歯周病は歯肉の下（縁下）で進行し、口を開けて見るだけでは評価できない | **B** | ○ | 5 の代替として機能する。こちらを使う |
| 6b | **「歯科疾患の40%は歯肉縁下でX線でしか見えない」** | **C** | ✕ | 出所が動物病院ブログのみ。数字を出さない |
| 7a | 犬で、歯周病と腎・肝・心の組織学的変化との**関連**が報告されている | **B** | △ | 使うなら「関連が報告されている」まで |
| 7b | **歯周病が心臓病・腎臓病を「引き起こす」** | **C** | ✕ | **因果は示されていない。絶対に言わない。→ §3-7** |
| 8 | 歯磨きは頻度が高いほど有効（毎日・1日おきは週1・隔週より有意に良好） | **B** | ◎ | **本テーマで最も裏付けが厚い。台本の軸候補** |
| 9 | 毎日の歯磨きが家庭ケアの標準（gold standard）とされている | **B** | ○ | 8 と同方向。学会側の言い方 |
| 10 | 毎日磨いていても、麻酔下の処置が不要になるわけではない | **B** | ○ | 過剰な期待を防ぐ。**削らない** |
| 11 | **すでに歯肉が炎症している口をブラッシングすると痛みと嫌悪を生む** | **B** | ◎ | **他社コンテンツがほぼ触れない差別化点。→ §5** |
| 12 | 小型犬ほど歯周病のリスクが高い（体重が小さいほどオッズが高い） | **B** | ○ | 日本の飼育構成に刺さる |
| 12b | **「超小型犬は大型犬の最大5倍」という数字** | **C** | ✕ | 条件付き比較。単独で出すと誤解を招く |
| 13 | 短頭種は非短頭種よりリスクが高い | **B** | △ | 支持されるが**効果量は小さい**（体格ほどではない） |
| 14 | 日本の保険請求データでも、加齢とともに歯周病の請求率が上がる | **B** | ○ | 日本の視聴者に最も近い資料 |
| 15 | 無麻酔の歯石除去は、獣医団体が不適切としている | **B** | ○ | **AVDC・AAHA の2団体が独立に明言。→ 次弾推奨** |
| 16 | 無麻酔では歯肉縁下の清掃と全口腔の評価ができない | **B** | ○ | 15 の理由。事実ベースで批判色が薄い |
| 17 | 無麻酔では気管挿管がないため誤嚥のリスクがある | **B** | △ | 尺が要る。次弾向き |
| 18 | **日本では、スケーラーを用いた歯石除去は「診療行為」＝獣医師以外が行うのは獣医師法違反** | **B** | ○ | **農水省FAQが典拠。制度なので「時点」明記が必須** |
| 19 | VOHC認定のデンタルガム等には歯垢・歯石の抑制効果が試験で示されている | **B** | ○ | **認定制度の存在**を伝えるのが誠実 |
| 19b | **「VOHCの基準は◯%以上の減少」という数字** | **C** | ✕ | 検索結果内で10%と15%が食い違った |
| 20 | ガム・おもちゃは歯磨きの代替にはならない | **B** | ○ | 19 とセットで必須 |
| 21a | 硬すぎるもの（骨・鹿角・蹄・硬いナイロン）は歯の破折の原因になる | **B** | ○ | 「良かれと思って」を止められる実用情報 |
| 21b | 「親指の爪で押してへこまない硬さは硬すぎる」の目安 | **B**（専門家意見） | △ | 便利だが**試験で検証された基準ではない**と記録 |
| 22 | AAHAは1歳（猫・小型犬）／2歳（大型犬）からの年1回以上の麻酔下歯科処置を推奨 | **B** | ○ | 受診導線の根拠になる |

**台本に使える（◎○）= 15 / 条件付き（△）= 6 / 使わない（✕）= 5**（#1c は台本外の企画前提）

---

## 3. 主張ごとの詳細

### 主張 1a / 1b / 1c ── 「3歳以上の犬の大半に歯周病変」⚠️ 本テーマ最大の地雷

- **判定:** 1a = **B**（質的な「とても多い」）／ **1b = C**（「80%」「8割」「大半」という量的表現）／ 1c = B
- **検索結果が提示した記述（原文未照合・出所ごとに列挙）:**
  - 「over 80% of dogs and cats by three years of age」— PubMed 41712493（2026-02 の総説とされる）
  - 「prevalence of 80–89% in dogs over 3 years of age」— スウェーデンの飼い主アンケート研究（PMC7297050）の背景記述として
  - 「80% of dogs have some level of periodontal disease by age 2」— Merck Veterinary Manual 由来として（**年齢が2歳になっている**）
  - 「80% to 90% ... by age three」— AVMA 由来として
  - 「Studies from previous decades listed the prevalence at 60-70%」「a 2018 study found that almost 90%」「another 2018 study using more accurate diagnostics found evidence in **100%** of canine subjects」— Today's Veterinary Practice 由来として
  - 「53% of dogs aged 1-2 and **87% of dogs by age 3** have periodontal **bone loss**」— 同上
  - 「1-year period prevalence for **diagnosis** with periodontal disease was **12.52%**」— O'Neill 2021, VetCompass, n=22,333（JSAP）
- **URL（すべて未アクセス）:** https://pubmed.ncbi.nlm.nih.gov/41712493/ ／ https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7297050/ ／ https://onlinelibrary.wiley.com/doi/full/10.1111/jsap.13405 ／ https://todaysveterinarypractice.com/dentistry/practical-dentistry-periodontal-disease-utilizing-current-information-to-improve-client-compliance/
- **アクセス可否:** ❌ 全件403または未到達
- **備考（重要・依頼で名指しされた論点への回答）:**
  1. **「80%」の一次資料は、本セッションでは特定できなかった。** 検索で出てくるのは AVMA・Merck・Cornell・VCA・動物病院ブログといった**二次的な引用**ばかりで、**元の疫学研究に辿り着けない**。数字の出所を問う検索（"myth" "questionable origin" 等）を明示的に投げたが、**起源を検証した文献も、起源そのものも出てこなかった**。＝ **循環引用の疑いが濃い。**
  2. **年齢の閾値が資料間で動く。** 「3歳」「2歳」が混在。
  3. **割合が資料間で 12.5% 〜 100% まで動く。** ただしこれは**測っているものが違う**ことが大きい:
     - **12.52%** = 一次診療の記録に「歯周病」と**診断名が付いた**割合（1年間）
     - **80〜90%** = 何らかの歯周病変が**ある**とされる割合
     - **87%** = 3歳時点で**骨吸収**が認められる割合
     - **100%** = 精密な診断法（歯科X線等）を使った場合
     つまり「有病率」は**診断の精度と定義に完全に依存する**。前回の猫CKD（20〜50%／40%／80%）と同じ構図だが、**本テーマは幅がさらに大きい（8倍）**。
  4. **結論:** **リールで「3歳以上の80%」「8割」「大半」を出さない。** 数字を出した瞬間、①出典を聞かれて答えられない ②別の数字を持つ人に反証される、の二重リスクを負う。**「成犬ではとても多いと言われている」で十分に伝わる**（猫CKD回で数値を出さなかった判断がそのまま正解として通用する）。
  5. ただし **1a（とても多い）自体は複数の独立した系統が同方向を示しており B。** 「多い」というメッセージを弱める必要はない。**弱めるべきは数字だけ。**

### 主張 2 ── 口臭は歯周病のサインのことがある

- **判定:** B
- **検索結果が提示した記述（原文未照合）:**
  - 「Oral malodor (halitosis) is one of the first signs of periodontitis in dogs」
  - 「halitosis is the first chance for owners to notice the presence of periodontal disease」
  - 「The most common cause of halitosis is periodontal disease caused by plaque (bacteria)」
- **候補一次資料（未アクセス）:**
  - "Oral malodor and its relevance to periodontal disease in the dog" — PubMed 10518872 https://pubmed.ncbi.nlm.nih.gov/10518872/
  - "Halitosis in Dogs and the Effect of Periodontal Therapy" — *J Nutr* https://jn.nutrition.org/article/S0022-3166(23)02299-X/fulltext
  - UC Davis School of Veterinary Medicine「Halitosis in Dogs」（**飼い主向け解説**。一次資料と同列にしない）
- **アクセス可否:** ❌ 全件未アクセス
- **備考:** 飼い主が自宅で気づける唯一の入口として、コンテンツ価値が非常に高い。ただし**「口が臭い＝歯周病」ではない**（口腔腫瘍、消化器・腎疾患由来、食餌性など他の原因がある）。**猫CKD回の「ほかの病気のこともある」に相当する鑑別ヘッジを、本テーマでも必ず入れる。** *J Nutr* の論文は栄養学系ジャーナル掲載＝**フード会社の関与が想定される**ため、出典として使う場合は資金源の確認が要る。

### 主張 3 ── 口臭の主因は歯垢中の細菌が出す揮発性硫黄化合物

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「The high levels of H₂S and CH₃SH produced by *P. gulae* and other *Porphyromonas* spp. contribute to halitosis」
- **候補一次資料:** "Volatile Sulfur Compounds Produced by the Anaerobic Bacteria *Porphyromonas* spp. Isolated from the Oral Cavities of Dogs" — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10458929/
- **アクセス可否:** ❌ 403
- **備考:** 機序として妥当だが、**40秒リールでは尺を食うだけで行動が変わらない**。ネコネコの一言（「あのニオイ、正体は細菌が出すガスなんだよ」）に圧縮できるなら可、それ以上は不要。

### 主張 4a / 4b ── 歯肉炎は可逆、歯周炎は不可逆

- **判定:** 両方 B
- **検索結果が提示した記述（原文未照合）:**
  - 「Gingivitis, the initial stage of periodontal disease, is a reversible inflammatory condition」「gingivitis is the only stage that is reversible」
  - 「periodontitis is a destructive and irreversible form ... resulting in tissue destruction in the periodontal ligament, cementum, alveolar bone, and gingiva」
  - AVDC ステージ分類として提示されたもの: Stage 1 = 付着喪失なし／Stage 2 = 付着喪失25%未満／Stage 3 = 中等度〜進行／Stage 4 = 付着喪失50%超・動揺
- **アクセス可否:** ❌ 一次資料（AVDC の Stage 定義原文、WSAVA 2020）は未アクセス
- **備考:** **本テーマで唯一の「良い知らせ」であり、行動を促す最大の動機。**「もう手遅れ」と思わせないために必須。同時に 4b（不可逆）とセットにして初めて「今やる理由」になる。**片方だけ出さない。** なお検索上位は dvm360 のプロシーディング・Today's Veterinary Nurse・動物病院サイト・海藻サプリ販売サイトが混在しており、**海藻サプリ等の商用ページは根拠として一切採用していない**。

### 主張 5 ── 犬は口の痛みを表に出さず、進行しても普通に食べる ⚠️

- **判定:** **C（一次資料が取れなかった）**
- **検索で出てきたもの:** Bond Vet・BluePearl・wellpets・Houston Pet Dental・Reed Animal Hospital・Adamson・PetMD ＝ **ほぼ全てが動物病院・企業の飼い主向けブログ**。Cornell（大学付属）も結果一覧には出たが、**この主張を述べているかは未確認**。学会指針・査読文献は1件も出てこなかった。
- **備考:** 臨床的にはよく語られ、経験的にも妥当性が高いが、**現時点で示せる根拠が二次情報しかない**。
  - **対処:** この主張を**主張6a（縁下で進行するので見ただけでは分からない）に置き換える。** 6a は AVDC/AAHA が無麻酔スケーリングを否定する理由として独立に述べており、根拠が厚い。**飼い主に届くメッセージ（＝見た目や食欲では判断できない）はほぼ同じで、根拠は格段に強くなる。**
  - どうしても使う場合は「ふつうに食べていても、口の中では進んでいることがある**と言われている**」まで弱め、獣医師レビューに回す。

### 主張 6a / 6b ── 歯肉の下で進行する／「40%はX線でしか見えない」

- **判定:** 6a = **B** ／ **6b = C**
- **検索結果が提示した記述（原文未照合）:**
  - 6a側: 「access to the subgingival area of every tooth is impossible in an unanesthetized canine or feline patient」「A complete oral examination ... is not possible in an unanesthetized patient」（AVDC ポジションステートメント由来として）
  - 6b側: 「40% of dogs' and cats' dental disease is under the gumline and can only be seen on dental X-rays」— **出所は動物病院ブログのみ**
- **アクセス可否:** ❌ AVDC・AAHA いずれも403
- **備考:** **6a は使う。6b の「40%」は使わない。** 主張1b と同じ理由（数字の出所が辿れない）。「見えているところだけでは分からない」という質的表現で全く同じ効果が出る。

### 主張 7a / 7b ── 全身への影響 ⚠️ 依頼で名指しされた論点

- **判定:** 7a（**関連**が報告されている）= **B** ／ **7b（歯周病が全身疾患を引き起こす）= C**
- **検索結果が提示した記述（原文未照合）:**
  - 関連側: 「A significant correlation between periodontal disease burden and histopathological changes in internal organs was identified, particularly in the atrioventricular valves, the liver, the myocardium and the kidneys」「for each square centimeter of periodontal disease burden, there was a 1.2 and 1.4 times higher likelihood for greater liver and kidney pathology」
  - 関連側: 「Glickman and contributors described a positive relationship between periodontal disease and azotemic chronic kidney disease in dogs」
  - **反証・限定側（最重要）:** 「Although an association between periodontal and cardiac disease was demonstrated, **a specific causal relationship cannot be proven**」「Evidence-based research directly connecting periodontal disease to a **causal** relationship with systemic disease is challenging to validate and substantiate」「this remains an **association** rather than a proven causal relationship」
- **候補一次資料（すべて犬が対象・未アクセス）:**
  - DeBowes LJ, et al. "Association of periodontal disease and histologic lesions in multiple organs from 45 dogs." *J Vet Dent* 1996. — https://pubmed.ncbi.nlm.nih.gov/9520780/
  - Glickman LT, et al. "Evaluation of the risk of endocarditis and other cardiovascular events on the basis of the severity of periodontal disease in dogs." *JAVMA* 2009;234(4):486. — https://avmajournals.avma.org/view/journals/javma/234/4/javma.234.4.486.xml
  - Pavlica Z, et al.（2008）「Relation between periodontal disease and systemic diseases in dogs」系の記述 — https://www.sciencedirect.com/science/article/abs/pii/S003452881930219X
  - Rawlinson JE, et al. "Association of periodontal disease with systemic health indices in dogs and the systemic response to treatment of periodontal disease."
  - Niemiec BA. "The Relationship Between Periodontal Infection and Systemic and Distant Organ Disease in Dogs." *Vet Clin North Am Small Anim Pract* 2021. — https://pubmed.ncbi.nlm.nih.gov/34838247/
- **アクセス可否:** ❌ 全件未アクセス
- **備考（飼い主向けにどこまで言ってよいか — 結論）:**
  1. **言える:** 「口の中だけの問題ではないかもしれない、という報告がある」「歯周病の程度と、ほかの臓器の変化との**関連**が犬で報告されている」
  2. **言えない:** 「歯周病が心臓病になる」「腎臓を壊す」「寿命が縮む」「歯を治せば心臓が良くなる」。**因果は示されていないと、レビュー自身が明言している。**
  3. **やってはいけない外挿:** 人医学には歯周病と動脈硬化性心血管疾患の膨大な文献がある（検索でも PMC の人の論文が多数ヒットした）。**これらを犬の話として引かない。** 本記録で採用したのは**すべて犬を対象とした研究**であり、人のデータは1件も使っていない。
  4. **40秒での推奨:** **この論点は今回の台本に入れない。** 理由は3つ — ①正しく言おうとすると「関連はあるが因果は不明」という長い留保が必要で、40秒に入らない ②留保を削ると誇大表現になり `vet-marketing-compliance` を通らない ③この論点なしでも「歯肉炎は元に戻る／進んだら戻らない」という直接的で強い動機が既にある。**単独回にするか、恒久的に扱わないかは獣医師レビューで判断。**

### 主張 8 ── 歯磨きは頻度が高いほど有効 ★本テーマで最も裏付けが厚い

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「the efficacy of brushing the teeth of beagle dogs was evaluated for 4 brushing frequencies: brushing daily, brushing every other day, brushing weekly and brushing every other week, compared with no brushing in a control group」「Brushing more frequently had greater effectiveness in retarding accumulation of plaque and calculus, and reducing the severity of pre-existing gingivitis. Brushing **daily or every other day** produced **statistically significant** improved results compared with brushing weekly or every other week」
- **候補一次資料:** **Harvey C, Serfilippi L, Barnvos D. "Effect of Frequency of Brushing Teeth on Plaque and Calculus Accumulation, and Gingivitis in Dogs." *J Vet Dent* 2015;32(1):16-21. PMID 26197686** — https://pubmed.ncbi.nlm.nih.gov/26197686/ ／ https://journals.sagepub.com/doi/abs/10.1177/089875641503200102
- **アクセス可否:** ❌ 403（SAGE・PubMed とも）
- **備考:**
  - **対象種＝犬（ビーグル）で、頻度を比較した実験研究。** 本テーマで唯一「比較して差が出た」タイプの根拠であり、**推奨する台本の軸**（→ §5）。
  - **限界（記録として残す）:** ビーグルを用いた実験環境での試験であり、**一般家庭の多犬種・多様な口腔状態にそのまま当てはまるかは別問題**。犬から犬への外挿ではあるが、犬種・年齢・既存の歯周状態は揃っていない。台本では品種に触れないため実害はないが、**「毎日磨けば必ず防げる」という言い方はこの研究から導けない**（防止ではなく、蓄積の遅延と歯肉炎の軽減）。
  - **関連（未検証・参考）:** グレイハウンドで週1・毎日のブラッシングが歯肉炎と歯石を減らしたとする研究（PMC8300175）、3つの歯垢コントロール法の無作為化盲検試験（Allan 2019, JSAP, DOI 10.1111/jsap.12964）。いずれも未アクセス。

### 主張 9 ── 毎日の歯磨きが家庭ケアの標準（gold standard）

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「the gold standard to maintain good oral health and prevent periodontitis is **daily** tooth brushing」「Brushing needs to be done daily to be of benefit」（AAHA 由来として）
- **候補一次資料:** AAHA 2019 Dental Care Guidelines for Dogs and Cats — https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/dental/aaha_dental_guidelines.pdf
- **アクセス可否:** ❌ 403
- **備考:** 主張8（研究）と主張9（指針）が**独立に同じ方向**を示している＝この論点は本テーマで最も安全。ただし「毎日でなければ無意味」と読める言い方（"needs to be done daily to be of benefit"）と、主張8の「週1でも無しよりは良いが毎日/1日おきに劣る」は、**厳密には温度差がある**。台本では**「毎日がいちばん。難しければ1日おきでも、頻度が高いほど良いと報告されている」**という Harvey 側の表現を採るのが、正確かつ飼い主のハードルを上げすぎない。

### 主張 10 ── 毎日磨いていても麻酔下の処置は不要にならない

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「Even daily brushing does not preclude the need for anesthetized exams, radiographs, and therapy」（AAHA 2019 由来として）
- **アクセス可否:** ❌ 403
- **備考:** 「歯磨きさえすれば病院に行かなくていい」という誤読を防ぐ。**受診導線の医学的根拠でもある。削らない。**

### 主張 11 ── 炎症のある歯肉をブラッシングすると痛みと嫌悪を生む ★差別化点

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「brushing teeth with **already inflamed gingiva will cause pain and animal aversion**」（AAHA 2019 由来として）
- **アクセス可否:** ❌ 403
- **備考:** **本セッションで最も価値のある発見。**
  - 世に出ている「犬の歯磨き」コンテンツの大半は「今日から始めよう！」で終わる。しかし**すでに歯肉炎がある口を無理に磨くと、痛みを与え、犬が歯磨きを一生嫌いになる**。これは飼い主にとって実害があり、かつ**ほとんど語られていない**。
  - 同時にこれは**受診導線を自然に成立させる**：「まず一度、口の中を診てもらってから始めるのが安全」。CTA が説教ではなく**具体的な手順**になる。
  - **主張8（頻度）＋主張11（始める前の順序）の組み合わせが、本テーマの独自性。**

### 主張 12 / 12b / 13 ── 小型犬・短頭種のリスク

- **判定:** 12 = **B** ／ **12b（5倍という数字）= C** ／ 13 = **B（ただし効果量は小さい）**
- **検索結果が提示した記述（原文未照合）:**
  - 「**Increasing adult bodyweight was associated with progressively decreasing odds of periodontal disease**」
  - 「Extra-small breeds (less than 6.5 kg) were **up to five times** more likely to be diagnosed with periodontal disease than giant breeds (greater than 25 kg)」
  - 「**Brachycephalic** breeds had **1.25 times** the odds ... compared with mesocephalic breeds」「Spaniel types had 1.63 times the odds」
  - 犬種別オッズ比: Toy Poodle 3.97 / King Charles Spaniel 2.63 / Greyhound 2.58 / Cavalier KCS 2.39
- **候補一次資料:** **O'Neill DG, et al. "Epidemiology of periodontal disease in dogs in the UK primary-care veterinary setting." *JSAP* 2021.** n=22,333 — https://onlinelibrary.wiley.com/doi/full/10.1111/jsap.13405 ／ https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9291557/
- **アクセス可否:** ❌ 403（Wiley・PMC とも）
- **備考:**
  - **12（小型犬でリスクが高い）は方向性が明確で、日本の飼育構成（小型犬が多い）に直接刺さる。** 使う価値が高い。
  - **12b の「5倍」は使わない。** これは「6.5kg未満 vs 25kg超」という**両極端の比較**であり、単独で出すと「小型犬は大型犬より常に5倍危険」と誤読される。**「小さい子ほどリスクが高いと報告されている」で十分。**
  - **13（短頭種）は事実だが、オッズ比1.25＝体格（最大5倍）に比べて効果量が明らかに小さい。** 「小型犬・短頭種は要注意」と並列に並べると、短頭種のリスクを過大に見せることになる。**並列にせず、体格を主・頭蓋型を従とするか、短頭種に触れない。**
  - **重要な限界:** この研究の「有病率」は**診断名が記録された割合**（1年12.52%）であり、実際に病変がある割合ではない。**小型犬は診察を受けやすい／口が見えやすい等の検出バイアスが排除できない。** ただし複数の独立データ（下記14、Banfield、WALTHAM）が同方向を示している。

### 主張 14 ── 日本の保険請求データ（犬・猫）★日本の視聴者に最も近い

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「The dataset comprised **688,665 dogs** representing 81 breeds and 185,782 cats representing 38 breeds」「For both species, the claims rate **increased with age**」「the rate of increase in cats was approximately 3.5% lower than that of dogs」「In dogs, **body size showed a strong association with the predicted probability** of a periodontal disease claim at less than 1 year of age (baseline risk); however, the slopes of the age effect were similar across size categories」
- **候補一次資料:** "Species- and breed-associated heterogeneity in age-related increases in periodontal disease risk among dogs and cats based on Japanese insurance claim data"（アニコム損保 × 麻布大学、2026年2月公開とされる） — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12930463/
- **アクセス可否:** ❌ 403
- **備考:**
  - **日本のデータであること・n が68万頭と極めて大きいこと**から、日本の飼い主向けコンテンツの根拠として価値が高い。
  - **ただし「請求率（claims rate）」であり有病率ではない。** 保険加入者に限られ、受診・請求行動のバイアスがある。**リールで数字を出さない。**
  - 微妙だが重要な知見: **体格差は「1歳未満のベースラインリスク」に効いており、加齢に伴う上昇の傾き自体は体格間で似ている**。つまり「小型犬は早い段階から差がついている」であって「小型犬だけ急速に悪化する」ではない。**もし体格に触れるなら、この含意（＝小型犬は若いうちから）を活かす方が正確。**
  - **公開が2026年2月と非常に新しい。** 引用前に原典で著者・掲載誌・査読状況を確認すること（利益相反：ペット保険会社が共著）。

### 主張 15 / 16 / 17 ── 無麻酔での歯石除去 ⚠️ 依頼で名指しされた論点

- **判定:** 3つとも **B**
- **検索結果が提示した記述（原文未照合）:**
  - **AVDC**（2004/2005 ポジションステートメント "Companion Animal Dental Scaling Without Anesthesia" 由来として）: 「Cleaning a companion animal's teeth without general anesthesia is considered **unacceptable and below the standard of care**」「**even minimal head movement by the patient can lead to injury to the oral tissues**」「A complete oral examination ... is not possible in an unanesthetized patient」「access to the subgingival area of every tooth is impossible in an unanesthetized canine or feline patient」「Without endotracheal intubation to protect the airway, debris and fluid can be aspirated into the lungs, creating risk for aspiration pneumonia」
  - AVDC は「Anesthesia-Free Dentistry」ではなく **Non-Professional Dental Scaling（NPDS）**という語を好む、との記述あり
  - **AAHA 2019 Dental Care Guidelines** 由来として: 「nonanesthetic dentistry is **considered not appropriate** because of patient stress, injury, risk of aspiration, and lack of diagnostic capabilities」「'anesthesia-free' dentistry **has not been shown to be safer** or comparable to the capacity to supra- and subgingivally clean teeth in an anesthetized patient and is therefore **unacceptable**」
- **URL:** https://avdc.org/avdc-position-statements/ ／ https://www.aaha.org/resources/2019-aaha-dental-care-guidelines-for-dogs-and-cats/nonanesthetic-dentistry/ ／ AVMA 解説記事 https://www.avma.org/javma-news/2016-02-01/below-surface-anesthesia-free-dentistry
- **アクセス可否:** ❌ AVDC 403（直接試行）／ AAHA 403（直接試行）／ AVMA 未試行
- **備考:**
  - **AVDC（米国獣医歯科学会）と AAHA（米国動物病院協会）という2つの独立した団体が、独立に同じ結論を出している。** これは本テーマで最も明快な根拠構造。
  - **表現上の注意（重要）:** 「特定のサービスを名指しで否定する」形にすると、①景品表示法・薬機法の観点ではなく**営業妨害・比較広告のリスク**、②視聴者の防御反応（既に利用している飼い主を責める形になる）を招く。
    - **推奨する言い方:** 「◯◯は危険です」ではなく、**「獣医団体は、麻酔をかけない歯石除去について『歯ぐきの下を掃除できず、口全体の評価もできない』として推奨していない」**＝**事実の伝達に留め、判断は視聴者に委ねる。**
    - **理由を先に、結論を後に。** 「なぜダメか」（縁下に届かない／全体を診られない／動くと傷つく／誤嚥）を説明すれば、結論を強く言う必要がなくなる。
  - **40秒には重すぎる。→ §5-3 で「単独回」を推奨。**

### 主張 18 ── 日本の法制度：スケーラーによる歯石除去は診療行為 ⚠️ 制度・要時点明記

- **判定:** B
- **検索結果が提示した記述（原文未照合・和文）:**
  - 「スケーラーを用いる歯石除去は、獣医師の獣医学的判断及び技術をもって行う**診療行為**です」（農林水産省「小動物獣医療等に関するよくある質問」由来として）
  - 「歯垢・歯石除去の際に、**出血を伴う処置は、危害を及ぼすおそれのある行為として診療に該当する**」
  - 「獣医師法では獣医師以外による飼育動物の診療業務を禁止しており」
  - 「なお、**歯垢を除去する目的でブラシやガーゼ等を用いる歯磨きは一般的に診療行為ではありません**が、口腔内に傷がある等の場合は獣医師にご相談ください」
- **候補一次資料:** 農林水産省「小動物獣医療等に関するよくある質問」 https://www.maff.go.jp/j/syouan/tikusui/zyui/FAQ.html （愛知県・岐阜県の家畜防疫担当課ページが「歯石除去関係が更新された」旨で同内容をミラー）／ 一般社団法人ジャパンケネルクラブ「【注意】獣医師以外による無麻酔歯石除去について」 https://www.jkc.or.jp/news/tartarremoval/ ／ 日本小動物歯科研究会ガイドライン https://www.sadsj.jp/guideline/
- **アクセス可否:** ❌ すべて未アクセス（本セッションでは maff.go.jp を含め直接取得していない）
- **備考:**
  - **日本の視聴者にとって、米国の学会見解より遥かに直接的で強い情報。** 「海外の団体が言っている」ではなく「**日本の所管官庁が診療行為だと整理している**」。
  - **必ず添えること:**
    - **「2026年7月時点」**（制度は改正される）
    - **「詳細は農林水産省のページをご確認ください」**（原文確認の促し）
    - **断定しない範囲:** 個別のサービスが違法かどうかは、実際の行為内容（スケーラーを使うか／出血を伴うか）と事実認定に依存する。**「あの店は違法」と断じない。** 伝えるのは**「国が『診療行為』と整理している行為がある」という制度の存在**まで。
  - **重要な副次情報:** 同FAQは**「ブラシやガーゼによる歯磨きは一般的に診療行為ではない」**とも述べている（とされる）。これは**「じゃあ家でのケアもダメなの？」という当然の疑問に先回りできる**、コンテンツ上とても有用な一文。ただし原文未確認。
  - **未確認事項:** 日本小動物歯科研究会（SADSJ）のガイドライン本文、および「逮捕事例」の一次情報（報道・判決）は**確認していない**。**事件・逮捕の言及は、原典（報道・判例）を確認するまで一切コンテンツに入れない。**

### 主張 19 / 19b / 20 ── デンタルガム・VOHC

- **判定:** 19 = **B** ／ **19b（基準の%）= C** ／ 20 = **B**
- **検索結果が提示した記述（原文未照合）:**
  - 「trials conducted under VOHC protocols that include professional teeth scaling on day 0, with assessment of plaque and calculus accumulations compared with a **negative control group at 28 days** post-scaling」「A **minimum of two trials** are required for all products tested」
  - ⚠️ **矛盾:** 同じ検索の中で「at least a **10%** reduction」と「a minimum **15%** reduction」の**両方**が提示された。
  - 製品別の数値（「DentaLife 57%」「OraVet 53%」）は **販売サイト・アフィリエイト系ブログ由来**。
- **候補一次資料:** VOHC Trial Protocol Requirements https://vohc.org/trial-protocol-requirements/ ／ "Effectiveness of Dental Homecare Protocols in Unscaled Dogs" https://pmc.ncbi.nlm.nih.gov/articles/PMC11894899/
- **アクセス可否:** ❌ 未アクセス
- **備考:**
  - **19（VOHC という第三者認定制度が存在し、認定品は試験で効果が示されている）は伝える価値が高い。** 飼い主が売り場で使える判断基準になる。
  - **19b の数値（10%か15%か）は出さない。** 検索結果内で食い違っており、どちらが現行基準か確認できていない。
  - **製品名・製品別の数値は一切出さない。** 出所が販売サイトであり、かつ特定商品の推奨は `vet-marketing-compliance` の対象になる。
  - **20（代替にならない）は必ずセットで。** ガムだけで「ケアした」と思わせるのが、このジャンルの最大の害。「ガムは**補助**。歯ブラシの代わりにはならない」。
  - **本テーマは商業ページの汚染が最も激しい領域。** 検索上位が製品レビュー・アフィリエイトで埋まる。**採用は VOHC 自身の記載と査読文献のみに限定した。**

### 主張 21a / 21b ── 硬すぎるおもちゃと歯の破折

- **判定:** 21a = **B** ／ 21b = **B（ただし専門家の経験則）**
- **検索結果が提示した記述（原文未照合）:**
  - 「Tooth fracture in dogs ... with a reported prevalence of **20% to 27%**」
  - 「**Slab fractures most commonly affect the carnassial tooth (upper 4th premolar)**」
  - 「Hard objects such as **bones (cooked and raw), antlers, hooves, ice balls, and hard nylon bones** are the most common causes of slab fractures」「**Antlers and bones are marketed as 'natural chew toys'—yet they are the most common cause of tooth fractures in dogs**」
  - 21b: 「If the material **does not leave a dent when tested with a thumbnail**, it is too hard for a dog's teeth」
- **候補一次資料:** Today's Veterinary Practice「Diagnosis and Treatment of Fractured Teeth」https://todaysveterinarypractice.com/dentistry/diagnosis-and-treatment-of-fractured-teeth/ ／ Vet Times / Veterinary Practice News（**業界紙＝査読文献ではない**）
- **アクセス可否:** ❌ 403／未アクセス
- **備考:**
  - **21a は「良かれと思ってやっていることが害になる」型の情報で、飼い主の行動を実際に変える。** 鹿角・骨・蹄が「自然」「デンタルケアに良い」として売られている現状への、事実ベースの対抗情報になる。
  - **21b の「親指の爪テスト」は覚えやすく実行可能で、コンテンツとしては極めて優秀。** ただし**試験で検証された基準ではなく、獣医歯科医の経験則（expert opinion）**。使う場合は「歯科の先生がよく使う目安」という位置づけで出す。**「これなら安全」という保証には使わない。**
  - **本テーマ（歯周病）とは別の疾患（破折）。** 40秒に混ぜると論点が散る。→ **単独回向き**（デンタルガム／おもちゃ回）。

### 主張 22 ── 麻酔下歯科処置の推奨開始年齢と頻度

- **判定:** B
- **検索結果が提示した記述（原文未照合）:** 「AAHA recommends these procedures **at least annually** starting at **one year of age for cats and small-breed dogs**, and at **two years of age for large-breed dogs**」（AAHA 2019 由来として）
- **アクセス可否:** ❌ 403
- **備考:**
  - **猫CKD回の「7歳・年1〜2回」に相当する、受診導線の数値的根拠。** ただし今回は**「1歳／2歳」が想像よりずっと早い**ため、飼い主の常識（「うちはまだ若いから」）を裏切る良いフックになりうる。
  - **⚠️ ただし米国の指針であり、日本の一般的な診療慣行・費用感（自由診療・全身麻酔を伴う）とそのまま一致するとは限らない。** リールで「年1回は麻酔をかけて」と言い切ると、**費用・麻酔リスクの説明なしに高額処置を推奨する形**になる。
  - **推奨する扱い:** 年齢・頻度の数字は**出さず**、「**若いうちから、口の中を定期的に診てもらう**」という質的表現に留める。数字を出す場合は「海外の指針では」という限定と、獣医師レビューが必須。

---

## 4. 台本に使える主張 / 使えない主張（次工程 02-script.md への入力）

### 4-1. ✅ 使える（B判定・ヘッジ付きで台本に載せてよい）

| # | 台本で言ってよい形（案） | 必須のヘッジ／条件 |
|---|---|---|
| 1a | 「犬の歯周病は、成犬ではとても多いと言われている」 | **数字を入れない** |
| 2 | 「口のニオイが気になったら、歯ぐきのサインのことがある」 | 「**ことがある**」／**ほかの原因もある**と併記 |
| 4a+4b | 「歯ぐきの炎症だけの段階なら元に戻りうる。骨まで溶けると戻らない」 | **必ずセット。**「戻りうる」（断定しない） |
| 6a | 「歯周病は歯ぐきの下で進むから、見ただけでは分からない」 | — |
| 8 | 「歯みがきは頻度が命。毎日か1日おきが、週1回より良いと報告されている」 | 「**報告されている**」／「**防げる**」と言わない |
| 10 | 「毎日みがいていても、病院での処置が要らなくなるわけじゃない」 | **削らない** |
| 11 | 「もう歯ぐきが腫れている子を無理にみがくと、痛くて歯みがき嫌いになる。**始める前に一度診てもらう**」 | — |
| 12 | 「小さい子ほどリスクが高いと報告されている」 | **「5倍」を出さない** |
| 14 | 「日本のデータでも、年齢とともに増えていく」 | **請求率であり有病率ではない**ため数字を出さない |
| 18 | 「日本では、スケーラーを使う歯石除去は『診療行為』と整理されている（2026年7月時点／要確認）」 | **時点明記＋原文確認の促し／個別サービスを違法と断じない** |
| 19+20 | 「ガムは補助。VOHCという第三者の認定もあるけど、歯ブラシの代わりにはならない」 | **%を出さない／製品名を出さない** |
| 22 | 「若いうちから、定期的に口の中を診てもらう」 | **年齢・頻度の数字を出さない** |

### 4-2. △ 条件付き（尺・構成しだい。今回は入れなくてよい）

| # | 主張 | 条件 |
|---|---|---|
| 3 | 口臭の正体は細菌が出すガス | 1フレーズに圧縮できるなら。行動は変わらない |
| 7a | 全身との「関連」の報告 | **正しく言うと留保が長い。今回は入れない**（→ §5-3） |
| 13 | 短頭種のリスク | 体格と並列にしない。触れないのが無難 |
| 17 | 無麻酔＝誤嚥リスク | 無麻酔回（次弾）で |
| 21a/21b | 硬いおもちゃと破折 | **別疾患。別回で** |
| 5 | 痛みを隠す／普通に食べる | **6a に置換を推奨** |

### 4-3. ❌ 使えない（削る・言わない）

| # | 主張 | 理由 |
|---|---|---|
| **1b** | **「3歳以上の80%」「8割」「大半」** | **一次資料に辿れない。出典間で 12.5%〜100%。数字を出した瞬間に反証可能になる** |
| **6b** | 「40%は歯肉縁下でX線でしか見えない」 | 出所が動物病院ブログのみ |
| **7b** | 「歯周病が心臓病・腎臓病を引き起こす」 | **因果は示されていない。レビュー自身が明言。人医学からの外挿も禁止** |
| **12b** | 「小型犬は大型犬の5倍」 | 両極端の条件付き比較。単独提示は誤解を招く |
| **19b** | 「VOHC の基準は◯%減」 | 検索結果内で10%と15%が食い違い |
| — | 逮捕事例・事件の言及 | 一次情報（報道・判決）を確認していない |
| — | 特定商品名・特定サービスの名指し否定 | 出所が販売サイト／比較広告リスク |

---

## 5. 推奨する構成の方向性（40秒・イヌイヌがボケ → ネコネコが解説）

### 5-1. 結論：軸は **「頻度」と「順序」**

本テーマで最も裏付けが厚く（主張8＝比較試験）、かつ**他社コンテンツが言っていない**（主張11＝始める前に診てもらう）2点を軸にする。
数字（80%）を軸にする従来型の構成は、**根拠が最も弱い場所に全体重を乗せることになる**ため採らない。

### 5-2. 推奨する流れ（キャラ配分の骨格のみ。セリフは 02-script で）

| 秒 | 役 | 内容 | 根拠 |
|---|---|---|---|
| 0-3 **フック** | イヌイヌ | 「歯みがき？ **週1でやってるよ！**」と胸を張る（＝視聴者の多数派の実態を代弁するボケ） | — |
| 3-8 | ネコネコ | 「……その週1、**やらないよりずっといい**。でも研究では**毎日か1日おき**とは差がついてる」 | **主張8** |
| 8-14 | イヌイヌ | 「えっ毎日!? もう手遅れじゃん」（＝視聴者の諦めを代弁） | — |
| 14-22 | ネコネコ | 「**歯ぐきが腫れてるだけの段階なら、戻りうる**。骨まで溶けると戻らない。だから今が分かれ目」 | **主張4a+4b** |
| 22-30 **山場** | ネコネコ | 「ただし——**もう腫れてる口を無理にみがくと痛い。**歯みがき嫌いになる子は、ここでつまずく。**始める前に一度、口の中を診てもらって**」 | **主張11 + 6a** |
| 30-36 | イヌイヌ | 「ニオイは? ガムは?」（残り論点の回収ボケ） | — |
| 36-40 **CTA** | ネコネコ | 「ニオイは**サインのことがある**（ほかの原因もある）。ガムは**補助**、歯ブラシの代わりにはならない。気になったら**かかりつけの先生に**」 | **主張2 / 19+20** |

**この構成が良い理由:**
1. **フックが「否定」ではなく「代弁」**。週1で磨いている飼い主を責めず、「やらないよりずっといい」と先に肯定してから差を伝える。
2. **主張11 が「悪い知らせ」ではなく「具体的な手順」として機能する**ので、CTA（受診）が説教にならない。
3. **数字を1つも出さずに成立する。** 唯一の量的表現「毎日か1日おき」は Harvey 2015 の比較条件そのもの＝**最も安全な数字**。
4. 犬猫で注意点が違うテーマだが、**今回は犬に限定して深掘りし、猫は次弾に回す**（CLAUDE.md 大原則2の「差分を見せる」は、シリーズ内で果たす）。

### 5-3. **今回入れないもの**（意図的な除外・理由を残す）

| 除外するもの | 理由 |
|---|---|
| **「3歳以上の80%」** | §3-1b。**このテーマで最も強い誘惑であり、最も危ない** |
| **全身疾患との関連（心臓・腎臓）** | 正しく言うと「関連はあるが因果は不明」の留保が要り、40秒に入らない。留保を削ると誇大表現。**この論点なしでも動機は十分ある** |
| **無麻酔歯石除去** | **啓蒙価値は本テーマで最も高いが、単独回にすべき。** AVDC・AAHA・農水省という3つの根拠を持ち、①なぜ縁下に届かないか ②なぜ全体を診られないか ③日本では制度上どう整理されているか、を丁寧に説明して初めて成立する。40秒に押し込むと「名指しの否定」に見えて逆効果 |
| **硬いおもちゃ・破折** | 別疾患。デンタルガム／おもちゃ回で |
| **年1回・1歳から の数字** | 米国指針であり、日本の費用感・麻酔リスクの説明なしに出せない |

### 5-4. 次弾の企画メモ（今回の検証で判明した宿題つき）

1. **【推奨・優先】無麻酔歯石除去の回** — 根拠は本記録 §3-15〜18 で揃っている。**表現設計に `vet-marketing-compliance` を通常より厚くかけること。** 「事実の伝達に留め、判断は視聴者に委ねる」型。農水省FAQの**「ブラシやガーゼの歯磨きは一般的に診療行為ではない」**を必ず併記し、「家でのケアもダメなの?」に先回りする。
2. **デンタルガム・おもちゃの回** — 主張19/20/21。**販売サイトの汚染が最も激しい領域**なので、根拠は VOHC 自身の記載と査読文献のみに限定する。
3. **猫の歯周病／歯肉口内炎の回** — **本記録は犬のみ。猫に流用しない。** 猫には破歯細胞性吸収病巣（FORL）・慢性歯肉口内炎という犬にない病態があり、独立した検証が要る。
4. **【前回からの申し送り・本セッションで回収済み】** `2026-07-22_cat-ckd/03-evidence.md` 主張16「犬は3歳以上の大半に歯周病変（次弾候補・判定C）」→ **本記録 §3-1b で検証し、C を維持。台本で使わないことを決定。**

---

## 6. egress 開通後に確認すべきチェックリスト

**以下を実行するまで、本テーマの主張は1件も判定Aに昇格しない。**

### 最優先（台本の軸を支える）
- [ ] **Harvey C, et al. *J Vet Dent* 2015;32(1):16-21（PMID 26197686）を原典で確認。** 「daily or every other day」が「weekly / every other week」に対し統計学的有意だったこと、対象がビーグルで n がいくつかを確認。**台本の軸そのもの**
- [ ] **AAHA 2019 Dental Care Guidelines を原典PDFで確認**し、以下3点の原文を確定:
  - [ ] 「brushing teeth with already inflamed gingiva will cause pain and animal aversion」（**主張11＝台本の山場**）
  - [ ] 「Even daily brushing does not preclude the need for anesthetized exams...」（主張10）
  - [ ] 毎日ブラッシングが gold standard とする記述（主張9）
- [ ] **AVDC ポジションステートメント "Companion Animal Dental Scaling Without Anesthesia" の原文**（発行年が 2004 / 2005 で揺れている。**正しい年を確定する**）

### 数字の確定（今回すべて C にした項目）
- [ ] **「3歳以上の80%」の一次資料が本当に存在するか**を、PubMed 41712493 の総説の**引用文献リストを辿って**確認する。存在しなければ「**追跡不能な循環引用**」と結論づけて記録を確定する
- [ ] O'Neill DG, et al. *JSAP* 2021（DOI 10.1111/jsap.13405）で、体重区分ごとのオッズ比・短頭種の1.25倍・1年期間有病率12.52%を確認。**「5倍」の比較条件（6.5kg未満 vs 25kg超）を原文で特定**
- [ ] VOHC の現行の受理基準（10% か 15% か）を vohc.org の Trial Protocol Requirements で確定
- [ ] 「歯科疾患の40%は歯肉縁下」の一次資料の有無を最終確認（見つからなければ恒久的に不使用）

### 全身疾患（言えることの上限を確定する）
- [ ] DeBowes 1996（PMID 9520780）／Glickman 2009 *JAVMA* 234(4):486／Niemiec 2021 *Vet Clin North Am* を確認し、**「関連」と「因果」の境界を原文の言葉で記録する**
- [ ] 犬を対象とした介入研究（歯周治療によって全身指標が改善したか）の有無を確認。**あれば言えることが増え、無ければ現状の禁止を維持**

### 日本の制度（**次弾＝無麻酔回の前提**）
- [ ] **農林水産省「小動物獣医療等に関するよくある質問」原文**（https://www.maff.go.jp/j/syouan/tikusui/zyui/FAQ.html ）で以下を確認し、**参照日を記録**:
  - [ ] 「スケーラーを用いる歯石除去は診療行為」の原文
  - [ ] 「出血を伴う処置は診療に該当する」の原文
  - [ ] 「ブラシやガーゼ等を用いる歯磨きは一般的に診療行為ではない」の原文
- [ ] 日本小動物歯科研究会（SADSJ）ガイドライン本文 https://www.sadsj.jp/guideline/ を確認
- [ ] 逮捕・摘発事例に触れる場合は、**報道または判決の一次情報**を確認（未確認なら言及しない）

### 日本のデータ
- [ ] アニコム損保×麻布大学の保険請求データ研究（PMC12930463）の**掲載誌・査読の有無・利益相反の記載**を確認。**2026年2月公開と非常に新しい**

### ワークフロー文書の更新
- [ ] `docs/evidence-workflow.md` §6 の到達実績表を更新:
  - [ ] `avdc.org` = ❌ 403（2026-07-27）を追加
  - [ ] `wsava.org` = 「未試行」→ **❌ 403（2026-07-27）**
  - [ ] `todaysveterinarypractice.com` = 「未試行・到達しやすい傾向」→ **❌ 403（2026-07-27）** ※現記載は誤解を招く
  - [ ] `www.aaha.org` = ❌ 403（2026-07-27・再確認）
  - [ ] `vohc.org` / `maff.go.jp` / `sadsj.jp` を資料リストに追加

---

## 7. 本テーマ固有の注意事項（02-script 以降へ持ち越す）

### 7-1. 対象種
本記録の全主張は**犬**が対象。以下は**犬のデータ**である: Harvey 2015（ビーグル）、O'Neill 2021（英国の犬 22,333頭）、DeBowes 1996（犬45頭）、Glickman 2009（犬）。**猫に流用しない。** AAHA 2019 は犬猫両方を対象とするが、本記録では犬に関する記述のみを採った。

### 7-2. 商業汚染への対処（本テーマ特有）
検索上位が**製品販売サイト・アフィリエイト・無麻酔サービス提供者・サプリメーカー**で埋まる度合いが、猫CKD回より明確に高かった。本記録では以下を**根拠として一切採用していない**: デンタルガム販売サイト、海藻サプリ販売サイト、無麻酔サービス事業者のページ、動物病院の集患ブログ、ペット保険会社の記事、まとめ記事。**02-script 以降でも同じ基準を維持すること。**

### 7-3. 人医学からの外挿を持ち込まない（本テーマ最大の落とし穴）
検索では**人の歯周病と心血管疾患の論文が大量にヒットした**（PMC11406040、PMC7843501、PMC8775300、PMC12387035 等）。人では「因果」を論じる研究（メンデルランダム化等）まで存在するが、**これらは犬の話ではない。** 犬の歯周病コンテンツに人の知見を混ぜると、獣医療エビデンスの体裁をした誤情報になる。**本記録は人のデータを1件も採用していない。この方針を台本まで貫くこと。**

### 7-4. 修正しないことを推奨する（＝守るべき）記述
- **口臭に対する鑑別ヘッジ**（「ほかの原因のこともある」）— 歯周病に一本化して見せない
- **「ガムは補助・歯ブラシの代わりにならない」** — 削ると本テーマの主要な害を放置することになる
- **「毎日みがいていても病院での処置が不要になるわけではない」** — 過剰な期待を防ぐ
- **数値を出していないこと** — 出典間で桁が動く本テーマでは、それが正解
- **画面内免責・受診誘導・病院名/院リンクを付けない方針** — 維持

---

**最終更新:** 2026-07-27
**次回レビュー期限:** egress 開通時、遅くとも次テーマ（無麻酔歯石除去 回）着手前
**この記録は獣医師のレビューを受けていない。** 判定Bの主張は、原典照合と獣医師レビューの両方を経て初めて確定とする。
**次工程:** `02-script.md`（本記録 §4-1 と §5 を入力とする）→ `vet-marketing-compliance`（**本工程では代替できない**。特に §3-15〜18 の無麻酔・法令まわりを扱う回は厚くかける）
