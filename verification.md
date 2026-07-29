# 検証記録

## ローカル確認

実施日: 2026-07-29

測定ID: `G-PE33N5234J`
確認時設定: `debug: true`

ユーザーによるブラウザ確認:

- 全ページが正常に表示される
- Google tagが読み込まれている
- GA4へのcollect通信が送信されている
- GA4 DebugViewでイベント受信を確認できた
- `page_view` および主要な操作イベントが送信されている
- Consoleに重大なJavaScriptエラーはない
- 個人情報がGA4へ送信されていない

自動検証:

- JavaScript構文: 合格
- HTML構造: 合格
- 内部リンクとアセット: 合格
- イベント契約: 合格
- 個人情報禁止項目: 合格
- CTA A/Bの遷移先一致: 合格
- OpenSpec厳格検証: 合格

ローカルLighthouse（モバイル）:

- Performance: 100
- Accessibility: 100
- Best Practices: 96
- SEO: 100
- Cumulative Layout Shift: 0

## 本番設定

- 測定ID: `G-PE33N5234J`
- `debug: false`
- `debug_mode`: 公開イベントには付与しない
- 公開予定URL: `https://kamizonok39-wq.github.io/web-pracrice-god0/`

## 公開後確認

GitHub Pages公開後に結果を追記する。
