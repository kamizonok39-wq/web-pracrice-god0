## Why

Measure GardenにはGA4イベント、CTA A/Bテスト、Data APIレポートがあるが、分析学習に使う一連のアクセスを人が50セッション分再現するのは負担が大きい。AIエージェントからPlaywrightを実行し、管理下の公開サイトへ低負荷で再現可能なテストアクセスを生成できれば、「サイト構築→計測→分析→改善提案」のMCP活用デモを一貫して実施できる。

## What Changes

- 公開中のGitHub Pagesだけを対象とする、50セッションの合成アクセス生成手順を追加する。
- CTA A/B、クリック確率、ユーザー行動、スクロール深度、デバイスの配分を定義する。
- すべてのセッションで解析同意を明示的に許可し、GA4の `collect` 通信を操作結果として確認する。
- `utm_source`、`utm_medium`、実行固有の `utm_campaign` によりテストアクセスを識別する。
- 同時実行数、操作間隔、セッション間隔、最大実行時間、許可ホスト、外部通信遮断、再試行を安全制約として定義する。
- 秘密情報を含まないMarkdown要約とJSONログをローカルだけに保存する。
- AIエージェントが既存OpenSpecからPlaywright操作へ変換するための実行指示書を追加する。

## Capabilities

### New Capabilities

- `synthetic-traffic-generation`: AIエージェントとPlaywrightによる、低負荷で識別可能なGA4学習用アクセス生成を定義する。

### Modified Capabilities

なし。既存の `static-learning-site`、`ga4-event-measurement`、`cta-experimentation`、`static-site-operations` の振る舞いは変更せず、操作対象の正本として参照する。

## Impact

- Playwrightによる実行スクリプト、設定、ローカルレポート出力、実行手順が追加対象となる。
- 公開サイトのHTML、CSS、JavaScript、GA4イベント契約は原則変更しない。
- 実行対象は `https://kamizonok39-wq.github.io/web-pracrice-god0/` に固定する。
- テストは外部参考サイトへ通信せず、Google Analyticsの計測通信だけを許可する。
- GA4レポートへの反映は時差があるため、実行完了条件には含めない。
- 認証トークン、Cookie、完全なNetwork header、個人情報は保存しない。

## Non-Goals

- 負荷試験、性能限界試験、大量アクセス生成。
- 第三者サイトのスクレイピングや操作。
- GA4 Measurement Protocolによるイベントの直接生成。
- GA4レポートへ反映されるまでの待機や、分析結果の自動評価。
- 本物のユーザー行動の統計的再現、A/Bテストの有意差判定。

## Approval

- 2026-08-15、ユーザーが未検証3項目をテストケース単位で管理し、必要な実装・自動テスト・文書を追加することを明示承認した。
