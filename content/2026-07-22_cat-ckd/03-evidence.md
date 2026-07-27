# 03-evidence — エビデンス検証記録（猫の慢性腎臓病リール）

**対象:** `content/2026-07-22_cat-ckd/02-script.md`
**検証日:** 2026-07-27
**検証者:** clinical-evidence-writer（獣医療エビデンス・ライター）
**対象種:** 猫（ネコ／*Felis catus*）。犬・その他の種には適用しない。

---

## 0. この検証の限界（最初に読むこと・省略不可）

### 0-1. 一次資料への直接アクセスは**1件もできなかった**

本セッションの実行環境では、外部HTTPS取得（WebFetch）が**すべてのホストに対して HTTP 403（組織のegressポリシーによる遮断）**を返した。試行して遮断されたホストは以下。

| ホスト | 用途 | 結果 |
|---|---|---|
| `journals.sagepub.com` | ISFM Consensus Guidelines 本文 | ❌ 403 |
| `www.iris-kidney.com` | IRIS ステージング | ❌ 403 |
| `www.merckvetmanual.com` | Merck Vet Manual | ❌ 403 |
| `www.vet.cornell.edu` | Cornell Feline Health Center | ❌ 403 |
| `www.aaha.org` | AAHA/AAFP Life Stage Guidelines | ❌ 403 |
| `pubmed.ncbi.nlm.nih.gov` / `pmc.ncbi.nlm.nih.gov` / `www.ncbi.nlm.nih.gov` | PubMed / PMC | ❌ 403 |
| `catvets.com` | AAFP | ❌ 403 |
| `doaj.org` | オープンアクセス索引 | ❌ 403 |
| `en.wikipedia.org` | （到達性の対照テスト） | ❌ 403 |

`/root/.ccr/README.md` の規定により、403 は組織ポリシーによる拒否であり**迂回してはならない**。したがって本検証で使えた手段は **WebSearch（検索結果とその要約）のみ**である。

### 0-2. その結果、**判定Aは1件も付けられない**

本記録に出てくる英文は、すべて**検索エンジンが返した要約・スニペット**であり、**原典の該当箇所を開いて照合したものではない**。したがって：

- 本記録の英文を、**原文の逐語引用として台本や公開物に転記してはならない**。
- 検索要約は語順・語句の改変や、別ソースの記述の混入が起こりうる。**「〜と書いてある」と断定できる材料ではない**。
- 各記述には出所URLを併記したが、**そのURLを開いて確認したわけではない**（開けなかった）。

> **この記録の正しい使い方**：「どの主張が、どの資料のどのあたりに根拠がありそうか」の**当たり付けと、リスクの高い主張の特定**まで。最終確定は、egressが開通した環境で §5 のチェックリストを実行してから。

---

## 1. 判定基準

| 判定 | 定義 |
|---|---|
| **A** | 一次資料に**実アクセスして**該当記述を確認した。原文引用を保持している。 |
| **B** | 一次資料に到達できていないが、検索結果が一次資料由来として提示した記述があり、複数経路で整合する。**原文照合は未了**。 |
| **C** | 一次資料に紐づく記述が見つからない／二次情報（ブログ・商用サイト・まとめ記事）しか出てこない／**反証寄りの情報がある**。 |

**本セッションの内訳：A=0件 / B=10件 / C=3件**（Aがゼロなのは主張の質の問題ではなく、上記アクセス遮断による）。

---

## 2. 主張一覧（サマリー）

