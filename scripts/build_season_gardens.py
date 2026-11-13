#!/usr/bin/env python3
"""Build matching summer, autumn and winter garden backgrounds from the original
Nhi's Learning Corner spring artwork. Original spring day/night WebP images
are not modified. Output is deterministic and contains no network downloads.
"""
from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


def blend(base: np.ndarray, target: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Blend target RGB through a per-pixel mask, avoiding sharp recoloring edges."""
    a = np.clip(alpha, 0, 1)[..., None]
    return base * (1.0 - a) + target * a


def recolor(img: Image.Image, season: str, night: bool) -> Image.Image:
    base = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    a = base.copy()
    h, w = a.shape[:2]
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    luminance = .299 * r + .587 * g + .114 * b
    chroma = np.max(a, axis=2) - np.min(a, axis=2)

    # Pink blossoms are concentrated in the treetops and beds. Exclude roof,
    # brown trunks, beige bridge and warm window lighting.
    pink = ((r > g * 1.075) & (b > g * .94) & (r > b * .93)
            & (r > (.31 if night else .43)) & (chroma > .065))
    # Lush foreground / rolling hills / mossy banks.
    green = ((g > b * 1.075) & (g > r * .91)
             & (g > (.13 if night else .22))
             & (chroma > .055))
    # Sky / distant blue mountains and the creek stay in cool colors.
    ymask = (np.arange(h)[:, None] < int(h * .63))
    skyblue = (b > r * 1.07) & (b > g * .99) & ymask

    if season == "summer":
        # Cherry blossom clusters become leafy green, with natural highlights.
        leaf = np.empty_like(a)
        leaf[..., 0] = luminance * (.58 if not night else .48)
        leaf[..., 1] = np.minimum(.99, luminance * (1.15 if not night else 1.08) + .045)
        leaf[..., 2] = luminance * (.62 if not night else .57)
        a = blend(a, leaf, pink.astype(np.float32) * (.89 if not night else .81))
        # A more saturated green summer garden, deeper azure sky.
        leaf2 = np.empty_like(a)
        leaf2[..., 0] = r * .87
        leaf2[..., 1] = np.minimum(.99, g * 1.13 + .035)
        leaf2[..., 2] = b * .89
        a = blend(a, leaf2, green.astype(np.float32) * .48)
        sky = np.empty_like(a)
        sky[..., 0] = r * .90
        sky[..., 1] = g * 1.015
        sky[..., 2] = np.minimum(1.0, b * 1.045)
        a = blend(a, sky, skyblue.astype(np.float32) * .22)
        if not night:
            a = np.clip((a - .50) * 1.055 + .50, 0, 1)

    elif season == "autumn":
        # Greens of the trees and hedgerows become autumn gold / copper,
        # while the original garden bridge, river and house remain familiar.
        warm = np.empty_like(a)
        warm[..., 0] = np.minimum(.99, luminance * 1.34 + .06)
        warm[..., 1] = luminance * (.82 if not night else .68) + .012
        warm[..., 2] = luminance * (.36 if not night else .43)
        a = blend(a, warm, green.astype(np.float32) * (.86 if not night else .75))
        blossom = np.empty_like(a)
        blossom[..., 0] = np.minimum(.99, luminance * 1.27 + .065)
        blossom[..., 1] = luminance * .68
        blossom[..., 2] = luminance * .31
        a = blend(a, blossom, pink.astype(np.float32) * .90)
        if not night:
            # Warm late-afternoon daylight without repainting the background.
            a[..., 0] = np.minimum(1.0, a[..., 0] * 1.035)
            a[..., 2] *= .945

    elif season == "winter":
        # Frost the cherry blossom branches, meadows and hill greenery,
        # retaining the cabin, timber bridge, creek and moon/sun positions.
        frost = np.empty_like(a)
        if night:
            frost[..., 0] = np.minimum(.94, luminance * .76 + .19)
            frost[..., 1] = np.minimum(.97, luminance * .82 + .23)
            frost[..., 2] = np.minimum(.99, luminance * .92 + .30)
        else:
            frost[..., 0] = np.minimum(1.0, luminance * .35 + .67)
            frost[..., 1] = np.minimum(1.0, luminance * .36 + .70)
            frost[..., 2] = np.minimum(1.0, luminance * .35 + .75)
        a = blend(a, frost, green.astype(np.float32) * (.85 if night else .91))
        bloom = np.empty_like(a)
        if night:
            bloom[..., 0] = np.minimum(1, luminance * .70 + .26)
            bloom[..., 1] = np.minimum(1, luminance * .76 + .35)
            bloom[..., 2] = np.minimum(1, luminance * .76 + .42)
        else:
            bloom[..., 0] = np.minimum(1, luminance * .31 + .72)
            bloom[..., 1] = np.minimum(1, luminance * .30 + .76)
            bloom[..., 2] = np.minimum(1, luminance * .28 + .79)
        a = blend(a, bloom, pink.astype(np.float32) * .95)
        # The moonlit valley keeps its deep blue night contrast.
        if not night:
            a = np.clip((a - .50) * .96 + .52, 0, 1)

    result = Image.fromarray(np.uint8(np.clip(a, 0, 1) * 255), "RGB")
    if season == "winter":
        result = add_snow(result, night)
    elif season == "autumn":
        result = add_autumn_leaves(result, night)
    return result


def add_snow(img: Image.Image, night: bool) -> Image.Image:
    """A touch of static snowy detail; falling snow is layered by the web app."""
    rng = np.random.default_rng(119 if night else 118)
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    painter = ImageDraw.Draw(overlay, "RGBA")
    for i in range(int(w * h / 2100)):
        x = int(rng.integers(0, w))
        y = int(rng.integers(0, h))
        # More visible over the darker sky; delicate crystals near the ground.
        radius = float(rng.choice([.6, .9, 1.3, 1.8, 2.3]))
        alpha = int(rng.integers(65 if night else 90, 190 if night else 215))
        color = (225, 244, 252, alpha) if night else (255, 255, 255, alpha)
        painter.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def add_autumn_leaves(img: Image.Image, night: bool) -> Image.Image:
    rng = np.random.default_rng(212 if night else 211)
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    colors = [(232, 158, 70, 180), (181, 80, 51, 170), (244, 197, 107, 170)]
    for i in range(max(28, w // 28)):
        x = int(rng.integers(0, w))
        y = int(rng.integers(h // 5, h))
        rad = int(rng.integers(2, 7))
        c = colors[i % len(colors)]
        if night:
            c = (c[0] // 2, c[1] // 2, c[2] // 2, 170)
        d.ellipse((x-rad, y-rad, x+rad+3, y+rad), fill=c)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="_site")
    ns = ap.parse_args()
    out = Path(ns.output)
    out.mkdir(parents=True, exist_ok=True)
    for mode in ("day", "night"):
        original = Path(f"garden-{mode}.webp")
        if not original.is_file():
            raise SystemExit(f"Missing original spring illustration: {original}")
        with Image.open(original) as image:
            source = image.convert("RGB")
        for season in ("summer", "autumn", "winter"):
            dest = out / f"garden-{season}-{mode}.webp"
            result = recolor(source, season, mode == "night")
            result.save(dest, format="WEBP", quality=89, method=5)
            if dest.stat().st_size < 20_000:
                raise SystemExit(f"Unexpectedly small output: {dest}")
            print(f"{dest} {result.size[0]}x{result.size[1]} {dest.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
