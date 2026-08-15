# Measure Garden

> AIエージェントとMCPを使って環境構築・作業再開する場合は、最初に [`AI_AGENT_MCP_SETUP.md`](AI_AGENT_MCP_SETUP.md) を読んでください。
>
> GA4分析用の合成アクセスを生成する場合は、[`PLAYWRIGHT_SYNTHETIC_TRAFFIC_INSTRUCTIONS.md`](PLAYWRIGHT_SYNTHETIC_TRAFFIC_INSTRUCTIONS.md) を参照してください。
>
> GA4の数値取得から改善分析、改修、日本語PR作成までを再開する場合は、[`GA4_ANALYSIS_AND_IMPROVEMENT_WORKFLOW.md`](GA4_ANALYSIS_AND_IMPROVEMENT_WORKFLOW.md) を参照してください。

## 現在の実施状態

最終更新: 2026-08-15

- 学習用静的サイト: 実装・GitHub Pages公開済み
- GA4イベント計測、Consent Mode、CTA A/B: 実装・検証済み
- Playwright合成アクセス: 実装済み。画面表示あり／なし、1～5並列、50セッション実行に対応
- 50セッション正式実行: 画面表示あり・3並列で全件成功済み
- 安全性とイベントの個別テスト: ST-SEC-001、ST-SEC-002、ST-GA4-001を完了
- 自動テスト: 12件合格
- 公開サイト3セッション再検証: 全件成功
- OpenSpec `add-playwright-synthetic-traffic`: 全タスク完了

詳細な証跡は [`verification.md`](verification.md)、テスト仕様は [`test-cases/README.md`](openspec/changes/add-playwright-synthetic-traffic/test-cases/README.md) を参照してください。

## 現在の残タスク

1. GA4通常レポートへ反映された合成アクセスをData APIで取得する。
2. UTM campaign単位で数値とページ構成を照合し、改善候補を作る。
3. ユーザー承認後、改善用OpenSpec、サイト改修、検証、日本語PRを実施する。
4. 独立した環境確認として、新規または初期化したWindows端末でセットアップ手順を再現する。
5. 補足的な手動確認として、レスポンシブ・キーボード操作と計測異常系を確認する。

GA4（Google Analytics 4）のイベント計測を、画面操作とソースコードを見比べながら学ぶ静的デモサイトです。架空の商品・記事を回遊し、イベントの発火条件、パラメータ、DebugViewでの見え方を確認できます。

> このサイトは教材です。実在商品の販売、問い合わせ受付、個人情報の入力・送信は行いません。

## 学べること

- ページ閲覧、CTAクリック、記事回遊、外部リンク、スクロール率の計測
- CTAの文言・配置を変えたA/B比較
- Consent Modeと、許可後にだけGoogle tagを読み込む構成
- GA4未設定・ブロック時にもサイトを壊さない実装
- GitHub Pagesでの静的サイト公開

## 技術構成

ビルド不要のHTML、CSS、Vanilla JavaScriptを採用しています。イベントの対象要素はHTMLの `data-ga-*` 属性で確認でき、送信条件は `assets/js/` の少数ファイルにまとまっています。

```text
.
├─ index.html
├─ products/
│  ├─ index.html
│  ├─ journey-kit.html
│  └─ content-kit.html
├─ articles/
│  ├─ index.html
│  ├─ event-design.html
│  └─ ab-testing.html
├─ contact/
│  └─ complete.html
├─ assets/
│  ├─ css/styles.css
│  └─ js/
│     ├─ ga4-config.js
│     ├─ analytics.js
│     ├─ tracking.js
│     └─ experiment.js
└─ scripts/validate-site.mjs
```

## ローカルで確認する

ファイルを直接開くのではなく、リポジトリのルートでHTTPサーバーを起動します。

Pythonがある場合：

```bash
python -m http.server 8000
```

Node.jsがある場合：

```bash
node scripts/serve.mjs
```

ブラウザで `http://localhost:8000/`（`serve`の場合は表示されたURL）を開きます。開発者ツールのConsoleを開くと、測定IDが未設定でもイベント名、発火理由、予定パラメータを確認できます。

## GA4測定IDを設定する

### 1. GA4側を準備する

1. Google Analyticsで学習専用のGA4プロパティを作成します。
2. 「管理」→「データの収集と修正」→「データ ストリーム」を開きます。
3. Webデータストリームを作成し、公開予定のGitHub Pages URLを登録します。
4. `G-` から始まる測定IDをコピーします。

### 2. リポジトリへ設定する

