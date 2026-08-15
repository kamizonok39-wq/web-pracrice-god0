# 合成アクセステストケース一覧

検証項目を、実装・自動テスト・実ブラウザ確認へ追跡できる単位で管理する。以下の3件はすべて完了している。

| ID | 検証対象 | OpenSpecタスク | 自動テスト | 状態 |
|---|---|---|---|---|
| ST-SEC-001 | 対象外オリジンのDocument取得拒否 | 5.3 | `tests/synthetic-traffic-origin.test.mjs` | 自動テスト・実行確認済み |
| ST-SEC-002 | レポートへの秘密・個人・Network生データ混入防止 | 5.4 | `tests/synthetic-traffic-report.test.mjs` | 自動テスト・実行時検査済み |
| ST-GA4-001 | 期待するcollectイベントと重複防止 | 6.2 | `tests/synthetic-traffic-events.test.mjs` | 自動テスト・公開サイトdry-run済み |

個別仕様には、目的、入力、操作、期待結果、実行コマンドを記載する。結果の証跡は `verification.md` に集約する。
