import sys
from PIL import Image
names = sys.argv[2:]; out = sys.argv[1]
ims = [Image.open(f'shots/{n}.png').convert('RGB') for n in names]
w = 720; cols = 2 if ims[0].width > 1000 else 4
ims = [im.resize((w if im.width > 1000 else 300, int(im.height * ((w if im.width > 1000 else 300) / im.width)))) for im in ims]
cw = ims[0].width; ch = max(i.height for i in ims)
rows = (len(ims) + cols - 1) // cols
M = Image.new('RGB', (cols * cw + (cols - 1) * 12, rows * ch + (rows - 1) * 12), 'white')
for k, im in enumerate(ims):
    M.paste(im, ((k % cols) * (cw + 12), (k // cols) * (ch + 12)))
M.save(out)
