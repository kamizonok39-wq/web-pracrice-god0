# Journey CTA Order Specification

## ADDED Requirements

### Requirement: 主要CTAを関連記事より先に提示する

導線観測スターターの商品詳細は、Variant Aの主要CTAを関連記事リンクより前に表示しなければならない（SHALL）。Variant Bは既存の上部CTAを維持し、関連記事をその後の共通導線として表示しなければならない（SHALL）。

#### Scenario: Variant Aを表示する

- **WHEN** `products/journey-kit.html?variant=a` を開く
- **THEN** 「詳しく相談する」CTAが「イベント名から始めない計測設計」リンクより前に表示される

#### Scenario: Variant Bを表示する

- **WHEN** `products/journey-kit.html?variant=b` を開く
- **THEN** 「無料で相談内容を見る」CTAが上部に表示され、関連記事リンクは商品説明後の共通導線として表示される

### Requirement: 計測契約を維持する

順序変更後もCTAと関連記事のイベント名、必須パラメータ、遷移先を変更してはならない（MUST NOT）。

#### Scenario: CTAと関連記事を操作する

- **WHEN** 利用者がCTAまたは関連記事リンクを操作する
- **THEN** 既存の `cta_click` または `article_navigation` が既存パラメータで送信される

### Requirement: 変更前後の視覚証跡を残す

変更前後のVariant Aを同一viewport・同一範囲で撮影し、リポジトリへ保存しなければならない（SHALL）。

#### Scenario: 比較画像を確認する

- **WHEN** 検証担当者が比較画像を開く
- **THEN** 変更前は関連記事がCTAより前、変更後はCTAが関連記事より前にあることを確認できる