`assets/js/ga4-config.js` のプレースホルダーだけを変更します。

```js
window.GA4_CONFIG = Object.freeze({
  measurementId: "G-PE33N5234J",
  debug: false,
});
```

設定箇所は `assets/js/ga4-config.js` の1か所です。測定IDはブラウザへ公開される識別子で、APIキーやパスワードではありません。本番公開では `debug: false` とし、公開イベントへ `debug_mode` を付与しません。

### 3. Enhanced Measurementの重複を避ける

この教材は、コード上の発火条件を明確にするため次を独自送信します。

- Page views
- Scrolls
- Outbound clicks

WebデータストリームのEnhanced Measurement設定で上記をオフにしてください。Google tag側の自動ページビューもコードで `send_page_view: false` にしています。重複を残すと、同じ操作が2回記録されます。

## 解析同意

初回状態は `analytics_storage: denied` です。「解析を有効にする」を選ぶまでGoogle tag自体を読み込みません。

- 同意状態：`localStorage` に `granted` または `denied` のみ保存
- 実験バリエーション：`sessionStorage` に `a` または `b` のみ保存
- 不使用：氏名、メールアドレス、電話番号、住所、自由入力、ユーザーID、フィンガープリント

同意を無効にした後もサイトの閲覧・リンク操作は利用できます。

## イベント一覧

イベント契約の正本は `assets/js/analytics.js` の `EVENT_CONTRACT` です。

| イベント | 発火条件 | 必須パラメータ |
|---|---|---|
| `page_view` | 同意済みのページ表示ごとに1回 | `page_title`, `page_location`, `page_path`, `page_type` |
| `cta_click` | `data-ga-event="cta_click"` の要素を実行 | `cta_id`, `cta_text`, `cta_position`, `destination_path`, `experiment_id`, `variant_id` |
| `article_navigation` | 計測対象リンクから記事詳細へ移動 | `source_content_id`, `destination_article_id`, `link_position` |
| `outbound_click` | 別ホストへのHTTP(S)リンクを実行 | `link_url`, `link_domain`, `link_text`, `link_position` |
| `scroll_depth` | 25/50/75/90/100%へ初到達 | `percent_scrolled`, `page_type` |
| `experiment_impression` | 実験CTAが同意済みユーザーに表示 | `experiment_id`, `variant_id`, `cta_id`, `cta_position` |

実験対象外CTAの `experiment_id` と `variant_id` は `none` です。URLと外部リンクはクエリ文字列・ハッシュを除いて送信し、入力値をイベントに渡す処理はありません。

## DebugViewで確認する

1. `assets/js/ga4-config.js` の `debug` を一時的に `true` にします。
2. ローカルサーバーを起動し、サイトで「解析を有効にする」を選びます。
3. 商品や記事を回遊し、CTA、外部リンク、スクロールを試します。
4. Google Analyticsの「管理」→「データ表示」→「DebugView」を開きます。
5. イベント名を選び、必須パラメータと操作が一致するか確認します。
6. 確認後は必ず `debug: false` に戻してから公開します。

### カスタムディメンション

「管理」→「データ表示」→「カスタム定義」で、イベントスコープのカスタムディメンションを登録します。

- `experiment_id`
- `variant_id`
- `cta_id`
- `cta_position`
- `page_type`
- `percent_scrolled`
- `source_content_id`
- `destination_article_id`
- `link_position`

登録後のデータから利用可能になります。過去データへ遡って適用されない点に注意してください。

## CTA実験

実験IDは `product-detail-primary-cta-v1` です。

- A：「詳しく相談する」を商品説明末尾に表示
- B：「無料で相談内容を見る」を商品概要直後に表示
- 自動：初回にA/Bを均等確率で割り当て、同じブラウザセッション中は維持
- 手動：商品詳細URLへ `?variant=a` または `?variant=b` を追加

主要指標は次の式です。

```text
CTAクリック率 = cta_click数 ÷ experiment_impression数
```

探索レポートでは行へ `variant_id`、列またはフィルタへイベント名を置きます。このデモの少量データから、統計的な優劣や事業判断を断定しないでください。

## 自動検証

Node.js 20以上で次を実行します。

```bash
node scripts/validate-site.mjs
```

次を確認します。

- 必須ページと内部リンク
- ローカルアセット参照
- HTMLの基本構造
- 全ページのGA4スクリプト
- イベント契約と個人情報禁止キー
- CTA A/Bの同一遷移先
- OpenSpecの受け入れ条件に対応する構造

## GitHub Pagesへ公開する

