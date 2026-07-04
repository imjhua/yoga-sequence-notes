#!/usr/bin/env python3
"""Generate vertical-flow mindmap SVG. Usage: python3 scripts/generate-mindmap.py seq1"""

import sys
from pathlib import Path

PRESETS = {
    "seq1": {
        "root": ("사마코나사나", "목표자세 · 골반 움직임"),
        "steps": [
            ("수카사나", "어깨 · 가슴 이완"),
            ("받다코나사나", "고관절 · 서혜부 스트레칭"),
            ("파르바타", "척추 신장"),
            ("엎드려서", "고관절 이완"),
            ("블록 · 다리 뻗기", "햄스트링 스트레칭"),
            ("블록 · 바즈라사나", "발목 · 허벅지 앞쪽"),
            ("무릎산", "고관절 비틀기"),
            ("한쪽다리 뒤 · 발등", "고관절 · 옆구리 비틀기"),
        ],
        "peak": ("사마코나사나", "피크 — 내전근 · 햄스트링 이완"),
    },
    "seq0": {
        "root": ("우르드바 다누라사나", "목표자세 · 등 · 고관절"),
        "steps": [
            ("시팅", "손목 · 어깨 워밍업"),
            ("받다코나 · 시팅", "몸 앞면 깨우기"),
            ("빌드업", "백벤드 준비"),
            ("스탠딩", "휠 준비 동작"),
        ],
        "peak": ("우르드바 다누라사나", "피크 — 발바닥 · 등 힘"),
    },
}


def build_svg(root, steps, peak):
    W, box_w = 380, 320
    x = (W - box_w) // 2
    h_root, h_step, line_h, gap_top = 64, 58, 20, 24
    total_h = gap_top + h_root + len(steps) * (line_h + h_step) + line_h + h_step + 24
    cx = W // 2
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {total_h}" font-family="system-ui, sans-serif">',
        f'<rect width="{W}" height="{total_h}" fill="#FAFAF8"/>',
        f'<rect x="{x}" y="{gap_top}" width="{box_w}" height="{h_root}" rx="12" fill="#EDE9FE" stroke="#8B5CF6" stroke-width="2"/>',
        f'<text x="{cx}" y="{gap_top+26}" text-anchor="middle" font-size="16" font-weight="700" fill="#5B21B6">{root[0]}</text>',
        f'<text x="{cx}" y="{gap_top+48}" text-anchor="middle" font-size="12" fill="#7C3AED">{root[1]}</text>',
    ]
    cy = gap_top + h_root
    for title, sub in steps:
        cy += line_h
        lines += [
            f'<line x1="{cx}" y1="{cy-line_h}" x2="{cx}" y2="{cy}" stroke="#A8A29E" stroke-width="2"/>',
            f'<rect x="{x}" y="{cy}" width="{box_w}" height="{h_step}" rx="10" fill="#DCFCE7" stroke="#4ADE80" stroke-width="1.5"/>',
            f'<text x="{cx}" y="{cy+24}" text-anchor="middle" font-size="14" font-weight="600" fill="#166534">{title}</text>',
            f'<text x="{cx}" y="{cy+44}" text-anchor="middle" font-size="11" fill="#15803D">{sub}</text>',
        ]
        cy += h_step
    cy += line_h
    lines += [
        f'<line x1="{cx}" y1="{cy-line_h}" x2="{cx}" y2="{cy}" stroke="#A8A29E" stroke-width="2"/>',
        f'<rect x="{x}" y="{cy}" width="{box_w}" height="{h_step}" rx="10" fill="#FFEDD5" stroke="#F97316" stroke-width="2"/>',
        f'<text x="{cx}" y="{cy+24}" text-anchor="middle" font-size="14" font-weight="700" fill="#9A3412">{peak[0]}</text>',
        f'<text x="{cx}" y="{cy+44}" text-anchor="middle" font-size="11" fill="#C2410C">{peak[1]}</text>',
        '</svg>',
    ]
    return '\n'.join(lines)


def main():
    key = sys.argv[1] if len(sys.argv) > 1 else "seq1"
    if key not in PRESETS:
        print(f"Unknown preset: {key}. Available: {', '.join(PRESETS)}")
        sys.exit(1)
    p = PRESETS[key]
    out = Path(__file__).parent.parent / "public" / "mindmaps" / f"{key}-mindmap.svg"
    out.write_text(build_svg(p["root"], p["steps"], p["peak"]), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
