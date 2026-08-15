# Playwright合成アクセステスト指示書

状態: OpenSpec承認・全タスク実装済み。dry-run、画面表示、3並列、部分完了時のチェックポイント、50セッション完走、安全性・イベント自動検査を検証済み。

## AIエージェントへの指示

> `AGENTS.md`、既存の `openspec/changes/build-ga4-learning-site/`、新しい `openspec/changes/add-playwright-synthetic-traffic/`、この指示書を最初から最後まで読んでください。承認前は実行スクリプト、依存関係、公開サイトを変更しないでください。承認後は `tasks.md` の順に実装し、最初にdry-run、次に50セッションを実行してください。対象外サイトへアクセスせず、認証情報、Cookie、完全なNetworkログを保存しないでください。

## 正本

- 追加要件: `openspec/changes/add-playwright-synthetic-traffic/specs/synthetic-traffic-generation/spec.md`
- 設計判断: `openspec/changes/add-playwright-synthetic-traffic/design.md`
- 実装順序: `openspec/changes/add-playwright-synthetic-traffic/tasks.md`
- 画面導線: `openspec/changes/build-ga4-learning-site/specs/static-learning-site/spec.md`
- GA4イベント: `openspec/changes/build-ga4-learning-site/specs/ga4-event-measurement/spec.md`
- CTA A/B: `openspec/changes/build-ga4-learning-site/specs/cta-experimentation/spec.md`
- 運用・障害: `openspec/changes/build-ga4-learning-site/specs/static-site-operations/spec.md`
- 個別テスト仕様: `openspec/changes/add-playwright-synthetic-traffic/test-cases/README.md`

## 固定設定

```yaml
target_url: https://kamizonok39-wq.github.io/web-pracrice-god0/
sessions: 50
concurrency: 1  # CLIで1～5を指定可能。未指定時は1
operation_delay_seconds: [1, 3]
session_delay_seconds: [10, 20]
max_runtime_minutes: 30
consent: granted_for_all_sessions
retry_per_failed_session: 1
completion_signal: ga4_collect_observed
report_storage: local_only
```

過去の部分実行とdry-runはGA4へ送信済みであり、再実行しても上書きされない。正式分析では一意な `run_id` を指定し、GA4のUTM campaignで対象実行を識別する。

## セットアップと実行コマンド

初回だけ依存関係とChromiumを導入する。

```powershell
npm.cmd install
npx.cmd playwright install chromium
```

実アクセスの前に安全性・計画・イベント契約の自動テストを実行する。全件合格しない場合は、dry-runや50セッション実行を開始しない。

```powershell
npm.cmd run test:synthetic
```

安全性・イベント検証を個別に再実行する場合:

```powershell
npm.cmd run test:synthetic:origin
npm.cmd run test:synthetic:report
npm.cmd run test:synthetic:events
```

50セッションの計画だけを確認する。

```powershell
npm.cmd run synthetic:plan
```

3種類の行動を1件ずつdry-runする。

```powershell
npm.cmd run synthetic:dry
```

50セッションを標準の低負荷設定で実行する。

```powershell
npm.cmd run synthetic:run
```

ブラウザを表示して1並列でデモ実行する。

```powershell
npm.cmd run synthetic:run -- --headed --concurrency 1
```

ブラウザを表示して3並列で実行する。

```powershell
npm.cmd run synthetic:run -- --headed --concurrency 3
```

画面を表示せず3並列で実行する場合は `--headed` を外す。並列数は1～5の範囲で指定でき、未指定時は1となる。

AIが任意の`run_id`で1～3件を高速確認する場合:

```powershell
node scripts/synthetic-traffic/run.mjs --sessions 3 --fast --run-id pw-example-dry001
```

`--fast`は3件以下のdry-run専用で、50セッションには使用できない。出力は `.playwright-output/synthetic-traffic/<run_id>/` に保存され、Git管理されない。

## セッション計画

### CTA

| Variant | セッション | クリック確率 |
|---|---:|---:|
| A | 25 | 70% |
| B | 25 | 30% |

クリック数は確率判定のため固定しない。実績値をレポートする。

### 行動

| ID | 件数 | 操作 |
|---|---:|---|
| product-short | 8 | トップ→商品一覧→商品詳細→CTA判定 |
| article-focused | 25 | トップ→記事一覧→記事詳細→関連記事→商品詳細→CTA判定 |
| mixed-deep | 17 | トップ→商品一覧→商品詳細→関連記事→外部参考リンク→商品詳細→CTA判定 |

### 最大スクロール深度

| 25% | 50% | 75% | 90% | 100% |
|---:|---:|---:|---:|---:|
| 5件 | 5件 | 10件 | 5件 | 25件 |

### デバイス

| Desktop | Mobile | Tablet |
|---:|---:|---:|
| 25件 | 20件 | 5件 |

