/* こころの じゅんび ―― 画面（ui.js・古い Safari で動く書き方だけ） */
(function (global) {
  'use strict';
  var KJ = global.KJ, doc = global.document, IMG = global.KJ_IMG || {};
  var S = KJ.loadState();   /* きろく */
  var G = null;             /* いまの 1まわり */
  var screen = 'home';
  var timers = [];

  function el(id) { return doc.getElementById(id); }
  function setText(node, text) { if (node) { node.textContent = text; } }
  function on(id, fn) { var n = el(id); if (n) { n.addEventListener('click', fn, false); } }
  function yobi() { return KJ.YOBIKATA[S.yobikata] || KJ.YOBIKATA[0]; }
  function later(fn, ms) { timers.push(global.setTimeout(fn, ms)); }
  function clearTimers() { var i; for (i = 0; i < timers.length; i++) { global.clearTimeout(timers[i]); } timers = []; }
  function show(id) {
    var ids = ['scr-home', 'scr-breath', 'scr-play', 'scr-magic', 'scr-final', 'scr-grown'], i;
    clearTimers();
    for (i = 0; i < ids.length; i++) { el(ids[i]).style.display = (ids[i] === 'scr-' + id) ? 'block' : 'none'; }
    screen = id;
    if (id === 'home') { checkUpdate(); reloadIfIdle(); }
    global.scrollTo(0, 0);
  }
  function setImg(node, key) { if (IMG[key]) { node.src = IMG[key]; node.style.display = 'block'; } else { node.removeAttribute('src'); node.style.display = 'none'; } }

  /* ================= はじめ ================= */
  function renderHome() {
    setImg(el('home-img'), 'toi');
    setText(el('home-len'), S.shortMode ? 'みじかい（5もん・やく 3ぷん）' : '10もん（やく 5ふん）');
    setText(el('home-ver'), 'v' + KJ.APP_VERSION);
  }

  /* ================= ふうせん いき ================= */
  function startBreath() {
    var ball = el('ball'), say = el('ball-say'), B = KJ.BREATH, n = 0;
    show('breath');
    el('breath-next').style.display = 'none';
    el('breath-skip').style.display = 'inline-block';
    ball.className = 'ball';
    setText(say, '');
    function cycle() {
      if (n >= B.times) {
        ball.style.webkitTransitionDuration = '1s'; ball.style.transitionDuration = '1s';
        ball.className = 'ball';
        setText(say, 'できたね');
        el('breath-next').style.display = 'inline-block';
        el('breath-skip').style.display = 'none';
        return;
      }
      n++;
      ball.style.webkitTransitionDuration = (B.inhale / 1000) + 's'; ball.style.transitionDuration = (B.inhale / 1000) + 's';
      ball.className = 'ball big';
      setText(say, 'すって ' + n);
      KJ.snd.play('inhale');
      later(function () {
        ball.style.webkitTransitionDuration = (B.exhale / 1000) + 's'; ball.style.transitionDuration = (B.exhale / 1000) + 's';
        ball.className = 'ball';
        setText(say, 'はいて ' + n);
        KJ.snd.play('exhale');
        later(cycle, B.exhale);
      }, B.inhale);
    }
    later(cycle, 400);
  }

  /* ================= クイズ ================= */
  function startQuiz() {
    G = { scenes: KJ.pickScenes(!!S.shortMode), idx: 0, tries: 0, done: false, stars: 0, order: [], got: [false, false, false] };
    show('play');
    renderScene();
  }
  function paintStars() {
    var h = '', i;
    for (i = 0; i < G.scenes.length; i++) { h += (i < G.stars) ? '<span>★</span>' : '<span class="off">★</span>'; }
    el('play-stars').innerHTML = h;
    h = '';
    for (i = 0; i < KJ.MAGIC.length; i++) { h += '<span class="' + (G.got[i] ? 'on' : '') + '">' + (i + 1) + '</span>'; }
    el('play-kotoba').innerHTML = 'ことば ' + h;
  }
  function renderScene() {
    var sc = G.scenes[G.idx], box = el('choices'), okFirst = KJ.okFirst(), opts, i, b, qi = el('q-img');
    G.tries = 0; G.done = false;
    el('scr-play').className = 'screen';
    setText(el('play-title'), (G.idx + 1) + '／' + G.scenes.length + '　' + sc.title);
    paintStars();
    setImg(qi, sc.stem);
    qi.className = (sc.stem === 'toi') ? 'tiny' : '';
    setText(el('q-text'), KJ.fill(sc.q, yobi()));
    setText(el('msg'), ''); el('msg').className = 'msg';
    opts = okFirst ? [{ t: sc.ok, good: true }, { t: sc.ng, good: false }] : [{ t: sc.ng, good: false }, { t: sc.ok, good: true }];
    G.order = opts;
    box.innerHTML = '';
    for (i = 0; i < opts.length; i++) {
      b = doc.createElement('button');
      b.className = 'choice'; b.setAttribute('data-i', String(i));
      b.innerHTML = '<span class="mark"></span><span class="txt"></span>';
      b.getElementsByTagName('span')[1].textContent = KJ.fill(opts[i].t, yobi());
      box.appendChild(b);
    }
    box.style.display = 'block';
    el('reveal').style.display = 'none'; el('reveal').className = 'reveal';
  }
  function onChoice(i) {
    var cards = el('choices').getElementsByTagName('button'), card = cards[i], m = el('msg');
    if (!G || G.done || !card || card.className.indexOf('wrong') >= 0) { return; }
    if (G.order[i].good) {
      G.done = true; G.stars++;
      card.className = 'choice right';
      card.getElementsByTagName('span')[0].textContent = '○ トイくんと おなじ';
      m.className = 'msg good';
      setText(m, G.tries === 0 ? KJ.praise() : KJ.OSHII2);
      KJ.snd.play('ok');
      later(function () { KJ.snd.play('star'); }, 450);
      paintStars();
      later(showReveal, 700);
    } else {
      G.tries++;
      card.className = 'choice wrong';
      card.getElementsByTagName('span')[0].textContent = '？ もう いちど';
      m.className = 'msg warn';
      setText(m, KJ.OSHII);
      KJ.snd.play('oshii');
    }
  }
  /* こたえの 絵の はば＝画面の たかさに あわせて できるだけ おおきく（絵は 1000×728） */
  function sizePic() {
    var pic = el('rv-pic'), zoom = el('scr-play').className.indexOf('zoom') >= 0, box = el('rv-l'), vw, vh, wmax, hmax;
    if (!pic || pic.style.display === 'none') { return; }
    vw = global.innerWidth || 1024; vh = global.innerHeight || 640;
    wmax = zoom ? vw - 32 : (box.clientWidth || vw * 0.7);
    hmax = zoom ? vh - 24 : vh - el('play-bar').offsetHeight - 40;
    pic.style.width = Math.floor(Math.min(wmax, hmax * 1000 / 728)) + 'px';
  }
  function toggleZoom() {
    var sp = el('scr-play');
    if (screen !== 'play' || !G || !G.done || el('rv-pic').style.display === 'none') { return; }
    sp.className = (sp.className.indexOf('zoom') >= 0) ? 'screen revealing' : 'screen revealing zoom';
    sizePic();
  }
  function showMagic(sc) {
    var box = el('rv-magic'), m = sc.magic, first;
    if (!(m >= 0)) { box.style.display = 'none'; return false; }
    first = !G.got[m];
    G.got[m] = true;
    setText(el('rv-magic-h'), 'だいじな ことば ' + (m + 1) + 'つめ');
    setText(el('rv-magic-w'), KJ.MAGIC[m].w);
    setText(el('rv-magic-say'), first ? 'こえに だして いって みよう' : 'もう いちど こえに だして みよう');
    box.className = first ? 'kotoba new' : 'kotoba';
    box.style.display = 'block';
    paintStars();
    return first;
  }
  function showReveal() {
    var sc = G.scenes[G.idx], rv = el('reveal'), ring = el('rv-ring'), card = el('rv-card'), r, h;
    el('choices').style.display = 'none';
    el('scr-play').className = 'screen revealing';
    setText(el('rv-msg'), el('msg').textContent);
    if (sc.reveal === 'card') {
      el('rv-pic').style.display = 'none';
      h = '<div class="half quiet"><b></b><ul></ul></div><div class="half talk"><b></b><ul></ul></div>';
      card.innerHTML = h;
      fillHalf(card.getElementsByTagName('div')[0], KJ.CARD.left);
      fillHalf(card.getElementsByTagName('div')[1], KJ.CARD.right);
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
      el('rv-pic').style.display = 'block';
      setImg(el('rv-img'), sc.reveal);
      r = sc.ring;
      /* 絵は もとの わく（1262×892）の 88,48 から 1090×794 を 切りだしたもの */
      ring.style.left = ((r[0] - 88) / 1090 * 100) + '%';
      ring.style.top = ((r[1] - 48) / 794 * 100) + '%';
      ring.style.width = (r[2] / 1090 * 100) + '%';
      ring.style.height = (r[3] / 794 * 100) + '%';
    }
    setText(el('rv-yaku'), KJ.fill(sc.yaku, yobi()));
    setText(el('rv-tip'), sc.tip ? KJ.fill(sc.tip, yobi()) : '');
    el('rv-tip').style.display = sc.tip ? 'block' : 'none';
    el('rv-zoom').style.display = (sc.reveal === 'card') ? 'none' : 'block';
    if (showMagic(sc)) { later(function () { KJ.snd.play('magic'); }, 300); }
    setText(el('next-btn'), G.idx + 1 < G.scenes.length ? 'つぎへ' : 'さいごの 3つへ');
    rv.style.display = 'block';
    sizePic();
    later(function () { rv.className = 'reveal show'; }, 30);
  }
  function fillHalf(div, data) {
    var ul = div.getElementsByTagName('ul')[0], i, li;
    div.getElementsByTagName('b')[0].textContent = data.h;
    for (i = 0; i < data.items.length; i++) { li = doc.createElement('li'); li.textContent = data.items[i]; ul.appendChild(li); }
  }
  function onNext() {
    if (!G || !G.done) { return; }
    G.idx++;
    if (G.idx < G.scenes.length) { renderScene(); } else { startMagic(); }
  }

  /* ================= 3つの ことば（おもいだす れんしゅう） ================= */
  function startMagic() {
    var list = el('magic-list'), i, b;
    show('magic');
    list.innerHTML = '';
    G.opened = 0;
    el('scr-play').className = 'screen';
    for (i = 0; i < KJ.MAGIC.length; i++) {
      b = doc.createElement('button');
      b.className = 'magic'; b.setAttribute('data-m', String(i));
      b.innerHTML = '<span class="num"></span><b></b><span></span>';
      b.getElementsByTagName('span')[0].textContent = String(i + 1);
      b.getElementsByTagName('b')[0].textContent = 'なんだった かな？';
      list.appendChild(b);
    }
    el('magic-next').style.display = 'none';
  }
  function openMagic(i) {
    var b = el('magic-list').getElementsByTagName('button')[i], m = KJ.MAGIC[i];
    if (!b || b.className.indexOf('open') >= 0) { return; }
    b.className = 'magic open';
    b.getElementsByTagName('b')[0].textContent = m.w;
    b.getElementsByTagName('span')[1].textContent = m.sub;
    KJ.snd.play('magic');
    G.opened++;
    if (G.opened >= KJ.MAGIC.length) { el('magic-next').style.display = 'inline-block'; }
  }

  /* ================= さいご ================= */
  function startFinal() {
    var h = '', i, y = yobi();
    show('final');
    setImg(el('fin-img'), 'hug');
    setText(el('fin-title'), (S.name ? S.name + '、' : '') + 'じゅんび できたね！');
    for (i = 0; i < G.scenes.length; i++) { h += '★'; }
    el('fin-stars').innerHTML = h + '<span>こころの おまもり</span>';
    setText(el('fin-msg'), y + 'から：「どんな ときも だいすき。' + y + 'は いつも こころの なかに いっしょに いるよ。」');
    setText(el('fin-hug'), 'ここで ぎゅっと しよう。');
    KJ.snd.play('finale');
    S.done = (S.done || 0) + 1;
    KJ.saveState(S);
  }

  /* ================= おとなのひと ================= */
  function renderGrown() {
    var sel = el('grown-yobi'), i, o;
    sel.innerHTML = '';
    for (i = 0; i < KJ.YOBIKATA.length; i++) { o = doc.createElement('option'); o.value = String(i); o.textContent = KJ.YOBIKATA[i]; sel.appendChild(o); }
    sel.value = String(S.yobikata || 0);
    el('grown-name').value = S.name || '';
    el('grown-len').value = S.shortMode ? 'short' : 'full';
    el('grown-snd').value = (S.sound === false) ? 'off' : 'on';
    setText(el('grown-ver'), 'v' + KJ.APP_VERSION + '・さいごまで いった かいすう ' + (S.done || 0));
  }
  var holdTimer = null;
  function holdStart() { holdTimer = global.setTimeout(function () { holdTimer = null; renderGrown(); show('grown'); }, 1200); }
  function holdEnd() { if (holdTimer) { global.clearTimeout(holdTimer); holdTimer = null; } }

  /* ================= 版の 取りなおし（くるくる ずけい と同型） ================= */
  var UPD_KEY = 'kokoro_upd';
  function tidyUrl() {
    if (!global.history || !global.history.replaceState) { return; }
    if (global.location.search.indexOf('v=') < 0) { return; }
    try { global.history.replaceState(null, '', global.location.pathname); } catch (e) { /* 見ためだけ */ }
  }
  function checkUpdate() {
    var x;
    if (!global.XMLHttpRequest) { return; }
    try { x = new global.XMLHttpRequest(); } catch (e) { return; }
    try { x.open('GET', 'version.txt?t=' + (new Date()).getTime(), true); } catch (e2) { return; }
    x.onreadystatechange = function () {
      var v, now, last = null, part;
      if (x.readyState !== 4 || x.status !== 200) { return; }
      v = parseInt(String(x.responseText).replace(/[^0-9]/g, ''), 10);
      now = (new Date()).getTime();
      if (!(v > KJ.APP_VERSION)) { return; }
      try { last = global.sessionStorage.getItem(UPD_KEY); } catch (e3) { /* 無くても進む */ }
      if (last) { part = String(last).split(':'); if (part[0] === String(v) && (now - parseInt(part[1], 10)) < 30000) { return; } }
      if (screen !== 'home') { return; }
      try { global.sessionStorage.setItem(UPD_KEY, v + ':' + now); } catch (e4) { /* 無くても進む */ }
      global.location.replace('./?v=' + v);
    };
    try { x.send(null); } catch (e5) { /* 通信できなくても つかえる */ }
  }
  var cacheReady = false;
  function reloadIfIdle() { if (!cacheReady || screen !== 'home') { return; } cacheReady = false; global.location.reload(); }
  function watchCache() {
    var ac = global.applicationCache;
    if (!ac || !ac.addEventListener) { return; }
    ac.addEventListener('updateready', function () { try { ac.swapCache(); } catch (e) { /* つぎに */ } cacheReady = true; reloadIfIdle(); }, false);
  }

  /* ================= 押したときの 受けとり ================= */
  function init() {
    var gb = el('grown-btn');
    on('start-btn', startBreath);
    on('breath-skip', startQuiz);
    on('breath-next', startQuiz);
    on('play-back', function () { renderHome(); show('home'); });
    on('breath-back', function () { renderHome(); show('home'); });
    on('magic-back', function () { renderHome(); show('home'); });
    on('next-btn', onNext);
    on('rv-pic', toggleZoom);
    on('rv-zoom', toggleZoom);
    on('grown-snd-test', function () {
      var was = KJ.snd.on;
      KJ.snd.on = true; KJ.snd.unlock();
      setText(el('grown-snd-res'), KJ.snd.play('finale') ? 'ならしました' : 'おとの しくみが つくれません');
      KJ.snd.on = was;
    });
    global.addEventListener('resize', sizePic, false);
    doc.addEventListener('visibilitychange', function () { if (doc.hidden && KJ.snd.keep) { try { KJ.snd.keep.pause(); } catch (e) { /* つぎの タッチで もどる */ } } }, false);
    on('magic-next', startFinal);
    on('fin-home', function () { renderHome(); show('home'); });
    el('choices').addEventListener('click', function (ev) {
      var t = ev.target, n = 0;
      while (t && n < 4) { if (t.getAttribute && t.getAttribute('data-i') !== null) { onChoice(parseInt(t.getAttribute('data-i'), 10)); return; } t = t.parentNode; n++; }
    }, false);
    el('magic-list').addEventListener('click', function (ev) {
      var t = ev.target, n = 0;
      while (t && n < 4) { if (t.getAttribute && t.getAttribute('data-m') !== null) { openMagic(parseInt(t.getAttribute('data-m'), 10)); return; } t = t.parentNode; n++; }
    }, false);
    gb.addEventListener('touchstart', function (ev) { ev.preventDefault(); holdStart(); }, false);
    gb.addEventListener('touchend', holdEnd, false); gb.addEventListener('touchcancel', holdEnd, false);
    gb.addEventListener('mousedown', holdStart, false); gb.addEventListener('mouseup', holdEnd, false); gb.addEventListener('mouseleave', holdEnd, false);
    on('grown-back', function () { renderHome(); show('home'); });
    on('grown-save', function () {
      var y = parseInt(el('grown-yobi').value, 10);
      S.yobikata = (y >= 0 && y < KJ.YOBIKATA.length) ? y : 0;
      S.name = String(el('grown-name').value || '').slice(0, 8);
      S.shortMode = el('grown-len').value === 'short';
      S.sound = el('grown-snd').value !== 'off';
      KJ.snd.on = S.sound;
      if (!S.sound && KJ.snd.keep) { try { KJ.snd.keep.pause(); } catch (e) { /* つぎに */ } }
      KJ.saveState(S); renderHome(); show('home');
    });
    KJ.snd.on = (S.sound !== false);
    doc.addEventListener('touchend', function () { KJ.snd.unlock(); }, false);
    doc.addEventListener('click', function (ev) { KJ.snd.unlock(); if (ev.target && ev.target.tagName === 'BUTTON') { KJ.snd.play('tap'); } }, false);
    tidyUrl();
    watchCache();
    renderHome();
    show('home');
  }
  /* 試験用＝画面を 直接 うごかす 入口 */
  KJ.ui = { startQuiz: startQuiz, showReveal: function () { clearTimers(); showReveal(); }, toggleZoom: toggleZoom, startBreath: startBreath, onChoice: onChoice, onNext: onNext, openMagic: openMagic, startFinal: startFinal,
    round: function () { return G; }, state: function () { return S; }, flush: function () { var t = timers.slice(0); return t.length; } };

  if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', init, false); } else { init(); }
})(window);
