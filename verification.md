# 検証記録

## ローカル確認

実施日: 2026-07-29

測定ID: `G-PE33N5234J`
確認時設定: `debug: true`

ユーザーによるブラウザ確認:

- 全ページが正常に表示される
- Google tagが読み込まれている
- GA4へのcollect通信が送信されている
- GA4 DebugViewでイベント受信を確認できた
- `page_view` および主要な操作イベントが送信されている
- Consoleに重大なJavaScriptエラーはない
- 個人情報がGA4へ送信されていない

自動検証:

- JavaScript構文: 合格
- HTML構造: 合格
- 内部リンクとアセット: 合格
- イベント契約: 合格
- 個人情報禁止項目: 合格
- CTA A/Bの遷移先一致: 合格
- OpenSpec厳格検証: 合格

ローカルLighthouse（モバイル）:

- Performance: 100
- Accessibility: 100
- Best Practices: 96
- SEO: 100
- Cumulative Layout Shift: 0

## 本番設定

- 測定ID: `G-PE33N5234J`
- `debug: false`
- `debug_mode`: 公開イベントには付与しない
- 公開予定URL: `https://kamizonok39-wq.github.io/web-pracrice-god0/`

## Playwright合成アクセステスト

- 初回実施日: 2026-08-05
- 最終再検証日: 2026-08-15

実装範囲:

- 50セッションの再現可能な計画生成
- A/B、行動、スクロール深度、デバイスの固定配分
- 独立Browser Contextと全セッションの解析同意
- 3種類の導線、CTA確率クリック、外部Document遮断
- GA4 `collect` のイベント名だけを抽出する監視
- 1回再試行、30分停止、SIGINT／SIGTERM終了処理
- Git管理対象外のMarkdown／JSONレポート

自動確認（2026-08-15更新）:

- 計画生成、オリジン制限、レポート安全性、イベント検証の自動テスト12件: 合格
- サイト検証: 合格
- OpenSpec厳格検証: 2変更とも合格
- 依存関係監査: 既知の脆弱性0件

公開サイトdry-run:

- 3種類の導線を各1件: 3件すべて合格
- Variant AのCTAクリック: 合格
- Variant BのCTAクリック: 合格
- `page_view`: 観測
- `experiment_impression`: 観測
- `cta_click`: 観測
- `article_navigation`: 観測
- `outbound_click`: 観測
- `scroll_depth`: 観測
- 外部参考サイトのDocument遮断: 合格
- レポート保存先: `.playwright-output/synthetic-traffic/<run_id>/`（Git管理対象外）

既知の制約:

- ChromiumのBeaconリクエストはPlaywright上で `net::ERR_ABORTED` と報告される場合がある。ツールはリクエスト生成とイベント名の観測を完了条件とし、GA4管理画面への反映は待たない。
- 50セッションの逐次実行 `pw-20260805T122158Z-a3fd5f` は30分上限まで実施し、47セッションでcollectを観測、46セッション正常完了、526イベントをローカル観測した。この実行単体は部分完了だが、後述の3並列正式実行で50件完走を確認済み。
- 続く中断実行 `pw-20260805T125346Z-44690b` は21セッションでcollectを観測し、20セッション正常完了、224イベントをローカル観測した。
- 3セッション・3並列のdry-run `pw-concurrency-dry001` は全件成功した。
- 画面表示あり・1並列のdry-run `pw-headed-dry001` は成功した。
- CLIは `--headed` と `--concurrency 1～5` を独立指定でき、並列時も完了数とチェックポイントを更新する。
- 50セッション・画面表示あり・3並列の正式実行 `pw-20260805-headed-c3-full001` は634秒（10分34秒）で50件すべて成功した。最終失敗0、再試行2回、未開始0。
- 正式実行の配分はA/B各25、行動8/25/17、desktop/mobile/tablet 25/20/5で計画どおり。CTA実績はA 15/25（60%）、B 4/25（16%）。
- 正式実行で `page_view` 180、`scroll_depth` 165、`article_navigation` 51、`cta_click` 19、`outbound_click` 17などを観測し、外部Documentを17回遮断した。
- 正式実行のローカルJSONにAuthorization、Cookie、OAuthトークン、秘密鍵の禁止フィールド候補がないことを確認した。
- 30分上限時の部分レポート確定は逐次実行で確認済み。対象外オリジン拒否とレポート秘密情報検査は専用自動テストを追加し合格済み。

