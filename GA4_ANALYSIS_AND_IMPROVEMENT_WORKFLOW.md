# GA4分析・改善・PRワークフロー

最終更新: 2026-08-15

## 目的

Google Analytics Data APIから取得した数値と、Measure Gardenのページ構成・導線・イベント仕様を照合し、根拠付きの改善案を作成する。ユーザー承認後はOpenSpec、実装、検証を更新し、日本語のPull RequestをGitHubへ作成する。

## 現在の状態

- 公開URL: `https://kamizonok39-wq.github.io/web-pracrice-god0/`
- GA4測定ID: `G-PE33N5234J`
- ADC認証と `analytics.readonly` スコープ: 疎通確認済み
- Google Analytics Data API: 標準レポートとリアルタイムレポートの読取確認済み
- GA4数値プロパティID: `547494073`
- 標準取得期間: `2026-06-01` から今日まで
- 2026-08-15に再認証後の通常・リアルタイム取得を再確認。`page_view` 277、`cta_click` 29、`outbound_click` 18、`scroll_depth` 584を取得
- 2026-08-05の確認時点では、通常レポートは反映待ちで `page_view` 0、リアルタイムは `page_view` 6、`activeUsers` 1を確認
- Playwright合成アクセス: 実装済み。画面表示あり／なし、1～5並列を指定可能
- 50件の逐次実行は部分完了。`pw-20260805T122158Z-a3fd5f` では47セッションでcollectを観測し、46セッションが正常完了
- その後の中断実行 `pw-20260805T125346Z-44690b` でも21セッションでcollectを観測
- dry-runのアクセスもGA4へ送信済み。再実行は既存データを上書きせず追加される
- 正式実行 `pw-20260805-headed-c3-full001` は画面表示あり・3並列で50セッションを10分34秒で完走。全50件成功、再試行2回、CTAはA 15/25、B 4/25
- 安全性・イベント検証 ST-SEC-001、ST-SEC-002、ST-GA4-001は実装・自動テスト済み
- 合成アクセス自動テストは12件すべて合格
- 再検証 `pw-event-validation-001` は3並列・3セッションが全件成功し、期待イベント不足と定義済み重複なしを確認
- 今後の改善分析ではcampaignで除外せず、合成アクセスを模擬訪問データとしてGA4全体を分析対象にする
- 最大のページ内到達率低下として導線観測スターターの50%→75%（24→12イベント、50%減）を特定し、CTAを関連記事より前へ移動する改善を実装済み

## 再開時に最初に読むもの

1. `AGENTS.md`
2. `README.md`
3. `openspec/changes/build-ga4-learning-site/`
4. `openspec/changes/add-playwright-synthetic-traffic/`
5. `PLAYWRIGHT_SYNTHETIC_TRAFFIC_INSTRUCTIONS.md`
6. `GA4_DATA_ACQUISITION_RUBRIC.md`
7. このファイル
8. `verification.md`

## 分析データの取得

認証情報とOAuthクライアントJSONはリポジトリ外で管理する。数値のGA4プロパティIDは環境変数から渡し、文書やGitへ新たに認証情報を保存しない。

取得項目、追加する切り口、解釈ルール、品質確認、完了条件は `GA4_DATA_ACQUISITION_RUBRIC.md` を正本とする。分析タスクを開始するAIエージェントは、取得前に必ず同ファイルを読み、依頼に明示された例外がない限りルーブリックへ従う。

```powershell
.\.venv\Scripts\python.exe scripts\ga_report.py --check-auth
$env:GA_PROPERTY_ID = "547494073"
.\.venv\Scripts\python.exe scripts\ga_report.py
Remove-Item Env:GA_PROPERTY_ID
```

ADCが失効した場合は、リポジトリ外の `$env:USERPROFILE\.credentials\google\oauth-client.json` を使って `gcloud.cmd auth application-default login` を再実行する。詳細は `AI_AGENT_MCP_SETUP.md` のPhase 6を正本とする。秘密値やADC本文は読み上げたりGitへ保存したりしない。

通常レポートへ反映されていない場合は、リアルタイムの受信確認だけを接続確認として扱い、改善判断を確定しない。通常集計へ反映された後、同じ期間と条件で再取得する。

## 分析に使用する情報

- ページ別 `page_view`
- セッション数、ユーザー数、デバイス分類
- `experiment_impression` と `cta_click` によるCTAクリック率
- A/Bバリエーション別の表示数とクリック率
- `article_navigation` による内部回遊
- `outbound_click`
- `scroll` と `scroll_depth` による到達度
- 流入構成を説明する場合のsource／medium／campaign
- HTML上の導線、CTA配置、記事・商品間リンク
- OpenSpecに定義された期待行動とイベント発火条件

## 分析上の注意

- 今回の主要データは設計された合成アクセスであり、実利用者の自然行動を代表しない。
- 少数標本の差を統計的な優劣として断定しない。
- タイムアウトまたは失敗したセッションも、失敗前のイベントが部分的に計上される。
- 特別な比較依頼がない限りcampaignで抽出・除外せず、GA4全体を分析する。
- GA4の標準レポート反映には時間差がある。Playwrightの完了条件はcollect観測であり、Data API反映ではない。
- 発見事項、根拠、仮説、期待効果、リスク、確認指標を分けて記載する。

## 改善からPRまで

1. 分析期間、取得時刻、プロパティ、指標、適用したフィルタを記録する。
2. 数値をサイト構成と照合し、課題候補を優先度付きで提示する。
3. ユーザーが採用する改善案を承認する。
4. 承認案に対応するOpenSpecのproposal、design、spec、tasksを作成または更新する。
5. OpenSpecの実装承認後にサイトを改修する。
6. 静的検証、Playwright、必要なブラウザ確認を実施する。
7. 改修前の数値、課題、仮説、変更、検証、改修後に見る指標をまとめる。
8. ブランチをpushし、日本語のタイトル・本文でPull Requestを作成する。

PRは合成データに基づく教材上の改善であることを明記し、自動でマージしない。マージはユーザーの明示依頼後に行う。

## 次の実行指示

通常レポートへの反映後、AIへ次のように依頼する。

> `GA4_DATA_ACQUISITION_RUBRIC.md` と `GA4_ANALYSIS_AND_IMPROVEMENT_WORKFLOW.md` を読み、ルーブリックに従ってGA4 Data APIから最新データを取得してください。特別な指定がない限りcampaignで除外せず、GA4の取得値を観測事実として分析してください。改善案の承認前はサイトを変更せず、承認後にOpenSpec、実装、検証を更新し、日本語PRを作成してください。

## 残タスク

- [x] GA4通常レポートの反映状況をData APIで再取得する。
- [x] campaignで分離せず、合成アクセスを含む全アクセスを分析対象にする方針を確定する。
- [x] 数値、ページ導線、イベント仕様を照合して改善候補と優先度を提示する。
- [x] 導線観測スターターのCTA順序改善についてユーザー承認を得る。
- [ ] 承認後に改善用OpenSpec、実装、検証、日本語PRを作成する。

Playwright合成アクセステスト自体に未完了タスクはない。追加実行はデータ追加または回帰確認が必要な場合だけ行う。
