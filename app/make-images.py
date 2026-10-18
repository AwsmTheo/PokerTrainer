"""Draws the app icon and launch screen (a spade on felt green) into the iOS project.

Run with: python3 make-images.py   (needs Pillow). Re-run only to change the artwork.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

FELT = (22, 74, 52)
CARD = (243, 239, 228)
INK = (20, 26, 23)
ASSETS = Path(__file__).parent / 'ios/App/App/Assets.xcassets'


def spade(draw, cx, cy, s, fill):
    """A spade of height about 2*s centred on (cx, cy)."""
    r = s * 0.48
    top = (cx, cy - s)
    lobes = [(cx + dx * s * 0.45, cy + s * 0.18) for dx in (-1, 1)]
    for lx, ly in lobes:
        draw.ellipse([lx - r, ly - r, lx + r, ly + r], fill=fill)
    # The point: the lines from the tip that just touch each lobe on its outer side.
    sides = []
    for (lx, ly), out in zip(lobes, (-1, 1)):
        dx, dy = lx - top[0], ly - top[1]
        dist = math.hypot(dx, dy)
        a = math.atan2(dy, dx) - out * math.asin(r / dist)
        t = math.sqrt(dist * dist - r * r)
        sides.append((top[0] + t * math.cos(a), top[1] + t * math.sin(a)))
    draw.polygon([top, sides[0], lobes[0], lobes[1], sides[1]], fill=fill)
    # The stem.
    draw.polygon([(cx - s * 0.08, cy + s * 0.25), (cx + s * 0.08, cy + s * 0.25),
                  (cx + s * 0.42, cy + s), (cx - s * 0.42, cy + s)], fill=fill)


def card_on_felt(size, card_h):
    k = 4  # draw large, then shrink, for smooth edges
    W = size * k
    img = Image.new('RGB', (W, W), FELT)
    d = ImageDraw.Draw(img)
    ch = card_h * k
    cw = ch * 0.72
    x0, y0 = (W - cw) / 2, (W - ch) / 2
    d.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=ch * 0.08, fill=CARD)
    spade(d, W / 2, W / 2 - ch * 0.02, ch * 0.24, INK)
    return img.resize((size, size), Image.LANCZOS)


card_on_felt(1024, 700).save(ASSETS / 'AppIcon.appiconset/AppIcon-512@2x.png')
splash = card_on_felt(2732, 520)
for name in ('splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'):
    splash.save(ASSETS / 'Splash.imageset' / name)
print('Wrote the app icon and launch screen')