| # | 行 | 主張 | 判定 | 一言 |
|---|---|---|---|---|
| 1 | L15 | 猫はもともとあまり水を飲まない動物である | B | 標準的生理学。ただし「食事形態で変わる」条件が落ちている |
| 2 | L16 | 急に水を飲む・尿が増えるのは体のサインのことがある | B | PU/PD の一般記述として妥当 |
| 3 | L16 | それを「多飲多尿」と呼ぶ | B | 用語定義。問題なし |
| 4 | L17 | 多飲多尿の代表的な原因が慢性腎臓病 | B | 猫のPU/PD三大原因の筆頭として整合 |
| 5 | L17 | CKDはシニア猫にとても多い | B | 本台本で最も裏付けが厚い。数値を出していないのが正解 |
| 6 | L17 | 多飲多尿はほかの病気のこともある | B | 保護的ヘッジ。**必ず残す** |
| 7 | L18 | 飲水量の記録が診察で役立つ | B | 臨床的に標準。ただし明示的な出典は未取得 |
| 8 | L18 | 尿量の記録が診察で役立つ | B | 同上 |
| 9 | L18 | **尿の「色」**の記録が診察で役立つ | **C** | 一次資料ゼロ。商用サイトのみ。**要修正** |
| 10 | L18 | 体重の記録が診察で役立つ | B | 特定の一次研究（Freeman 2016）で強化可能 |
| 11 | L19 | 「7歳」が節目 | B | **創作された数字ではない**。2系統の指針と整合 |
| 12 | L19 | 年1〜2回の健診 | B | 指針の幅の内側。やや保守的 |
| 13 | L19 | 血液・尿検査で早めに見つけられることがある | B | ヘッジ「ことがある」が適切 |
| 14 | L37 | 多飲多尿が CKD の代表的な**初期**サイン | **C** | **反証寄りの情報あり。要修正**（配信メモ内） |
| 15 | L39 | 早く気づけばできることが増える | B | トーン規定。介入研究で下支え可能 |
| 16 | L43 | 犬は3歳以上の大半に歯周病変（次弾候補） | **C** | 本セッション未検証。次テーマ着手時に要検証 |

---

## 3. 主張ごとの詳細

### 主張1 ── 猫はもともとあまり水を飲まない動物である
- **該当行:** L15（セリフ・テロップ）
- **判定:** B
- **検索結果が提示した記述（原文未照合）:**
  - "Domestic cats retain the physiological traits of their desert-dwelling ancestors, characterized by a low thirst drive and highly concentrated urine."
  - "Cats fed an all meat or wet diet, which typically contains in excess of 75% moisture, will voluntarily drink only small quantities of water."
- **候補一次資料（いずれも未アクセス）:**
  - *Journal of Animal Science* (2025) スコーピングレビュー「Diet format, protein, amino acids, salt, and osmolytes, as well as water viscosity, affect water consumption in domestic cats」32文献レビュー — https://academic.oup.com/jas/article/doi/10.1093/jas/skaf434/8379605
  - *British Journal of Nutrition* 「Effect of dietary water intake on urinary output, specific gravity...」 — https://www.cambridge.org/core/services/aop-cambridge-core/content/view/S0007114511001875
- **アクセス可否:** ❌ 全て未アクセス（403）
- **備考:** 台本の出典5件のどれもこの主張を担保していない（ISFM/IRIS/Merck/Cornell/AAHA はいずれも「猫の飲水行動の生理」を主題としない）。**出典欄と主張の対応が切れている箇所**。また「あまり飲まない」は**ウェットフード中心の場合**の話で、ドライフード主体だと飲水量は増える。台本は無条件の断定になっている。

### 主張2・3 ── 急な多飲多尿は体のサインのことがある／それを多飲多尿と呼ぶ
- **該当行:** L16
- **判定:** B（両方）
- **検索結果が提示した記述（原文未照合）:**
  - "With over 30 causes of PU/PD, the diagnostic workup can be challenging for both the clinician and the client."
- **候補一次資料:** *Today's Veterinary Practice*「A Stepwise Diagnostic Approach to Polyuria and Polydipsia」(2023) — https://todaysveterinarypractice.com/internal-medicine/companion-animal-polyuria-and-polydipsia/
- **アクセス可否:** ❌ 未アクセス
- **備考:** 「サインのことがある」というヘッジは適切。断定していない点は評価できる。

### 主張4 ── 多飲多尿の代表的な原因が慢性腎臓病
- **該当行:** L17
- **判定:** B
- **検索結果が提示した記述（原文未照合）:**
  - "The most common causes of PU/PD in cats are CKD, diabetes mellitus, and hyperthyroidism."
- **候補一次資料:** *Today's Veterinary Practice* (2023) 同上／PDF: https://todaysveterinarypractice.com/wp-content/uploads/sites/4/2023/10/TVP-2023-1112_Polyuria-Polydipsia_3.pdf
- **アクセス可否:** ❌ 未アクセス
- **備考:** 台本が挙げた Merck の当該URL（腎機能障害のページ）は、この「原因の順位づけ」を担保するページとしては**ずれている可能性が高い**。PU/PD の鑑別を主題とする上記レビューの方が主張に直結する。

