/* こころの じゅんび ―― しくみ（app.js）
   受験の 当日の あさ、こどもと おうちの ひとが いっしょに 5ふん で たしかめる クイズ。
   ・古い Safari で動く書き方だけ（var と function。let/const/アロー/テンプレート文字列は使わない）
   ・子どもの画面の ことばは ひらがな・カタカナ・すうじ だけ（tools/check_kana.py が見る）
   ・もとの 資料＝「お子さんの為の 入試の心構え」（挿絵は 許諾ずみ・しげ 2026-11-01）。p は その ページ
   ・まちがいの 選択肢は もとの 資料の ふきだし（ついやって しまう こと）から とる＝lure に ページと ことばを のこす */
(function (global) {
  'use strict';
  var KJ = global.KJ || {};
  global.KJ = KJ;

  KJ.APP_VERSION = 1;
  KJ.SCHEMA = 1;
  KJ.STORE_KEY = 'kokoro_junbi_v1';

  /* よびかた（おとなのひと で えらぶ）。{y} の ところに はいる */
  KJ.YOBIKATA = ['おかあさん', 'おとうさん', 'ママ', 'パパ', 'おうちの ひと'];

  /* ================= ばめん（10こ・当日の ながれの じゅん） =================
     q＝といかけ／ok＝ただしい こうどう／ng＝ついやって しまう こと（lure＝もとの ふきだし）
     yaku＝やくそく（「〜しない」でなく「〜する」の かたちで いう）／tip＝ひとこと たす こと
     reveal＝こたえの あとに 出す 絵（ring＝トイくんの いる ところ・絵の 1262×892 の わくでの 四角）
     core＝みじかい（5こ）の ときも 出す */
  var SCENES = [
    { id: 'idou', p: 2, title: 'いどう', stem: 's02',
      q: 'いろいろな おへやに いどう するよ。どう する？',
      ok: 'まえの こに ついて しずかに あるく',
      ng: 'おともだちと おしゃべり しながら あるく', lure: 'p2 ゆびを さして おしゃべり して いる こ',
      yaku: 'ならぶ ときは まえを みて しずかに', tip: '',
      reveal: 'r02', ring: [645, 465, 85, 200], core: false },
    { id: 'tomodachi', p: 1, title: 'おともだち', stem: 'toi',
      q: 'まって いる とき、おともだちが はなしかけて きたよ。どう する？',
      ok: 'にっこり して、せんせいの ほうを むく',
      ng: 'いっしょに おしゃべり する', lure: 'p1 はなしかけられても あいてに しない',
      yaku: 'しずかに する ときの おはなしは あとで', tip: '',
      reveal: 'card', ring: null, core: false },
    { id: 'ohanashi', p: 4, title: 'おはなし', stem: 's04',
      q: 'せんせいが たいせつな おはなしを するよ。どこを みる？',
      ok: 'せんせいの かおを みて きく',
      ng: 'うしろの おともだちを みる', lure: 'p4 うしろを むいたり ものを おとしたり して いる こ',
      yaku: 'おはなしは せんせいの かおを みて きく', tip: '',
      reveal: 'r04', ring: [420, 435, 80, 70], core: true },
    { id: 'otehon', p: 3, title: 'おてほん', stem: 's03',
      q: 'せんせいが おてほんを みせるよ。どう する？',
      ok: 'せんせいの おてほんを よく みて おぼえる',
      ng: 'おともだちの まねを すれば いい', lure: 'p3 みんなの まね したら いいだけ',
      yaku: 'おてほんは せんせいを みる。おともだちが ちがっても きに しない', tip: 'あいずが あってから うごこう',
      reveal: 'r03', ring: [700, 525, 70, 110], core: true },
    { id: 'hajime', p: 5, title: 'はじめ', stem: 's05',
      q: 'テストの はじまり。えんぴつは いつ もつ？',
      ok: '「はじめ」と いわれてから もつ',
      ng: 'しって いる もんだいだから すぐ かく', lure: 'p5 この もんだい しってる かんたんだね',
      yaku: 'えんぴつは「はじめ」で もつ。「やめ」で おく', tip: '',
      reveal: 'r05', ring: [200, 495, 125, 110], core: true },
    { id: 'wakaranai', p: 6, title: 'わからない とき', stem: 's06',
      q: 'わからない もんだいが あったら、どう おもう？',
      ok: '「だいじょうぶ。つぎ！」と こころで いう',
      ng: '「もう だめだ」と おもう', lure: 'p6 おこられる もう いや',
      yaku: 'わからない もんだいが あっても だいじょうぶ。つぎを がんばる', tip: 'みんなにも むずかしい もんだいが あるよ',
      reveal: 'r06', ring: [410, 290, 150, 165], core: true },
    { id: 'oekaki', p: 7, title: 'おえかき', stem: 'toi',
      q: 'えを かく じかん。はやく かけたら どう する？',
      ok: 'じかん いっぱい、もっと ていねいに かく',
      ng: '「できました！」と おおきな こえで いう', lure: 'p7 できました ぼくが いちばん',
      yaku: 'じかん いっぱい ていねいに。となりの えは みない', tip: '',
      reveal: 'r07', ring: [320, 230, 150, 175], core: false },
    { id: 'toire', p: 8, title: 'トイレ', stem: 's08',
      q: 'トイレが すんだら、どう する？',
      ok: 'あるいて しずかに もどる',
      ng: 'はしって もどる', lure: 'p8 いそげ',
      yaku: 'トイレの あとは あるいて しずかに', tip: 'いきたく なったら、てを あげて せんせいに いって いいよ',
      reveal: 'r08', ring: [555, 310, 90, 195], core: false },
    { id: 'dance', p: 9, title: 'おどる', stem: 's09',
      q: '「おんがくに あわせて おどって ください」。どう する？',
      ok: 'はずかしがらずに げんきに おどる',
      ng: 'はずかしいから じっと たって いる', lure: 'p9 もじもじ して いる こ',
      yaku: 'うごく ときは げんきに。ゆうきを だそう', tip: '',
      reveal: 'r09', ring: [550, 325, 180, 320], core: false },
    { id: 'kaeri', p: 10, title: 'かえりみち', stem: 'toi',
      q: 'テストは いつ おわり？',
      ok: '{y}の ところに もどったら おわり',
      ng: 'もんだいが おわったら もう おわり', lure: 'p10 キック する こ・おおごえの こ',
      yaku: '{y}に あうまで ならんで しずかに', tip: '',
      reveal: 'r10', ring: [530, 270, 90, 155], core: true }
  ];
  KJ.SCENES = SCENES;

  /* さいごに おもいだす 3つの ことば（おぼえるのは これだけ） */
  KJ.MAGIC = [
    { w: 'よく みる・よく きく', sub: 'せんせいの かおと おてほん' },
    { w: 'あいずを まつ', sub: '「はじめ」で もつ・「やめ」で おく' },
    { w: 'わからなくても だいじょうぶ、つぎ！', sub: 'ドキドキしたら ふうせん いき' }
  ];
  /* しずかに する とき／なかよく はなす とき（おともだち の こたえの カード） */
  KJ.CARD = {
    left: { h: 'しずかに する とき', items: ['せんせいが はなす とき', 'テストの とき', 'ならぶ とき・まつ とき'] },
    right: { h: 'なかよく はなす とき', items: ['みんなで いっしょに あそぶ とき', '「いっしょに やろう」', '「どうぞ」「ありがとう」'] }
  };

  /* ほめことば＝やりかた（かんがえた・おぼえて いた）を ほめる。のうりょく（てんさい・あたまが いい）は つかわない */
  var PRAISE = ['よく かんがえたね', 'トイくんと おなじだね', 'じぶんで えらべたね', 'ちゃんと おぼえて いたね', 'その とおり！'];
  KJ.PRAISE = PRAISE;
  KJ.BAN_WORDS = ['てんさい', 'あたまが いい', 'いちばん えらい', 'ごうかく', 'ぜったい'];
  KJ.OSHII = 'おしい！ もう いちど かんがえて みよう';
  KJ.OSHII2 = 'トイくんは こっちを えらんだよ';

  KJ.fill = function (text, yobikata) { return String(text).split('{y}').join(yobikata || KJ.YOBIKATA[0]); };

  /* 1まわりの ばめん（みじかい＝core だけ） */
  KJ.pickScenes = function (shortMode) {
    var out = [], i;
    for (i = 0; i < SCENES.length; i++) { if (!shortMode || SCENES[i].core) { out.push(SCENES[i]); } }
    return out;
  };

  /* えらぶ ばしょを まぜる（ok が ひだり ばかりに ならない） */
  var rngState = null;
  KJ.seed = function (s) { rngState = (s === null || s === undefined) ? null : (s | 0); };
  function rnd() {
    if (rngState === null) { return Math.random(); }
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x80000000;
  }
  KJ.okFirst = function () { return rnd() < 0.5; };
  KJ.praise = function () { return PRAISE[Math.floor(rnd() * PRAISE.length)]; };

  /* ふうせん いき＝すって 4びょう・はいて 6びょう を 3かい（ゆっくり はく ほうを ながく） */
  KJ.BREATH = { inhale: 4000, exhale: 6000, times: 3 };

  /* ================= おと（ファイルを つかわず その場で つくる） ================= */
  var NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568.0, C4: 261.63, E4: 329.63, G4: 392.0, A4: 440.0 };
  /* [おと, はじまり（びょう）, ながさ, おおきさ, かたち] */
  var SOUNDS = {
    tap: [['G5', 0, 0.06, 0.35, 'sine']],
    ok: [['C5', 0, 0.14, 0.8, 'triangle'], ['E5', 0.1, 0.14, 0.8, 'triangle'], ['G5', 0.2, 0.28, 0.9, 'triangle']],
    oshii: [['E5', 0, 0.16, 0.5, 'sine'], ['C5', 0.16, 0.24, 0.5, 'sine']],
    star: [['C6', 0, 0.1, 0.5, 'sine'], ['E6', 0.08, 0.1, 0.5, 'sine'], ['G6', 0.16, 0.22, 0.55, 'sine']],
    inhale: [['C4', 0, 0.5, 0.35, 'sine'], ['E4', 0.5, 0.5, 0.35, 'sine'], ['G4', 1.0, 0.8, 0.35, 'sine']],
    exhale: [['G4', 0, 0.6, 0.3, 'sine'], ['E4', 0.6, 0.6, 0.3, 'sine'], ['C4', 1.2, 1.2, 0.3, 'sine']],
    magic: [['G5', 0, 0.12, 0.6, 'triangle'], ['C6', 0.12, 0.3, 0.7, 'triangle']],
    finale: [['C5', 0, 0.16, 0.8, 'triangle'], ['E5', 0.15, 0.16, 0.8, 'triangle'], ['G5', 0.3, 0.16, 0.8, 'triangle'],
      ['C6', 0.45, 0.5, 0.9, 'triangle'], ['G5', 0.45, 0.5, 0.5, 'sine'], ['E6', 0.75, 0.6, 0.6, 'sine']]
  };
  KJ.SOUNDS = SOUNDS;
  var snd = { ctx: null, on: true, vol: 0.22 };
  KJ.snd = snd;
  function audioClass() { return global.AudioContext || global.webkitAudioContext || null; }
  /* さいしょの タッチで 音の しくみを おこす（iOS 10 は タッチの 中で ないと 鳴らない） */
  snd.unlock = function () {
    var AC, b, src;
    try {
      if (!snd.ctx) {
        AC = audioClass(); if (!AC) { return false; }
        snd.ctx = new AC();
        b = snd.ctx.createBuffer(1, 1, 22050);
        src = snd.ctx.createBufferSource(); src.buffer = b; src.connect(snd.ctx.destination);
        if (src.start) { src.start(0); } else if (src.noteOn) { src.noteOn(0); }
      }
      if (snd.ctx.state && snd.ctx.state !== 'running' && snd.ctx.resume) { snd.ctx.resume(); }
      return true;
    } catch (e) { return false; }
  };
  function tone(ctx, freq, at, dur, vol, type) {
    var o = ctx.createOscillator(), g = ctx.createGain(), peak = Math.max(0.0002, vol * snd.vol);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(peak, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(ctx.destination);
    if (o.start) { o.start(at); o.stop(at + dur + 0.03); } else { o.noteOn(at); o.noteOff(at + dur + 0.03); }
  }
  snd.play = function (name) {
    var ctx = snd.ctx, seq = SOUNDS[name], t0, i, n;
    if (!snd.on || !ctx || !seq) { return false; }
    try {
      t0 = ctx.currentTime + 0.01;
      for (i = 0; i < seq.length; i++) { n = seq[i]; tone(ctx, NOTE[n[0]], t0 + n[1], n[2], n[3], n[4]); }
      return true;
    } catch (e) { return false; }
  };

  /* ================= きろく（たんまつの 中だけ） ================= */
  function freshState() { return { schema: KJ.SCHEMA, yobikata: 0, name: '', shortMode: false, sound: true, done: 0 }; }
  KJ.freshState = freshState;
  KJ.loadState = function () {
    var raw = null, s;
    try { raw = global.localStorage ? global.localStorage.getItem(KJ.STORE_KEY) : null; } catch (e) { raw = null; }
    if (!raw) { return freshState(); }
    try { s = JSON.parse(raw); } catch (e2) { return freshState(); }
    if (!s || s.schema !== KJ.SCHEMA) { return freshState(); }
    if (!(s.yobikata >= 0 && s.yobikata < KJ.YOBIKATA.length)) { s.yobikata = 0; }
    return s;
  };
  KJ.saveState = function (s) { try { if (global.localStorage) { global.localStorage.setItem(KJ.STORE_KEY, JSON.stringify(s)); } } catch (e) { /* 保存できなくても つかえる */ } };

  /* ================= 自己点検（CC が tools/test.html から よぶ） ================= */
  KJ.selfTest = function (doc) {
    var pass = 0, fail = 0, lines = [], i, j, s, ids = {}, n5, w, k;
    function ok(cond, msg) { if (cond) { pass++; } else { fail++; lines.push('FAIL ' + msg); } }
    ok(SCENES.length === 10, 'ばめんは 10こ');
    n5 = KJ.pickScenes(true).length;
    ok(n5 === 5, 'みじかい は 5こ（いま ' + n5 + '）');
    for (i = 0; i < SCENES.length; i++) {
      s = SCENES[i];
      ok(!ids[s.id], 'id が かさならない ' + s.id); ids[s.id] = true;
      ok(s.p >= 1 && s.p <= 10, s.id + ' もとの ページが 1〜10');
      ok(s.q && s.ok && s.ng && s.yaku, s.id + ' といかけ・こたえ・やくそく が ある');
      ok(s.ok !== s.ng, s.id + ' ok と ng が ちがう');
      ok(typeof s.lure === 'string' && /^p\d+ /.test(s.lure) && s.lure.indexOf('p' + s.p + ' ') === 0, s.id + ' まちがいの 出どころ（ページ）が ある');
      ok(s.yaku.indexOf('しない') < 0 || s.yaku.indexOf('きに しない') >= 0, s.id + ' やくそく は「〜する」の かたち');
      ok(s.yaku.indexOf('だめ') < 0 && s.yaku.indexOf('ダメ') < 0, s.id + ' やくそく に だめ を つかわない');
      ok(!!(global.KJ_IMG && global.KJ_IMG[s.stem]) || !global.KJ_IMG, s.id + ' もんだいの 絵が ある');
      ok(s.reveal === 'card' || !!(global.KJ_IMG && global.KJ_IMG[s.reveal]) || !global.KJ_IMG, s.id + ' こたえの 絵が ある');
      ok(s.reveal === 'card' || (s.ring && s.ring.length === 4 && s.ring[0] + s.ring[2] <= 1178 && s.ring[1] + s.ring[3] <= 842), s.id + ' トイくんの わくが 絵の 中');
      ok(s.ok.length <= 24 && s.ng.length <= 24, s.id + ' えらぶ ことばは 24もじ いない（よみやすさ）');
    }
    /* ことばに 能力ほめ・あおる ことばが ない */
    w = [];
    for (i = 0; i < PRAISE.length; i++) { w.push(PRAISE[i]); }
    for (i = 0; i < SCENES.length; i++) { w.push(SCENES[i].q, SCENES[i].ok, SCENES[i].yaku, SCENES[i].tip); }
    for (i = 0; i < KJ.MAGIC.length; i++) { w.push(KJ.MAGIC[i].w, KJ.MAGIC[i].sub); }
    for (i = 0; i < w.length; i++) { for (j = 0; j < KJ.BAN_WORDS.length; j++) { ok(String(w[i]).indexOf(KJ.BAN_WORDS[j]) < 0, 'つかわない ことば「' + KJ.BAN_WORDS[j] + '」が ない: ' + w[i]); } }
    ok(KJ.MAGIC.length === 3, 'おぼえる ことばは 3つ');
    /* よびかた の さしかえ */
    ok(KJ.fill('{y}に あう', 'パパ') === 'パパに あう', 'よびかた が はいる');
    ok(KJ.fill(SCENES[9].ok, '') .indexOf('{y}') < 0, 'よびかた が からでも {y} が のこらない');
    /* ふうせん いき＝30びょう */
    ok((KJ.BREATH.inhale + KJ.BREATH.exhale) * KJ.BREATH.times === 30000, 'ふうせん いき は 30びょう');
    ok(KJ.BREATH.exhale > KJ.BREATH.inhale, 'はく ほうが ながい');
    /* えらぶ ばしょ＝200かいで ひだり・みぎ が かたよらない */
    KJ.seed(3); k = 0;
    for (i = 0; i < 200; i++) { if (KJ.okFirst()) { k++; } }
    KJ.seed(null);
    ok(k > 70 && k < 130, 'ok の ばしょが かたよらない（' + k + '/200）');
    /* おと の ならび */
    for (k in SOUNDS) { if (SOUNDS.hasOwnProperty(k)) { for (i = 0; i < SOUNDS[k].length; i++) { ok(!!NOTE[SOUNDS[k][i][0]], 'おと ' + k + ' の 高さが ある'); ok(SOUNDS[k][i][2] > 0 && SOUNDS[k][i][2] <= 1.5, 'おと ' + k + ' は みじかい'); } } }
    ok(!SOUNDS.bgm, 'ずっと ながれる おとが ない');
    /* きろく */
    s = freshState();
    ok(s.sound === true && s.yobikata === 0 && s.shortMode === false, 'はじめの きろく');
    lines.unshift('PASS=' + pass + ' FAIL=' + fail);
    return lines;
  };
})(window);
