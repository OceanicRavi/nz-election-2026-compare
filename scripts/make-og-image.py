from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#241f38")
draw = ImageDraw.Draw(img)

# Sunset gradient, matching the site's hero background
stops = [
    (0.00, (255, 177, 92)),
    (0.14, (255, 138, 61)),
    (0.30, (242, 98, 46)),
    (0.46, (200, 90, 94)),
    (0.62, (154, 79, 122)),
    (0.78, (104, 68, 119)),
    (0.92, (58, 47, 82)),
    (1.00, (36, 31, 56)),
]

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

for y in range(H):
    t = y / H
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t0 <= t <= t1:
            local_t = (t - t0) / (t1 - t0) if t1 > t0 else 0
            color = lerp(c0, c1, local_t)
            draw.line([(0, y), (W, y)], fill=color)
            break

bold = ImageFont.truetype("/c/Windows/Fonts/segoeuib.ttf", 64)
regular = ImageFont.truetype("/c/Windows/Fonts/segoeui.ttf", 30)
small = ImageFont.truetype("/c/Windows/Fonts/segoeuib.ttf", 22)

draw.text((70, 70), "NZ ELECTION 2026", font=small, fill=(255, 255, 255, 230))
draw.text((70, 150), "Know the parties.", font=bold, fill="white")
draw.text((70, 230), "Understand the plan.", font=bold, fill="white")
draw.text((70, 310), "Vote with confidence.", font=bold, fill="white")
draw.text((70, 410), "Compare all 7 major parties across 14 policy domains", font=regular, fill=(255, 255, 255, 220))
draw.text((70, 450), "— explained like you're 15.", font=regular, fill=(255, 255, 255, 220))

img.save("assets/og-image.png")
print("wrote assets/og-image.png", img.size)
