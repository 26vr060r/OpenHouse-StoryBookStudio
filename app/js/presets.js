(function (global) {
  var SBS = global.SBS || {};

  SBS.LIMITS = {
    freeText: 200,
    name: 20,
    title: 40,
    dedication: 80,
    maxCharacters: 5,
    personalityMax: 3,
    pageText: 400
  };

  var PAGE_KEY = "sbs-page-count";
  var PAGE_COUNTS = [12, 18, 24];

  function normalizePageCount(value) {
    var n = parseInt(value, 10);
    return PAGE_COUNTS.indexOf(n) !== -1 ? n : 12;
  }

  SBS.pageCounts = PAGE_COUNTS;
  SBS.normalizePageCount = normalizePageCount;

  SBS.getPageCount = function getPageCount() {
    try {
      return normalizePageCount(window.localStorage.getItem(PAGE_KEY));
    } catch (err) {
      return 12;
    }
  };

  SBS.setPageCount = function setPageCount(value) {
    try {
      window.localStorage.setItem(PAGE_KEY, String(normalizePageCount(value)));
    } catch (err) {
      return;
    }
  };

  SBS.spreadCountOf = function spreadCountOf(pages) {
    return Math.round(normalizePageCount(pages) / 2);
  };

  SBS.pageModeLabel = function pageModeLabel(pages) {
    var n = pages == null ? SBS.getPageCount() : normalizePageCount(pages);
    return "見開き" + n + "ページ";
  };

  SBS.PRESETS = {
    themes: [
      { id: "yuuki", label: "勇気", kana: "ゆうき", kana79: "ゆうき" },
      { id: "kindness", label: "やさしさ", kana: "やさしさ", kana79: "やさしさ" },
      { id: "friendship", label: "友情", kana: "ゆうじょう", kana79: "友じょう" },
      { id: "challenge", label: "挑戦", kana: "ちょうせん", kana79: "ちょうせん" },
      { id: "family", label: "家族", kana: "かぞく", kana79: "家ぞく" },
      { id: "curiosity", label: "好奇心", kana: "こうきしん", kana79: "こうきしん" },
      { id: "nature", label: "自然を大切に", kana: "しぜんをたいせつに", kana79: "しぜんを大切に" },
      { id: "its-ok", label: "失敗しても大丈夫", kana: "しっぱいしてもだいじょうぶ", kana79: "しっぱいしてもだいじょうぶ" }
    ],
    audiences: [
      { id: "age-2-3", label: "2〜3歳", furiganaDefault: true },
      { id: "age-4-6", label: "4〜6歳", furiganaDefault: true },
      { id: "age-7-9", label: "7〜9歳", furiganaDefault: false },
      { id: "age-10-12", label: "10〜12歳", furiganaDefault: false },
      { id: "age-13-15", label: "13〜15歳", furiganaDefault: false },
      { id: "with-adults", label: "おとなと一緒に", furiganaDefault: false }
    ],
    structures: [
      { id: "kishotenketsu", label: "起承転結" },
      { id: "adventure", label: "小さな冒険" },
      { id: "repeat", label: "くりかえし" },
      { id: "problem", label: "問題→解決" },
      { id: "daily", label: "一日のできごと" },
      { id: "explain", label: "知ってほしいこと" }
    ],
    settings: [
      { id: "forest", label: "森", kana: "もり", kana79: "森" },
      { id: "sea", label: "海", kana: "うみ", kana79: "海" },
      { id: "town", label: "まち", kana: "まち", kana79: "まち" },
      { id: "school", label: "学校", kana: "がっこう", kana79: "学校" },
      { id: "home", label: "うち", kana: "うち", kana79: "うち" },
      { id: "space", label: "宇宙", kana: "うちゅう", kana79: "うちゅう" },
      { id: "fantasy", label: "ファンタジーの国", kana: "ファンタジーのくに", kana79: "ファンタジーの国" }
    ],
    moods: [
      { id: "watercolor", label: "やさしい水彩" },
      { id: "crayon", label: "クレヨン" },
      { id: "collage", label: "切り絵" },
      { id: "pastel", label: "やわらかいパステル" },
      { id: "night", label: "夜の絵本" },
      { id: "colored-pencil", label: "色えんぴつ" },
      { id: "sumi", label: "すみの絵" },
      { id: "felt", label: "フェルトの絵" },
      { id: "flat-color", label: "あざやかな色面" }
    ],
    directions: [
      { id: "yoko", label: "横書き" },
      { id: "tate", label: "縦書き" }
    ],
    roles: [
      { id: "hero", label: "主人公" },
      { id: "sibling", label: "主人公のきょうだい" },
      { id: "family", label: "主人公の家族" },
      { id: "friend", label: "友だち" },
      { id: "guide", label: "案内役" },
      { id: "rival", label: "ちょっとしたライバル" },
      { id: "enemy", label: "敵" }
    ],
    kinds: [
      { id: "child", label: "子ども" },
      { id: "adult", label: "おとな" },
      { id: "animal", label: "動物" },
      { id: "creature", label: "空想の生き物" },
      { id: "object", label: "もの（乗り物など）" },
      { id: "robot", label: "ロボット" },
      { id: "fairy", label: "妖精" },
      { id: "plush", label: "ぬいぐるみ" }
    ],
    personalities: [
      { id: "playful", label: "おちゃめ" },
      { id: "careful", label: "しんちょう" },
      { id: "kind", label: "やさしい" },
      { id: "brave", label: "ゆうかん" },
      { id: "curious", label: "こうきしんおうせい" },
      { id: "cheerful", label: "あかるい" },
      { id: "shy", label: "はずかしがり" },
      { id: "relaxed", label: "のんびり" },
      { id: "stubborn", label: "がんこ" },
      { id: "lonely", label: "さびしがり" },
      { id: "earnest", label: "まじめ" }
    ]
  };

  // Markdown 見本用。ホームの「おまかせで一冊」は SBS.omakaseIntent() を使う。
  SBS.OMAKASE = {
    themePreset: "yuuki",
    themeFree: "",
    audience: "age-4-6",
    structure: "adventure",
    settingPreset: "forest",
    settingFree: "",
    mood: "watercolor",
    textDirection: "yoko",
    furigana: true,
    title: "くうのゆうき",
    dedication: "",
    characters: [
      {
        name: "くう",
        role: "hero",
        kind: "animal",
        personality: ["brave", "kind"],
        traits: "小さなくま。赤いマフラーがトレードマーク。"
      }
    ]
  };

  var OMAKASE_LAST_KEY = "sbs-omakase-last";
  var OMAKASE_NAMES = {
    child: ["みお", "はる", "そら", "ゆず", "れん", "あお", "こと", "なな", "かい", "つばき", "ひなた", "まめ"],
    adult: ["ハルコ", "ケンジ", "ミサキ", "タロウ"],
    animal: ["ぽん", "こも", "るる", "ちゃろ", "みけ", "たん", "ふく", "ころ", "あん"],
    creature: ["ふわり", "もこ", "りむ", "くも", "ぽわ"],
    object: ["トコトコ", "ぶーぶ", "カタン"],
    robot: ["ピピ", "トコ", "ブン", "ネル"],
    fairy: ["リル", "ホノ", "チカ", "スズ"],
    plush: ["むぅ", "たんたん", "くうた", "もふ"]
  };
  var OMAKASE_ANIMALS = ["うさぎ", "ねこ", "きつね", "ことり", "いぬ", "たぬき", "しか", "ペンギン", "こぐま"];
  var OMAKASE_COLORS = ["あお", "きみどり", "むらさき", "ちゃいろ", "しろ", "きん", "ももいろ", "みずいろ"];
  var OMAKASE_ACCESSORIES = ["ぼうし", "スカーフ", "まるいバッジ", "しましまのくつした", "リボン", "小さなリュック", "ながぐつ", "てぶくろ"];
  var OMAKASE_PACKS = [
    {
      id: "tray",
      theme: "its-ok",
      setting: "school",
      structure: "problem",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["crayon", "watercolor", "flat-color"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "{hero}のカレー",
      titleOld: "{hero}と給食当番",
      hook: "{hero}が給食当番でトレーをひっくり返し、カレーが床に広がる。",
      hookKana: "{hero}がきゅうしょくとうばんでトレーをひっくりかえして、カレーがゆかにひろがる。",
      fail: "笑われて顔がまっかになり、次の当番を逃げたくなる。",
      recover: "{friend}がぞうきんを持ってきて、ふたりで床をふく。",
      end: "翌日も当番をやり、カレーのにおいがちょっとだけ誇らしくなる。"
    },
    {
      id: "boot",
      theme: "friendship",
      setting: "town",
      structure: "daily",
      audiences: ["age-2-3", "age-4-6"],
      moods: ["felt", "crayon", "pastel"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "かたっぽのながぐつ",
      titleOld: "片方の長靴",
      hook: "公園のベンチに、片っぽだけの赤い長靴が置いてある。",
      hookKana: "こうえんのベンチに、かたっぽだけのあかいながぐつがおいてある。",
      fail: "持ち主をさがして声をかけても、だれもふり向かない。",
      recover: "{friend}が同じ色の長靴を持って走ってきて、片っぽ同士だと気づく。",
      end: "ふたりで片っぽずつはいて、帰り道をぴちゃぴちゃ歩く。"
    },
    {
      id: "star",
      theme: "curiosity",
      setting: "space",
      structure: "adventure",
      audiences: ["age-7-9", "age-10-12"],
      moods: ["night", "pastel", "watercolor"],
      heroKind: "child",
      friendRole: "guide",
      friendKind: "creature",
      titleYoung: "{hero}のほし",
      titleOld: "三つならんだ星",
      hook: "ベランダの望遠鏡に、いつもと違う色の星が三つ並んで見える。",
      hookKana: "ベランダのぼうえんきょうに、いつもとちがういろのほしがみっつならぶ。",
      fail: "手帳に写そうとして、いちばん明るい星を見失う。",
      recover: "{friend}が「いちばん暗いのを先に」と教え、三つをもう一度見つける。",
      end: "星の色をメモして、翌日の空でも同じ並びに気づける。"
    },
    {
      id: "sock",
      theme: "family",
      setting: "home",
      structure: "daily",
      audiences: ["age-2-3", "age-4-6"],
      moods: ["felt", "crayon", "watercolor"],
      heroKind: "child",
      friendRole: "family",
      friendKind: "adult",
      titleYoung: "くつしたどこ",
      titleOld: "一足だけないくつ下",
      hook: "洗濯機のなかで、おとうさんのくつ下が一足だけ行方不明になる。",
      hookKana: "せんたくきのなかで、おとうさんのくつしたがいっそくだけなくなる。",
      fail: "ソファの下をのぞいて、ほこりだけが顔にかかる。",
      recover: "{friend}と一緒に洗濯かごの底をひっくり返すと、丸まった片っぽが出る。",
      end: "乾いたくつ下をそろえて、玄関にふたつ並べる。"
    },
    {
      id: "worm",
      theme: "nature",
      setting: "forest",
      structure: "explain",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["watercolor", "colored-pencil", "pastel"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "animal",
      titleYoung: "あめのあと",
      titleOld: "雨あがりのミミズ",
      hook: "雨あがりの道にミミズがたくさん出ていて、踏んづけそうになる。",
      hookKana: "あめあがりのみちにミミズがたくさんでていて、ふんづけそうになる。",
      fail: "こわくてとびのいた拍子に、水たまりを大きくはねる。",
      recover: "{friend}が葉の橋を作り、ミミズが草むらへ戻るのを見守る。",
      end: "道の端を歩いて、土のにおいを残したまま家へ帰る。"
    },
    {
      id: "bucket",
      theme: "kindness",
      setting: "sea",
      structure: "kishotenketsu",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["watercolor", "pastel", "crayon"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "きいろいバケツ",
      titleOld: "片方だけのバケツ",
      hook: "砂浜に、片方だけの黄色いバケツが波で流れてくる。",
      hookKana: "すなはまに、かたっぽだけのきいろいバケツがなみでながれてくる。",
      fail: "自分の城に使おうとして、持ち主の泣き声が聞こえる。",
      recover: "{friend}と一緒に名前をよび、バケツを返す。",
      end: "お礼の貝がらをポケットに入れて、夕方の海を見る。"
    },
    {
      id: "errand",
      theme: "challenge",
      setting: "town",
      structure: "problem",
      audiences: ["age-7-9", "age-10-12"],
      moods: ["colored-pencil", "watercolor", "flat-color"],
      heroKind: "child",
      friendRole: "sibling",
      friendKind: "child",
      titleYoung: "{hero}のおつかい",
      titleOld: "一本まちがえた道",
      hook: "初めてひとりでパン屋までおつかいに行く途中、道を一本まちがえる。",
      hookKana: "はじめてひとりでパンやまでおつかいにいくとちゅう、みちをいっぽんまちがえる。",
      fail: "知らない角で立ち止まり、メモの字がにじんで読めなくなる。",
      recover: "{friend}の書いた地図の裏に、電柱の番号が書いてあるのを思い出す。",
      end: "焼きたてのパンを抱えて、まちがえた角をもう一度通って帰る。"
    },
    {
      id: "voice",
      theme: "yuuki",
      setting: "school",
      structure: "kishotenketsu",
      audiences: ["age-7-9", "age-10-12", "age-13-15"],
      moods: ["colored-pencil", "pastel", "sumi"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "{hero}のこえ",
      titleOld: "のどで止まった声",
      hook: "発表会で自分の番なのに、声がのどで止まる。",
      hookKana: "はっぴょうかいでじぶんのばんなのに、こえがのどでとまる。",
      fail: "笑われるのがこわくて、原稿をにぎったまま黙る。",
      recover: "{friend}が客席から小さくうなずき、最初の一文だけを口に出す。",
      end: "最後まで読んで、舞台袖で水を飲む手が少しだけ落ち着いている。"
    },
    {
      id: "bookmark",
      theme: "friendship",
      setting: "fantasy",
      structure: "adventure",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["night", "watercolor", "pastel"],
      heroKind: "child",
      friendRole: "fairy",
      friendKind: "fairy",
      titleYoung: "しおりのちず",
      titleOld: "しおりが地図になる夜",
      hook: "本のしおりが夜中に小さな地図に変わる。",
      hookKana: "ほんのしおりがよなかにちいさなちずになる。",
      fail: "地図どおりに歩くと、同じ本棚の前に戻ってしまう。",
      recover: "{friend}が「文字じゃなくて絵を見て」と教え、しおりの絵の道をたどる。",
      end: "朝、しおりはただの紙に戻り、本のあいだに大事にはさんである。"
    },
    {
      id: "milk",
      theme: "its-ok",
      setting: "home",
      structure: "daily",
      audiences: ["age-2-3", "age-4-6"],
      moods: ["felt", "crayon", "watercolor"],
      heroKind: "child",
      friendRole: "family",
      friendKind: "adult",
      titleYoung: "ミルクこぼした",
      titleOld: "テーブルのミルク",
      hook: "コップのミルクをこぼして、テーブルがしろくなる。",
      hookKana: "コップのミルクをこぼして、テーブルがしろくなる。",
      fail: "隠そうとしてふきんをかぶせ、もっと広がる。",
      recover: "{friend}が「ふけばいいよ」と言って、一緒にふく。",
      end: "新しいコップを半分だけついで、ゆっくり飲む。"
    },
    {
      id: "clock",
      theme: "curiosity",
      setting: "town",
      structure: "explain",
      audiences: ["age-10-12", "age-13-15", "with-adults"],
      moods: ["colored-pencil", "sumi", "flat-color"],
      heroKind: "child",
      friendRole: "guide",
      friendKind: "adult",
      titleYoung: "おくれたとけい",
      titleOld: "三分おくれた時計",
      hook: "駅前の時計が三分だけ遅れていることに気づく。",
      hookKana: "えきまえのとけいがさんぷんだけおくれていることにきがつく。",
      fail: "自分の腕時計が正しいと思い込み、バスを一本逃す。",
      recover: "{friend}と時刻表を見くらべ、時計塔の針がずれているとわかる。",
      end: "次のバスに乗り、遅れを手帳のすみに小さく書く。"
    },
    {
      id: "album",
      theme: "family",
      setting: "home",
      structure: "kishotenketsu",
      audiences: ["age-7-9", "age-10-12", "with-adults"],
      moods: ["watercolor", "colored-pencil", "sumi"],
      heroKind: "child",
      friendRole: "family",
      friendKind: "adult",
      titleYoung: "しらないこ",
      titleOld: "知らない子どもの写真",
      hook: "おばあちゃんの古いアルバムから、知らない子どもの写真が出てくる。",
      hookKana: "おばあちゃんのふるいアルバムから、しらないこどものしゃしんがでてくる。",
      fail: "自分の写真だと思い込み、名前を聞きそびれる。",
      recover: "{friend}が裏の日付を読んで、若いころの家族だと教える。",
      end: "同じ笑顔を鏡で探して、アルバムを棚に戻す。"
    },
    {
      id: "castle",
      theme: "nature",
      setting: "sea",
      structure: "daily",
      audiences: ["age-2-3", "age-4-6"],
      moods: ["watercolor", "pastel", "crayon"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "plush",
      titleYoung: "すなのしろ",
      titleOld: "波と砂のおしろ",
      hook: "波が、つくったばかりの砂のおしろをさらっていく。",
      hookKana: "なみが、つくったばかりのすなのしろをさらっていく。",
      fail: "波を叱っても、次の波が来る。",
      recover: "{friend}と少し高い場所に、より小さいおしろを作り直す。",
      end: "夕方、跡のかたちだけ残して、足をあらって帰る。"
    },
    {
      id: "crayon",
      theme: "kindness",
      setting: "school",
      structure: "problem",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["crayon", "flat-color", "pastel"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "すみっこのクレヨン",
      titleOld: "だれも使っていない箱",
      hook: "クラスのすみに、だれも使っていないクレヨンの箱がある。",
      hookKana: "クラスのすみに、だれもつかっていないクレヨンのはこがある。",
      fail: "一番きれいな色だけ持っていこうとして、蓋が割れる。",
      recover: "{friend}と色を分けて、欠けた蓋をテープで直す。",
      end: "次の図工の時間、箱は机のまんなかにある。"
    },
    {
      id: "tent",
      theme: "challenge",
      setting: "forest",
      structure: "adventure",
      audiences: ["age-7-9", "age-10-12"],
      moods: ["colored-pencil", "night", "watercolor"],
      heroKind: "child",
      friendRole: "sibling",
      friendKind: "child",
      titleYoung: "テントのひも",
      titleOld: "ほどけたテント",
      hook: "キャンプで、テントのひもが夜中にほどける。",
      hookKana: "キャンプで、テントのひもがよなかにほどける。",
      fail: "暗がりで結び直そうとして、結び目がかえって固くなる。",
      recover: "{friend}がヘッドライトを持ち、昼間覚えた結びをやり直す。",
      end: "朝、テントは立ったままで、ひもに露がついている。"
    },
    {
      id: "dark",
      theme: "yuuki",
      setting: "home",
      structure: "problem",
      audiences: ["age-2-3", "age-4-6"],
      moods: ["night", "felt", "pastel"],
      heroKind: "child",
      friendRole: "plush",
      friendKind: "plush",
      titleYoung: "くらいトイレ",
      titleOld: "消えたトイレの電気",
      hook: "トイレの電気がきれて、真っ暗になる。",
      hookKana: "トイレのでんきがきれて、まっくらになる。",
      fail: "ドアの外まで戻って、用を足せない。",
      recover: "{friend}を抱えて、足元の窓の明かりだけで用を足す。",
      end: "電気がついたあと、手を洗って「いってたよ」と言う。"
    },
    {
      id: "umbrella",
      theme: "friendship",
      setting: "town",
      structure: "repeat",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["watercolor", "pastel", "crayon"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "おなじかさ",
      titleOld: "同じ色の傘",
      hook: "同じ色の傘を持った子と、雨の交差点で三回すれちがう。",
      hookKana: "おなじいろのかさをもったこと、あめのこうさてんでさんかいすれちがう。",
      fail: "声をかけようとして、信号が変わって置いていかれる。",
      recover: "三回目に{friend}のほうから「また会ったね」と言う。",
      end: "屋根の下で名前を交換して、傘のしずくをはらう。"
    },
    {
      id: "shelf",
      theme: "curiosity",
      setting: "fantasy",
      structure: "kishotenketsu",
      audiences: ["age-7-9", "age-10-12"],
      moods: ["night", "sumi", "watercolor"],
      heroKind: "child",
      friendRole: "guide",
      friendKind: "adult",
      titleYoung: "うえのたな",
      titleOld: "借りた記録のない本",
      hook: "図書館のいちばん上の棚に、借りた記録のない薄い本がある。",
      hookKana: "としょかんのいちばんうえのたなに、かりたきろくのないうすいほんがある。",
      fail: "無断で持ち出そうとして、司書の視線に止まる。",
      recover: "{friend}に相談し、閲覧室でだけ開いてよいとわかる。",
      end: "薄い本の最後の白紙に、自分の感想を一語だけ残す。"
    },
    {
      id: "bento",
      theme: "family",
      setting: "school",
      structure: "daily",
      audiences: ["age-10-12", "age-13-15", "with-adults"],
      moods: ["colored-pencil", "watercolor", "flat-color"],
      heroKind: "child",
      friendRole: "family",
      friendKind: "adult",
      titleYoung: "たまごやき",
      titleOld: "いびつな卵焼き",
      hook: "お弁当のふたを開けたら、いつもの卵焼きではなく、いびつな卵焼きが入っている。",
      hookKana: "おべんとうのふたをあけたら、いつものたまごやきではなく、いびつなたまごやきがはいっている。",
      fail: "ふたをすぐ閉めて、食べずに休み時間を過ごす。",
      recover: "{friend}からのメモが蓋の裏にあり、「焦げたけど甘い」と書いてある。",
      end: "いびつな一切れを食べて、甘さを放課後に報告する。"
    },
    {
      id: "poster",
      theme: "its-ok",
      setting: "school",
      structure: "kishotenketsu",
      audiences: ["age-13-15", "with-adults"],
      moods: ["flat-color", "sumi", "colored-pencil"],
      heroKind: "child",
      friendRole: "rival",
      friendKind: "child",
      titleYoung: "さかさのポスター",
      titleOld: "一枚だけ逆さま",
      hook: "文化祭のポスターを貼りまちがえて、反対向きに一枚だけ残る。",
      hookKana: "ぶんかさいのポスターをはりまちがえて、はんたいむきにいちまいだけのこる。",
      fail: "全部はがして貼り直そうとし、のりで破れる。",
      recover: "{friend}が「逆さまの一枚は目印になる」と言い、破れた角だけ直す。",
      end: "当日、その一枚の前で集合写真を撮る。"
    },
    {
      id: "plush",
      theme: "kindness",
      setting: "home",
      structure: "daily",
      audiences: ["age-2-3", "age-4-6"],
      moods: ["felt", "pastel", "crayon"],
      heroKind: "child",
      friendRole: "plush",
      friendKind: "plush",
      titleYoung: "ほこりのぬいぐるみ",
      titleOld: "棚から落ちたぬいぐるみ",
      hook: "ぬいぐるみが棚から落ちて、ほこりをかぶっている。",
      hookKana: "ぬいぐるみがたなからおちて、ほこりをかぶっている。",
      fail: "払おうとして、ほこりを顔にかける。",
      recover: "{friend}を水で軽く拭いて、窓際で乾かす。",
      end: "乾いたぬいぐるみを枕元に戻して、電気を消す。"
    },
    {
      id: "acorn",
      theme: "nature",
      setting: "forest",
      structure: "daily",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["watercolor", "crayon", "colored-pencil"],
      heroKind: "animal",
      friendRole: "friend",
      friendKind: "animal",
      titleYoung: "どんぐりぽろり",
      titleOld: "破れたポケット",
      hook: "どんぐりを拾いすぎて、ポケットが破れる。",
      hookKana: "どんぐりをひろいすぎて、ポケットがやぶれる。",
      fail: "全部抱えようとして、坂道で転がす。",
      recover: "{friend}と帽子に分けて入れ、いちばんきれいな二つだけ残す。",
      end: "残したどんぐりを木の根元に置いて、空のポケットで帰る。"
    },
    {
      id: "recorder",
      theme: "challenge",
      setting: "school",
      structure: "problem",
      audiences: ["age-10-12", "age-13-15"],
      moods: ["colored-pencil", "flat-color", "sumi"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "child",
      titleYoung: "リコーダー",
      titleOld: "裏返った最初の音",
      hook: "リコーダーのテストで、最初の音だけ裏返る。",
      hookKana: "リコーダーのテストで、さいしょのおとだけうらがえる。",
      fail: "吹き直そうとして息が多すぎ、さらに高い音が出る。",
      recover: "{friend}が「最初だけ小さく」と合図し、二回目は音が落ちつく。",
      end: "廊下で同じフレーズを一度だけ確認して、ケースを閉める。"
    },
    {
      id: "crab",
      theme: "kindness",
      setting: "sea",
      structure: "adventure",
      audiences: ["age-4-6", "age-7-9"],
      moods: ["watercolor", "pastel", "crayon"],
      heroKind: "child",
      friendRole: "friend",
      friendKind: "animal",
      titleYoung: "はさまれたカニ",
      titleOld: "防波堤のすきま",
      hook: "防波堤のすきまに、小さなカニが一匹はさまれている。",
      hookKana: "ぼうはていのすきまに、ちいさなカニがいっぴきはさまれている。",
      fail: "指で引っ張って、カニがもっと奥へ引っこむ。",
      recover: "{friend}と海水をかけて石を湿らせ、カニが自分で出てくる。",
      end: "カニが潮だまりへ戻るのを見て、手をあらって帰る。"
    },
    {
      id: "letter",
      theme: "kindness",
      setting: "town",
      structure: "kishotenketsu",
      audiences: ["age-7-9", "age-10-12", "with-adults"],
      moods: ["colored-pencil", "watercolor", "sumi"],
      heroKind: "child",
      friendRole: "guide",
      friendKind: "adult",
      titleYoung: "なまえのないてがみ",
      titleOld: "宛名のない手紙",
      hook: "ポストの下に、宛名のない手紙が落ちている。",
      hookKana: "ポストのしたに、あてなのないてがみがおちている。",
      fail: "中を開けてしまおうとして、封ののりがはがれかける。",
      recover: "{friend}と一緒に郵便局へ持っていき、窓口に渡す。",
      end: "手元には何も残らないが、ポストの前の石を元の位置に戻す。"
    }
  ];

  function omakasePick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function omakasePickExcept(list, banned) {
    var filtered = (list || []).filter(function (item) {
      return item !== banned;
    });
    return omakasePick(filtered.length ? filtered : list);
  }

  function omakaseFill(text, hero, friend) {
    return String(text || "")
      .replace(/\{hero\}/g, hero || "こども")
      .replace(/\{friend\}/g, friend || "ともだち");
  }

  function omakaseFurigana(audienceId) {
    var list = SBS.PRESETS.audiences;
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === audienceId) return list[i].furiganaDefault !== false;
    }
    return true;
  }

  function omakaseAudience(pack) {
    var pool = (pack.audiences && pack.audiences.length) ? pack.audiences.slice() : [
      "age-2-3", "age-4-6", "age-7-9", "age-10-12", "age-13-15", "with-adults"
    ];
    if (pool.indexOf("age-4-6") !== -1) pool.push("age-4-6");
    if (pool.indexOf("age-7-9") !== -1) pool.push("age-7-9");
    return omakasePick(pool);
  }

  function omakaseMood(pack, audience) {
    if (pack.moods && pack.moods.length) return omakasePick(pack.moods);
    if (audience === "age-2-3") return omakasePick(["crayon", "felt", "pastel", "watercolor"]);
    return omakasePick(["watercolor", "crayon", "pastel", "colored-pencil", "night", "felt", "flat-color"]);
  }

  function omakasePersonalities(theme) {
    var pairs = {
      yuuki: ["brave", "shy"],
      kindness: ["kind", "earnest"],
      friendship: ["cheerful", "lonely"],
      challenge: ["earnest", "stubborn"],
      family: ["kind", "relaxed"],
      curiosity: ["curious", "playful"],
      nature: ["careful", "curious"],
      "its-ok": ["earnest", "shy"]
    };
    var pair = pairs[theme] || ["kind", "curious"];
    var extra = omakasePickExcept(["playful", "careful", "kind", "brave", "curious", "cheerful", "shy", "relaxed", "stubborn", "lonely", "earnest"], pair[0]);
    if (Math.random() < 0.35 && extra !== pair[1]) return [pair[0], extra];
    return pair.slice();
  }

  function omakaseTraits(kind, look) {
    var color = omakasePick(OMAKASE_COLORS);
    var acc = omakasePick(OMAKASE_ACCESSORIES);
    if (look) {
      return String(look).replace(/\{color\}/g, color).replace(/\{acc\}/g, acc);
    }
    if (kind === "animal") {
      return "小さな" + omakasePick(OMAKASE_ANIMALS) + "。" + color + "の" + acc + "がトレードマーク。";
    }
    if (kind === "child") {
      return "子ども。" + color + "の" + acc + "を身につけている。";
    }
    if (kind === "adult") {
      return "おとな。" + color + "の" + acc + "が目印。";
    }
    if (kind === "creature") {
      return "ふわふわの空想の生き物。" + color + "の" + acc + "をつけている。";
    }
    if (kind === "robot") {
      return "小さなロボット。胴体は" + color + "で、" + acc + "型の部品がついている。";
    }
    if (kind === "fairy") {
      return "小さな妖精。" + color + "の羽と" + acc + "。";
    }
    if (kind === "plush") {
      return "ぬいぐるみ。" + color + "の生地に、小さな" + acc + "。";
    }
    if (kind === "object") {
      return "小さな乗り物。" + color + "の車体に" + acc + "がついている。";
    }
    return color + "の" + acc + "がトレードマーク。";
  }

  function omakaseName(kind, banned) {
    var bank = OMAKASE_NAMES[kind] || OMAKASE_NAMES.child;
    return omakasePickExcept(bank, banned);
  }

  function omakaseLast() {
    try {
      return window.sessionStorage.getItem(OMAKASE_LAST_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function omakaseRemember(key) {
    try {
      window.sessionStorage.setItem(OMAKASE_LAST_KEY, key);
    } catch (err) {
      return;
    }
  }

  function omakaseChoosePack() {
    var last = omakaseLast();
    var pack = omakasePick(OMAKASE_PACKS);
    var i;
    for (i = 0; i < 8; i += 1) {
      if (pack.id !== last) break;
      pack = omakasePick(OMAKASE_PACKS);
    }
    return pack;
  }

  function omakaseBrief(intent, plot) {
    var base = "";
    try {
      if (SBS.IntentMarkdown && SBS.IntentMarkdown.stringify) {
        base = SBS.IntentMarkdown.stringify(intent);
      }
    } catch (err) {
      base = "";
    }
    var lines = [
      String(base || "").replace(/\n+$/, ""),
      "",
      "## この本だけの物語",
      "- きっかけ：" + plot.hook,
      "- つまずき：" + plot.fail,
      "- 立て直し：" + plot.recover,
      "- おわり：" + plot.end,
      "",
      "上の出来事だけを具体的に書く。別の本の固有名詞や、決まった変身・決まった敵は出さない。日常に戻って終わる。"
    ];
    return lines.join("\n");
  }

  SBS.intentFromSeed = function intentFromSeed(seed) {
    seed = seed || {};
    return {
      schemaVersion: 1,
      theme: { preset: seed.themePreset || "", freeText: seed.themeFree || "" },
      audience: seed.audience || "",
      structure: typeof seed.structure === "object" && seed.structure
        ? { preset: seed.structure.preset || "", freeText: seed.structure.freeText || "" }
        : { preset: seed.structure || "", freeText: seed.structureFree || "" },
      setting: { preset: seed.settingPreset || "", freeText: seed.settingFree || "" },
      mood: typeof seed.mood === "object" && seed.mood
        ? { preset: seed.mood.preset || "", freeText: seed.mood.freeText || "" }
        : { preset: seed.mood || "", freeText: seed.moodFree || "" },
      textDirection: seed.textDirection || "yoko",
      furigana: seed.furigana !== false,
      title: seed.title || "",
      dedication: seed.dedication || "",
      pageCount: SBS.normalizePageCount(seed.pageCount || (SBS.getPageCount && SBS.getPageCount()) || 12),
      plotHook: seed.plotHook || "",
      plotHookKana: seed.plotHookKana || "",
      plotFail: seed.plotFail || "",
      plotRecover: seed.plotRecover || "",
      plotEnd: seed.plotEnd || "",
      briefMarkdown: seed.briefMarkdown || "",
      characters: (seed.characters || []).map(function (c) {
        return {
          name: c.name || "",
          role: c.role || "",
          roleFree: c.roleFree || "",
          kind: c.kind || "",
          kindFree: c.kindFree || "",
          personality: (c.personality || []).slice(),
          personalityFree: c.personalityFree || "",
          traits: c.traits || ""
        };
      })
    };
  };

  SBS.omakaseIntent = function omakaseIntent() {
    var pack = omakaseChoosePack();
    var audience = omakaseAudience(pack);
    var young = audience === "age-2-3" || audience === "age-4-6";
    var heroKind = pack.heroKind || "child";
    var heroName = omakaseName(heroKind);
    var friendKind = pack.friendKind || "child";
    var friendName = pack.friendRole ? omakaseName(friendKind, heroName) : "";
    var titleTmpl = young ? (pack.titleYoung || pack.titleOld) : (pack.titleOld || pack.titleYoung);
    var characters = [
      {
        name: heroName,
        role: "hero",
        kind: heroKind,
        personality: omakasePersonalities(pack.theme),
        traits: omakaseTraits(heroKind, pack.heroLook)
      }
    ];
    if (pack.friendRole && friendName && Math.random() < 0.88) {
      characters.push({
        name: friendName,
        role: pack.friendRole,
        kind: friendKind,
        personality: omakasePersonalities(pack.theme).reverse(),
        traits: omakaseTraits(friendKind, pack.friendLook)
      });
    } else {
      friendName = "";
    }
    var seed = {
      themePreset: pack.theme,
      audience: audience,
      structure: pack.structure,
      settingPreset: pack.setting,
      mood: omakaseMood(pack, audience),
      textDirection: Math.random() < 0.22 ? "tate" : "yoko",
      furigana: omakaseFurigana(audience),
      title: omakaseFill(titleTmpl, heroName, friendName).slice(0, SBS.LIMITS.title),
      dedication: "",
      pageCount: SBS.getPageCount && SBS.getPageCount(),
      plotHook: omakaseFill(pack.hook, heroName, friendName),
      plotHookKana: omakaseFill(pack.hookKana || pack.hook, heroName, friendName),
      plotFail: omakaseFill(pack.fail, heroName, friendName),
      plotRecover: omakaseFill(pack.recover, heroName, friendName),
      plotEnd: omakaseFill(pack.end, heroName, friendName),
      characters: characters
    };
    var intent = SBS.intentFromSeed(seed);
    intent.briefMarkdown = omakaseBrief(intent, {
      hook: seed.plotHook,
      fail: seed.plotFail,
      recover: seed.plotRecover,
      end: seed.plotEnd
    });
    omakaseRemember(pack.id);
    return intent;
  };

  SBS.personalityLine = function personalityLine(ch) {
    var labels = [];
    ((ch && ch.personality) || []).forEach(function (id) {
      var label = SBS.labelOf(SBS.PRESETS.personalities, id);
      if (label) labels.push(label);
    });
    if (ch && ch.personalityFree) labels.push(String(ch.personalityFree).slice(0, 80));
    return labels.join("、");
  };

  SBS.structureOf = function structureOf(intent) {
    var raw = intent && intent.structure;
    if (!raw) return { preset: "", freeText: "" };
    if (typeof raw === "string") return { preset: raw, freeText: "" };
    return { preset: raw.preset || "", freeText: raw.freeText || "" };
  };

  SBS.moodOf = function moodOf(intent) {
    var raw = intent && intent.mood;
    if (!raw) return { preset: "", freeText: "" };
    if (typeof raw === "string") return { preset: raw, freeText: "" };
    return { preset: raw.preset || "", freeText: raw.freeText || "" };
  };

  SBS.labelOf = function labelOf(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i].label;
    }
    return "";
  };

  SBS.audienceWord = function audienceWord(list, field, audience) {
    var free = "";
    var id = "";
    var i;
    var item = null;
    if (field && typeof field === "object") {
      free = field.freeText || "";
      id = field.preset || "";
    } else if (typeof field === "string") {
      id = field;
    }
    if (free) return free;
    for (i = 0; i < (list || []).length; i += 1) {
      if (list[i].id === id) {
        item = list[i];
        break;
      }
    }
    if (!item) return "";
    if ((audience === "age-2-3" || audience === "age-4-6") && item.kana) return item.kana;
    if (audience === "age-7-9" && item.kana79) return item.kana79;
    return item.label;
  };

  global.SBS = SBS;
})(window);
