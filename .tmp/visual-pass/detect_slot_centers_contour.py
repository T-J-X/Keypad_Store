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

OUT = Path('/Users/terry/keypad-store/.tmp/visual-pass/cv2')
OUT.mkdir(parents=True, exist_ok=True)


def load_image(url: str):
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    array = np.frombuffer(data, dtype=np.uint8)
    rgba = cv2.imdecode(array, cv2.IMREAD_UNCHANGED)
    if rgba is None:
        raise RuntimeError(f"Could not decode image: {url}")

    if rgba.shape[2] == 4:
        alpha = rgba[:, :, 3]
        bgr = rgba[:, :, :3]
    else:
        alpha = np.full(rgba.shape[:2], 255, dtype=np.uint8)
        bgr = rgba

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    return bgr, gray, alpha


def detect_button_contours(gray, alpha, model_key):
    # Restrict to non-transparent pixels.
    work = gray.copy()
    work[alpha < 8] = 0

    # Detect darker ring structures against mid-tone panel.
    blur = cv2.GaussianBlur(work, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 82, 255, cv2.THRESH_BINARY_INV)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    clean = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    clean = cv2.morphologyEx(clean, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = gray.shape
    min_area = (w * h) * 0.002
    max_area = (w * h) * 0.06

    circles = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area or area > max_area:
            continue

        perimeter = cv2.arcLength(contour, True)
        if perimeter <= 0:
            continue

        circularity = 4 * np.pi * area / (perimeter * perimeter)
        if circularity < 0.55:
            continue

        (x, y), radius = cv2.minEnclosingCircle(contour)
        if radius < 20:
            continue

        # drop tiny false positives near edges
        if x < radius or y < radius or x > (w - radius) or y > (h - radius):
            continue

        circles.append((float(x), float(y), float(radius), float(circularity), float(area)))

    return circles, clean


def select_grid(candidates, cols, rows):
    expected = cols * rows
    if len(candidates) < expected:
        return []

    # Rank by radius first, then circularity.
    ranked = sorted(candidates, key=lambda c: (c[2], c[3]), reverse=True)

    best = []
    for pool_size in range(expected, min(len(ranked), expected * 3) + 1):
        pool = ranked[:pool_size]
        points = np.array([[c[0], c[1]] for c in pool], dtype=np.float32)
        if len(points) < expected:
            continue

        # kmeans with expected centers
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 120, 0.2)
        compactness, labels, centers = cv2.kmeans(
            points,
            expected,
            None,
            criteria,
            12,
            cv2.KMEANS_PP_CENTERS,
        )

        # convert centers to row/col ordering based on y then x
        centers = centers.tolist()
        centers_sorted = sorted(centers, key=lambda p: (p[1], p[0]))

        # assign each center to nearest unused candidate
        used = set()
        picked = []
        for cx, cy in centers_sorted:
            best_i = None
            best_d = 1e18
            for i, c in enumerate(pool):
                if i in used:
                    continue
                d = (c[0] - cx) ** 2 + (c[1] - cy) ** 2
                if d < best_d:
                    best_d = d
                    best_i = i
            if best_i is not None:
                used.add(best_i)
                picked.append(pool[best_i])

        if len(picked) != expected:
            continue

        # Validate grid regularity.
        xs = np.array([p[0] for p in picked], dtype=np.float32)
        ys = np.array([p[1] for p in picked], dtype=np.float32)

        x_centers = cv2.kmeans(xs.reshape(-1, 1), cols, None, criteria, 10, cv2.KMEANS_PP_CENTERS)[2].reshape(-1)
        y_centers = cv2.kmeans(ys.reshape(-1, 1), rows, None, criteria, 10, cv2.KMEANS_PP_CENTERS)[2].reshape(-1)
        x_centers.sort()
        y_centers.sort()

        # Build ordered slots row-major by nearest clusters.
        slots = []
        for yi, yc in enumerate(y_centers):
            row = sorted(picked, key=lambda p: abs(p[1] - yc))[:cols*2]
            row = sorted(row, key=lambda p: p[0])
            # pick nearest per x center
            row_used = set()
            for xi, xc in enumerate(x_centers):
                bi = None
                bd = 1e18
                for i, p in enumerate(row):
                    if i in row_used:
                        continue
                    d = (p[0] - xc) ** 2 + (p[1] - yc) ** 2
                    if d < bd:
                        bd = d
                        bi = i
                if bi is None:
                    continue
                row_used.add(bi)
                slots.append((yi, xi, row[bi]))

        if len(slots) == expected:
            # dedupe by coordinates
            uniq = {(round(s[2][0], 2), round(s[2][1], 2)) for s in slots}
            if len(uniq) == expected:
                return sorted(slots, key=lambda s: (s[0], s[1]))

    return []


def fallback_manual(gray, cols, rows):
    h, w = gray.shape
    # coarse fallback centers if contour fails
    x_start = 0.11
    x_end = 0.89
    y_start = 0.18
    y_end = 0.76

    xs = [x_start + (x_end - x_start) * i / (cols - 1 if cols > 1 else 1) for i in range(cols)]
    ys = [y_start + (y_end - y_start) * j / (rows - 1 if rows > 1 else 1) for j in range(rows)]
    slots = []
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            slots.append((j, i, (x * w, y * h, min(w, h) * 0.06, 1.0, 1.0)))
    return slots


for model, meta in MODELS.items():
    bgr, gray, alpha = load_image(meta['url'])
    circles, mask = detect_button_contours(gray, alpha, model)
    slots = select_grid(circles, meta['cols'], meta['rows'])
    if not slots:
        slots = fallback_manual(gray, meta['cols'], meta['rows'])

    h, w = gray.shape
    print(f"\n{model} ({w}x{h})")

    vis = bgr.copy()
    radii = []

    slot_idx = 1
    for _, _, c in slots:
        x, y, r = float(c[0]), float(c[1]), float(c[2])
        radii.append(r)
        cx = x / w
        cy = y / h
        size_pct = (r * 2 / w) * 100
        print(f"slot_{slot_idx}: cx={cx:.4f} cy={cy:.4f} sizePct={size_pct:.2f}")

        cv2.circle(vis, (int(round(x)), int(round(y))), int(round(r)), (0, 255, 0), 2)
        cv2.circle(vis, (int(round(x)), int(round(y))), 2, (0, 0, 255), 3)
        slot_idx += 1

    med = float(np.median(radii)) if radii else 0.0
    print(f"median sizePct={(med*2/w)*100:.2f}")

    cv2.imwrite(str(OUT / f"{model.lower()}-slots.png"), vis)

print(f"\nWrote overlays to {OUT}")
