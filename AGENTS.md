# Repository Working Agreement

## Project

This repository contains a learning-oriented static website for practicing Google Analytics 4 (GA4) measurement.

## Specification-driven workflow

- Use OpenSpec for planning and specification management.
- Do not begin implementation until the active OpenSpec proposal, specifications, design, and tasks have been reviewed and explicitly approved by the user.
- Treat the approved OpenSpec artifacts as the source of truth.
- When requirements change, update and revalidate the OpenSpec artifacts before changing implementation.

## Implementation constraints

- The site must remain deployable to GitHub Pages as static files.
- Prefer technology that is easy for beginners to read and operate.
- Support current smartphone and desktop browsers.
- Keep GA4 event names and firing conditions explicit and easy to trace in source code.
- Do not collect, store, or transmit personally identifiable information.
- Keep the GA4 measurement ID configurable in one documented file.
- Never commit API secrets, credentials, private keys, or personal information.

## Quality gates

- Validate OpenSpec artifacts before implementation.
- Verify all acceptance criteria before declaring implementation complete.
- Document GA4 measurement ID setup and GitHub Pages deployment in `README.md`.

## GitHub communication

- Pull Requestのタイトルと本文は日本語で記述する。
- Pull Requestのコメント、レビュー依頼、レビューへの返信も原則として日本語で記述する。
- コード、コマンド、ファイル名、API名、エラーメッセージ、外部仕様からの引用は、正確性のため原文のままでよい。
- Pull Request本文には、変更内容、変更理由、利用者・開発者への影響、実施した検証を含める。
