"""Vice-style "loading screen" filter: a classical (no-AI) prototype.

Pipeline: edge-preserving smoothing -> color quantization -> ink outlines
-> sunset color grade -> halftone glow + vignette -> optional poster frame.

Usage: python vice_filter.py input.jpg output.png [--title "TEXT"] [--no-frame]
"""
import argparse

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"


def smooth(img, passes=4):
    out = img
    for _ in range(passes):
        out = cv2.bilateralFilter(out, d=9, sigmaColor=60, sigmaSpace=9)
    return out


def quantize(img, k=14):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    data = lab.reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    q = centers[labels.flatten()].reshape(lab.shape).astype(np.uint8)
    return cv2.cvtColor(q, cv2.COLOR_LAB2BGR)


def ink_lines(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                  cv2.THRESH_BINARY, 13, 9)
    # soften and thin speckle so lines read like brush ink, not noise
    edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    return cv2.GaussianBlur(edges, (3, 3), 0).astype(np.float32) / 255.0


def sunset_grade(img):
    f = img.astype(np.float32) / 255.0
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    lum = lum[..., None]
    shadow = np.array([0.70, 0.45, 0.15])     # BGR teal/indigo
    highlight = np.array([0.35, 0.55, 1.00])  # BGR warm orange
    tint = shadow * (1 - lum) + highlight * lum
    f = np.clip(f * 0.80 + tint * f * 0.50, 0, 1)
    f = f ** 0.82  # lift mids so it reads sunny, not muddy
    # vertical magenta->orange sky gradient, strongest at the top
    h, w = lum.shape[:2]
    y = np.linspace(1, 0, h)[:, None, None]
    sky = np.array([0.75, 0.25, 0.95]) * y + np.array([0.20, 0.55, 1.0]) * (1 - y)
    f = 1 - (1 - f) * (1 - sky * 0.18)  # screen blend
    hsv = cv2.cvtColor(np.clip(f * 255, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
    hsv = hsv.astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.25, 0, 255)
    hsv[..., 2] = np.clip((hsv[..., 2] - 128) * 1.15 + 142, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def glow_and_vignette(img):
    f = img.astype(np.float32) / 255.0
    bright = np.clip(f - 0.7, 0, 1) * 3
    glow = cv2.GaussianBlur(bright, (0, 0), 18)
    f = 1 - (1 - f) * (1 - glow * 0.35)
    h, w = f.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    f *= np.clip(1.1 - 0.35 * d ** 2, 0.5, 1)[..., None]
    return np.clip(f * 255, 0, 255).astype(np.uint8)


def poster_frame(bgr, title):
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    w, h = im.size
    border = max(12, w // 60)
    canvas = Image.new("RGB", (w + border * 2, h + border * 2), (12, 10, 18))
    canvas.paste(im, (border, border))
    d = ImageDraw.Draw(canvas)
    size = w // 11
    font = ImageFont.truetype(FONT, size)
    tw = d.textlength(title, font=font)
    x, y = (canvas.width - tw) / 2, canvas.height - border - size * 1.45
    # gradient-filled title: draw a mask then fill with pink->orange
    mask = Image.new("L", canvas.size, 0)
    md = ImageDraw.Draw(mask)
    md.text((x, y), title, font=font, fill=255)
    grad = Image.new("RGB", canvas.size)
    gd = ImageDraw.Draw(grad)
    for i in range(canvas.height):
        t = min(max((i - y) / size, 0), 1)
        gd.line([(0, i), (canvas.width, i)],
                fill=(255, int(60 + 120 * t), int(170 - 120 * t)))
    d.text((x + 6, y + 6), title, font=font, fill=(10, 8, 20))  # drop shadow
    d.text((x, y), title, font=font, fill=(10, 8, 20),
           stroke_width=max(3, size // 18), stroke_fill=(10, 8, 20))
    canvas.paste(grad, (0, 0), mask)
    return canvas


def run(src, dst, title="VICE CAM", frame=True):
    img = cv2.imread(src)
    h, w = img.shape[:2]
    scale = 1400 / max(h, w)
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    base = smooth(img)
    flat = quantize(base)
    lines = ink_lines(base)[..., None]
    toon = (flat.astype(np.float32) * (0.25 + 0.75 * lines)).astype(np.uint8)
    out = glow_and_vignette(sunset_grade(toon))
    if frame:
        poster_frame(out, title).save(dst)
    else:
        cv2.imwrite(dst, out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--title", default="VICE CAM")
    ap.add_argument("--no-frame", action="store_true")
    a = ap.parse_args()
    run(a.src, a.dst, a.title, not a.no_frame)