## GA4 Data API接続確認

実施日: 2026-08-05

- Application Default Credentials: 有効
- OAuthスコープ: `https://www.googleapis.com/auth/analytics.readonly`
- 標準レポートとリアルタイムレポート: 読取成功
- 確認時の通常レポート: 過去7日間の `page_view` は反映待ちで0
- 確認時のリアルタイム: `activeUsers` 1、`page_view` 6
- リアルタイムイベント: `scroll_depth` 15、`scroll` 5、`article_navigation` 3、`cta_click` 2、`experiment_impression` 1、`session_start` 1、`first_visit` 1、`user_engagement` 1
- 当初はUTM campaign単位の集計を想定していたが、2026-08-15に合成アクセスを模擬訪問データとして扱い、原則としてcampaignで除外しない方針へ更新した。

### 2026-08-15 再認証・標準期間取得

- GA4プロパティ: `547494073`
- ADC再認証: 成功
- 読み取り専用スコープ: 成功
- 標準期間: `2026-06-01` から今日まで
- 通常レポート: 取得成功
- リアルタイムレポート: 取得成功
- `page_view`: 277
- `cta_click`: 29
- `outbound_click`: 18
- `scroll_depth`: 584
- `article_navigation`: 84
- Windows社内CA対策: `pip-system-certs` とgRPC用一時CAバンドルでTLS検証を維持して成功
- OAuthクライアントJSONとADCはリポジトリ外で管理し、秘密値は文書・ログ・Gitへ保存していない

## ゼロスタート環境セットアップ文書監査

実施日: 2026-08-05

- 前提を「統合IDEで任意AIエージェントだけ利用可能、その他は未導入」へ変更。
- `AI_AGENT_MCP_SETUP.md` をPhase -1～9の一本道へ再構成。
- Git、Node.js、Python、GitHub CLI、Google Cloud CLI、固定版OpenSpec、npm ci、Playwright Chromiumの導入・確認を記載。
- GitHub、GA4 ADC、MCPの認証境界と、MCP非対応時のCLI代替を記載。
- 社内プロキシ、CA、管理者権限、OneDrive、日本語パス、実行ポリシーのトラブル対応を記載。
- セットアップ完了チェック、停止、依存関係削除、認証失効を記載。
- `npm run validate`、合成アクセス単体テスト4件、OpenSpec strict検証、差分チェックに合格。
- 残確認: 新規または初期化したWindows端末でPhase -1～9を実地再現する。

## 公開後確認

実施日: 2026-07-29

公開URL: `https://kamizonok39-wq.github.io/web-pracrice-god0/`

自動確認:

- GitHub Pagesを `main` ブランチの `/` から公開: 完了
- トップ、商品一覧・詳細、記事一覧・詳細、問い合わせ完了の8ページ: HTTP 200
- CSSとJavaScript: HTTP 200
- 全ページから参照される内部リンクと静的リソース: HTTP 200
- リポジトリ名を含むサブディレクトリ配信: パス切れなし
- 公開されたGA4測定ID: `G-PE33N5234J`
- 公開された設定: `debug: false`
- `debug_mode`: `debug` が真の場合だけ追加する実装であり、本番イベントには付与しない

公開後Lighthouse:

- Lighthouse CLIの再実行を試みたが、このセッションではNode.js/npmがPATHから利用できず実行不能
- Google PageSpeed Insights APIによる代替実行も、APIのレート制限（HTTP 429）により完了せず
- 同一コミット内容に対する公開前のモバイルLighthouse結果は Performance 100、Accessibility 100、Best Practices 96、SEO 100、CLS 0

