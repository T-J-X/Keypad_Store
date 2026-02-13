import cv2
import numpy as np
import urllib.request
from pathlib import Path

MODELS = {
    "PKP-2200-SI": {
        "url": "http://localhost:3000/assets/source/b0/pkp-2200-si.png",
        "cols": 2,
        "rows": 2,
    },
    "PKP-2300-SI": {
        "url": "http://localhost:3000/assets/source/b0/pkp-2300-si.png",
        "cols": 3,
        "rows": 2,
    },
    "PKP-2400-SI": {
        "url": "http://localhost:3000/assets/source/6f/pkp-2400-si.png",
        "cols": 4,
        "rows": 2,
    },
    "PKP-2500-SI": {
        "url": "http://localhost:3000/assets/source/a5/pkp-2500-si.png",
        "cols": 5,
        "rows": 2,
    },
    "PKP-2600-SI": {
        "url": "http://localhost:3000/assets/source/d7/pkp-2600-si.png",
        "cols": 6,
        "rows": 2,
    },
    "PKP-3500-SI": {
        "url": "http://localhost:3000/assets/source/a2/pkp-3500-si.png",
        "cols": 5,
        "rows": 3,
    },
}

OUT = Path('/Users/terry/keypad-store/.tmp/visual-pass/cv3')
OUT.mkdir(parents=True, exist_ok=True)


def load_image(url: str):
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise RuntimeError(f"Could not decode image: {url}")

    if image.ndim == 3 and image.shape[2] == 4:
        alpha = image[:, :, 3]
        bgr = image[:, :, :3]
        bgr = np.where(alpha[:, :, None] > 0, bgr, 18)
    else:
        bgr = image

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    return bgr, gray


def detect(gray):
    blur = cv2.GaussianBlur(gray, (9, 9), 1.8)

    circles = cv2.HoughCircles(
        blur,
        cv2.HOUGH_GRADIENT,
        dp=1.1,
        minDist=40,
        param1=120,
        param2=26,
        minRadius=24,
        maxRadius=90,
    )

    if circles is None:
        return []

    out = []
    for c in np.round(circles[0]).astype(int):
        out.append((int(c[0]), int(c[1]), int(c[2])))

    # dedupe
    dedup = []
    for x, y, r in out:
        keep = True
        for ex, ey, er in dedup:
            if abs(x - ex) < 8 and abs(y - ey) < 8:
                if r > er:
                    dedup.remove((ex, ey, er))
                    break
                keep = False
                break
        if keep:
            dedup.append((x, y, r))
    return dedup


def kmeans_1d(values, k):
    values = np.array(values, dtype=np.float32).reshape(-1, 1)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 120, 0.2)
    _, labels, centers = cv2.kmeans(values, k, None, criteria, 14, cv2.KMEANS_PP_CENTERS)
    centers = centers.reshape(-1)
    order = np.argsort(centers)
    return centers[order]


def choose_grid(circles, cols, rows):
    expected = cols * rows
    if len(circles) < expected:
        return []

    # Bias toward larger circles (outer button wells)
    circles = sorted(circles, key=lambda c: c[2], reverse=True)[: max(expected * 3, expected)]

    xs = [c[0] for c in circles]
    ys = [c[1] for c in circles]

    x_centers = kmeans_1d(xs, cols)
    y_centers = kmeans_1d(ys, rows)

    used = set()
    slots = []
    for yi, yc in enumerate(y_centers):
        row_candidates = [
            (i, c) for i, c in enumerate(circles)
            if i not in used and abs(c[1] - yc) < (max(28, abs(y_centers[1]-y_centers[0]) * 0.28) if rows > 1 else 1000)
        ]

        for xi, xc in enumerate(x_centers):
            best_i = None
            best_score = 1e18
            for i, c in row_candidates:
                if i in used:
                    continue
                dx = c[0] - xc
                dy = c[1] - yc
                score = dx * dx + dy * dy
                if score < best_score:
                    best_score = score
                    best_i = i
            if best_i is None:
                continue
            used.add(best_i)
            slots.append((yi, xi, circles[best_i]))

    if len(slots) != expected:
        return []

    slots.sort(key=lambda s: (s[0], s[1]))
    return slots


for model, meta in MODELS.items():
    bgr, gray = load_image(meta['url'])
    circles = detect(gray)
    slots = choose_grid(circles, meta['cols'], meta['rows'])
    if not slots:
        print(f"\n{model}: could not detect full grid reliably ({len(circles)} candidates)")
        continue

    h, w = gray.shape
    print(f"\n{model} ({w}x{h})")

    vis = bgr.copy()
    radii = []
    idx = 1
    for _, _, (x, y, r) in slots:
        radii.append(r)
        cx = x / w
        cy = y / h
        size_pct = (r * 2 / w) * 100
        print(f"slot_{idx}: cx={cx:.4f} cy={cy:.4f} sizePct={size_pct:.2f} r={r}")
        cv2.circle(vis, (x, y), r, (0, 255, 0), 2)
        cv2.circle(vis, (x, y), 2, (0, 0, 255), 3)
        idx += 1

    med = np.median(radii)
    print(f"median sizePct={(med*2/w)*100:.2f}")

    cv2.imwrite(str(OUT / f"{model.lower()}-slots.png"), vis)

print(f"\nWrote overlays to {OUT}")
