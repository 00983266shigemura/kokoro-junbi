/* こころの じゅんび ―― しくみ（app.js）
   受験の 当日の あさ、こどもと おうちの ひとが いっしょに 5ふん で たしかめる クイズ。
   ・古い Safari で動く書き方だけ（var と function。let/const/アロー/テンプレート文字列は使わない）
   ・子どもの画面の ことばは ひらがな・カタカナ・すうじ だけ（tools/check_kana.py が見る）
   ・もとの 資料＝「お子さんの為の 入試の心構え」（レインボー先生）。挿絵も ここから。p は その ページ
   ・まちがいの 選択肢は もとの 資料の ふきだし（ついやって しまう こと）から とる＝lure に ページと ことばを のこす */
(function (global) {
  'use strict';
  var KJ = global.KJ || {};
  global.KJ = KJ;

  KJ.APP_VERSION = 4;
  KJ.SCHEMA = 1;
  KJ.STORE_KEY = 'kokoro_junbi_v1';

  /* よびかた（おとなのひと で えらぶ）。{y} の ところに はいる */
  KJ.YOBIKATA = ['おかあさん', 'おとうさん', 'ママ', 'パパ', 'おうちの ひと'];

  /* ================= ばめん（10こ・当日の ながれの じゅん） =================
     q＝といかけ／ok＝ただしい こうどう／ng＝ついやって しまう こと（lure＝もとの ふきだし）
     ng2＝3つめの えらぶ もの（ある ばめんだけ・lure2＝その 出どころ）
     yaku＝やくそく（「〜しない」でなく「〜する」の かたちで いう）／tip＝ひとこと たす こと
     reveal＝こたえの あとに 出す 絵（ring＝トイくんの いる ところ・絵の 1262×892 の わくでの 四角）
     core＝みじかい（5こ）の ときも 出す
     magic＝この ばめんで 出す だいじな ことば（KJ.MAGIC の ばんごう・-1＝なし）。とちゅうで 出して こえに だし、さいごに おもいだす */
  var SCENES = [
    { id: 'idou', p: 2, title: 'いどう', stem: 's02',
      q: 'いろいろな おへやに いどう するよ。どう する？',
      ok: 'まえの こに ついて しずかに あるく',
      ng: 'おともだちと おしゃべり しながら あるく', lure: 'p2 ゆびを さして おしゃべり して いる こ',
      yaku: 'ならぶ ときは まえを みて しずかに', tip: '',
      reveal: 'r02', ring: [645, 465, 85, 200], core: false, magic: -1 },
    { id: 'tomodachi', p: 1, title: 'おともだち', stem: 'toi',
      q: 'まって いる とき、おともだちが はなしかけて きたよ。どう する？',
      ok: 'にっこり して、せんせいの ほうを むく',
      ng: 'いっしょに おしゃべり する', lure: 'p1 はなしかけられても あいてに しない',
      yaku: 'しずかに する ときの おはなしは あとで', tip: '',
      reveal: 'card', ring: null, core: false, magic: -1 },
    { id: 'ohanashi', p: 4, title: 'おはなし', stem: 's04',
      q: 'せんせいが たいせつな おはなしを するよ。どこを みる？',
      ok: 'せんせいの かおを みて きく',
      ng: 'うしろの おともだちを みる', lure: 'p4 うしろを むいたり ものを おとしたり して いる こ',
      yaku: 'おはなしは せんせいの かおを みて きく', tip: '',
      reveal: 'r04', ring: [420, 435, 80, 70], core: true, magic: 0 },
    { id: 'otehon', p: 3, title: 'おてほん', stem: 's03',
      q: 'せんせいが おてほんを みせるよ。どう する？',
      ok: 'せんせいの おてほんを よく みて おぼえる',
      ng: 'おともだちの まねを すれば いい', lure: 'p3 みんなの まね したら いいだけ',
      yaku: 'おてほんは せんせいを みる。おともだちが ちがっても きに しない', tip: 'あいずが あってから うごこう',
      reveal: 'r03', ring: [700, 525, 70, 110], core: true, magic: 0 },
    { id: 'hajime', p: 5, title: 'はじめ', stem: 's05',
      q: 'テストの はじまり。えんぴつは いつ もつ？',
      ok: '「はじめ」と いわれてから もつ',
      ng: 'しって いる もんだいだから すぐ かく', lure: 'p5 この もんだい しってる かんたんだね',
      yaku: 'えんぴつは「はじめ」で もつ。「やめ」で おく', tip: '',
      reveal: 'r05', ring: [200, 495, 125, 110], core: true, magic: 1 },
    { id: 'wakaranai', p: 6, title: 'わからない とき', stem: 's06',
      q: 'わからない もんだいが あったら、どう おもう？',
      ok: '「だいじょうぶ。つぎ！」と こころで いう',
      ng: '「もう だめだ」と おもう', lure: 'p6 おこられる もう いや',
      yaku: 'わからない もんだいが あっても だいじょうぶ。つぎを がんばる', tip: 'みんなにも むずかしい もんだいが あるよ',
      reveal: 'r06', ring: [410, 290, 150, 165], core: true, magic: 2 },
    { id: 'oekaki', p: 7, title: 'おえかき', stem: 'toi',
      q: 'えを かく じかん。はやく かけたら どう する？',
      ok: 'じかん いっぱい、もっと ていねいに かく',
      ng: '「できました！」と おおきな こえで いう', lure: 'p7 できました ぼくが いちばん',
      yaku: 'じかん いっぱい ていねいに。じぶんの えを みて かく', tip: '',
      reveal: 'r07', ring: [320, 230, 150, 175], core: false, magic: -1 },
    { id: 'toire', p: 8, title: 'トイレ', stem: 's08',
      q: 'トイレが すんだら、どう する？',
      ok: 'あるいて しずかに もどる',
      ng: 'はしって もどる', lure: 'p8 いそげ',
      yaku: 'トイレの あとは あるいて しずかに', tip: 'いきたく なったら、てを あげて せんせいに いって いいよ',
      reveal: 'r08', ring: [555, 310, 90, 195], core: false, magic: -1 },
    { id: 'dance', p: 9, title: 'おどる', stem: 's09',
      q: '「おんがくに あわせて おどって ください」。どう する？',
      ok: 'はずかしがらずに げんきに おどる',
      ng: 'はずかしいから じっと たって いる', lure: 'p9 もじもじ して いる こ',
      yaku: 'うごく ときは げんきに。ゆうきを だそう', tip: '',
      reveal: 'r09', ring: [550, 325, 180, 320], core: false, magic: -1 },
    { id: 'kaeri', p: 10, title: 'かえりみち', stem: 'toi',
      q: 'テストは いつまで？',
      ok: 'がっこうの もんを でるまで',
      ng: 'もんだいが おわるまで', lure: 'p10 キック する こ・おおごえの こ',
      ng2: '{y}に あうまで', lure2: 'p10 ほんぶんの「おかあさんの ところに もどったら おわり」を もんを でるまでに のばした',
      yaku: 'がっこうの もんを でるまで テスト。さいごまで しずかに', tip: '{y}に あえても、もんを でるまで しずかに',
      reveal: 'r10', ring: [530, 270, 90, 155], core: true, magic: -1 }
  ];
  KJ.SCENES = SCENES;

  /* だいじな 3つの ことば（おぼえるのは これだけ）。とちゅうの ばめんで 出し（magic）、さいごに おもいだす。
     さいごは head（ぶんの とちゅう）まで 出して、tail（さいごの ことば）を こどもが いう。w＝head＋tail */
  KJ.MAGIC = [
    { w: 'よく みる・よく きく', head: 'よく みる・よく ', tail: 'きく', sub: 'せんせいの かおと おてほん' },
    { w: 'あいずを まつ', head: 'あいずを ', tail: 'まつ', sub: '「はじめ」で もつ・「やめ」で おく' },
    { w: 'わからなくても だいじょうぶ、つぎ！', head: 'わからなくても だいじょうぶ、', tail: 'つぎ！', sub: 'ドキドキしたら ふうせん いき' }
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

  /* やくそく の 否定形さがし＝「ない」を 既定で こばみ、ゆるす 言いかたは 下の 一覧だけ（列挙で 否定語を さがす と もれる） */
  KJ.NEG_OK = ['きに しない', 'わからない'];
  KJ.negHits = function (text) {
    var t = String(text), i, hits = 0;
    for (i = 0; i < KJ.NEG_OK.length; i++) { t = t.split(KJ.NEG_OK[i]).join(''); }
    if (t.indexOf('ない') >= 0) { hits++; }
    if (t.indexOf('だめ') >= 0 || t.indexOf('ダメ') >= 0) { hits++; }
    return hits;
  };

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
  /* えらぶ もの の ならび（2つ＝okFirst・3つ＝ok を 3か所の どこかへ） */
  KJ.options = function (sc) {
    var bad = [{ t: sc.ng, good: false }], at;
    if (sc.ng2) { bad.push({ t: sc.ng2, good: false }); if (rnd() < 0.5) { bad.reverse(); } }
    at = (bad.length === 1) ? (KJ.okFirst() ? 0 : 1) : Math.floor(rnd() * 3);
    bad.splice(at, 0, { t: sc.ok, good: true });
    return bad;
  };
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
    inhale: [['C5', 0, 0.5, 0.4, 'sine'], ['E5', 0.5, 0.5, 0.4, 'sine'], ['G5', 1.0, 0.8, 0.4, 'sine']],
    exhale: [['G5', 0, 0.6, 0.35, 'sine'], ['E5', 0.6, 0.6, 0.35, 'sine'], ['C5', 1.2, 1.2, 0.35, 'sine']],
    magic: [['G5', 0, 0.12, 0.6, 'triangle'], ['C6', 0.12, 0.3, 0.7, 'triangle']],
    finale: [['C5', 0, 0.16, 0.8, 'triangle'], ['E5', 0.15, 0.16, 0.8, 'triangle'], ['G5', 0.3, 0.16, 0.8, 'triangle'],
      ['C6', 0.45, 0.5, 0.9, 'triangle'], ['G5', 0.45, 0.5, 0.5, 'sine'], ['E6', 0.75, 0.6, 0.6, 'sine']]
  };
  KJ.SOUNDS = SOUNDS;
  var snd = { ctx: null, on: true, vol: 0.32, keep: null };
  KJ.snd = snd;
  function audioClass() { return global.AudioContext || global.webkitAudioContext || null; }
  /* 音の ない 短い WAV（8000Hz・16bit・0.25びょう）。消音スイッチ対策の ために ながしつづける */
  function silentWav() {
    var n = 2000, len = n * 2, h, i;
    function u32(v) { return String.fromCharCode(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255); }
    function u16(v) { return String.fromCharCode(v & 255, (v >> 8) & 255); }
    h = 'RIFF' + u32(36 + len) + 'WAVE' + 'fmt ' + u32(16) + u16(1) + u16(1) + u32(8000) + u32(16000) + u16(2) + u16(16) + 'data' + u32(len);
    for (i = 0; i < len; i++) { h += String.fromCharCode(0); }
    return 'data:audio/wav;base64,' + global.btoa(h);
  }
  KJ.silentWav = silentWav;
  /* さいしょの タッチで 音の しくみを おこす（iOS 10 は タッチの 中で ないと 鳴らない）。
     iPad の 消音（よこの スイッチ・コントロールセンター）が 入って いると、合成の 音（Web Audio）だけ 消される。
     音の ない audio を 1つ ながしつづけると、ページが「再生」あつかいに なり、合成の 音も 鳴る（推定・実機で 確かめる） */
  snd.unlock = function () {
    var AC, b, src, a;
    try {
      if (!snd.keep && global.Audio) {
        a = new global.Audio(); a.src = silentWav(); a.loop = true;
        snd.keep = a;
      }
      if (snd.keep && snd.on && snd.keep.paused) { snd.keep.play(); }
    } catch (e0) { /* 鳴らなくても つかえる */ }
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
  /* 鳴らす たびに 音の しくみが とまって いないか みる（K4）。
     iPad は べつの アプリや 着信・画面の とじで 音の しくみを とめる（suspended・interrupted）。とまったままだと 鳴らない。
     running いがい（state の ない 古い しくみも ふくむ）なら resume を よぶ。しっぱいしても とまらない */
  snd.wake = function () {
    var c = snd.ctx, p;
    if (!c || !c.resume || c.state === 'running') { return false; }
    try {
      p = c.resume();
      if (p && p.then) { p.then(null, function () { /* つぎの タッチで また おこす */ }); }
    } catch (e) { /* 鳴らなくても つかえる */ }
    return true;
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
      snd.wake();
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
    var pass = 0, fail = 0, lines = [], info = [], keys = [], i, j, s, ids = {}, n5, w, k;
    function ok(cond, msg) { if (cond) { pass++; } else { fail++; lines.push('FAIL ' + msg); } }
    /* K番号の 項目＝ひとまとまりで まわし、ぜんぶ 合格なら KEYS に のせる */
    function kblock(key, fn) {
      var before = fail;
      try { fn(); } catch (e) { ok(false, key + ' 例外 ' + (e && e.message ? e.message : e)); }
      if (fail === before) { keys.push(key); }
    }
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
      ok(KJ.negHits(s.yaku) === 0, s.id + ' やくそく は「〜する」の かたち（否定形なし）: ' + s.yaku);
      ok(KJ.negHits(s.tip) === 0, s.id + ' ひとこと も 否定形なし: ' + s.tip);
      ok(KJ.negHits(s.ok) === 0, s.id + ' ただしい こうどう も 否定形なし: ' + s.ok);
      ok(!!(global.KJ_IMG && global.KJ_IMG[s.stem]) || !global.KJ_IMG, s.id + ' もんだいの 絵が ある');
      ok(s.reveal === 'card' || !!(global.KJ_IMG && global.KJ_IMG[s.reveal]) || !global.KJ_IMG, s.id + ' こたえの 絵が ある');
      ok(s.reveal === 'card' || (s.ring && s.ring.length === 4 && s.ring[0] + s.ring[2] <= 1178 && s.ring[1] + s.ring[3] <= 842), s.id + ' トイくんの わくが 絵の 中');
      ok(s.ok.length <= 24 && s.ng.length <= 24, s.id + ' えらぶ ことばは 24もじ いない（よみやすさ）');
      if (s.ng2) {
        ok(s.ng2.length <= 24 && s.ng2 !== s.ok && s.ng2 !== s.ng, s.id + ' 3つめの えらぶ ことばが ある・かさならない');
        ok(typeof s.lure2 === 'string' && s.lure2.indexOf('p' + s.p + ' ') === 0, s.id + ' 3つめの 出どころ（ページ）が ある');
      }
    }
    /* ことばに 能力ほめ・あおる ことばが ない */
    w = [];
    for (i = 0; i < PRAISE.length; i++) { w.push(PRAISE[i]); }
    for (i = 0; i < SCENES.length; i++) { w.push(SCENES[i].q, SCENES[i].ok, SCENES[i].yaku, SCENES[i].tip, SCENES[i].ng2 || ''); }
    for (i = 0; i < KJ.MAGIC.length; i++) { w.push(KJ.MAGIC[i].w, KJ.MAGIC[i].sub); }
    for (i = 0; i < w.length; i++) { for (j = 0; j < KJ.BAN_WORDS.length; j++) { ok(String(w[i]).indexOf(KJ.BAN_WORDS[j]) < 0, 'つかわない ことば「' + KJ.BAN_WORDS[j] + '」が ない: ' + w[i]); } }
    ok(KJ.MAGIC.length === 3, 'おぼえる ことばは 3つ');
    /* さいごは ぶんの とちゅうまで 出し、さいごの ことばを いわせる（しげ指示 11/1） */
    for (i = 0; i < KJ.MAGIC.length; i++) {
      ok(KJ.MAGIC[i].head + KJ.MAGIC[i].tail === KJ.MAGIC[i].w, 'ことば ' + (i + 1) + ' は とちゅう＋さいごの ことば で できて いる');
      ok(KJ.MAGIC[i].head.length > 0 && KJ.MAGIC[i].tail.length >= 2, 'ことば ' + (i + 1) + ' の とちゅうと さいごが ある');
    }
    /* おわりの ばめん＝がっこうの もんを でるまで が ただしい（しげ指示 11/1） */
    s = SCENES[SCENES.length - 1];
    ok(s.id === 'kaeri' && s.ok.indexOf('もんを でるまで') >= 0, 'おわりは もんを でるまで が ただしい');
    ok(!!s.ng2 && s.ng2.indexOf('あうまで') >= 0, '{y}に あうまで は まちがいの ほう');
    /* 3つの ときも ok の ばしょが かたよらない・ok は いつも 1つ */
    KJ.seed(5); w = [0, 0, 0];
    for (i = 0; i < 300; i++) { n5 = KJ.options(s); k = 0; for (j = 0; j < n5.length; j++) { if (n5[j].good) { w[j]++; k++; } } ok(n5.length === 3 && k === 1, '3つの えらぶ ものに ok は 1つ'); }
    KJ.seed(null);
    ok(w[0] > 60 && w[1] > 60 && w[2] > 60, '3つの ときの ok の ばしょが かたよらない（' + w.join('/') + '）');
    /* だいじな ことば が とちゅうで 3つとも 出る（10もん・5もん とも）＝さいごに おもいだす まえに 1かいは 見て こえに だす */
    for (k = 0; k < 2; k++) {
      n5 = KJ.pickScenes(k === 1); w = [0, 0, 0];
      for (i = 0; i < n5.length; i++) {
        ok(n5[i].magic === -1 || (n5[i].magic >= 0 && n5[i].magic < KJ.MAGIC.length), n5[i].id + ' magic の ばんごうが ある');
        if (n5[i].magic >= 0) { w[n5[i].magic]++; }
      }
      for (j = 0; j < 3; j++) { ok(w[j] >= 1, (k === 1 ? 'みじかい' : '10もん') + ' で ことば ' + (j + 1) + ' が とちゅうで 出る（' + w[j] + 'かい）'); }
      ok(n5[n5.length - 1].magic === -1, 'さいごの ばめんは ことばを 出さない（おもいだす まえに あいだを おく）');
    }
    ok(KJ.silentWav().indexOf('data:audio/wav;base64,UklGR') === 0, '音の ない WAV が つくれる');
    for (i = 0; i < KJ.MAGIC.length; i++) { ok(KJ.negHits(KJ.MAGIC[i].w) === 0, 'おぼえる ことば も 否定形なし: ' + KJ.MAGIC[i].w); }
    /* 否定形さがし が 効くか（見本を まぜて 落ちること） */
    ok(KJ.negHits('となりの えは みない') === 1, '見本「みない」を 見つける');
    ok(KJ.negHits('おしゃべり しないで') === 1, '見本「しないで」を 見つける');
    ok(KJ.negHits('はしったら だめ') === 1, '見本「だめ」を 見つける');
    ok(KJ.negHits('おともだちが ちがっても きに しない') === 0, 'ゆるす 言いかた「きに しない」は とおす');
    /* よびかた の さしかえ */
    ok(KJ.fill('{y}に あう', 'パパ') === 'パパに あう', 'よびかた が はいる');
    ok(KJ.fill(SCENES[9].ng2, '') .indexOf('{y}') < 0, 'よびかた が からでも {y} が のこらない');
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
    kblock('K4', function () { selfTestK4(ok, info); });
    kblock('K26', function () { selfTestK26(doc, ok, info); });
    kblock('K30', function () { selfTestK30(doc, ok, info); });
    lines.unshift('PASS=' + pass + ' FAIL=' + fail);
    return lines.concat(info, ['KEYS=' + keys.join(',')]);
  };

  /* K4＝とまった 音の しくみ（にせもの）で 鳴らすと resume が よばれる。うごいて いる ときは よばない。resume が しっぱいしても とまらない */
  function selfTestK4(ok, info) {
    var keepCtx = snd.ctx, keepOn = snd.on, called = 0, made = 0, r1, r2, r3, fake, st = [];
    function nop() {}
    fake = { state: 'suspended', currentTime: 0, destination: {},
      resume: function () { called++; st.push(fake.state); fake.state = 'running'; return null; },
      createOscillator: function () { made++; return { type: '', frequency: { setValueAtTime: nop }, connect: nop, start: nop, stop: nop }; },
      createGain: function () { return { gain: { setValueAtTime: nop, linearRampToValueAtTime: nop, exponentialRampToValueAtTime: nop }, connect: nop }; } };
    try {
      snd.ctx = fake; snd.on = true;
      r1 = snd.play('tap');
      ok(called === 1 && r1 === true && made === 1, 'K4 とまった（suspended）音の しくみは 鳴らす ときに resume する（よんだ ' + called + 'かい）');
      snd.play('tap');
      ok(called === 1, 'K4 うごいて いる（running）ときは resume を よばない');
      fake.state = 'interrupted';
      r2 = snd.play('ok');
      ok(called === 2 && r2 === true, 'K4 interrupted でも resume する');
      fake.state = 'suspended';
      fake.resume = function () { called++; st.push('throw'); throw new Error('resume しっぱい'); };
      r3 = snd.play('tap');
      ok(called === 3 && r3 === true, 'K4 resume が しっぱいしても 鳴らす しょりは とまらない');
    } finally { snd.ctx = keepCtx; snd.on = keepOn; }
    info.push('K4 おとの おこしなおし resume=' + called + 'かい（' + st.join('→') + '）・つくった おと=' + made + 'こ');
  }

  /* K26＝子どもが おす ボタン ぜんぶに touchstart を おくると press が つき、touchend で とれる。おとなの ボタンには つかない */
  function selfTestK26(doc, ok, info) {
    var P = KJ.press, all, list = [], i, n, kids = [], adults = [], ev, inner;
    function fire(node, type) { ev = doc.createEvent('Event'); ev.initEvent(type, true, true); node.dispatchEvent(ev); }
    function has(node) { return (' ' + node.className + ' ').indexOf(' press ') >= 0; }
    function label(node) { return node.id || (node.className.split(' ')[0] + (node.getAttribute('data-i') !== null ? node.getAttribute('data-i') : (node.getAttribute('data-m') || ''))); }
    if (!doc || !doc.getElementById('scr-home') || !KJ.ui || !P) {
      ok(false, 'K26 アプリの 画面が ない（tools/test.html は 無音の 複製を ひらく）');
      return;
    }
    /* 画面を つくって あとから できる ボタン（えらぶ・3つの ことば）も ならべる */
    KJ.ui.startQuiz(); KJ.ui.startMagic();
    all = doc.getElementsByTagName('button');
    for (i = 0; i < all.length; i++) { list.push(all[i]); }
    list.push(doc.getElementById('rv-pic'));
    for (i = 0; i < list.length; i++) {
      n = list[i];
      if (P.adult(n)) {
        adults.push(label(n));
        ok(P.target(n) === null, 'K26 おとなの ボタンは のぞく ' + label(n));
        fire(n, 'touchstart'); ok(!has(n), 'K26 おとなの ボタンに press が つかない ' + label(n)); fire(n, 'touchend');
      } else {
        kids.push(label(n));
        ok(P.target(n) === n, 'K26 子どもの ボタンは たいしょう ' + label(n));
        fire(n, 'touchstart'); ok(has(n), 'K26 touchstart で press が つく ' + label(n));
        fire(n, 'touchend'); ok(!has(n), 'K26 touchend で press が とれる ' + label(n));
      }
    }
    /* ボタンの 中の 字を さわっても ボタンが へこむ・touchcancel でも とれる */
    inner = doc.getElementById('choices').getElementsByTagName('span')[1];
    fire(inner, 'touchstart'); ok(has(inner.parentNode), 'K26 ボタンの 中の 字を さわっても ボタンに press');
    fire(inner, 'touchcancel'); ok(!has(inner.parentNode), 'K26 touchcancel で press が とれる');
    ok(kids.length >= 15, 'K26 子どもの ボタンが 15こ いじょう（いま ' + kids.length + '）');
    KJ.ui.home();
    info.push('K26 おした てごたえ たいしょう=' + kids.length + 'こ（' + kids.join(',') + '）');
    info.push('K26 のぞいた=' + adults.length + 'こ（おとなの ボタン: ' + adults.join(',') + '）');
  }

  /* K30＝window.onerror を じかに よぶと 下の おびが 出て、1ぎょうめ（かな）と 2ぎょうめ（なまの エラー）が はいる。さわると きえる */
  function selfTestK30(doc, ok, info) {
    var E = global.KJ_ERR, band, keep, t1 = '', t2 = '', vis = false, ev, q;
    band = doc ? doc.getElementById('err-band') : null;
    if (!E || !band || typeof global.onerror !== 'function') { ok(false, 'K30 おびか window.onerror が ない'); return; }
    ok(band.offsetHeight === 0, 'K30 ふだんは おびを 出さない');
    keep = E.list.slice(0); E.list.length = 0;
    try {
      global.onerror('K30 わざと おこした エラー', 'test.js', 123, 4, null);
      vis = band.style.display === 'block' && band.offsetHeight > 0;
      t1 = doc.getElementById('err-band-h').textContent;
      t2 = doc.getElementById('err-band-raw').textContent;
      ok(vis, 'K30 エラーで おびが 出る');
      ok(t1.indexOf('ごめんね') === 0, 'K30 1ぎょうめは かなの おわび: ' + t1);
      ok(t2.indexOf('K30 わざと おこした エラー') >= 0 && t2.indexOf('123') >= 0, 'K30 2ぎょうめに なまの エラーと ぎょう: ' + t2);
      ev = doc.createEvent('Event'); ev.initEvent('click', true, true); band.dispatchEvent(ev);
      ok(band.offsetHeight === 0, 'K30 おびを さわると きえる');
    } finally { E.list.length = 0; for (q = 0; q < keep.length; q++) { E.list.push(keep[q]); } }
    info.push('K30 エラーの おび=' + (vis ? 'でた' : 'でない') + ' 1ぎょうめ「' + t1 + '」 2ぎょうめ「' + t2 + '」');
  }
})(window);
