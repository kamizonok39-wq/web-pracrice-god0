# ST-GA4-001 collectイベントと重複防止

## 目的

各セッションの操作に対応するGA4 `collect` イベントが観測され、同一ページ・同一到達点のイベントが意図せず重複しないことを確認する。

## シナリオ別期待値

| イベント | product | article | mixed |
|---|---:|---:|---:|
| `page_view` | 1以上 | 1以上 | 1以上 |
| `experiment_impression` | 1 | 1 | 1 |
| `cta_click` | クリック判定時1、それ以外0 | 同左 | 同左 |
| `article_navigation` | 0 | 2 | 1 |
| `outbound_click` | 0 | 0 | 1 |
| `scroll_depth` | 1以上 | 1以上 | 1以上 |

## 重複の定義

- 同一セッション・同一ページパスの `page_view` が2件以上。
- 同一セッション・同一ページパス・同一スクロール率の `scroll_depth` が2件以上。

## 検証手順

1. 純粋関数テストで、正常な3シナリオと重複イベントの拒否を確認する。
2. 公開中のGitHub Pagesへ3セッションのdry-runを行う。
3. 各セッションが成功し、生成レポートに期待イベント不足・重複エラーがないことを確認する。

## 実行

```powershell
npm.cmd run test:synthetic:events
npm.cmd run synthetic:dry -- --fast --concurrency 3 --run-id pw-event-validation-001
```

公開サイトdry-runはGA4へテストイベントを送信する。実行単位はUTM campaignのrun IDで識別する。
