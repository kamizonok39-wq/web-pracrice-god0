## Purpose

初心者が追加のサーバーや複雑なビルド基盤なしでサイトを理解、検証、設定し、GitHub Pagesへ安全に公開できる運用要件を定義する。

## ADDED Requirements

### Requirement: 静的ホスティング互換性
成果物はGitHub Pagesのプロジェクトサイト配下で静的ファイルとして動作しなければならない（SHALL）。ルート固定URLに依存せず、リポジトリ名を含むサブパスからページ、CSS、JavaScript、画像へ到達できなければならない（SHALL）。

#### Scenario: GitHub Pagesのサブパスで公開する
- **WHEN** サイトを `https://<owner>.github.io/web-pracrice-god0/` 配下へ公開する
- **THEN** すべての内部リンクとアセットが404にならず読み込まれる

### Requirement: READMEによる再現可能な設定
READMEは前提条件、ローカル確認方法、GA4プロパティとWebデータストリームの準備、測定IDの設定箇所、DebugView確認、カスタムディメンション、GitHub Pages公開手順、無効化とトラブルシューティングを記載しなければならない（SHALL）。

#### Scenario: 初学者が公開手順を実行する
- **WHEN** 初学者がREADMEを上から順に実行する
- **THEN** コードへ個人情報や秘密情報を追加せず、GA4を設定したサイトをGitHub Pagesへ公開できる

### Requirement: 性能
画像とアセットは学習用途に必要な範囲へ抑え、標準的なモバイル回線で主要コンテンツを速やかに表示しなければならない（SHALL）。Lighthouseのモバイル計測でPerformance 90以上を目標とし、重大なレイアウトシフトを発生させてはならない（MUST NOT）。

#### Scenario: モバイル性能を検査する
- **WHEN** 公開相当ビルドのトップページをLighthouseのモバイル設定で検査する
- **THEN** Performanceが90以上で、Cumulative Layout Shiftが0.1以下である

### Requirement: アクセシビリティと意味構造
サイトはWCAG 2.2 AAを目標とし、適切なランドマーク、見出し階層、ラベル、代替テキスト、色コントラスト、フォーカス表示を備えなければならない（SHALL）。Lighthouse Accessibilityは90以上でなければならない（SHALL）。

#### Scenario: 自動アクセシビリティ検査を行う
- **WHEN** 各ページ種別をLighthouseまたは同等の自動検査で確認する
- **THEN** Accessibilityが90以上で、重大なエラーがない

### Requirement: 対応ブラウザと耐障害性
サイトは最新および1つ前の主要バージョンのChrome、Edge、Firefox、Safariで主要導線を利用できなければならない（SHALL）。GA4スクリプトがブロック、未設定、または読み込み失敗となっても閲覧とページ遷移を妨げてはならない（MUST NOT）。

#### Scenario: GA4通信がブロックされる
- **WHEN** ブラウザ拡張またはネットワーク設定がGoogle tagをブロックする
- **THEN** コンソールの未処理例外なしに全ページと主要導線を利用できる

### Requirement: 公開前品質確認
公開前に内部リンク、HTML、計測イベントの重複、個人情報を含むパラメータ、スマートフォン表示を確認できる再現可能なチェック手順を用意しなければならない（SHALL）。

#### Scenario: リリース候補を検証する
- **WHEN** 実装者が公開前チェックを実行する
- **THEN** リンク切れ、HTML重大エラー、イベント二重発火、個人情報送信、主要画面崩れがないことを確認できる
