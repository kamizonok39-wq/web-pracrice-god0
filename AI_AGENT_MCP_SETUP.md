# AIエージェント環境セットアップガイド

最終更新: 2026-08-05

## この文書の対象

統合IDEで任意のAIコーディングエージェントを利用できることだけを前提に、Windows 11の新規端末へMeasure Gardenの開発・検証環境を構築する。Git、Node.js、Python、GitHub CLI、Google Cloud CLI、OpenSpec、Playwright、MCP、各種認証は未導入として説明する。

この文書は環境構築の正本である。サイト仕様は `README.md` と `openspec/`、合成アクセスは `PLAYWRIGHT_SYNTHETIC_TRAFFIC_INSTRUCTIONS.md`、分析から改善PRまでは `GA4_ANALYSIS_AND_IMPROVEMENT_WORKFLOW.md` を参照する。

## Phase -1 — リポジトリ取得前の入口

新規端末にはこのファイル自体が存在しない。最初だけ、GitHubで次の公開ページを開き、そのURLをIDEのAIエージェントへ渡す。

<https://github.com/kamizonok39-wq/web-pracrice-god0/blob/main/AI_AGENT_MCP_SETUP.md>

AIがWebページを直接読めない場合は、人がPhase 0～3を画面で参照しながら実行する。Gitを導入してcloneした後は、GitHub上の表示ではなくローカルの `AI_AGENT_MCP_SETUP.md` を正本として最初から読み直す。IDEエージェントにターミナル実行能力がない場合、コマンドは人がIDE内ターミナルで実行し、結果だけをAIへ共有する。

## AIエージェントへの開始指示

リポジトリ取得後、AIへ次のまま依頼する。

> `AI_AGENT_MCP_SETUP.md` と `AGENTS.md` を最初から最後まで読み、現在の端末を読み取り専用コマンドで調査してください。この文書のPhase順に不足を提示し、1段階ずつ構築・検証してください。インストール、管理者権限、再起動、認証、課金、外部公開、秘密情報、システム全体の設定変更が必要な場合は実行前に確認してください。認証値を会話やログへ表示せず、OpenSpec承認前に仕様変更や実装を開始しないでください。

## 安全境界

- インストーラーは公式配布元または社内承認済み配布元だけを使う。
- AIは人の確認なしに実行ポリシー、ファイアウォール、プロキシ、証明書、システム環境変数を変更しない。
- GitHub、Google、AI製品のログインは人がブラウザ画面と対象アカウントを確認する。
- トークン、OAuthクライアントJSON、ADC、Cookie、秘密鍵、パスワード、個人情報をリポジトリへ保存しない。
- `reset --hard`、広範囲な削除、未コミット変更の破棄、無断push、公開、マージを行わない。
- コマンドが失敗した場合は、エラーを隠さず次のPhaseへ進まない。

## 構築の全体順序

```text
Phase 0  端末・社内制約の確認
Phase 1  Git / Node.js / Python / GitHub CLI / Google Cloud CLI
Phase 2  GitHub認証とGit初期設定
Phase 3  リポジトリ取得と正本読込
Phase 4  Node.js / OpenSpec / Playwright
Phase 5  ローカルサイトと自動検証
Phase 6  Python / GA4 Data API / ADC
Phase 7  AIエージェント・MCP能力確認
Phase 8  GitHub書込・PR能力確認
Phase 9  総合完了判定
```

GA4分析が不要な端末はPhase 6を保留できる。合成アクセスが不要な端末はPlaywrightブラウザ導入を保留できるが、サイトの基本検証は実施する。

## Phase 0 — 端末と社内制約を確認する

PowerShellで読み取り確認する。

```powershell
$PSVersionTable.PSVersion
[System.Environment]::OSVersion.VersionString
$env:PROCESSOR_ARCHITECTURE
Get-Command winget -ErrorAction SilentlyContinue
Get-ExecutionPolicy -List
```

人へ確認する項目:

- ソフトウェア導入に管理者権限または社内申請が必要か。
- `winget` を使用できるか。使用不可なら社内ポータルまたは公式インストーラーを使う。
- GitHub、npm、Microsoft Playwright CDN、Google Cloud、Google Analytics APIへの通信が許可されるか。
- HTTPプロキシ、SSLインスペクション、社内CA証明書があるか。
- GitHub.comかGitHub Enterpriseか。組織SSOが必要か。
- 作業フォルダーをOneDrive配下へ置く社内ルールがあるか。

