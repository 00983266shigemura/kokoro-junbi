# こころの じゅんび ── 公開前の検査をまとめて回す（CCが使う。しげ用の台本は push.zsh）
#   1 組み立て  2 古い書き方  3 字の在庫・子どもの画面の漢字・書かない語  4 ホーム画面の絵
#   5 自己点検（本物のブラウザで src/app.js を実行）  6 iPad よこおきの 1がめん＋無音
# 終了コード 0=全部PASS / 1=どれか不合格
ROOT="/Users/shigemurasatoshi/dev/kokoro-junbi"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
LOG="$ROOT/logs/check_$(date +%Y%m%d_%H%M%S).log"
FAILFILE="$ROOT/logs/.check_fail"
mkdir -p "$ROOT/logs"
rm -f "$FAILFILE"
{
print "== 1/6 組み立て =="
/usr/bin/python3 "$ROOT/tools/build_app.py" || touch "$FAILFILE"
print "== 2/6 古い書き方だけか（src/app.js・src/ui.js・index.html） =="
/usr/bin/python3 "$ROOT/tools/check_es5.py" --selftest || touch "$FAILFILE"
/usr/bin/python3 "$ROOT/tools/check_es5.py" "$ROOT/src/app.js" "$ROOT/src/ui.js" "$ROOT/index.html" || touch "$FAILFILE"
print "== 3/6 字の在庫（絵文字なし） =="
/usr/bin/python3 "$ROOT/tools/check_chars.py" "$ROOT/index.html" "$ROOT/README.md" || touch "$FAILFILE"
print "== 3b/6 子どもの画面の漢字（おとなのひと の画面は除く） =="
/usr/bin/python3 "$ROOT/tools/check_kana.py" --selftest || touch "$FAILFILE"
/usr/bin/python3 "$ROOT/tools/check_kana.py" || touch "$FAILFILE"
print "== 3c/6 公開物の書かない語（受験校・日程・受験番号） =="
/usr/bin/python3 "$ROOT/tools/check_private.py" --selftest || touch "$FAILFILE"
/usr/bin/python3 "$ROOT/tools/check_private.py" "$ROOT/index.html" "$ROOT/README.md" "$ROOT/offline.appcache" || touch "$FAILFILE"
print "== 4/6 ホーム画面の絵 =="
/usr/bin/python3 "$ROOT/tools/make_icon.py" --check || touch "$FAILFILE"
print "== 5/6 自己点検（ブラウザで実行） =="
TMP="$ROOT/logs/selftest_dom.html"
"$CHROME" --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files --virtual-time-budget=20000 \
  --dump-dom "file://$ROOT/tools/test.html" > "$TMP" 2>/dev/null
RESULT=$(/usr/bin/python3 "$ROOT/tools/read_selftest.py" "$TMP")
print -r -- "$RESULT"
print -r -- "$RESULT" | head -1 | grep -q '^PASS=[0-9]* FAIL=0$' || touch "$FAILFILE"
print "== 6/6 iPad よこおきで 1がめんに おさまるか（1024×640・ぜんぶの がめん・無音の複製で） =="
/usr/bin/python3 "$ROOT/tools/mkpage.py" --selftest || touch "$FAILFILE"
/usr/bin/python3 "$ROOT/tools/mkpage.py" || touch "$FAILFILE"
FIT=$("$CHROME" --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files --virtual-time-budget=20000 \
  --dump-dom "file://$ROOT/tools/fit_check.html#size=1024x640" 2>/dev/null | sed -n '/<div id="out">/,/<\/div>/p' | sed -e 's/<div id="out">//' -e 's/<\/div>//')
print -r -- "$FIT"
# 合格は「FIT=PASS」だけの行（検査ページの中の文字には一致させない）
print -r -- "$FIT" | grep -qx 'FIT=PASS' || touch "$FAILFILE"
if [[ -e "$FAILFILE" ]]; then print "== けっか: FAIL =="; else print "== けっか: PASS =="; fi
} 2>&1 | tee "$LOG"
if [[ -e "$FAILFILE" ]]; then rm -f "$FAILFILE"; exit 1; fi
exit 0