### 主張5 ── CKDはシニア猫にとても多い
- **該当行:** L17
- **判定:** B（**本台本で最も裏付けが厚い主張**）
- **既確認情報:** 別エージェントが ISFM Consensus Guidelines (JFMS 2016) 内に **"CKD is one of the most commonly diagnosed diseases in older cats"** の記述を確認済み、との申し送りを受けている。**ただし本セッションでは同誌に到達できず、この確認を再現できていない**。他者の確認結果をもって A とはしない。
- **検索結果が提示した記述（原文未照合）:** 有病率の数値は資料間で大きくばらつく（「全猫の1〜3%」「10歳超で20〜50%」「10歳超で最大40%・15歳超で80%」等）。
- **URL:** https://journals.sagepub.com/doi/10.1177/1098612X16631234（DOI: 10.1177/1098612X16631234）
- **アクセス可否:** ❌ 403
- **備考:** **台本が具体的な数値（％）を一切出していないのは正しい判断**。上記のとおり数値は出典によって2〜4倍の開きがあり、リールで一つの％を断定すると必ず反証可能になる。「とても多いと言われてる」という表現を維持すること。

### 主張6 ── 多飲多尿はほかの病気のこともある
- **該当行:** L17
- **判定:** B
- **根拠:** 主張4と同じ（猫のPU/PD三大原因＝CKD・糖尿病・甲状腺機能亢進症、さらに30以上の原因）
- **備考:** この一文は**医学的にも規制対応上も本台本の生命線**。CKDに一本化して見せない設計は正しい。**削らない・弱めない**。

### 主張7・8 ── 飲水量／尿量の記録が診察で役立つ
- **該当行:** L18
- **判定:** B（ただし明示的な出典は未取得）
- **検索結果が提示した記述（原文未照合）:**
  - "Owners were able to observe polydipsia (increased water intake) and polyuria in cats that were later diagnosed with chronic kidney disease."
- **アクセス可否:** ❌ 未アクセス
- **備考:** 真の多飲の確認（飲水量測定）は PU/PD 診断の標準的な初手であり臨床的には妥当だが、**「飼い主が記録して持参すると診察で役立つ」と明示した一次資料は本セッションでは取得できていない**。主張として無理はないが、出典欄に書ける具体的アンカーが無い状態。

### 主張9 ── 尿の「色」の記録が診察で役立つ ⚠️
- **該当行:** L18（「②おしっこの量・色」／テロップ「✅おしっこ」）
- **判定:** **C（根拠が見つからない）**
- **検索で出てきたもの:** 猫砂メーカー（PrettyLitter 等）、猫用品ブログ、猫behaviorサイトのみ。**学会指針・査読文献は1件も出てこなかった**。
- **アクセス可否:** — （そもそも一次資料が見つからない）
- **備考:** 尿の色は尿比重の粗い代用でしかなく、猫砂の種類・光の条件・観察者によって大きくぶれる。飼い主に「色を記録して」と促すことは、①判断材料として弱い ②「色が薄い＝腎臓病」という誤った自己診断を誘発しうる、の二重のリスクがある。**「量」だけに絞るのが安全**。→ §4 の修正案A参照。

### 主張10 ── 体重の記録が診察で役立つ
- **該当行:** L18
- **判定:** B（**一次研究で強化できる余地が大きい**）
- **検索結果が提示した記述（原文未照合）:**
  - "loss of body weight may precede a diagnosis of CKD in cats by up to 3 years"
  - "median weight loss during the preceding 6 to 12 months was 10.8% and 2.1% in cats with and without CKD, respectively"
- **候補一次資料:** Freeman LM, Lachaud MP, Matthews S, Rhodes L, Zollers B. **"Evaluation of Weight Loss Over Time in Cats with Chronic Kidney Disease." *J Vet Intern Med.* 2016;30(5):1661-1666.** DOI: 10.1111/jvim.14561 — https://onlinelibrary.wiley.com/doi/full/10.1111/jvim.14561
- **アクセス可否:** ❌ 未アクセス
- **備考:** 3項目のうち**体重が最も強い研究的裏付けを持ちうる**。にもかかわらず台本の出典欄にこの研究が無い。到達可能になったら最優先で確認し、出典に追加すべき。

### 主張11・12・13 ── 7歳／年1〜2回／血液・尿検査で早期発見
- **該当行:** L19
- **判定:** B（3つとも）
- **検索結果が提示した記述（原文未照合）:**
  - ISFM由来として提示されたもの:
    - "Health checks every 6 months for cats >7 years of age (including evaluation of body weight, body condition score and blood pressure), together with selected diagnostic testing (including haematology, serum biochemistry screening and routine urinalysis)"
    - "Screening of apparently healthy cats is recommended to facilitate a prompt diagnosis, since cats in the early stages of disease may be free of clinical signs."
    - "Urine specific gravity (USG) testing is a simple and effective screening test for identifying patients that may be suffering from renal disease."
  - AAHA/AAFP 2021 由来として提示されたもの:
    - "the kitten stage from birth up to 1 year; young adult from 1 year through 6 years; mature adult from 7 to 10 years; and senior aged over 10 years"
    - "The panel supports minimum annual wellness examinations and consultations for all cats, with more frequent examinations recommended for seniors and geriatrics"