プロキシ、証明書、管理者権限で判断が必要なら、AIは推測で変更せず社内管理者へ確認する。

## Phase 1 — 必須ソフトウェアを導入する

### 1.1 既存状態を調べる

コマンドが見つからなくてもこの段階では正常である。

```powershell
git --version
node --version
npm.cmd --version
py --version
python --version
gh --version
gcloud --version
```

### 1.2 Git

公式: <https://git-scm.com/install/windows>

`winget` が許可される場合:

```powershell
winget install --id Git.Git -e --source winget
```

完了後にIDEとPowerShellを開き直す。

```powershell
git --version
```

### 1.3 Node.js LTS

公式: <https://nodejs.org/en/download>

このリポジトリはNode.js 20以上を必要とする。社内標準がなければ、公式でActive LTSまたはMaintenance LTSと表示される版を使用する。

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

PowerShellを開き直して確認する。

```powershell
node --version
npm.cmd --version
```

### 1.4 Python

公式: <https://www.python.org/downloads/windows/>

GA4 Data APIにはPython 3.10以上を使用する。`py` と `python` のどちらが有効かを確認し、以後は利用できる方へ統一する。

```powershell
winget install 9NQ7512CXL7T
py --version
```

Microsoft StoreやMSIXが禁止されている場合は、社内承認済みのPython 3.10以上を導入する。

### 1.5 GitHub CLI

公式: <https://cli.github.com/>

```powershell
winget install --id GitHub.cli -e --source winget
gh --version
```

### 1.6 Google Cloud CLI

GA4 Data APIを使用する端末だけに導入する。公式: <https://cloud.google.com/sdk/docs/install-sdk>

Windows用のGoogle署名済みインストーラーまたは社内配布版を使う。インストーラー同梱Pythonを利用してもよい。完了後にPowerShellを開き直す。

```powershell
gcloud --version
```

## Phase 2 — GitHub認証とGit初期設定

GitHub.comを使う場合:

```powershell
gh auth login -h github.com
gh auth status
```

対話画面では対象アカウントを確認し、Git操作はHTTPSと資格情報ストアを優先する。Enterpriseの場合は社内ホスト名で `gh auth login --hostname <hostname>` を使う。複数アカウントがある場合は `gh auth switch` で対象を確認する。

Gitコミットへ使う表示名とメールアドレスを人が確認して設定する。社内ポリシーに従い、GitHubのnoreplyアドレスも選択できる。

```powershell
git config --global user.name "<表示名>"
git config --global user.email "<メールアドレス>"
git config --global --get user.name
git config --global --get user.email
```

AIは既存のグローバル設定を無断で上書きしない。設定済みなら値を人へ確認する。

## Phase 3 — リポジトリを取得する

作業先はユーザーが選ぶ。既存フォルダーへ上書きcloneしない。

```powershell
git clone https://github.com/kamizonok39-wq/web-pracrice-god0.git
Set-Location web-pracrice-god0
git status --short
git branch --show-current
git remote -v
gh repo view
```

期待値:

- 作業ツリーに意図しない変更がない。
- `origin` が対象リポジトリを指す。
- `gh repo view` で正しい所有者とリポジトリ名が表示される。

IDEでこのフォルダーを開く。AIは次の順に全文を読む。

1. `AI_AGENT_MCP_SETUP.md`
2. `AGENTS.md`
3. `README.md`
4. `openspec/changes/build-ga4-learning-site/specification.md`
5. `openspec/changes/build-ga4-learning-site/tasks.md`
6. `openspec/changes/add-playwright-synthetic-traffic/`
7. `verification.md`
8. `GA4_ANALYSIS_AND_IMPROVEMENT_WORKFLOW.md`

## Phase 4 — Node.js、OpenSpec、Playwright

### 4.1 ロックファイルから依存関係を復元する

`package-lock.json` を変更しない再現可能な導入には `npm ci` を使う。

```powershell
npm.cmd ci
npm.cmd run test:synthetic
```

### 4.2 OpenSpec CLI

この環境で検証済みの版は1.7.0である。まず既存版を確認する。

```powershell
openspec.cmd --version
```

未導入の場合:

```powershell
npm.cmd install -g @fission-ai/openspec@1.7.0
openspec.cmd --version
openspec.cmd validate --all --strict --no-interactive
```

更新は別作業として互換性を確認する。`@latest` を無条件に使わない。PowerShellが`.ps1`を拒否する場合、実行ポリシーを緩和せず`.cmd`を使う。

