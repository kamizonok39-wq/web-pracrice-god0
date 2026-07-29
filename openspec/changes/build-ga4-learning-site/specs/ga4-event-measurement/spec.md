## Purpose

学習者がページ上の行動、JavaScript上の発火条件、GA4 DebugView上のイベントを一対一で追跡できる、明示的で個人情報を含まない計測仕様を定義する。

## ADDED Requirements

### Requirement: GA4測定の有効化
サイトは設定されたGA4測定IDを使ってGoogle tagを初期化できなければならない（SHALL）。未設定またはプレースホルダーの測定IDでは外部へイベントを送信してはならず（MUST NOT）、開発者コンソールに学習者向けの説明を表示しなければならない（SHALL）。

#### Scenario: 有効な測定IDが設定される
- **WHEN** `G-`で始まる有効な形式の測定IDが設定され、ユーザーが解析を許可する
- **THEN** Google tagが一度だけ読み込まれ、イベント送信が有効になる

#### Scenario: 測定IDが未設定である
- **WHEN** 測定IDが空または説明用プレースホルダーである
- **THEN** サイトの閲覧機能は維持され、GA4への通信は行われない

### Requirement: 解析同意と個人情報の禁止
解析ストレージは初期状態で拒否され、ユーザーが明示的に学習用解析を有効にした場合のみ許可されなければならない（SHALL）。イベント名、URL、タイトル、イベントパラメータに氏名、メールアドレス、電話番号、住所、自由記述、ユーザーIDその他の個人識別情報を含めてはならない（MUST NOT）。

#### Scenario: 初回訪問で同意していない
- **WHEN** ユーザーが初めてサイトを開く
- **THEN** analytics storageはdeniedで、解析を有効化する選択肢が表示される

#### Scenario: 解析を有効化する
- **WHEN** ユーザーが解析有効化を選択する
- **THEN** 同意状態が同一ブラウザに保存され、Google tagが初めて読み込まれ、現在のページの `page_view` が1回送信可能になる

### Requirement: イベント仕様の一元管理
計測コードは、イベント名と発火条件を定数または対応表として一元管理し、各イベント送信箇所から参照しなければならない（SHALL）。READMEは同じイベント一覧とGA4 DebugViewでの確認手順を示さなければならない（SHALL）。

#### Scenario: 学習者がイベント実装を確認する
- **WHEN** 学習者が計測用JavaScriptファイルを開く
- **THEN** イベント名、必須パラメータ、発火条件を1つのまとまりとして確認できる

### Requirement: ページ閲覧イベント
各HTMLページの表示時にGA4推奨イベント `page_view` を1回送信しなければならない（SHALL）。パラメータは `page_title`、`page_location`、`page_path`、`page_type` を含まなければならない（SHALL）。

#### Scenario: ページを直接表示する
- **WHEN** 同意済みユーザーが任意のページを新規表示または再読み込みする
- **THEN** その表示に対して `page_view` が1回だけ発火する

### Requirement: CTAクリックイベント
`data-ga-event="cta_click"` を持つCTAの選択時に `cta_click` を送信しなければならない（SHALL）。パラメータは `cta_id`、`cta_text`、`cta_position`、`destination_path`、`experiment_id`、`variant_id` を含まなければならない（SHALL）。

#### Scenario: 商品詳細のCTAを選択する
- **WHEN** 同意済みユーザーが商品詳細ページの主要CTAをクリックまたはキーボードで実行する
- **THEN** 遷移前に `cta_click` が1回発火し、表示中のCTAバリエーションが記録される

#### Scenario: 実験対象外のCTAを選択する
- **WHEN** 同意済みユーザーが実験対象外のCTAを実行する
- **THEN** `cta_click` が1回発火し、`experiment_id` と `variant_id` には文字列 `none` が記録される

### Requirement: 記事回遊イベント
記事カード、関連記事、パンくずまたは記事内リンクから記事詳細へ移動する際に `article_navigation` を送信しなければならない（SHALL）。パラメータは `source_content_id`、`destination_article_id`、`link_position` を含まなければならない（SHALL）。遷移元が記事でない場合、`source_content_id` は `top`、`article-list`、`product-<id>` のような匿名のコンテンツ識別子でなければならない（SHALL）。

#### Scenario: 関連記事へ移動する
- **WHEN** 同意済みユーザーが記事詳細ページの関連記事リンクを選択する
- **THEN** 遷移前に `article_navigation` が1回発火し、遷移元と遷移先の記事IDが記録される

#### Scenario: 記事一覧から記事へ移動する
- **WHEN** 同意済みユーザーが記事一覧のカードを選択する
- **THEN** `article_navigation` が1回発火し、`source_content_id` に `article-list` が記録される

### Requirement: 外部リンクイベント
現在のGitHub Pagesサイトと異なるホストへのHTTP(S)リンクを選択した際に `outbound_click` を送信しなければならない（SHALL）。パラメータは `link_url`、`link_domain`、`link_text`、`link_position` を含まなければならない（SHALL）。

#### Scenario: 外部参考資料を開く
- **WHEN** 同意済みユーザーが外部サイトへの参考リンクを選択する
- **THEN** 外部遷移前に `outbound_click` が1回発火する

### Requirement: スクロール率イベント
各ページで初めて25%、50%、75%、90%、100%の各深度へ到達した時に `scroll_depth` を送信しなければならない（SHALL）。パラメータは `percent_scrolled`、`page_type` を含み、同一ページ表示中の同じ閾値は1回だけ送信しなければならない（SHALL）。

#### Scenario: ページ末尾まで読む
- **WHEN** 同意済みユーザーが同一ページ表示中にページ末尾までスクロールする
- **THEN** `scroll_depth` が25、50、75、90、100の各値について最大1回ずつ発火する

### Requirement: 学習用デバッグ表示
開発モードでは、送信対象イベントのイベント名、発火理由、匿名パラメータをブラウザコンソールへ整形表示できなければならない（SHALL）。この表示はGA4送信が無効な場合も動作しなければならない（SHALL）。

#### Scenario: 測定IDなしでイベントを試す
- **WHEN** 学習者がデバッグモードでCTAを選択する
- **THEN** GA4通信なしで `cta_click` の発火条件と送信予定パラメータをコンソールで確認できる