1. 変更を `main` ブランチへコミット・プッシュします。
2. GitHubのリポジトリで「Settings」→「Pages」を開きます。
3. 「Build and deployment」のSourceを「Deploy from a branch」にします。
4. Branchを `main`、Folderを `/(root)` にして保存します。
5. デプロイ完了後、次のURLを開きます。

```text
https://kamizonok39-wq.github.io/web-pracrice-god0/
```

6. トップ、商品一覧、商品詳細、記事一覧、記事詳細、問い合わせ完了を巡り、404とレイアウト崩れがないか確認します。
7. 測定IDを設定済みなら、同意後にDebugViewでイベントを確認します。

### 公開を止める・戻す

- 公開停止：「Settings」→「Pages」でSourceを無効化します。
- コードを戻す：問題のないコミットをrevertして `main` へプッシュします。
- GA4送信だけ止める：`ga4-config.js` を `G-XXXXXXXXXX` へ戻します。

## トラブルシューティング

### イベントがDebugViewへ出ない

- 測定IDが正しいか確認
- サイトで解析を有効化したか確認
- 広告ブロッカーや追跡防止を一時的に確認
- ConsoleにGoogle tag読み込み失敗がないか確認
- `debug` が `true` か確認

### イベントが2回出る

- Enhanced MeasurementのPage views、Scrolls、Outbound clicksをオフにしたか確認
- 同じ計測用JavaScriptをHTMLで重複読み込みしていないか確認

### GitHub PagesでCSSやリンクが壊れる

- URLが `https://kamizonok39-wq.github.io/web-pracrice-god0/` で始まるか確認
- 大文字・小文字を含めファイル名が一致するか確認
- `node scripts/validate-site.mjs` を実行

## 仕様

OpenSpec変更は `openspec/changes/build-ga4-learning-site/` にあります。仕様、設計、タスク、自己レビューを確認できます。

公開前後の確認結果は [`verification.md`](verification.md) に記録します。

## Google Analytics Data APIレポート

`scripts/ga_report.py` は、公開サイトとは独立してローカルで動作する読み取り専用の分析スクリプトです。Google Analytics Data API v1とApplication Default Credentials（ADC）を使用し、認証情報や秘密鍵をリポジトリへ保存しません。

### 前提条件

- Python 3.10以上
- Google Cloud CLI（`gcloud`）
- 対象Google CloudプロジェクトでGoogle Analytics Data APIが有効
- ADCで認証するGoogleアカウントに、対象GA4プロパティの「閲覧者」以上の権限
- GA4管理画面の「管理」→「プロパティの設定」に表示される数値のプロパティID

`G-PE33N5234J` はWebデータストリームの測定IDです。Data APIのプロパティ指定には使用できません。

### セットアップ

PowerShellで仮想環境を作成し、依存関係をインストールします。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

ADCへログインします。Google Cloud CLIの標準OAuthクライアントではAnalyticsスコープが制限される場合があるため、Google Auth Platformで作成した「デスクトップアプリ」のOAuthクライアントJSONを使用します。JSONは必ずリポジトリ外へ保存してください。生成されるADCもユーザープロファイルに保存され、リポジトリには保存されません。

```powershell
gcloud auth application-default login `
  --client-id-file="C:\path\outside-repository\oauth-client.json" `
  --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
```

`cloud-platform` は現在のGoogle Cloud CLIがADCログイン時に要求するスコープです。レポートスクリプトがGoogle Analyticsへ要求するスコープは `analytics.readonly` のみに固定しています。

認証確認だけを行う場合:

```powershell
.\.venv\Scripts\python.exe scripts\ga_report.py --check-auth
```

対象の数値プロパティIDを現在のPowerShellセッションへ設定し、レポートを実行します。

```powershell
$env:GA_PROPERTY_ID = "123456789"
.\.venv\Scripts\python.exe scripts\ga_report.py
```

`.env.example` は設定値の形式を示すだけのファイルです。スクリプトは秘密情報の誤読込を避けるため、`.env` を自動では読み込みません。必要な値は実行環境から渡してください。

### 出力されるレポート

- 今日を含む過去7日間の日別 `page_view`
- ページパス別 `page_view`
- イベント名別イベント数
- `cta_click` の件数
- `outbound_click` の件数
- `scroll` と `scroll_depth` の内訳および合計
- リアルタイムの `activeUsers`

認証には `https://www.googleapis.com/auth/analytics.readonly` だけを明示的に要求します。ADC、`.env`、認証JSON、サービスアカウント鍵、仮想環境、Pythonキャッシュは `.gitignore` の対象です。