### 4.3 Playwright Chromium

Playwrightはnpmパッケージとは別に対応ブラウザを必要とする。公式: <https://playwright.dev/docs/browsers>

```powershell
npx.cmd playwright install chromium
npx.cmd playwright --version
npx.cmd playwright install --list
```

社内プロキシ配下で失敗した場合は、公式手順の `HTTPS_PROXY` と `NODE_EXTRA_CA_CERTS` を参照し、値や証明書変更を社内管理者へ確認する。AIが証明書検証を無効化してはいけない。

## Phase 5 — ローカルサイトと自動検証

```powershell
npm.cmd run validate
node scripts\serve.mjs
```

`http://127.0.0.1:8000/` を開き、次を確認する。

- トップページが表示される。
- Consoleに未捕捉エラーがない。
- HTML、CSS、JavaScriptがHTTP 200になる。
- 解析同意の許可／拒否後も画面操作できる。

停止はサーバーを起動したターミナルで `Ctrl+C`。

Playwrightの最小確認:

```powershell
npm.cmd run synthetic:plan
node scripts\synthetic-traffic\run.mjs --sessions 1 --fast --headed --concurrency 1 --run-id pw-setup-check001
```

公開サイトへ1セッションのGA4テスト通信が発生する。実行前に対象URLとユーザーの許可を確認する。繰り返し実行時は重複しない `run_id` を使う。

## Phase 6 — GA4 Data API

### 6.1 Google側で人が準備する

1. Google Cloudで対象プロジェクトを選択または作成する。
2. Google Analytics Data APIを有効化する。
3. Google Auth PlatformのOAuth同意画面を設定する。
4. 「デスクトップアプリ」のOAuthクライアントを作成する。
5. OAuthクライアントJSONをリポジトリ外のアクセス制限された場所へ保存する。
6. 認証するGoogleアカウントへ対象GA4プロパティの「閲覧者」以上を付与する。
7. GA4管理画面から数字だけのプロパティIDを確認する。`G-...` の測定IDとは異なる。

課金、組織ポリシー、OAuth公開状態、権限付与は人または管理者が判断する。

### 6.2 Python環境

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 6.3 ADC認証

`gcloud auth application-default login` は既存ADCを上書きし得る。実行前に対象Googleアカウントと既存利用を確認する。OAuth JSONのパスや内容を会話、ログ、Gitへ残さない。

```powershell
gcloud auth application-default login `
  --client-id-file="C:\path\outside-repository\oauth-client.json" `
  --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
```

認証確認:

```powershell
.\.venv\Scripts\python.exe scripts\ga_report.py --check-auth
```

プロパティIDは現在のPowerShellだけへ設定する。

```powershell
$env:GA_PROPERTY_ID = "<数字だけのプロパティID>"
.\.venv\Scripts\python.exe scripts\ga_report.py
Remove-Item Env:GA_PROPERTY_ID
```

期待値は、認証成功と読み取り専用レポートの表示である。通常レポートが0でも、反映待ちか権限・プロパティ違いかを切り分ける。

## Phase 7 — 任意AIエージェントとMCP

エージェント製品ごとに設定方式が異なるため、固定設定をリポジトリへ置かない。AIは最初に次を報告する。

- 製品名と実行面（IDE拡張、CLI、デスクトップアプリなど）。
- MCP対応の有無と、現在読み込まれているサーバー／ツール一覧。
- ファイル、Shell、ブラウザ、GitHubへの読み取り／書き込み権限。
- 認証済み接続と未認証接続。
- ユーザー承認が必要な操作。

推奨能力と代替:

| 能力 | MCP／コネクター例 | MCPがない場合 |
|---|---|---|
| ブラウザ検査 | Chrome DevTools、Playwright | リポジトリ内Playwright、手動DevTools |
| GitHub | GitHub connector | `gh` と `git` |
| GA4読取 | 専用接続があれば読み取り専用 | `scripts/ga_report.py` |
| 仕様・ファイル | IDE／Filesystem | IDEとShell |

疎通確認は読み取りから始める。

1. リポジトリ名、現在ブランチ、作業ツリーを読む。
2. ローカルページのタイトルとアクセシビリティ情報を読む。
3. ConsoleとNetworkを秘密情報なしで確認する。
4. GitHubのリポジトリ情報を読む。
5. GA4は認証確認または読み取りレポートだけを行う。

Issue、push、PR、デプロイ、GA設定変更などの書き込みを疎通目的で行わない。Networkの完全なheader、Cookie、Authorization、ブラウザプロファイルを成果物へ保存しない。