- **URL:** ISFM: https://journals.sagepub.com/doi/10.1177/1098612X16631234 ／ AAHA/AAFP 2021 PDF: https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/feline-life-stage-2021/2021-aaha-aafp-feline-life-stage-guidelines.pdf
- **アクセス可否:** ❌ 両方403
- **備考（重要・良い知らせ）:** 依頼で最も警戒された **「7歳」「年1〜2回」は、AIが捏造した数字ではない可能性が高い**。
  - 「7歳」= ISFM が健康チェックの推奨開始年齢として挙げる年齢、かつ AAHA/AAFP のライフステージ区分（mature adult = 7〜10歳）の境界。**2系統の独立した指針が同じ7歳を使っている**。
  - 「年1〜2回」= ISFM は7歳超で**6か月ごと**（＝年2回）の健康チェック＋検査は**少なくとも年1回**、AAHA/AAFP は**最低年1回**＋高齢はより高頻度。台本の「年1〜2回」はこの幅の内側に収まる（むしろやや保守的）。
  - ⚠️ ただしこれらは検索要約であり、**この文言が原典に実在するかは未照合**。特に ISFM の該当文は2回の別クエリで同趣旨が返ったが、**同一の二次ページを情報源にしている可能性**を排除できていない。§5 で最優先確認。
- **補助的に見つかった追加候補資料（未アクセス）:**
  - Paepe D, Daminet S. "Feline CKD: Diagnosis, staging and screening." *JFMS* 2013. DOI: 10.1177/1098612X13495235
  - Mortier F, et al. "Value of repeated health screening in 259 apparently healthy mature adult and senior cats followed for 2 years." *JVIM* 2024. DOI: 10.1111/jvim.17138

### 主張14 ── 多飲多尿が CKD の代表的な「初期」サイン ⚠️
- **該当行:** L37（配信メモ。※**画面には出ない**）
- **判定:** **C（根拠が見つからないどころか、反証寄りの情報がある）**
- **検索結果が提示した反証寄りの記述（原文未照合）:**
  - "cats maintain their urine concentrating ability further into the disease process than dogs; therefore, PU/PD is often not recognized in early stages of CKD in cats"
  - ISFM由来として: "cats in the early stages of disease may be free of clinical signs"
- **備考:** 猫は犬より尿濃縮能を長く保つため、**PU/PD は必ずしも「初期」サインではない**。IRIS ステージ1では無症状のことがあり、PU/PD が飼い主に気づかれる頃には進行している場合がある。
  - **画面上の台本は「初期」と言っていない**（L16「体からのサインのことがある」）ため、**公開物としての実害は現時点で無い**。
  - しかし配信メモは次弾以降の企画判断を駆動する。ここに誤った前提が残ると「多飲多尿に気づけば早期発見できる」という**過剰な期待を煽る続編**が生まれうる。→ §4 の修正案C。
  - 同時にこれは、**L19の定期健診の訴求がなぜ必要か**の根拠でもある（症状が出る前に見つけるには検査しかない）。メモの修正は、むしろ台本の説得力を上げる方向に働く。

### 主張15 ── 早く気づけばできることが増える（トーン規定）
- **該当行:** L39
- **判定:** B
- **検索結果が提示した記述（原文未照合）:**
  - Ross 2006（二重盲検・無作為化対照試験、ステージ2〜3の飼い猫45頭）: 腎臓用療法食群22頭では尿毒症クリーゼ・腎性死がゼロ、維持食群では6頭が尿毒症を発症・5頭が腎疾患関連で死亡
  - "cats diagnosed early in the disease course live longer than cats diagnosed with more severe azotaemia"
