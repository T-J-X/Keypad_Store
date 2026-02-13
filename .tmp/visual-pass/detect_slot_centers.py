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

OUT = Path('/Users/terry/keypad-store/.tmp/visual-pass/cv')
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
        mask = alpha > 0
        background = np.zeros_like(bgr)
        background[:] = 18
        bgr = np.where(mask[:, :, None], bgr, background)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image, gray


def detect_circles(gray):
    blurred = cv2.GaussianBlur(gray, (7, 7), 1.4)

    # Run a few Hough passes and merge candidates.
    all_circles = []
    passes = [
        (1.2, 28, 120, 26, 20, 80),
        (1.15, 24, 110, 24, 18, 85),
        (1.3, 30, 140, 30, 24, 90),
    ]
    for dp, min_dist, p1, p2, rmin, rmax in passes:
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=dp,
            minDist=min_dist,
            param1=p1,
            param2=p2,
            minRadius=rmin,
            maxRadius=rmax,
        )
        if circles is None:
            continue
        circles = np.round(circles[0, :]).astype(int)
        for c in circles:
            all_circles.append((int(c[0]), int(c[1]), int(c[2])))

    deduped = []
    for x, y, r in all_circles:
        duplicate = False
        for ex, ey, er in deduped:
            if abs(x - ex) <= 6 and abs(y - ey) <= 6 and abs(r - er) <= 6:
                duplicate = True
                break
        if not duplicate:
            deduped.append((x, y, r))
    return deduped


def kmeans_1d(values, k):
    data = np.array(values, dtype=np.float32).reshape(-1, 1)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 120, 0.2)
    compactness, labels, centers = cv2.kmeans(
        data,
        k,
        None,
        criteria,
        16,
        cv2.KMEANS_PP_CENTERS,
    )
    centers = centers.reshape(-1)
    order = np.argsort(centers)
    centers_sorted = centers[order]
    return centers_sorted


def infer_grid(candidates, cols, rows):
    xs = [x for x, _, _ in candidates]
    ys = [y for _, y, _ in candidates]
    x_centers = kmeans_1d(xs, cols)
    y_centers = kmeans_1d(ys, rows)

    slots = []
    used = set()
    for yi, yc in enumerate(y_centers):
        for xi, xc in enumerate(x_centers):
            best_i = None
            best_d = 1e9
            for i, (x, y, r) in enumerate(candidates):
                if i in used:
                    continue
                d = (x - xc) ** 2 + (y - yc) ** 2
                if d < best_d:
                    best_d = d
                    best_i = i
            if best_i is None:
                continue
            used.add(best_i)
            x, y, r = candidates[best_i]
            slots.append((yi, xi, x, y, r))

    slots.sort(key=lambda row: (row[0], row[1]))
    return x_centers, y_centers, slots


for model, meta in MODELS.items():
    image, gray = load_image(meta["url"])
    candidates = detect_circles(gray)
    if len(candidates) < meta["cols"] * meta["rows"]:
        print(f"{model}: not enough circles ({len(candidates)})")
        continue

    x_centers, y_centers, slots = infer_grid(candidates, meta["cols"], meta["rows"])

    h, w = gray.shape[:2]
    print(f"\n{model} ({w}x{h})")
    print(f"x centers: {[round(float(x), 2) for x in x_centers]}")
    print(f"y centers: {[round(float(y), 2) for y in y_centers]}")

    radii = []
    slot_idx = 1
    for _, _, x, y, r in slots:
        radii.append(r)
        cx = x / w
        cy = y / h
        size_pct = (r * 2 / w) * 100
        print(f"slot_{slot_idx}: cx={cx:.4f} cy={cy:.4f} sizePct={size_pct:.2f} r={r}")
        slot_idx += 1

    median_r = float(np.median(radii)) if radii else 0
    print(f"median radius: {median_r:.2f} px; approx sizePct={(median_r*2/w)*100:.2f}")

    # Visualization
    if image.ndim == 3 and image.shape[2] == 4:
        vis = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    else:
        vis = image.copy()

    for _, _, x, y, r in slots:
        cv2.circle(vis, (x, y), int(r), (0, 255, 0), 2)
        cv2.circle(vis, (x, y), 2, (0, 0, 255), 3)

    cv2.imwrite(str(OUT / f"{model.lower()}-slots.png"), vis)

print(f"\nWrote overlays to {OUT}")
