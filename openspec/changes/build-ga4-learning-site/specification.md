# GA4アクセス解析学習サイト仕様書

## 1. サイトの目的

画面上の操作、ソースコード内のイベント発火条件、GA4 DebugViewの結果を対応付けながら、アクセス解析の基礎を学べる公開教材を提供する。架空のEC・記事サイトを題材に、ページ閲覧、CTA、コンテンツ回遊、外部遷移、読了度、簡易A/Bテストを実践できるようにする。

## 2. 想定ユーザー

- GA4を初めて設定・操作する学習者
- HTML/CSS/JavaScriptを学習中で、計測コードを読みたい人
- アクセス解析を学び直すWeb担当者

前提知識は、ブラウザ操作とGitHubの基本が分かる程度とする。Google Analyticsの高度な知識やNode.jsのビルド経験は求めない。

## 3. ページ構成

| 種別 | 最低ページ数 | 主な内容 | 主な計測 |
|---|---:|---|---|
| トップ | 1 | 学習目的、注目商品、注目記事、解析同意 | `page_view`, `cta_click` |
| 商品一覧 | 1 | 架空商品カード3件程度 | `page_view`, `cta_click` |
| 商品詳細 | 2 | 商品説明、関連記事、実験CTA | `page_view`, `cta_click`, `experiment_impression`, `scroll_depth` |
| 記事一覧 | 1 | 架空記事カード3件程度 | `page_view`, `article_navigation` |
| 記事詳細 | 2 | 長文記事、関連記事、外部参考リンク | `page_view`, `article_navigation`, `outbound_click`, `scroll_depth` |
| 問い合わせ完了 | 1 | 模擬到達点、実送信なしの説明 | `page_view` |

## 4. ユーザー導線

### 商品関心導線

`トップ → 商品一覧 → 商品詳細 → CTA → 問い合わせ完了 → 商品一覧またはトップ`

### 記事回遊導線

`トップまたは商品詳細 → 記事一覧 → 記事詳細 → 関連記事 → 別の記事詳細`

### 学習導線

`READMEで測定ID設定 → 解析を有効化 → 画面操作 → コンソール確認 → GA4 DebugView確認 → 探索でバリエーション比較`

## 5. GA4で計測するイベント

| イベント | 発火条件 | 必須パラメータ |
|---|---|---|
| `page_view` | 同意済みの各ページ表示時に1回 | `page_title`, `page_location`, `page_path`, `page_type` |
| `cta_click` | 計測対象CTAのクリックまたはキーボード実行時 | `cta_id`, `cta_text`, `cta_position`, `destination_path`, `experiment_id`, `variant_id` |
| `article_navigation` | 記事カードや関連記事から記事詳細へ移動するリンクの実行時 | `source_content_id`, `destination_article_id`, `link_position` |
| `outbound_click` | 現在と異なるホストへのHTTP(S)リンク実行時 | `link_url`, `link_domain`, `link_text`, `link_position` |
| `scroll_depth` | 25/50/75/90/100%へ各ページで初到達した時 | `percent_scrolled`, `page_type` |
| `experiment_impression` | 実験対象CTAが表示された時にページ表示ごと1回 | `experiment_id`, `variant_id`, `cta_id`, `cta_position` |

同じ操作での二重発火を禁止する。実験対象外のCTAでは `experiment_id` と `variant_id` に `none` を設定する。GA4 Enhanced Measurementのpage views、scrolls、outbound clicksと重複しない設定をREADMEで説明する。イベントパラメータへ個人情報や独自ユーザーIDを含めない。

## 6. 実験項目

- 実験ID: `product-detail-primary-cta-v1`
- 対象: 商品詳細の主要CTA
- バリエーションA: 「詳しく相談する」を商品説明末尾に配置
- バリエーションB: 「無料で相談内容を見る」を商品概要直後に配置
- 遷移先と目的: A/Bで統一し、問い合わせ完了ページへ遷移
- 割り当て: 初回に均等ランダム、同一セッション中は固定
- 手動検証: `?variant=a` / `?variant=b`
- 表示母数: `experiment_impression`
- 成果: `cta_click`
- 主指標: `cta_click ÷ experiment_impression`
- 注意: 学習用の少量データから統計的・事業的結論を断定しない

## 7. 技術構成

### 採用

静的HTML、CSS、Vanilla JavaScriptを採用し、ビルド工程を必須にしない。

### 選定理由

- GitHub Pagesへそのまま配置できる。
- 画面要素の `data-*` 属性とイベントコードの対応を初心者が追いやすい。
- フレームワーク固有概念や依存更新を学習範囲へ持ち込まずに済む。
- GA4が失敗しても通常リンクでページ遷移できる構成にしやすい。

### 代替案

- **Astro / Eleventy:** ページ増加時のテンプレート共通化に適するが、現段階ではビルド工程が教材を複雑にする。
- **React + Vite:** SPA計測やコンポーネント学習に適するが、今回は複数ページの基本計測と可読性を優先する。
- **Google Tag Manager:** 運用変更には適するが、発火条件がリポジトリ外へ移りコード学習に不向き。

詳細は [design.md](./design.md) を参照する。

## 8. 非機能要件

- 幅320px以上で主要コンテンツに横スクロールを発生させない。
- 最新および1つ前の主要Chrome、Edge、Firefox、Safariを対象とする。
- WCAG 2.2 AAを目標とし、Lighthouse Accessibility 90以上とする。
- LighthouseモバイルPerformance 90以上、CLS 0.1以下とする。
- GA4未設定、同意拒否、通信ブロック時にもページ閲覧と導線を維持する。
- GitHub Pagesの `/<repository>/` サブパスでリンクとアセットを正しく解決する。
- 個人情報を入力、保存、イベント送信しない。解析ストレージは初期状態で拒否する。
- イベント名、必須パラメータ、発火条件をコード内で一元管理する。

## 9. 受け入れ条件

- 6種類のページが存在し、商品詳細と記事詳細は各2ページ以上ある。
- 商品関心導線と記事回遊導線を、スマートフォンとキーボード操作で完了できる。
- 問い合わせ完了まで個人情報の入力や実送信が発生しない。
- 6イベントが仕様どおりの条件で各1回発火し、必須パラメータを持つ。
- スクロール率が25/50/75/90/100%ごとに重複なく計測される。
- CTAのA/Bを自動割り当ておよびURL指定で再現でき、表示数とクリック数を比較できる。
- 測定ID未設定、同意拒否、GA4ブロックでもサイト機能が壊れない。
- DebugViewで匿名イベントを確認でき、個人情報が含まれない。
- GitHub Pagesの公開URLですべての内部リンクとアセットが機能する。
- READMEだけで測定ID設定、デバッグ、カスタムディメンション設定、公開、無効化を再現できる。
- Lighthouseとブラウザ検証が非機能要件を満たす。

詳細なテストシナリオは `specs/*/spec.md` を参照する。

## 10. 実装タスク一覧

実装作業は [tasks.md](./tasks.md) のチェックリストに従う。大分類は次のとおり。

1. プロジェクト基盤
2. ページ実装
3. GA4基盤とプライバシー
4. イベント計測
5. CTA実験
6. README
7. 受け入れ検証

仕様がユーザーに承認されるまで、これらのタスクは開始しない。
