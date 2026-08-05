# AIエージェント・MCP導入／再開ガイド

この文書は、人とAIエージェントが、このリポジトリから安全に開発環境を構築し、Measure Gardenの作業を開始・再開するための入口です。

認証トークン、OAuthクライアントJSON、Cookie、秘密鍵、パスワードは、このリポジトリへ保存しません。AIエージェントは、秘密値を必要とする操作を人の確認なしに進めてはいけません。

## AIエージェントへの開始指示

リポジトリを開いたら、AIエージェントへ次のように依頼してください。

> このリポジトリの `AI_AGENT_MCP_SETUP.md` と `AGENTS.md` を最初から最後まで読み、現在の端末を調査してください。不足している環境構築を、安全な読み取り確認から順に提案・実施してください。認証、外部公開、課金、秘密情報、システム全体への変更が必要な場合は、実行前に私へ確認してください。既存のOpenSpecを正本として扱い、承認されていない仕様変更や実装は開始しないでください。

## この環境で実現すること

最終的には、AIエージェントとMCPを使い、次の流れを再現可能にします。

1. VS CodeへAIエージェントを導入する。
2. AIがリポジトリ、仕様、進捗を理解する。
3. AIが計測サイトを構築・検証する。
4. ブラウザMCPで画面、Console、Network、アクセシビリティを確認する。
5. GA4 Data APIから読み取り専用で利用状況を取得する。
6. AIが根拠付きの改善案を提示する。
7. 人の承認後、OpenSpec、実装、検証記録を更新する。

## 想定環境

- Windows 11
- Visual Studio Code
- Git
- GitHubアカウント
- GitHub CLI（`gh`）
- Node.js 20以上
- Python 3.10以上（GA4 Data APIレポートを使う場合）
- VS Codeで利用できるAIコーディングエージェント

AI製品やMCPクライアントによって設定画面・設定ファイルが異なるため、固有の設定値をこのリポジトリへ固定しません。使用中のクライアントの公式手順と、現在のツール一覧を確認してください。

## 1. 人が最初に行う準備

### 必須ソフトウェア

次のコマンドが実行できることを確認します。

```powershell
git --version
code --version
node --version
gh --version
```

PowerShellの実行ポリシーにより `npm.ps1` が拒否される場合は、ポリシーを安易に緩和せず、必要に応じて `npm.cmd` を使用します。

Python機能を使う場合は、次のいずれかが実行できることも確認します。

```powershell
py --version
python --version
```

不足しているソフトウェアは、公式配布元または社内で承認された配布方法からインストールします。AIはインストール前に、配布元、変更範囲、管理者権限、再起動の有無を人へ説明します。

### GitHub認証

GitHub CLIを対話的に認証します。

```powershell
gh auth login -h github.com
gh auth status
```

認証はOSの資格情報ストアを利用し、トークンを `.env`、Markdown、ソースコード、Git設定の平文値として保存しません。

## 2. リポジトリを取得する

任意の作業用フォルダーで実行します。

```powershell
git clone https://github.com/kamizonok39-wq/web-pracrice-god0.git
cd web-pracrice-god0
code .
```

既に取得済みの場合、AIは未コミット変更を確認してから更新を提案します。ユーザーの変更を破棄する `reset --hard` などは実行しません。

## 3. AIエージェントが最初に読むファイル

AIは次の順序で読みます。

1. `AI_AGENT_MCP_SETUP.md` — 環境構築と安全境界
2. `AGENTS.md` — このリポジトリの作業規約
3. `README.md` — サイトの目的、構成、操作方法
4. `openspec/changes/build-ga4-learning-site/specification.md` — 統合仕様
5. `openspec/changes/build-ga4-learning-site/tasks.md` — 現在のタスク
6. `verification.md` — 実施済みの検証と残確認

AIは文書と実際の端末状態が異なる場合、端末で確認できた事実を報告し、文書更新の要否を提案します。

## 4. AIが行う安全な事前確認

最初は読み取り操作だけを実行します。

```powershell
git status --short
git branch --show-current
git remote -v
node --version
Get-Command py, python -ErrorAction SilentlyContinue
```

続いて、認証値を表示せず、必要な設定の有無だけを確認します。

- GA4測定IDの設定箇所
- `GA_PROPERTY_ID` の有無
- Google Application Default Credentialsを利用できるか
- 利用可能なMCPサーバーとツール
- ブラウザの起動・ローカルURLへの接続可否

AIは環境変数の値、認証JSONの内容、Authorization header、Cookieを会話やログへ展開しません。

## 5. ローカルサイトを起動する

依存パッケージ不要のNode.jsサーバーを使用できます。

```powershell
node scripts/serve.mjs
```

既定URL:

```text
http://127.0.0.1:8000/
```

停止は、サーバーを起動したターミナルで `Ctrl+C` を押します。

Pythonが利用できる場合は、代わりに次も使用できます。

```powershell
py -m http.server 8000
```

## 6. MCPを接続・確認する

このプロジェクトで優先するMCPは次のとおりです。

| MCP／コネクター | 用途 | 必要権限 |
|---|---|---|
| Chrome DevTools | Console、Network、画面幅、Lighthouse、性能確認 | ローカル／公開サイトのブラウザ操作 |
| Playwright | 操作シナリオ、キーボード、画面幅、スクリーンショット、回帰確認 | 管理下サイトのブラウザ操作 |
| GitHub | リポジトリ、Issue、PR、レビュー、Actions | 対象リポジトリに必要な最小権限 |
| GA4 Data API | 読み取り専用の利用状況分析 | 対象GA4プロパティの閲覧権限 |

