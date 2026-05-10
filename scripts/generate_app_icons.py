from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "src-tauri" / "icons"
PUBLIC_DIR = ROOT / "public"


def rounded_box(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def blur_shadow(size, box, radius, fill, offset, blur):
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shifted = (
        box[0] + offset[0],
        box[1] + offset[1],
        box[2] + offset[0],
        box[3] + offset[1],
    )
    shadow_draw.rounded_rectangle(shifted, radius=radius, fill=fill)
    return shadow.filter(ImageFilter.GaussianBlur(blur))


def line(draw, points, fill, width):
    draw.line(points, fill=fill, width=width, joint="curve")


def draw_person(draw, cx, cy, scale, body_color, size):
    head_r = int(size * 0.031 * scale)
    draw.ellipse((cx - head_r, cy - head_r, cx + head_r, cy + head_r), fill=body_color)
    body_box = (
        cx - int(size * 0.052 * scale),
        cy + int(size * 0.022 * scale),
        cx + int(size * 0.052 * scale),
        cy + int(size * 0.108 * scale),
    )
    draw.rounded_rectangle(body_box, radius=int(size * 0.02 * scale), fill=body_color)


def draw_app_icon(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (248, 249, 253, 255))
    draw = ImageDraw.Draw(canvas)

    blue_border = (194, 204, 223, 255)
    blue_mid = (120, 140, 171, 255)
    blue_dark = (66, 84, 112, 255)
    blue_shadow = (69, 86, 114, 52)
    blue_soft = (220, 226, 238, 255)
    paper = (255, 255, 255, 255)
    gold = (225, 190, 118, 255)
    gold_soft = (238, 214, 161, 255)

    outer_pad = int(size * 0.085)
    outer_box = (outer_pad, outer_pad, size - outer_pad, size - outer_pad)
    outer_radius = int(size * 0.115)

    canvas.alpha_composite(
        blur_shadow(
            canvas.size,
            outer_box,
            outer_radius,
            (170, 180, 204, 58),
            (0, int(size * 0.018)),
            max(12, size // 18),
        )
    )
    rounded_box(draw, outer_box, outer_radius, fill=(249, 250, 253, 255), outline=blue_border, width=max(3, size // 110))

    card_box = (
        int(size * 0.22),
        int(size * 0.19),
        int(size * 0.72),
        int(size * 0.79),
    )
    card_radius = int(size * 0.04)
    canvas.alpha_composite(
        blur_shadow(
            canvas.size,
            card_box,
            card_radius,
            blue_shadow,
            (0, int(size * 0.02)),
            max(10, size // 22),
        )
    )
    rounded_box(draw, card_box, card_radius, fill=paper)

    fold_w = int(size * 0.12)
    fold_h = int(size * 0.12)
    fold_top = (card_box[2] - fold_w, card_box[1], card_box[2], card_box[1] + fold_h)
    draw.polygon(
        [
            (fold_top[0], fold_top[1]),
            (fold_top[2], fold_top[3]),
            (fold_top[2], fold_top[1]),
        ],
        fill=(245, 247, 251, 255),
    )
    line(draw, [(fold_top[0], fold_top[1]), (fold_top[2], fold_top[3]), (fold_top[2], fold_top[3])], blue_soft, max(2, size // 180))

    avatar_box = (
        int(size * 0.265),
        int(size * 0.255),
        int(size * 0.43),
        int(size * 0.425),
    )
    rounded_box(draw, avatar_box, int(size * 0.028), fill=(241, 244, 249, 255), outline=(180, 191, 214, 255), width=max(2, size // 150))
    draw.ellipse(
        (
            int(size * 0.315),
            int(size * 0.292),
            int(size * 0.377),
            int(size * 0.355),
        ),
        fill=blue_mid,
    )
    draw.pieslice(
        (
            int(size * 0.292),
            int(size * 0.352),
            int(size * 0.402),
            int(size * 0.446),
        ),
        180,
        360,
        fill=blue_mid,
    )

    text_width = max(4, size // 44)
    text_rows = (
        (0.475, 0.33, 0.59),
        (0.475, 0.385, 0.66),
    )
    for start_x, row_y, end_x in text_rows:
        line(
            draw,
            [(int(size * start_x), int(size * row_y)), (int(size * end_x), int(size * row_y))],
            blue_mid,
            text_width,
        )

    check_rows = (0.47, 0.585, 0.7)
    for row_y in check_rows:
        check_box = (
            int(size * 0.265),
            int(size * row_y),
            int(size * 0.335),
            int(size * (row_y + 0.07)),
        )
        rounded_box(draw, check_box, int(size * 0.015), fill=(229, 234, 243, 255))
        line(
            draw,
            [
                (int(size * 0.282), int(size * (row_y + 0.038))),
                (int(size * 0.299), int(size * (row_y + 0.055))),
                (int(size * 0.325), int(size * (row_y + 0.02))),
            ],
            blue_mid,
            max(3, size // 70),
        )
        line(
            draw,
            [(int(size * 0.366), int(size * (row_y + 0.026))), (int(size * 0.463), int(size * (row_y + 0.026)))],
            blue_mid,
            max(3, size // 60),
        )
        line(
            draw,
            [(int(size * 0.366), int(size * (row_y + 0.061))), (int(size * 0.44), int(size * (row_y + 0.061)))],
            blue_mid,
            max(3, size // 60),
        )

    lens_center = (int(size * 0.622), int(size * 0.615))
    lens_radius = int(size * 0.158)
    lens_box = (
        lens_center[0] - lens_radius,
        lens_center[1] - lens_radius,
        lens_center[0] + lens_radius,
        lens_center[1] + lens_radius,
    )
    canvas.alpha_composite(
        blur_shadow(
            canvas.size,
            lens_box,
            lens_radius,
            (60, 78, 108, 60),
            (int(size * 0.01), int(size * 0.02)),
            max(10, size // 22),
        )
    )
    draw.ellipse(lens_box, fill=blue_dark)
    inner_ring = int(lens_radius * 0.14)
    draw.ellipse(
        (
            lens_box[0] + inner_ring,
            lens_box[1] + inner_ring,
            lens_box[2] - inner_ring,
            lens_box[3] - inner_ring,
        ),
        fill=(251, 252, 255, 255),
        outline=(132, 149, 178, 255),
        width=max(2, size // 120),
    )

    draw_person(draw, int(size * 0.621), int(size * 0.59), 1.05, gold, size)
    draw_person(draw, int(size * 0.545), int(size * 0.618), 0.66, (207, 214, 229, 255), size)
    draw_person(draw, int(size * 0.697), int(size * 0.618), 0.66, (207, 214, 229, 255), size)

    handle_shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    handle_shadow_draw = ImageDraw.Draw(handle_shadow)
    handle_shadow_draw.line(
        [(int(size * 0.765), int(size * 0.77)), (int(size * 0.865), int(size * 0.87))],
        fill=(67, 84, 112, 80),
        width=max(20, size // 13),
    )
    handle_shadow = handle_shadow.filter(ImageFilter.GaussianBlur(max(6, size // 34)))
    canvas.alpha_composite(handle_shadow)

    handle = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    handle_draw = ImageDraw.Draw(handle)
    handle_draw.line(
        [(int(size * 0.75), int(size * 0.754)), (int(size * 0.845), int(size * 0.85))],
        fill=gold_soft,
        width=max(12, size // 26),
    )
    handle_draw.line(
        [(int(size * 0.79), int(size * 0.79)), (int(size * 0.89), int(size * 0.89))],
        fill=blue_dark,
        width=max(26, size // 12),
    )
    handle = handle.filter(ImageFilter.GaussianBlur(max(1, size // 190)))
    canvas.alpha_composite(handle)

    return canvas


def save_png(image: Image.Image, path: Path, size: int):
    image.resize((size, size), Image.Resampling.LANCZOS).save(path, format="PNG")


def write_svg():
    svg = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#F8F9FD"/>
  <rect x="44" y="44" width="424" height="424" rx="56" fill="#F9FAFD" stroke="#C2CCDF" stroke-width="10"/>
  <rect x="112" y="96" width="256" height="308" rx="24" fill="white"/>
  <path d="M320 96H368V144L320 96Z" fill="#F5F7FB"/>
  <rect x="134" y="130" width="84" height="84" rx="18" fill="#F1F4F9" stroke="#B4BFD6" stroke-width="4"/>
  <circle cx="176" cy="165" r="21" fill="#788CAB"/>
  <path d="M136 214C136 186.386 158.386 164 186 164H166C138.386 164 116 186.386 116 214V214H136Z" fill="#788CAB" transform="translate(20 12)"/>
  <rect x="234" y="162" width="76" height="13" rx="6.5" fill="#788CAB"/>
  <rect x="234" y="201" width="112" height="13" rx="6.5" fill="#788CAB"/>
  <rect x="134" y="240" width="42" height="42" rx="10" fill="#E5EAF3"/>
  <path d="M145 261L157 274L171 255" stroke="#788CAB" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="187" y="252" width="69" height="12" rx="6" fill="#788CAB"/>
  <rect x="187" y="281" width="53" height="12" rx="6" fill="#788CAB"/>
  <rect x="134" y="299" width="42" height="42" rx="10" fill="#E5EAF3"/>
  <path d="M145 320L157 333L171 314" stroke="#788CAB" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="187" y="311" width="64" height="12" rx="6" fill="#788CAB"/>
  <rect x="187" y="340" width="53" height="12" rx="6" fill="#788CAB"/>
  <rect x="134" y="358" width="42" height="42" rx="10" fill="#E5EAF3"/>
  <path d="M145 379L157 392L171 373" stroke="#788CAB" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="187" y="370" width="72" height="12" rx="6" fill="#788CAB"/>
  <rect x="187" y="399" width="57" height="12" rx="6" fill="#788CAB"/>
  <circle cx="318" cy="315" r="81" fill="#425470"/>
  <circle cx="318" cy="315" r="68" fill="#FBFCFF" stroke="#8495B2" stroke-width="4"/>
  <circle cx="318" cy="292" r="22" fill="#E1BE76"/>
  <rect x="287" y="320" width="62" height="47" rx="16" fill="#E1BE76"/>
  <circle cx="274" cy="316" r="14" fill="#CFD6E5"/>
  <rect x="254" y="336" width="40" height="31" rx="12" fill="#CFD6E5"/>
  <circle cx="362" cy="316" r="14" fill="#CFD6E5"/>
  <rect x="342" y="336" width="40" height="31" rx="12" fill="#CFD6E5"/>
  <path d="M387 385L436 434" stroke="#ECD6A1" stroke-width="18" stroke-linecap="round"/>
  <path d="M402 400L465 463" stroke="#425470" stroke-width="32" stroke-linecap="round"/>
</svg>
"""
    (PUBLIC_DIR / "talentiq-icon.svg").write_text(svg, encoding="utf-8")


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    master = draw_app_icon(1024)

    save_png(master, ICON_DIR / "32x32.png", 32)
    save_png(master, ICON_DIR / "128x128.png", 128)
    save_png(master, ICON_DIR / "128x128@2x.png", 256)
    save_png(master, ICON_DIR / "icon.png", 512)
    save_png(master, ICON_DIR / "Square30x30Logo.png", 30)
    save_png(master, ICON_DIR / "Square44x44Logo.png", 44)
    save_png(master, ICON_DIR / "Square71x71Logo.png", 71)
    save_png(master, ICON_DIR / "Square89x89Logo.png", 89)
    save_png(master, ICON_DIR / "Square107x107Logo.png", 107)
    save_png(master, ICON_DIR / "Square142x142Logo.png", 142)
    save_png(master, ICON_DIR / "Square150x150Logo.png", 150)
    save_png(master, ICON_DIR / "Square284x284Logo.png", 284)
    save_png(master, ICON_DIR / "Square310x310Logo.png", 310)
    save_png(master, ICON_DIR / "StoreLogo.png", 50)

    master.resize((256, 256), Image.Resampling.LANCZOS).save(
        ICON_DIR / "icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    master.resize((512, 512), Image.Resampling.LANCZOS).save(ICON_DIR / "icon.icns")
    write_svg()


if __name__ == "__main__":
    main()
