# GA4データ取得・分析ルーブリック

最終更新: 2026-08-15

## 目的

Measure Gardenの訪問分析を行うAIエージェントが、セッションをまたいでも同じ基準でGA4 Data APIからデータを取得し、過不足や誤集計を避けるための正本とする。

分析依頼では、特別な指定がない限りテスト仕様上の期待値やPlaywrightの計画配分を分析根拠にせず、GA4 Data APIから取得した値だけを観測事実として扱う。合成アクセスを通常の模擬訪問データとして含め、campaignによる除外は行わない。

## 固定条件

| 項目 | 値 |
|---|---|
| GA4プロパティID | `547494073` |
| 標準開始日 | `2026-06-01` |
| 標準終了日 | `today` |
| 認証スコープ | `https://www.googleapis.com/auth/analytics.readonly` |
| 認証方式 | Application Default Credentials |
| 取得方法 | Google Analytics Data API（読み取り専用） |
| campaignの扱い | 原則として全アクセスを合算 |
| 秘密情報 | 出力・文書・Gitへ保存しない |

期間や対象を変更する場合は、分析結果に変更理由と実際の条件を明記する。

## 実行前チェック

1. `AGENTS.md`、このルーブリック、`GA4_ANALYSIS_AND_IMPROVEMENT_WORKFLOW.md` を読む。
2. `git status --short` で作業ツリーを確認する。データ取得だけの依頼ではファイルを変更しない。
3. `.venv` と `requirements.txt` の依存関係を確認する。
4. ADCの認証状態を読み取り専用で確認する。
5. プロパティIDと期間を実行前に表示する。

```powershell
.\.venv\Scripts\python.exe scripts\ga_report.py --check-auth
$env:GA_PROPERTY_ID = "547494073"
.\.venv\Scripts\python.exe scripts\ga_report.py
Remove-Item Env:GA_PROPERTY_ID
```

ADCが失効している場合は `AI_AGENT_MCP_SETUP.md` のPhase 6に従う。SSL検証を無効化してはならない。

## 必須取得セット

訪問分析では、最低限次を取得する。

### 1. 全体指標

- `sessions`
- `totalUsers`
- `activeUsers`
- `newUsers`
- `screenPageViews`
- `engagedSessions`
- `engagementRate`
- `averageSessionDuration`
- `eventCount`

併せて次を計算する。

- 1セッション当たりページビュー
- 新規ユーザー比率
- 1ユーザー当たりイベント数

### 2. 日別推移

ディメンション `date` で、セッション、ユーザー、ページビュー、エンゲージメント率、平均セッション時間を取得する。特定日に集中している場合は、全期間平均だけで一般化しない。

### 3. ランディングページ

`landingPagePlusQueryString` を軸に、セッション、ユーザー、ページビュー、エンゲージメント率、平均セッション時間を取得する。

### 4. ページ別

`pagePath` と必要に応じて `pageTitle` を軸に、ページビュー、ユーザー、エンゲージメント時間を取得する。

次を点検する。

- リポジトリ名あり／なしのパス混在
- 末尾スラッシュの差
- localhostと公開ホストの混在
- 同一ページのURL分散

### 5. イベント別

`eventName` を軸に、イベント数とユーザー数を取得する。少なくとも次を確認する。

- `page_view`
- `experiment_impression`
- `cta_click`
- `article_navigation`
- `outbound_click`
- `scroll`
- `scroll_depth`
- `session_start`
- `first_visit`
- `user_engagement`

## 標準の追加切り口

分析目的に応じて次を追加する。

### スクロール率

- ディメンション: `percentScrolled`
- 指標: `eventCount`, `totalUsers`
- フィルタ: `eventName = scroll_depth`

25%、50%、75%、90%、100%を率別に取得する。イベント数は複数ページ・複数閾値の合計であり、セッション数として扱わない。必要に応じて `pagePath × percentScrolled` まで分解する。

### CTA

`cta_click` のイベント数、ユーザー数、ページ別件数を取得する。