## Phase 8 — GitHubの変更・PRフロー

変更前:

```powershell
git status --short
git switch -c <作業ブランチ>
```

コミット前:

```powershell
npm.cmd run validate
npm.cmd run test:synthetic
openspec.cmd validate --all --strict --no-interactive
git diff --check
git status --short
git diff
```

対象ファイルだけを追加する。ユーザーの無関係な変更を含めず、`git add -A`を安易に使わない。

```powershell
git add <対象ファイル>
git diff --cached
git commit -m "<日本語または規約に沿うメッセージ>"
git push -u origin <作業ブランチ>
gh pr create --draft
```

PRのタイトル、本文、コメントは `AGENTS.md` に従い日本語で記載する。PR本文へ変更内容、理由、影響、検証を含める。マージはユーザーの明示依頼後に行う。

## Phase 9 — セットアップ完了判定

次をすべて満たしたら「環境構築完了」とする。保留項目は理由を明記する。

- [ ] Git、Node.js、npm、Python、ghがバージョン表示できる。
- [ ] GA4を使う場合、gcloudがバージョン表示できる。
- [ ] GitHubの対象アカウントとリポジトリを確認できる。
- [ ] clone後のremoteと作業ツリーが正しい。
- [ ] `npm ci` が成功する。
- [ ] Chromiumがインストール済みである。
- [ ] OpenSpec strict検証が成功する。
- [ ] サイト検証と合成アクセス単体テストが成功する。
- [ ] ローカルサイトを開いて停止できる。
- [ ] 許可を得たPlaywright 1セッションが成功する。
- [ ] GA4を使う場合、ADC認証確認と読み取り専用APIが成功する。
- [ ] AIが利用可能なMCP／代替CLI、権限、認証状態を報告できる。
- [ ] 秘密情報がリポジトリとGit差分にない。
- [ ] 未完了事項と次タスクを引き継ぎへ記録した。

## トラブルシューティング

### コマンドが見つからない

IDEとPowerShellを閉じて開き直し、`Get-Command <名前>`で確認する。PATHを手作業で変更する前に公式インストーラーの修復または社内管理者を利用する。

### PowerShellがnpmやOpenSpecを拒否する

実行ポリシーを緩和せず `npm.cmd`、`npx.cmd`、`openspec.cmd` を使う。

### npmまたはChromium取得が失敗する

社内プロキシ、CA、CDN許可を確認する。`strict-ssl=false`やTLS検証無効化で回避しない。

### Gitで所有者警告が出る

対象パス、所有者、実行ユーザーを確認する。ワークスペース全体や任意パスを無条件に`safe.directory`へ追加しない。

### GitHubのアカウントが違う

```powershell
gh auth status
gh auth switch
gh repo view
```

### ADCの認証先が違う

既存ADCを上書きする前に利用者と影響を確認する。`gcloud auth login`とADCは別である。必要なら人が正しいOAuthクライアントとアカウントで再認証する。

### OneDrive・日本語パスで問題が出る

絶対パスを確認し、コマンドでは`-LiteralPath`や引用符を使う。同期競合や長いパスが原因なら、ユーザー承認後に短い作業パスへcloneし直す。既存フォルダーを無断移動しない。

## 停止・削除・認証失効

- ローカルサーバーとテスト: 実行ターミナルで `Ctrl+C`。
- Python環境: 他用途がないことを確認後、リポジトリ内 `.venv` を削除できる。
- Node依存関係: 他用途がないことを確認後、リポジトリ内 `node_modules` を削除できる。
- Playwrightブラウザ: `npx.cmd playwright uninstall`。他プロジェクトへの影響を確認する。
- GitHub CLI認証: `gh auth logout`。対象ホストとアカウントを確認する。
- ADC: `gcloud auth application-default revoke`。この端末の他アプリへの影響を確認する。
- 公開停止、GA4停止、ブランチ削除、リポジトリ削除は別途ユーザー承認を得る。

## 人が最終判断する事項

- ソフトウェア導入、管理者権限、再起動、社内申請
- 外部サービスへのログイン、アカウント、権限、SSO
- Google Cloudプロジェクト、OAuth、課金、GA4権限
- MCPの追加と書き込み権限
- 仕様と改善案の承認
- push、PR公開、デプロイ、マージ、ロールバック
- 秘密情報の発行・失効
- 社内データ、個人情報、セキュリティ実証の利用可否
