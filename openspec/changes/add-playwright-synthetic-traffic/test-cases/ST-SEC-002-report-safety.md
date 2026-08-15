# ST-SEC-002 レポート安全性

## 目的

ローカルレポートへ認証情報、個人情報、Cookie、header、完全なNetwork URLや送信本文が保存されないことを自動検査する。

## 許可する情報

イベント名、時刻、ページパス、HTTP結果、セッション番号、A/Bバリアント、スクロール率など、仕様で許可した最小情報だけを保存する。設定の `targetUrl` は実行対象の明示用として例外的に許可する。

## テストケース

| ケース | 入力 | 期待結果 |
|---|---|---|
| 正常な要約レポート | 許可フィールドだけのオブジェクト | 合格 |
| 認証・Cookie・PII | authorization、cookie、メールアドレス等 | 拒否 |
| Network生データ | requestUrl、postData、headers等 | 拒否 |
| 完全URLの混入 | `targetUrl` 以外の値に完全URL | 拒否 |

## 合格条件

安全なレポートだけが保存可能で、禁止キーまたは禁止形式を1件でも含むレポートは保存前に失敗すること。

## 実行

```powershell
npm.cmd run test:synthetic:report
```
