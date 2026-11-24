"""Build the static fonts the share image (src/app/opengraph-image.tsx) uses.

next/og (Satori) needs TTF/OTF/WOFF fonts and doesn't handle variable fonts,
so this pins each family to the one instance the card uses and keeps basic
Latin plus a few symbols. Both fonts are under the SIL Open Font License 1.1
(see src/app/fonts/OFL.txt and public/fonts/OFL-JetBrainsMono.txt).

Usage (needs `pip install fonttools brotli`):
    python scripts/fonts/build_og_fonts.py <JetBrainsMono-latin.woff2>

Sources: our trimmed Archivo variable file, and the latin JetBrains Mono
variable file from Google Fonts (next/font/google downloads it into
.next/static/media during a build).
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "src" / "assets" / "og"
ARCHIVO = ROOT / "src" / "app" / "fonts" / "archivo-variable.woff2"

# Printable ASCII plus the few symbols the card uses.
TEXT = "".join(chr(c) for c in range(0x20, 0x7F)) + "·→●—Ø"


def build(source: Path, axes: dict, out: Path) -> None:
    font = TTFont(source)
    font = instancer.instantiateVariableFont(font, axes)
    options = subset.Options()
    options.layout_features = ["kern", "liga"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=TEXT)
    subsetter.subset(font)
    font.flavor = None  # plain TTF for Satori
    out.parent.mkdir(parents=True, exist_ok=True)
    font.save(out)
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


def main(jetbrains: str) -> None:
    build(ARCHIVO, {"wght": 800, "wdth": 125}, OUT_DIR / "archivo-800-expanded.ttf")
    build(Path(jetbrains), {"wght": 500}, OUT_DIR / "jetbrains-mono-500.ttf")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
