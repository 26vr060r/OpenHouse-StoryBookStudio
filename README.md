# StoryBook Studio

見開き24ページ（左・插絵／右・文章）の絵本を、ブラウザでつくる HTML アプリです。ビルドは不要です。

## アプリで今できること / まだできないこと

**今できること（Sprint 01）**

- `app/index.html` を開いてホーム画面を見る
- 種類別の保存フォルダ規約を `library/README.md` で確認する

**まだできないこと**

- テーマや登場人物の入力（Sprint 02）
- 物語の構成と見開きビューア（Sprint 03）
- 插絵の生成（Sprint 04 デモ、Sprint 08 Gemini）
- プロンプトの書き出し（Sprint 05）
- 種類別フォルダへの保存（Sprint 06）
- 印刷・PDF（Sprint 07）

ホームのボタンは押すと「次のスプリントでつながる」と出ます。壊れた画面にはしません。

## 開き方

1. このリポジトリをクローンする（またはフォルダを開く）
2. `app/index.html` をブラウザで開く（ダブルクリックで可）
3. 展示キオスクにするときは `app/index.html?kiosk=1`（運営者の歯車を隠す）

Gemini 連携やフォルダ直書きは、のちのスプリントで `http://localhost` 配信が必要になることがあります。Sprint 01 のホームは `file://` で動きます。

## フォルダ

- `app/` … アプリ本体
- `templates/prompts/` … プロンプトレシピ（Sprint 05 で中身を追加）
- `library/` … 絵本の成果物ルート。命名規約は [library/README.md](library/README.md)

## 開発の進め方

1日スプリントです。作業ブランチは `sprint/01-foundation` のように切り、終わりに `main` へ PR します。絵本コンテンツの量産ではなく、**アプリの機能を載せる**計画です。
