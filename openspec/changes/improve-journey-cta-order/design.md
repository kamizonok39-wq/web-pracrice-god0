# Design: CTAと関連記事の順序変更

## 現状

Variant Aでは、商品説明の後に関連記事リンク、その後に主要CTAがある。GA4上では50%から75%のスクロールイベントが24件から12件へ減少し、同ページからの記事遷移は17ユーザーで観測されている。

## 決定

`article.prose` 内を次の順序にする。

1. 商品説明
2. Variant A主要CTA／Variant B空ブロック
3. 共通の関連記事セクション

Variant Bの上部CTAは維持する。これによりAは下部CTAを関連記事より先に提示し、Bも上部CTAの後に関連記事へ進める。

関連記事には既存の `article_navigation` 属性をそのまま維持する。新しいイベントや個人情報は追加しない。

## スクリーンショット

- 変更前: 公開中ページ `?variant=a`
- 変更後: ローカルページ `?variant=a`
- viewport: 1440×1200
- deviceScaleFactor: 1
- 撮影範囲: `article.prose`
- 保存先:
  - `docs/screenshots/journey-cta-order/before.png`
  - `docs/screenshots/journey-cta-order/after.png`

## 検証

- HTML構造と内部リンク検証
- GA4イベント契約の既存検証
- Variant AでCTAが関連記事より前にあること
- Variant Bで上部CTAと関連記事が表示されること
- 前後画像が同一条件で存在すること

## 改修後に比較するGA4指標

- 対象ページの50%→75%スクロール到達イベント減少率
- 対象ページの `cta_click` ユーザー率
- 対象ページの `article_navigation` ユーザー率

改修前基準値は50%到達24件、75%到達12件、CTA利用10/29ユーザー、記事遷移17/29ユーザーとする。
