## Context

リポジトリにはOpenSpec構成だけがあり、アプリケーション実装はまだ存在しない。要求の動機と範囲は [proposal.md](./proposal.md)、観測可能な振る舞いは `specs/` 配下を参照する。ホスティング先はGitHub Pagesで、対象読者はコードを読みながらGA4を学ぶ初心者である。

## Goals / Non-Goals

**Goals:**

- ビルドなしでファイル構成、画面、計測コードの対応を追えるようにする。
- GitHub Pagesのプロジェクトサイト配下でも壊れない相対リンク設計にする。
- GA4イベント名、発火条件、パラメータを一元化し、DebugViewとコンソールで検証しやすくする。
- CTA実験を匿名かつ再現可能にし、表示母数とクリック数を比較できるようにする。
- 計測不能時にも閲覧を妨げないプログレッシブエンハンスメントとする。

**Non-Goals:**

- 実商品の販売、問い合わせ受付、会員登録、ログイン、決済、データベース連携。
- サーバーサイド計測、Google Tag Manager、広告連携、ユーザー単位の追跡。
- 実験結果の統計的有意差判定や本番マーケティング判断。
- CMS、管理画面、多言語化、検索機能。

## Decisions

### 1. HTML/CSS/Vanilla JavaScriptを採用する

各ページを静的HTML、共通CSS、役割別の少数JavaScriptファイルで構成する。npmによるビルドを必須にせず、ローカルHTTPサーバーとGitHub Pagesだけで動作させる。

**理由:** 初心者がDOM要素の `data-*` 属性からイベント送信までを直接追え、GitHub Pagesの配信物とソースが一致する。依存更新やビルド失敗も避けられる。

**代替案:**

- **Astro / Eleventy:** テンプレート共通化と多数ページの生成には優れるが、Node.jsとビルド工程が教材の理解対象を増やす。ページ数が大幅に増えた場合の第一代替候補。
- **React + Vite:** コンポーネント化とSPA解析の学習には適するが、今回はページ遷移型サイトのGA4基礎とソース可読性を優先するため不採用。
- **単一ページのみ:** 配置は簡単だが、ページ閲覧と記事回遊の計測学習を十分に再現できないため不採用。

### 2. 複数HTMLページと相対URLを採用する

想定ファイルは `index.html`、`products/index.html`、`products/<id>.html`、`articles/index.html`、`articles/<id>.html`、`contact/complete.html` とし、内部リンクとアセット参照は各階層から解決できる相対URLにする。

**理由:** GitHub Pagesの `/<repository>/` サブパスで追加設定なしに動作し、`page_view` とページ種別の対応も理解しやすい。

**代替案:** ルート相対URLはローカル開発では簡潔だが、プロジェクトサイト公開時にリポジトリ名を含むベースパス処理が必要になるため不採用。

### 3. 計測層を独立させる

計測を次の責務へ分ける。

- `assets/js/ga4-config.js`: 測定ID、デバッグ設定、プレースホルダー判定。
- `assets/js/analytics.js`: Google tag初期化、Consent Mode、イベント定義、共通送信関数。
- `assets/js/tracking.js`: DOMの `data-ga-*` 属性とスクロール状態を発火条件へ変換。
- `assets/js/experiment.js`: CTAバリエーション割り当て、DOM反映、表示イベント。

イベント送信APIは「コンソールへの学習ログ」と「同意・測定IDが有効な場合のGA4送信」を同じ入口で処理する。GA4読み込み失敗は捕捉し、ナビゲーションを止めない。

**理由:** UIと計測の責務を分離しつつ、イベント一覧と発火条件を少数ファイルで追える。

**代替案:**

- **Google Tag Manager:** ノーコード変更には優れるが、発火条件がリポジトリ外へ移り学習要件に反するため不採用。
- **各ページにインラインgtag:** 最初は短いが、イベント名の揺れと二重発火が起きやすいため不採用。

### 4. イベント契約を固定する

| イベント名 | 発火条件 | 主なパラメータ |
|---|---|---|
| `page_view` | 同意済みの各ページ表示時に1回 | `page_title`, `page_location`, `page_path`, `page_type` |
| `cta_click` | `data-ga-event="cta_click"` のCTA実行時 | `cta_id`, `cta_text`, `cta_position`, `destination_path`, `experiment_id`, `variant_id` |
| `article_navigation` | 記事カードや関連記事から記事詳細へ移動するリンク実行時 | `source_content_id`, `destination_article_id`, `link_position` |
| `outbound_click` | 現在と異なるホストへのHTTP(S)リンク実行時 | `link_url`, `link_domain`, `link_text`, `link_position` |
| `scroll_depth` | 25/50/75/90/100%へ初到達時 | `percent_scrolled`, `page_type` |
| `experiment_impression` | 実験CTAが表示可能になった時にページ表示ごと1回 | `experiment_id`, `variant_id`, `cta_id`, `cta_position` |