## 実行前チェック

AIは実行前に次を確認して報告する。

1. Git作業ツリーの状態。
2. PlaywrightまたはPlaywright MCPが利用可能か。
3. 対象URLが固定値と一致するか。
4. 50件の配分合計がすべて正しいか。
5. 出力先がGit管理対象外か。
6. 許可オリジンと外部Document遮断が有効か。
7. 最大30分と停止処理が有効か。
8. レポートスキーマに秘密値の保存欄がないか。

不一致がある場合は50件実行を開始せず、ユーザーへ報告する。

## 1セッションの共通手順

1. 計画からvariant、行動、最大スクロール深度、デバイスを取得する。
2. 新しいBrowser Contextを作成する。
3. `run_id` のUTMを付けてトップを開く。
4. 解析同意ボタンを選択し、状態が有効になったことを確認する。
5. `page_view` の `collect` を観測する。
6. 割り当てられた行動シナリオを、操作間1～3秒で進める。
7. 商品詳細は `?variant=a` または `?variant=b` を使う。
8. `experiment_impression` とvariantを確認する。
9. 割り当て最大値まで段階的にスクロールする。
10. シード付き確率判定がtrueならCTAを操作する。
11. 操作したイベントに対応する `collect` を確認する。
12. 許可フィールドだけを結果へ保存する。
13. Browser Contextを閉じる。
14. セッション間10～20秒待機する。

## 要素の特定方針

安定性の高い順に使用する。

1. `data-ga-event`、`data-analytics-consent`、`data-experiment-variant`など既存の意味付き属性。
2. roleと日本語のアクセシブル名。
3. hrefとページ見出し。
4. CSS構造や要素の出現順への依存は避ける。

サイトの表示文言とOpenSpecが不一致の場合、テストを無理に合わせず仕様差分として報告する。

## `collect`の確認

Google Analyticsの計測リクエストを監視し、可能な範囲でイベント名を読み取る。結果へ保存してよい項目は次だけとする。

- session_index
- attempt
- observed_at
- page_path
- expected_event
- observed_event
- http_statusまたは送信観測結果
- variant
- scenario_id

保存禁止:

- Cookie
- Authorization header
- 全header
- 完全なリクエストURL
- クエリ全文
- リクエスト本文の生データ
- ブラウザプロファイル
- 個人情報

## 外部リンク

外部参考リンクはクリック操作を行うが、対象外オリジンのDocumentリクエストを中止する。Google Analyticsの `outbound_click` を観測した後、外部ページの内容を取得せず元のシナリオへ戻る。Google Analyticsの計測先まで遮断しない。

## 成功・失敗

セッション成功:

- 対象サイト内の計画導線を完了した。
- 解析同意が有効になった。
- 操作したイベントに対応する `collect` を観測した。
- 対象外サイトのDocumentを取得していない。
- Browser Contextを閉じた。

セッション失敗:

- ページまたは要素のタイムアウト。
- 計画導線を完了できない。
- 期待した `collect` を所定時間内に観測できない。
- 許可されていないページアクセスを検出した。
- レポート安全検査に失敗した。

失敗時は新しいBrowser Contextで1回だけ再試行する。再失敗後は次の計画セッションへ進む。

## 30分上限と中断

- 開始から30分に達したら新しいセッションを開始しない。
- 進行中の操作を安全な境界で止め、Contextを閉じる。
- `completed_partial` としてレポートを確定する。
- ユーザーから停止指示が来た場合も同じ終了処理を使う。
- 強制終了後にブラウザやNodeプロセスを残さない。

## ローカルレポート

想定出力:

```text
.playwright-output/synthetic-traffic/<run_id>/summary.md
.playwright-output/synthetic-traffic/<run_id>/results.json
```

`summary.md` に含める内容:

- run_idと開始・終了時刻
- 完了状態と所要時間
- 計画／完了／失敗／再試行数
- A/Bの表示数、クリック数、実績クリック率
- 行動、スクロール、デバイスの計画値と実績値
- イベント別の期待数と観測数
- 外部Document遮断件数
- 30分上限または手動停止の有無
- 既知の問題と次の確認事項

`results.json` に含める内容:

- 実行設定の秘密情報を含まない複製
- セッション計画
- セッション／試行ごとの結果
- 許可フィールドだけのイベント観測
- 集計値

レポートはGitへコミットしない。

## 段階的な実行

1. 計画生成だけを実行し、合計と再現性を確認する。
2. 1セッションのdry-runを実行する。
3. A/B、記事、外部リンク、途中スクロールを含む3セッションdry-runを実行する。
4. レポートの秘密情報検査を行う。
5. ユーザーへdry-run結果を報告する。
6. 問題がなければ50セッションを実行する。

50セッションを最初から無検証で実行してはならない。
