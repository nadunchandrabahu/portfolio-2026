"""Build the tiny JetBrains Mono file used for text engraved on the 3D gearbox.

drei <Text> (troika) needs a TTF/OTF/WOFF file from our own origin. The
gearbox only engraves a few characters (segment numbers 00-06, "EPH 2:8",
"Ø48", "Z=24"), so we pin the weight to 500 and keep just those glyphs.

Usage (needs `pip install fonttools brotli`):
    python scripts/fonts/subset_gearbox_mono.py <JetBrainsMono-latin.woff2>

Source: the latin JetBrains Mono variable file from Google Fonts (for example
the one next/font/google downloads into .next/static/media). JetBrains Mono is
under the SIL Open Font License 1.1; see public/fonts/OFL-JetBrainsMono.txt.
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = Path(__file__).resolve().parents[2] / "public" / "fonts" / "jetbrains-mono-gearbox.ttf"
TEXT = "0123456789 EPHZ:=Ø.-·"


def main(source: str) -> None:
    font = TTFont(source)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": 500})
    options = subset.Options()
    options.layout_features = []
    options.name_IDs = ["*"]
    options.notdef_outline = True
    sub = subset.Subsetter(options)
    sub.populate(text=TEXT)
    sub.subset(font)
    font.flavor = None
    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(OUT)
    print(f"{OUT.name}: {OUT.stat().st_size / 1024:.1f} KB, glyphs: {len(font.getGlyphOrder())}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