補足的な手動確認として残る項目:

- 公開URLで主要導線を操作した際のConsoleエラー再確認
- 公開Networkで `debug_mode` が付与されないことの目視確認
- 320px、390px、デスクトップ幅でキーボード操作・フォーカス・横スクロール・CTA A/B表示を確認
- 測定ID欠落、同意拒否、無効variant、GA4ブロック時の異常系を確認

## 個別テストの実装・検証結果

実施日: 2026-08-15

| ID | 検証内容 | 自動テスト結果 | 実ブラウザ結果 |
|---|---|---|---|
| ST-SEC-001 | 対象外オリジンのDocument取得拒否 | 合格 | 既存dry-runで外部Document遮断を確認済み |
| ST-SEC-002 | レポートへの秘密・個人・Network生データ混入防止 | 合格 | 保存前検査を実行経路へ組込み済み |
| ST-GA4-001 | シナリオ別collectイベントと重複防止 | 合格 | 3セッションすべて合格 |

- 実行コマンド: `npm.cmd run test:synthetic`
- 結果: 12件中12件合格
- 個別仕様: `openspec/changes/add-playwright-synthetic-traffic/test-cases/`
- 公開サイトdry-run: `pw-event-validation-001`
- 結果: 3セッションすべて成功、失敗0、再試行0、48秒
- 観測イベント: `page_view` 10、`experiment_impression` 3、`scroll_depth` 23、`article_navigation` 3、`outbound_click` 1、`cta_click` 1
- 外部Document遮断: 1件
- 実行時検証で期待イベント不足および定義済み重複は検出されなかった。

## 現在の完了状況と残タスク

完了:

- `build-ga4-learning-site` の実装タスク
- `add-playwright-synthetic-traffic` の全タスク
- 50セッション正式実行
- ST-SEC-001、ST-SEC-002、ST-GA4-001
- サイト検証、合成アクセス自動テスト、OpenSpec厳格検証

残タスク:

- GA4通常レポート反映後のData API再取得と改善分析
- 改善案のユーザー承認後に行うOpenSpec・改修・日本語PR
- 新規または初期化したWindows端末でのセットアップ手順再現
- レスポンシブ、キーボード操作、計測異常系の補足的な手動確認

合成アクセステスト仕様には未完了タスクがなく、以後の再実行は回帰確認または分析データ追加として扱う。

## 導線観測スターターのCTA順序改善

実施日: 2026-08-15

GA4観測事実（2026-06-01以降）:

- 対象ページ: `導線観測スターター｜Measure Garden`
- スクロール50%: 24イベント、21ユーザー
- スクロール75%: 12イベント、9ユーザー
- 50%→75%のイベント減少率: 50%
- ページ利用: 29ユーザー
- CTA利用: 10ユーザー（34.5%）
- 記事遷移: 17ユーザー（58.6%）

変更:

- Variant A主要CTAを関連記事より前へ移動した。
- 関連記事をCTA後の共通 `next-step-card` として整理した。
- Variant Bの上部CTAを維持した。
- `cta_click`、`article_navigation` の属性と遷移先を維持した。

視覚証跡:

- 変更前: `docs/screenshots/journey-cta-order/before.png`
- 変更後: `docs/screenshots/journey-cta-order/after.png`
- 条件: Variant A、1440×1200、deviceScaleFactor 1、`article.prose`

ローカル検証:

- Variant A CTAが関連記事より前: 合格
- Variant B CTAが関連記事より前: 合格
- CTA・記事リンクの可視性: 合格
- イベント属性・遷移先の維持: 合格

公開後に再確認する指標:

- 50%→75%スクロール到達イベント減少率
- 対象ページのCTA利用ユーザー率
- 対象ページの記事遷移ユーザー率

GA4反映後に変更前基準値と比較する。合成アクセスを含む全アクセスを対象とし、campaignでは除外しない。