- **候補一次資料:** Ross SJ, et al. "Clinical evaluation of dietary modification for treatment of spontaneous chronic kidney disease in cats." *JAVMA* 2006;229(6):949-957. — https://avmajournals.avma.org/view/journals/javma/229/6/javma.229.6.949.xml
- **アクセス可否:** ❌ 未アクセス
- **備考:** 「できることが増える」という言い方は、介入で予後が変わりうるという知見と整合し、かつ**特定の治療効果を約束していない**ため広告規制上も安全。維持でよい。なお Ross 2006 はステージ2〜3が対象であり、**ステージ1（無症状期）での介入利益を示したものではない**点は、将来「超早期発見」を訴求する際の限界として覚えておくこと。

### 主張16 ── 犬は3歳以上の大半に歯周病変（次弾候補）
- **該当行:** L43
- **判定:** **C（本セッション未検証）**
- **備考:** 本タスクの対象外のため検証していない。**対象種が犬であり、本台本（猫）の知見からの外挿は一切できない。** 次テーマ着手時に、この数字の一次資料（AVDC / WSAVA Dental Guidelines 等）を独立に検証すること。「大半」という量的表現は要注意。

---

## 4. 出典5件そのものの妥当性レビュー

台本 L30〜L34 の出典欄は、**5つのURLが並んでいるだけで、どの主張を担保するのかの対応が書かれていない**。これが本台本の最大の構造的欠陥。個別には以下。

| # | 出典 | 担保している主張 | 評価 |
|---|---|---|---|
| L30 | **ISFM Consensus Guidelines (JFMS 2016)** | 主張5（シニア猫に多い）、主張11-13（7歳・頻度・検査） | ✅ **中核。維持。** 別エージェントが該当記述を確認済みの唯一の資料 |
| L31 | **IRIS** | **該当なし** | ⚠️ **要再考。** IRIS は「診断後の重症度ステージング」（血清クレアチニン／SDMA、蛋白尿・血圧によるサブステージ）の枠組みであり、**有病率・多飲多尿・健診頻度・7歳・在宅記録のいずれも主題にしていない**。本台本のどの主張にも直接対応しない**装飾的引用**になっている |
| L32 | **Merck Vet Manual（腎機能障害）** | 主張4に部分的 | ⚠️ ページ選定がずれている可能性。PU/PD の原因順位を担保するなら PU/PD の鑑別を主題とする資料に差し替えるべき |
| L33 | **Cornell Feline Health Center** | 主張2・5に部分的 | △ 大学付属センターの**飼い主向け解説ページ**であり、査読文献ではない。エビデンスレベルとしては「専門家による解説」相当。**一次資料と同列に並べない**方がよい |
| L34 | **AAHA/AAFP Feline Life Stage Guidelines (2021)** | 主張11・12（7歳・頻度） | ✅ 維持。ただし**どの主張に対応するかの明記**が必要（現状は「（シニア期の健診頻度）」とだけ書かれており、7歳の根拠でもあることが読み取れない） |

**共通の問題:** 全5件が**主張を書いた後から添えられた出典**であり、主張→出典の順で作られていない。これが「IRIS が何も担保していない」状態を生んでいる。

---

## 5. 未解決事項 ── egress開通後に最優先で実行すること

以下を実行するまで、本テーマの主張は**どれも判定Aに昇格しない**。

- [ ] **【最優先】ISFM 2016 の「>7歳・6か月ごと・血液/尿検査」の該当文を原典で確認**（検索要約でのみ得られている。ここが崩れると L19 全体が崩れる）
- [ ] ISFM 2016 の "CKD is one of the most commonly diagnosed diseases in older cats" を自分で再確認（現在は伝聞）
- [ ] AAHA/AAFP 2021 のライフステージ定義（mature adult 7〜10歳）と受診頻度の推奨を原典PDFで確認
- [ ] Freeman 2016 (JVIM, DOI 10.1111/jvim.14561) を確認し、**体重の主張の出典として台本に追加**
- [ ] PU/PD の原因順位（猫＝CKD・糖尿病・甲状腺機能亢進症）の出典を確定し、Merck の当該URLの妥当性を判断
- [ ] 猫の飲水生理（主張1）の一次資料を1件確定させる（現状、出典欄に対応する資料が無い）
- [ ] 尿の「色」に関する一次資料の有無を最終確認（見つからなければ §6 修正案Aを適用）
- [ ] Cornell ページを開き、一次資料ではなく「解説」としてラベルし直すか判断

---

## 6. 台本への修正提案（適用は親セッションが判断）

> **本記録では 02-script.md を編集していない。** 以下は提案のみ。