### 接続方針

- MCP設定は使用するAIクライアントのユーザー設定で管理します。
- トークンや認証ファイルをリポジトリ内のMCP設定へ直接書きません。
- 最初の疎通確認には、ページ一覧、リポジトリ情報、認証状態などの読み取り操作を使います。
- Issue作成、push、デプロイ、設定更新など、外部状態を変える操作はユーザーの依頼範囲を確認します。
- 任意コード実行型ツールは、定型ツールで代替できない場合に限定します。

### ブラウザMCPの疎通確認

1. ローカルサーバーを起動する。
2. MCPで `http://127.0.0.1:8000/` を開く。
3. ページタイトルとアクセシビリティツリーを取得する。
4. Consoleの重大なエラーがないことを確認する。
5. NetworkでHTML、CSS、JavaScriptが成功していることを確認する。
6. 320px、390px、デスクトップ幅へ変更できることを確認する。

確認結果は秘密情報を除いて `verification.md` へ記録します。

## 7. サイトの自動検証

Node.js 20以上で実行します。

```powershell
node scripts/validate-site.mjs
```

検証対象には、主要ページ、内部リンク、静的アセット、HTML構造、GA4スクリプト、イベント契約、個人情報禁止項目、CTA A/Bの遷移先、OpenSpec構造が含まれます。

AIは検証に失敗した場合、結果を隠さず、失敗項目、再現手順、推定原因、修正に仕様変更が必要かを報告します。

## 8. GA4の設定

### Webサイト側

GA4測定IDは `assets/js/ga4-config.js` の一か所で管理します。測定IDはWebページへ配信される識別子であり認証用シークレットではありませんが、変更理由と対象プロパティを確認してください。

```js
window.GA4_CONFIG = Object.freeze({
  measurementId: "G-XXXXXXXXXX",
  debug: false,
});
```

本番公開時は `debug: false` とします。

### Data API側

ローカル分析では、数値のGA4プロパティIDを環境変数から渡します。

```powershell
$env:GA_PROPERTY_ID = "123456789"
```

これは現在のPowerShellセッションだけに設定する例です。実値をコミットしません。

Python仮想環境と依存関係の例:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

認証状態だけを確認します。

```powershell
.\.venv\Scripts\python.exe scripts\ga_report.py --check-auth
```

レポートを実行します。

```powershell
.\.venv\Scripts\python.exe scripts\ga_report.py
```

Google Application Default Credentials、OAuthクライアントJSON、サービスアカウント鍵はリポジトリ外で管理します。必要な権限はGoogle Analyticsの読み取り専用に限定します。

## 9. 秘密情報を含めないための確認

コミット前に、AIと人が差分を確認します。

```powershell
git status --short
git diff --check
git diff
```

特に次をコミットしません。

- GitHub、Google、OpenAIなどのアクセストークン
- OAuthクライアントJSON
- サービスアカウント鍵、秘密鍵
- `.env` の実値
- Cookie、Authorization header、ブラウザプロファイル
- 個人情報を含むNetworkログやスクリーンショット
- OSユーザー名を含む不要な絶対パス

`.env.example` には形式を示すダミー値だけを置きます。AIは秘密らしい文字列を発見したら、内容を回答へ転載せず、ファイル名と対応方法だけを人へ報告します。

## 10. 仕様変更とサイト改修

このリポジトリはOpenSpecを正本にします。

1. AIが現状、データ、課題を整理する。
2. 改善案、根拠、期待効果、リスク、評価指標を提示する。
3. 人が採用案を明示的に承認する。
4. AIがproposal、spec、design、tasksを更新する。
5. 人がOpenSpecを承認する。
6. AIが実装する。
7. 自動検証とブラウザ検証を行う。
8. `verification.md` とタスク状態を更新する。

承認前に実装へ進んではいけません。

## 11. GitHubへ公開する

作業ツリーと差分を確認し、対象ファイルだけをコミットします。

```powershell
git status --short
git diff --check
git add <対象ファイル>
git diff --cached
git commit -m "docs: add AI agent and MCP setup guide"
git push -u origin <作業ブランチ>
```

通常はPull Requestでレビューしてから `main` へ統合します。GitHub Pagesは `main` のリポジトリルートを公開元として扱います。

AIはユーザーの未コミット変更を無断で含めず、`git add -A` を安易に使用しません。認証トークンをリモートURLへ埋め込みません。

## 12. 作業完了時の引き継ぎ

AIは作業終了時に、最低限次を残します。

- 実施したタスク
- 変更したファイル
- 実行した検証と結果
- 未解決事項
- 次に実行する具体的な一手
- 人の承認が必要な事項

別のAIエージェントは、この文書、`AGENTS.md`、OpenSpec、`verification.md`、Git差分を読むことで作業を再開できます。

## 現在の既知の注意点

- `npm` がPowerShell実行ポリシーで拒否される端末では `npm.cmd` を検討する。
- PythonがPATHにない端末では、Python Launcherの `py` または仮想環境内のPythonを使用する。
- Gitで所有者警告が出た場合、対象パスと原因を確認する。グローバルな `safe.directory` を無条件に広げない。
- MCPツールが表示されることと、対象サービスへ認証済みであることは別である。

## 人が判断する事項

AIへ移譲せず、人が最終判断します。

- 仕様と改善案の承認
- 外部サービスへのログインと権限付与
- 課金が発生するサービスの利用
- 本番公開、デプロイ、ロールバック
- 秘密情報の発行・失効
- 社内データ・個人情報の利用可否
- セキュリティ実証の対象と安全境界
