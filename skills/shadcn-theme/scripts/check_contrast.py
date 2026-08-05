#!/usr/bin/env python3
"""Check WCAG contrast for semantic text pairs in a shadcn theme."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import tinycss2
from coloraide import Color


def declarations(css: str, *, want_dark: bool) -> dict[str, str]:
    """Return --* custom properties from the :root or .dark theme block."""
    best: dict[str, str] | None = None
    best_count = -1

    for rule in tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True):
        if rule.type != "qualified-rule":
            continue
        selector = tinycss2.serialize(rule.prelude).strip()
        is_dark = ".dark" in selector
        is_root = ":root" in selector
        if want_dark and not is_dark:
            continue
        if not want_dark and (not is_root or is_dark):
            continue

        props: dict[str, str] = {}
        for node in tinycss2.parse_declaration_list(
            rule.content, skip_comments=True, skip_whitespace=True
        ):
            if node.type == "declaration" and node.name.startswith("--"):
                props[node.name[2:]] = tinycss2.serialize(node.value).strip()
        if len(props) > best_count:
            best, best_count = props, len(props)

    mode = "dark" if want_dark else "light"
    if best is None:
        raise ValueError(f"could not find {mode} theme block")
    return best


def parse_colors(props: dict[str, str]) -> dict[str, Color]:
    colors: dict[str, Color] = {}
    for name, value in props.items():
        try:
            colors[name] = Color(value)
        except Exception:
            continue
    return colors


def text_pairs(colors: dict[str, Color]) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    if "background" in colors and "foreground" in colors:
        pairs.append(("background", "foreground"))
    for name in sorted(colors):
        if name.endswith("-foreground"):
            surface = name[: -len("-foreground")]
            if surface in colors:
                pairs.append((surface, name))
    if "muted-foreground" in colors and "background" in colors:
        pairs.append(("background", "muted-foreground"))
    # de-dupe while preserving order
    seen: set[tuple[str, str]] = set()
    unique: list[tuple[str, str]] = []
    for pair in pairs:
        if pair not in seen:
            seen.add(pair)
            unique.append(pair)
    return unique


def contrast_ratio(foreground: Color, surface: Color, canvas: Color) -> float:
    background = Color.layer([surface, canvas])
    text = Color.layer([foreground, background])
    return text.contrast(background)


def check_mode(mode: str, colors: dict[str, Color], *, strict: bool) -> tuple[list[str], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    reports: list[str] = []
    canvas = colors.get("background")
    if canvas is None:
        return errors, warnings, reports

    for surface_name, foreground_name in text_pairs(colors):
        ratio = contrast_ratio(colors[foreground_name], colors[surface_name], canvas)
        reports.append(f"{mode}: --{foreground_name} on --{surface_name}: {ratio:.2f}:1")
        if ratio < 3:
            errors.append(
                f"{mode}: --{foreground_name} on --{surface_name} is "
                f"{ratio:.2f}:1; below the 3:1 large-text floor "
                f"(normal text needs 4.5:1)"
            )
        elif ratio < 4.5:
            message = (
                f"{mode}: --{foreground_name} on --{surface_name} is "
                f"{ratio:.2f}:1; normal text needs 4.5:1"
            )
            (errors if strict else warnings).append(message)
    return errors, warnings, reports


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check WCAG contrast for semantic text pairs in a theme CSS."
    )
    parser.add_argument("path", help="Theme CSS path, or - to read from stdin.")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail when text contrast is below 4.5:1.",
    )
    args = parser.parse_args()

    try:
        css = sys.stdin.read() if args.path == "-" else Path(args.path).read_text(encoding="utf-8")
        light = parse_colors(declarations(css, want_dark=False))
        dark = parse_colors(declarations(css, want_dark=True))
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    errors: list[str] = []
    warnings: list[str] = []
    reports: list[str] = []
    for mode, colors in (("light", light), ("dark", dark)):
        e, w, r = check_mode(mode, colors, strict=args.strict)
        errors.extend(e)
        warnings.extend(w)
        reports.extend(r)

    print(f"Parsed color tokens: light={len(light)}, dark={len(dark)}")
    print("Contrast checks:")
    for report in reports:
        print(f"  {report}")
    for warning in warnings:
        print(f"WARNING: {warning}")

    if errors:
        print(f"\nFAILED with {len(errors)} error(s):", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if warnings:
        print(f"\nPASS with {len(warnings)} warning(s): review text-pair warnings above.")
    else:
        print("\nPASS: checked semantic text pairs passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
