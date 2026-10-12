"""Generates the pixel-art app icons (SVG + PNG) from a 16x16 grid.

Usage:  python tools/make-icons.py
No dependencies: PNGs are written with zlib directly.
"""
import os
import struct
import zlib

GRID = [
    "................",
    ".KKKKKKKK.......",
    ".KBBBBBBK.......",
    ".KBLBBLBK.......",
    ".KBBLLBBK.......",
    ".KBLBBKKKKKKKKK.",
    ".KBBLLKWWWWWWWK.",
    ".KBLBBKWRRWRRWK.",
    ".KBBLLKRRRRRRRK.",
    ".KBLBBKRRRRRRRK.",
    ".KKKKKKWRRRRRWK.",
    "......KWWRRRWWK.",
    "......KWWWRWWWK.",
    "......KWWWWWWWK.",
    "......KKKKKKKKK.",
    "................",
]
COLORS = {
    "K": "#1a1626",
    "B": "#3156a8",
    "L": "#6e93e6",
    "W": "#f7f1e3",
    "R": "#d63c3c",
}
BG = "#2f7d4f"

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def write_svg(path):
    rects = []
    for y, row in enumerate(GRID):
        for x, ch in enumerate(row):
            if ch in COLORS:
                rects.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{COLORS[ch]}"/>')
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">'
        f'<rect width="16" height="16" rx="3" fill="{BG}"/>' + "".join(rects) + "</svg>\n"
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)


def write_png(path, size, padding=0.0):
    """padding: fraction of the canvas left as background on each side (for maskable icons)."""
    bg = hex_rgb(BG)
    inner = size * (1 - 2 * padding)
    cell = inner / 16
    off = size * padding
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            gx = int((px - off) // cell)
            gy = int((py - off) // cell)
            c = bg
            if 0 <= gx < 16 and 0 <= gy < 16 and GRID[gy][gx] in COLORS:
                c = hex_rgb(COLORS[GRID[gy][gx]])
            row += bytes(c)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write_svg(os.path.join(OUT, "icon.svg"))
    write_png(os.path.join(OUT, "icon-192.png"), 192)
    write_png(os.path.join(OUT, "icon-512.png"), 512)
    write_png(os.path.join(OUT, "icon-maskable-512.png"), 512, padding=0.12)
    print("icons written to", os.path.abspath(OUT))
