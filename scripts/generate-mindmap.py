#!/usr/bin/env python3
"""Generate vertical-flow mindmap SVG. Usage: python3 scripts/generate-mindmap.py seq2

SVG uses CSS variables (--mm-*) for light/dark mode when inlined via Mindmap.vue.
"""

import sys
from pathlib import Path

PRESETS = {
    "seq4": {
        "root": ("아르다찬드라사나", "목표자세 · 빈야사"),
        "steps": [
            ("수카사나", "전굴 · 측면"),
            ("사상가사나", "롤업 · 등·어깨"),
            ("다운독", "계단타기 · 워밍업"),
            ("테이블", "측면 열기"),
            ("태양경배", "수리야나마스카라"),
            ("빌드업 1", "우티타 트리코나"),
            ("빌드업 2", "호흡 · 시퀀스"),
        ],
        "peak": ("아르다찬드라사나", "균형 · 옆구리"),
    },
    "seq3": {
        "root": ("다운독", "목표자세 · 빈야사"),
        "steps": [
            ("수카사나", "전굴 · 측면"),
            ("사상가사나", "롤업 · 등·어깨"),
        ],
        "peak": ("다운독", "손 멀리 · 엉덩이 높게"),
    },
    "seq2": {
        "root": ("우파비스타코나사나", "목표자세 · 힐링"),
        "steps": [
            ("수카사나", "워밍업"),
            ("받다코나사나", "엉덩이살 · 날개짓"),
            ("A사이드", "단다 ~ 파스치모"),
            ("테이블", "30분"),
            ("로우런지", "35분"),
            ("블럭 시팅", "40분"),
        ],
        "peak": ("우파비스타코나사나", "45분 · 최종"),
        "finishing": ("피니싱", "사바사나"),
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


def build_svg(root, steps, peak, finishing=None):
    W, box_w = 380, 320
    x = (W - box_w) // 2
    h_root, h_step, line_h, gap_top = 64, 58, 20, 24
    extra = (line_h + h_step) if finishing else 0
    total_h = gap_top + h_root + len(steps) * (line_h + h_step) + line_h + h_step + extra + 24
    cx = W // 2
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" class="sequence-mindmap" viewBox="0 0 {W} {total_h}" font-family="system-ui, sans-serif">',
        f'<rect width="{W}" height="{total_h}" fill="var(--mm-bg)"/>',
        f'<rect x="{x}" y="{gap_top}" width="{box_w}" height="{h_root}" rx="12" fill="var(--mm-root-fill)" stroke="var(--mm-root-stroke)" stroke-width="1.5"/>',
        f'<text x="{cx}" y="{gap_top+26}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--mm-root-title)">{root[0]}</text>',
        f'<text x="{cx}" y="{gap_top+48}" text-anchor="middle" font-size="12" fill="var(--mm-root-sub)">{root[1]}</text>',
    ]
    cy = gap_top + h_root
    for title, sub in steps:
        cy += line_h
        lines += [
            f'<line x1="{cx}" y1="{cy-line_h}" x2="{cx}" y2="{cy}" stroke="var(--mm-line)" stroke-width="1.5"/>',
            f'<rect x="{x}" y="{cy}" width="{box_w}" height="{h_step}" rx="10" fill="var(--mm-step-fill)" stroke="var(--mm-step-stroke)" stroke-width="1"/>',
            f'<text x="{cx}" y="{cy+24}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--mm-step-title)">{title}</text>',
            f'<text x="{cx}" y="{cy+44}" text-anchor="middle" font-size="11" fill="var(--mm-step-sub)">{sub}</text>',
        ]
        cy += h_step
    cy += line_h
    lines += [
        f'<line x1="{cx}" y1="{cy-line_h}" x2="{cx}" y2="{cy}" stroke="var(--mm-line)" stroke-width="1.5"/>',
        f'<rect x="{x}" y="{cy}" width="{box_w}" height="{h_step}" rx="10" fill="var(--mm-peak-fill)" stroke="var(--mm-peak-stroke)" stroke-width="2"/>',
        f'<text x="{cx}" y="{cy+24}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--mm-peak-title)">{peak[0]}</text>',
        f'<text x="{cx}" y="{cy+44}" text-anchor="middle" font-size="11" fill="var(--mm-peak-sub)">{peak[1]}</text>',
    ]
    cy += h_step
    if finishing:
        cy += line_h
        lines += [
            f'<line x1="{cx}" y1="{cy-line_h}" x2="{cx}" y2="{cy}" stroke="var(--mm-line)" stroke-width="1.5"/>',
            f'<rect x="{x}" y="{cy}" width="{box_w}" height="{h_step}" rx="10" fill="var(--mm-step-fill)" stroke="var(--mm-step-stroke)" stroke-width="1"/>',
            f'<text x="{cx}" y="{cy+24}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--mm-step-title)">{finishing[0]}</text>',
            f'<text x="{cx}" y="{cy+44}" text-anchor="middle" font-size="11" fill="var(--mm-step-sub)">{finishing[1]}</text>',
        ]
    lines += ['</svg>']
    return '\n'.join(lines)


def main():
    key = sys.argv[1] if len(sys.argv) > 1 else "seq2"
    if key not in PRESETS:
        print(f"Unknown preset: {key}. Available: {', '.join(PRESETS)}")
        sys.exit(1)
    p = PRESETS[key]
    out = Path(__file__).parent.parent / "public" / "mindmaps" / f"{key}-mindmap.svg"
    out.write_text(build_svg(p["root"], p["steps"], p["peak"], p.get("finishing")), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
