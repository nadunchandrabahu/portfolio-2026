"""Trim the Archivo variable font to the ranges this site uses.

The Google Fonts latin file covers wght 100-900 and wdth 62-125 (~88 KB).
The site only sets Archivo at weights 500-800 and widths 100-125%, so we
limit both axes. That makes it much smaller and helps mobile LCP.

Usage (needs `pip install fonttools brotli`):
    python scripts/fonts/subset_archivo.py <source.woff2>

Source: the "latin" Archivo variable file from Google Fonts (for example the
one next/font/google downloads into .next/static/media). Archivo is under the
SIL Open Font License 1.1; see src/app/fonts/OFL.txt.
"""

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = Path(__file__).resolve().parents[2] / "src" / "app" / "fonts" / "archivo-variable.woff2"
AXES = {"wght": (500, 800), "wdth": (100, 125)}


def main(source: str) -> None:
    font = TTFont(source)
    limited = instancer.instantiateVariableFont(font, AXES)
    limited.flavor = "woff2"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    limited.save(OUT)
    before = Path(source).stat().st_size
    after = OUT.stat().st_size
    print(f"{OUT.name}: {before / 1024:.1f} KB -> {after / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