- イベント数ベースのクリック率: `cta_click eventCount ÷ experiment_impression eventCount`
- ユーザーベースの利用率: `cta_click totalUsers ÷ experiment_impression totalUsers`

重複クリックがあるため、2つの率を混同しない。

### 記事回遊

`article_navigation` をページ別、日別、デバイス別に取得する。イベント数と利用ユーザー数を併記する。

### 外部リンク

`outbound_click` を `linkDomain`、必要に応じて `linkUrl`、`linkText`、遷移元ページで取得する。GA4標準の `click` と独自の `outbound_click` を合算しない。

### 流入

`sessionSourceMedium` と `sessionDefaultChannelGroup` でセッション、ユーザーを取得する。合成アクセスも模擬訪問として分析へ含めるが、構成の説明には流入内訳を記載できる。

### デバイス・技術環境

`deviceCategory`、`browser`、`operatingSystem` でセッション、ユーザー、ページビューを取得する。複数ディメンションを組み合わせた表では同一セッションが複数行に現れる可能性があるため、行の単純合計を全体値にしない。

### 新規・再訪

`newVsReturning` と `firstSessionDate` を使う。再訪データがない場合は、継続利用について結論を出さない。

### 時間帯

`date`、`hour`、必要に応じて `dateHour` を使う。時刻はGA4プロパティのタイムゾーンで解釈する。

### ホスト

`hostName` で公開サイトとlocalhostを確認する。必要な場合は分析内で分けて記載するが、依頼がない限り全体集計から自動除外しない。

## カスタムパラメータの扱い

2026-08-15時点で、このプロパティにはData APIから利用可能なカスタムディメンションとカスタム指標が登録されていない。

次のイベントパラメータは送信されていても、GA4管理画面でイベントスコープのカスタムディメンションとして登録されるまでData APIの分析軸として利用できない。

- `variant_id`
- `experiment_id`
- `cta_id`
- `cta_position`
- `page_type`
- `source_content_id`
- `destination_article_id`
- `link_position`

登録は過去データへ遡及しない。利用できないパラメータを推測で補完してはならない。

`percent_scrolled` は例外で、Data APIでは標準ディメンション `percentScrolled` として取得できる。

## 解釈ルール

- イベント数、ユーザー数、セッション数を区別する。
- 複数ページで発火するイベントを訪問者数として扱わない。
- 平均値が少数の長時間セッションに引っ張られる可能性を明記する。
- データが特定日、端末、流入元へ集中している場合は一般利用へ外挿しない。
- 相関を因果関係として断定しない。
- 0件は「利用されていない」と「未登録・取得軸違い」を切り分ける。
- 合成アクセスを実在ユーザーの市場行動として説明しない。
- 少数データから統計的有意差を断定しない。

## 取得結果の品質確認

分析前に次を確認する。

- 全体の `page_view` とページ別 `screenPageViews` の合計が整合する。
- 全体のイベント数とイベント名別集計に大きな不整合がない。
- 期間、プロパティID、取得日時が記録されている。
- 空欄、`(not set)`、URL表記揺れを確認した。
- ディメンション追加による行の重複可能性を確認した。
- カスタムディメンション登録状況をメタデータで確認した。
- 認証情報、完全なADC、OAuth secretを出力していない。

## 分析レポートの構成

分析結果は次の順で記載する。

1. 取得条件
2. 全体指標
3. 日別推移
4. ランディングページ
5. ページ別閲覧
6. イベント別利用
7. スクロール率
8. CTA・記事回遊・外部リンク
9. 流入・デバイス・新規再訪
10. データ品質と制約
11. GAデータから直接確認できる事実
12. 仮説と追加取得が必要な項目

観測事実と解釈を分ける。改善案を作る場合も、根拠にした指標を併記する。

## 完了条件

次をすべて満たしたら取得タスク完了とする。

- 標準期間または指定期間の取得に成功した。
- 必須取得セットが揃った。
- 目的に応じた追加切り口を取得した。
- 取得値の整合性と制約を確認した。
- 秘密情報を保存していない。
- 次の分析担当が取得条件と判断根拠を再現できる。
