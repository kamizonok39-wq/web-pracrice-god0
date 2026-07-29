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

実施日: 2026-07-29

公開URL: `https://kamizonok39-wq.github.io/web-pracrice-god0/`

自動確認:

- GitHub Pagesを `main` ブランチの `/` から公開: 完了
- トップ、商品一覧・詳細、記事一覧・詳細、問い合わせ完了の8ページ: HTTP 200
- CSSとJavaScript: HTTP 200
- 全ページから参照される内部リンクと静的リソース: HTTP 200
- リポジトリ名を含むサブディレクトリ配信: パス切れなし
- 公開されたGA4測定ID: `G-PE33N5234J`
- 公開された設定: `debug: false`
- `debug_mode`: `debug` が真の場合だけ追加する実装であり、本番イベントには付与しない

公開後Lighthouse:

- Lighthouse CLIの再実行を試みたが、このセッションではNode.js/npmがPATHから利用できず実行不能
- Google PageSpeed Insights APIによる代替実行も、APIのレート制限（HTTP 429）により完了せず
- 同一コミット内容に対する公開前のモバイルLighthouse結果は Performance 100、Accessibility 100、Best Practices 96、SEO 100、CLS 0

ブラウザ操作が必要な残確認:

- 公開URLでのConsoleエラー確認
- Networkの `collect?v=2` で `page_view`、CTA、外部リンク、スクロールイベントと `debug_mode` 非付与を確認
- 320px、390px、デスクトップ幅でキーボード操作・フォーカス・横スクロール・CTA A/B表示を確認
- 測定ID欠落、同意拒否、無効variant、GA4ブロック時の異常系を確認
