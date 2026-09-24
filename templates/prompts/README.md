# プロンプトレシピ

穴あきのプロンプト文面を置く場所。Git で管理する。

実行時は `file://` でも読めるよう、同じ文面を `app/js/prompt-templates.js` にも置く。穴は `{{NAME}}`。コンパイラ（`app/js/prompt-compiler.js`）が Bible と intent を埋める。

実際に埋まったプロンプト（一冊ごとの成果）は `library/prompt/{bookId}/` へ保存する。Sprint 05 では ZIP の中身がその相対パスになる。

| ファイル | 役割 |
| --- | --- |
| `story-system.md` | 文章プロンプトの固定ルール |
| `image-system.md` | 插絵プロンプトの固定ルール（ロックの順番） |
| `style-lock.txt` | 雰囲気から作るスタイルロック |
| `character-block.txt` | キャラ1人分 |
| `character-lock.txt` | 全ページ同一のキャラロック |
| `world-lock.txt` | 地面・舞台 |
| `negative.txt` | 禁止事項と注入無効化 |
| `character-sheet.txt` | 参照シート用 |
| `character-turnaround.txt` | 確認用・1人6角度 |
| `page-image.txt` | 見開きごとの插絵 |
| `page-text.txt` | 見開きごとの文章 |
