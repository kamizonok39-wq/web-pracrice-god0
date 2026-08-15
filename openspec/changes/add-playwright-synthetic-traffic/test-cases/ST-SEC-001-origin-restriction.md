# ST-SEC-001 対象外オリジン制限

## 目的

テスト対象サイト以外のページを取得・操作せず、GA4計測通信だけを例外として継続できることを確認する。

## 関連要件

- OpenSpecタスク 3.7、5.3
- `requestPolicy` のDocument単位の許可判定

## テストケース

| ケース | 入力 | 期待結果 |
|---|---|---|
| 同一オリジンDocument | 対象サイト内URL | `continue` |
| 外部Document | 対象外オリジンURL | `abort` |
| 不正なDocument URL | URLとして解析不能な値 | `abort` |
| GA4などの非Document通信 | 対象外オリジンのfetch | `continue` |

## 合格条件

4ケースがすべて成功し、外部Documentの本文を取得する処理へ進まないこと。

## 実行

```powershell
npm.cmd run test:synthetic:origin
```
