from pathlib import Path
from PIL import Image, ImageDraw


def montage(src, out, cols):
    files = sorted(Path(src).glob("*.png"))
    thumbs = []
    for file in files:
        image = Image.open(file).convert("RGB")
        image.thumbnail((260, 360))
        canvas = Image.new("RGB", (280, 390), "white")
        canvas.paste(image, ((280 - image.width) // 2, 20))
        ImageDraw.Draw(canvas).text((12, 365), file.stem, fill=(30, 30, 30))
        thumbs.append(canvas)
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 280, rows * 390), (235, 240, 246))
    for index, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((index % cols) * 280, (index // cols) * 390))
    sheet.save(out)


montage("output/contest-submission/rendered-plan-final", "output/contest-submission/plan-montage-final.png", 4)
montage("output/contest-submission/rendered-ppt-final", "output/contest-submission/ppt-montage-final.png", 4)
