#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""こころの じゅんび ── ホーム画面の絵（icon.png）を作る唯一の道具（ちえの もり の道具と同じ型）。

絵の中身＝あたたかい だいだいの地に 白い ハート（こころ）と、右上に 黄色い ほし（おまもり）。
「こころの じゅんび」が 一目で分かる。文字は入れない。

大きさ＝180×180。透明を持たない（RGB）＝iOS 10 は透明部分を黒で塗るため。
色は src/template.html と同じ名札（--daidai / --ki / --ao）。

使い方＝ python3 tools/make_icon.py          ← icon.png を作り直す
         python3 tools/make_icon.py --check  ← 作らずに、今ある icon.png を見るだけ
終了コード＝0（できた）/ 1（できなかった）
"""
import math
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, 'icon.png')

SIZE = 180
SS = 8
DAIDAI = (0xe8, 0x89, 0x2b)
KI = (0xf2, 0xc2, 0x30)
AO = (0x1f, 0x6f, 0xb8)
SHIRO = (0xff, 0xfd, 0xf7)
SUMI = (0x1b, 0x1b, 0x1b)
MOMO = (0xf2, 0xb3, 0x9a)


def star(cx, cy, r1, r2):
    pts = []
    for i in range(10):
        r = r1 if i % 2 == 0 else r2
        a = math.radians(-90 + i * 36)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw():
    n = SIZE * SS
    im = Image.new('RGB', (n, n), DAIDAI)
    d = ImageDraw.Draw(im)
    lw = int(n * 0.022)
    # ハート＝まる2つ と 下向きの さんかく（すこし 下へ）
    cx, cy = n * 0.47, n * 0.53
    r = n * 0.19
    pts = []
    for k in range(200):
        t = 2 * math.pi * k / 200
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * r / 16 * 1.9, cy + y * r / 16 * 1.9))
    d.polygon(pts, fill=SHIRO, outline=SUMI)
    d.line(pts + [pts[0]], fill=SUMI, width=lw, joint='curve')
    # ハートの なかに ももいろの ほっぺ 2つ と にっこり（やさしい かお）
    for ox in (-0.11, 0.11):
        d.ellipse([cx + ox * n - n * 0.035, cy - n * 0.0 - n * 0.025, cx + ox * n + n * 0.035, cy + n * 0.025], fill=MOMO)
    for ox in (-0.07, 0.07):
        d.ellipse([cx + ox * n - n * 0.018, cy - n * 0.085, cx + ox * n + n * 0.018, cy - n * 0.045], fill=SUMI)
    d.arc([cx - n * 0.06, cy - n * 0.06, cx + n * 0.06, cy + n * 0.04], 20, 160, fill=SUMI, width=int(n * 0.016))
    # みぎうえに ほし（おまもり）
    d.polygon(star(n * 0.8, n * 0.2, n * 0.13, n * 0.055), fill=KI, outline=SUMI)
    sp = star(n * 0.8, n * 0.2, n * 0.13, n * 0.055)
    d.line(sp + [sp[0]], fill=SUMI, width=int(n * 0.014), joint='curve')
    return im.resize((SIZE, SIZE), Image.LANCZOS)


def look(path):
    if not os.path.exists(path):
        return '絵がありません＝' + path
    try:
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            if im.size != (SIZE, SIZE):
                return '大きさが %s＝%d×%d でなければなりません' % (im.size, SIZE, SIZE)
            if im.mode != 'RGB':
                return '色の持ち方が %s＝RGB（透明なし）でなければなりません' % im.mode
    except Exception as e:
        return 'こわれています＝' + str(e)
    return ''


def main():
    if '--check' in sys.argv:
        bad = look(OUT)
        if bad:
            sys.exit('✕ ' + bad)
        print('✓ %s ＝ %d×%d・透明なし・こわれていない（%d バイト）' % (OUT, SIZE, SIZE, os.path.getsize(OUT)))
        return
    im = draw()
    im.save(OUT, 'PNG', optimize=True)
    bad = look(OUT)
    if bad:
        sys.exit('書きましたが確かめに落ちました＝' + bad)
    print('できました ＝ %s（%d×%d・%d バイト）' % (OUT, SIZE, SIZE, os.path.getsize(OUT)))


if __name__ == '__main__':
    main()
