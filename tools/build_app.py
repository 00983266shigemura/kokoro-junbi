# -*- coding: utf-8 -*-
"""こころの じゅんび ── index.html と offline.appcache を組み立てる唯一の道具。

src/template.html の <!--APP_JS--> に src/app.js、<!--UI_JS--> に src/ui.js、
<!--IMG_JS--> に src/img/*.jpg（挿絵＝元資料から切り出したもの）を data: で埋め込み、index.html に書く。
絵を index.html の中へ入れるのは、通信が無くても1ファイルで開け、公開の照合も index.html の md5 1つで済むため。
あわせて version.txt と app.js の APP_VERSION が一致するかを見て、
offline.appcache（端末にしまうファイルの一覧）を md5 入りで書き直す
（中身が変わるたびに一覧も変わる＝古い版が端末に残り続けない）。

使い方＝ python3 tools/build_app.py        終了コード 0=できた / 1=できなかった
"""
import base64
import hashlib
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG_DIR = os.path.join(ROOT, 'src', 'img')


def read(p):
    return io.open(p, encoding='utf-8').read()


def md5(p):
    return hashlib.md5(open(p, 'rb').read()).hexdigest()


def img_js():
    names = sorted(n for n in os.listdir(IMG_DIR) if n.endswith('.jpg'))
    if not names:
        sys.exit('✕ src/img に絵がありません')
    parts = []
    for n in names:
        key = n[:-4]
        if not re.match(r'^[a-z0-9]+$', key):
            sys.exit('✕ 絵の名前は英小文字と数字だけ: ' + n)
        b = open(os.path.join(IMG_DIR, n), 'rb').read()
        if b[:3] != b'\xff\xd8\xff':
            sys.exit('✕ JPEG でない: ' + n)
        parts.append("'%s': 'data:image/jpeg;base64,%s'" % (key, base64.b64encode(b).decode('ascii')))
    return 'window.KJ_IMG = {\n' + ',\n'.join(parts) + '\n};', len(names)


def main():
    app = read(os.path.join(ROOT, 'src', 'app.js'))
    ui = read(os.path.join(ROOT, 'src', 'ui.js'))
    tpl = read(os.path.join(ROOT, 'src', 'template.html'))
    m = re.search(r'^\s*KJ\.APP_VERSION = (\d+);', app, re.M)
    if not m:
        sys.exit('✕ src/app.js に APP_VERSION の行がありません')
    ver = int(m.group(1))
    vp = os.path.join(ROOT, 'version.txt')
    if not os.path.exists(vp):
        sys.exit('✕ version.txt がありません')
    raw = read(vp).strip()
    if not re.match(r'^\d+$', raw) or int(raw) != ver:
        sys.exit('✕ version.txt（%s）と APP_VERSION（%d）が一致しません' % (raw, ver))
    if '</script' in app or '</script' in ui:
        sys.exit('✕ JS の中に </script が含まれています（埋め込むと壊れる）')
    for mark in ('<!--APP_JS-->', '<!--UI_JS-->', '<!--IMG_JS-->'):
        if tpl.count(mark) != 1:
            sys.exit('✕ template.html の埋め込み印 %s が1つではありません' % mark)
    imgs, nimg = img_js()
    html = tpl.replace('<!--IMG_JS-->', imgs).replace('<!--APP_JS-->', app.rstrip('\n')).replace('<!--UI_JS-->', ui.rstrip('\n'))
    out = os.path.join(ROOT, 'index.html')
    with io.open(out, 'w', encoding='utf-8', newline='\n') as fp:
        fp.write(html)
    icon = os.path.join(ROOT, 'icon.png')
    if not os.path.exists(icon):
        sys.exit('✕ icon.png がありません（python3 tools/make_icon.py で作る）')
    manifest = (
        'CACHE MANIFEST\n'
        '# こころの じゅんび v%d\n'
        '# index.html md5 %s\n'
        '# icon.png md5 %s\n'
        '\nCACHE:\n./\nindex.html\nicon.png\n\nNETWORK:\n*\n'
    ) % (ver, md5(out), md5(icon))
    with io.open(os.path.join(ROOT, 'offline.appcache'), 'w', encoding='utf-8', newline='\n') as fp:
        fp.write(manifest)
    print('できました ＝ index.html（%d バイト・v%d・絵 %d 枚・md5 %s）・offline.appcache' % (os.path.getsize(out), ver, nimg, md5(out)))


if __name__ == '__main__':
    main()