Google tagの初期化では自動ページビューを無効にし、解析同意後に明示的な `page_view` を送る。GA4標準のEnhanced Measurementによるpage views、scrolls、outbound clicksは、二重計測を避けるためREADMEで無効化対象を明示する。実験対象外のCTAでは `experiment_id` と `variant_id` に `none` を使用し、イベント表のパラメータ形状を一定にする。

### 5. 同意状態と実験状態を分離する

- 解析同意は `localStorage` に `granted` / `denied` のみ保存し、Google tagは `granted` 後に初めて読み込む。
- CTAバリエーションは `sessionStorage` に `a` / `b` のみ保存する。
- `?variant=a|b` を手動検証用の上書きとして扱う。
- 個人情報、GA client ID、独自ユーザーID、フィンガープリントは保存・送信しない。

**理由:** 学習上の再現性を確保しつつ、個人識別を避ける。実験割り当てをセッション単位に限定するため、長期追跡にもならない。

**代替案:** Cookieによる長期固定は本番実験に近いが、同意とプライバシーの説明が複雑になり学習範囲を超えるため不採用。

### 6. CTA実験は表示母数を必ず計測する

実験IDを `product-detail-primary-cta-v1` とし、A/Bで同じ遷移先を維持する。Aは「詳しく相談する」を商品説明末尾に置き、Bは「無料で相談内容を見る」を商品概要直後に置く。固定表示は使用しない。

評価指標は `cta_click / experiment_impression` とする。`variant_id` と `experiment_id` をGA4カスタムディメンションとして登録する手順をREADMEへ記載する。

### 7. コンテンツと導線

- **トップ:** 学習目的、注目商品、注目記事、計測できる行動、解析有効化コントロール。
- **商品一覧:** 3件程度の商品カードから商品詳細へ移動。
- **商品詳細:** 商品説明、関連記事、実験対象CTA。
- **記事一覧:** 3件程度の記事カード。
- **記事詳細:** 長文コンテンツ、スクロール計測、関連記事、外部参考リンク、商品への導線。
- **問い合わせ完了:** 模擬CTAの到達点、実送信なしの説明、トップ・商品・記事への復帰導線。

### 8. 検証方針

- ローカルHTTPサーバーで全内部リンクとアセットを確認する。
- 各ページ種別について320px/390px/デスクトップ幅を確認する。
- 測定IDなし、同意前、同意後、GA4ブロック時を確認する。
- 各イベントをコンソールで確認し、同一操作での二重発火がないことを確認する。
- GA4 DebugViewでイベント名と匿名パラメータを確認する。
- Lighthouse、HTML検証、キーボード操作、リンクチェックを実施する。

## Risks / Trade-offs

- [静的HTML間で共通ヘッダーが重複する] → ページ数を小さく保ち、共通構造の変更チェックリストを用意する。規模拡大時はEleventyへ移行する。
- [GA4 Enhanced Measurementと独自イベントが重複する] → READMEでpage views、scrolls、outbound clicksの対象設定を明示し、DebugViewで重複を検査する。
- [ブラウザや広告ブロッカーでGA4が動かない] → サイト機能を計測から分離し、コンソール学習ログを常に利用可能にする。
- [少量の実験データが誤解を招く] → 学習用で統計的結論を出せない旨と、表示母数を使う計算式を明記する。
- [GitHub Pagesのサブパスでリンクが壊れる] → 相対URLを使用し、公開URL相当のサブパスでリンク検証を行う。
- [100%スクロールが短いページで初期表示時に発火する] → 発火条件を文書化し、短いページも「表示領域が文書全体を覆う場合は到達」として一貫して扱う。

## Migration Plan

1. 仕様承認後、静的ページと共通アセットを実装する。
2. 測定IDプレースホルダーのままローカル品質確認を行う。
3. テスト用GA4プロパティの測定IDを設定し、同意後のDebugViewを確認する。
4. GitHub Pagesを `main` ブランチのルートから公開し、公開URLで再検証する。
5. 問題があればGitHub Pagesを無効化するか、直前コミットへ戻して再公開する。GA4側はデータストリームを停止または測定IDをプレースホルダーへ戻す。
