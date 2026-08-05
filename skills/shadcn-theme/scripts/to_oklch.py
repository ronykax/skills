#!/usr/bin/env python3
"""Convert any CSS color to OKLCH via ColorAide."""

from __future__ import annotations

import argparse
import sys

from coloraide import Color


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert any CSS color (hex, rgb, hsl, named, etc.) to OKLCH."
    )
    parser.add_argument(
        "color",
        help='Color string, e.g. #1d9bf0, rgb(29 155 240), hsl(203 89% 53%), tomato.',
    )
    args = parser.parse_args()

    try:
        print(Color(args.color).convert("oklch").to_string())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
