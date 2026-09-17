# library/ — 絵本成果物の保存先

アプリ本体（`app/`）と生成物を混ぜない。保存するときは、この `library` フォルダ（または同じ中身のフォルダ）を選ぶ。

実ユーザの生成物は Git に入れない。見本を置くときは命名規約どおりの名前にする。

アプリの「この絵本を保存」は `{bookId}.zip` を出す。中身は種類別の相対パスなので、この `library/` 直下へ展開すると `catalog/` `intent/` `bible/` `prompt/` `book/` に散らばる。Chrome でフォルダ直書きした場合は、同じパスへ書き、ZIP も `library/{bookId}.zip` に置く。

運営者向けの「プロンプトを保存」は `{bookId}.prompt.zip` で、中身は `prompt/{bookId}/` だけである。

## 種類別フォルダ

同じ一冊を一つの親フォルダにまとめない。種類ごとに分け、共通の `bookId` で紐付ける。

| フォルダ | 入れるもの |
| --- | --- |
| `catalog/` | 一冊の目録（各ファイルへのパス） |
| `intent/` | ウィザードの生入力 |
| `bible/` | 非表示のキャラ・色・身長アンカー |
| `prompt/` | 実際に使ったプロンプト一式 |
| `book/` | 絵本の正本（JSON + 原画） |
| `html/` | 閲覧用・A4印刷用 HTML |
| `pdf/` | 配布用 PDF |
| `spreads/` | 見開き PNG |

ZIP をこの `library/` 直下に展開すると、上のフォルダへ散らばる。ZIP ファイル名も `{bookId}.zip`。

## 命名規約

時刻は Asia/Tokyo。ファイル名にコロンを使わない。ASCII のみ。日本語タイトルは JSON の中だけ。

- **日時スタンプ `stamp`**: `YYYYMMDD-HHmmss`（例: `20260917-181032`）
- **slug**: 小文字 `[a-z0-9]+` をハイフン接続、最大 24 文字。空なら `book`
- **bookId**: `{stamp}_{slug}`（例: `20260917-181032_yuuki-kuma`）
- **同一秒の衝突**: slug 末尾に `_02`, `_03`
- **JSON の `createdAt`**: `2026-09-17T18:10:32+09:00`（ファイル名の stamp と一致）
- **見開き番号**: `p01`〜`p12`。左插絵 `_left`、見開き結合 `_spread`、キャラ参照 `_character-sheet`
- **役割トークン**（拡張子の前）: `.intent` `.bible` `.catalog` `.book` `.view` `.print-a4` `.image.prompt` `.text.prompt` `.meta`
- **サブフォルダ名 = bookId**（複数ファイルになる `prompt/` `book/` `spreads/`）
- **ファイル名は必ず bookId で始める**

例: `intent/20260917-181032_yuuki-kuma.intent.json`

`book.json` には `schemaVersion: 1` と `textDirection: "yoko"|"tate"` を含める。
