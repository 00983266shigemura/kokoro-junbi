# こころの じゅんび ── 目で見る確認用のスクリーンショットを撮る（CCが使う。無音の複製だけを開く）
#   使い方＝ zsh tools/shots.zsh <出力フォルダ> 〈場面の名前…〉
#   場面の名前は tools/fit_check.html の meas() の札（home・breath・playa0・hinta1・ansa1・magicopena・finala など）
ROOT="/Users/shigemurasatoshi/dev/kokoro-junbi"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$1"; shift
mkdir -p "$OUT"
/usr/bin/python3 "$ROOT/tools/mkpage.py" > /dev/null || { print "✕ 無音の複製を作れない"; exit 1; }
for s in "$@"; do
  "$CHROME" --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files --virtual-time-budget=4000 \
    --hide-scrollbars --window-size=1024,640 --screenshot="$OUT/$s.png" "file://$ROOT/tools/fit_check.html#shot=$s" > /dev/null 2>&1
  print "$OUT/$s.png"
done