### 修正案A（要対応）— 尿の「色」を落とす｜L18
- **現状:** 「①水を飲む量 ②おしっこの量・色 ③体重。この3つをメモしておくと診察で役立つよ」
- **修正案:** 「①水を飲む量 ②おしっこの量 ③体重。この3つをメモしておくと診察で役立つよ」（「・色」を削除）
- **理由:** 「色」を支持する一次資料が見つからず（判定C）、出てきたのは猫砂の商用サイトのみ。色は観察条件でぶれ、「薄い＝腎臓病」という自己診断を誘発するリスクがある。**削っても台本の情報量・テンポ・保存価値はほぼ落ちない**（テロップ「✅おしっこ」は無変更でよい）。

### 修正案B（推奨）— 主張1に条件を戻す｜L15
- **現状:** 「猫はもともと、**あまり水を飲まない**動物なんだ」
- **修正案:** 「猫はもともと、**自分から水をたくさん飲むタイプじゃない**動物なんだ」
- **理由:** 「あまり飲まない」の無条件断定は、ウェットフード中心時の話。ドライフード主体だと飲水量は増える。「自分から（＝自発的飲水）」を入れるだけで正確性が上がり、**尺・語調・キャラのトーンを壊さない**。フックの「水をよく飲む＝いいこと？」との対比も維持される。

### 修正案C（要対応）— 配信メモの「初期サイン」｜L37
- **現状:** 「CKDは高齢猫で非常に有病率が高く、多飲多尿が代表的な**初期サイン**＝啓蒙価値が最も高いテーマ」
- **修正案:** 「CKDは高齢猫で非常に有病率が高く、多飲多尿が代表的な**サイン**。ただし猫は犬より尿濃縮能を長く保つため、**PU/PDは必ずしも早期に現れない**（無症状期がある）＝だからこそ L19 の定期健診の訴求が要になる」
- **理由:** 「初期」を支持する資料が無く、むしろ反証寄りの情報がある（判定C）。画面には出ないため公開物への実害は無いが、この前提のまま続編を作ると「多飲多尿に気づけば早期発見できる」という過剰な期待を煽る企画が生まれる。修正すると**定期健診パートの必然性が強まる**方向に働く。

### 修正案D（推奨）— 出典欄を「主張→出典」の対応表にする｜L29-34
- **現状:** URLが5本並ぶだけで、どの主張を担保するのか不明。IRIS は実際にはどの主張にも対応していない。
- **修正案:** 以下の形式に置換（内容は §5 の原典確認後に確定）。

```markdown
## エビデンス
> 検証記録: 03-evidence.md（判定 A/B/C・最終確認日つき）
| 台本の主張 | 出典 | 判定 | 最終確認日 |
|---|---|---|---|
| CKDはシニア猫に多い | ISFM Consensus Guidelines, JFMS 2016 (DOI: 10.1177/1098612X16631234) | B | 2026-07-27 |
| 7歳から年1〜2回の健診（血液・尿検査） | ISFM 2016 ／ AAHA-AAFP Feline Life Stage Guidelines 2021 | B | 2026-07-27 |
| 多飲多尿の主因はCKD・糖尿病・甲状腺機能亢進症 | （PU/PD鑑別レビュー・原典確認後に確定） | B | 2026-07-27 |
| 体重減少はCKD診断に先行しうる | Freeman et al., JVIM 2016 (DOI: 10.1111/jvim.14561) | B | 2026-07-27 |
| 猫は自発的な飲水量が少ない | （未確定・要特定） | B | — |
```
- **IRIS について:** 削除するか、「※IRIS＝診断後のステージング枠組み。本台本の主張は担保しない（参考）」と用途を明記して残す。
- **Cornell について:** 「（飼い主向け解説ページ／査読文献ではない）」と注記する。

### 修正しないことを推奨する箇所（重要）
- **L17「ほかの病気のこともあるから」** — 医学的にも規制対応上も生命線。**削らない・弱めない**
- **L17「とても多いと言われてる」** — 有病率の数値は出典間で2〜4倍ばらつく。**％を入れない現状が正しい**
- **L19「見つけられることがある」/ L16「サインのことがある」** — ヘッジは適切
- **L22 画面内免責 / L20 受診誘導 / L40 病院リンク禁止** — 維持
- **L39「早く気づけばできることが増える」** — 介入研究と整合し、特定の効果を約束していない

---

**最終更新:** 2026-07-27 ／ **次回レビュー期限:** egress開通時、遅くとも次テーマ着手前
**この記録は獣医師のレビューを受けていない。** 判定Bの主張は、原典照合と獣医師レビューの両方を経て初めて確定とする。
