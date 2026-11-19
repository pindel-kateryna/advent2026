#!/usr/bin/env python3
"""Build compact WebP assets from read-only illustration originals (Pillow)."""
import json
from pathlib import Path
try:
    from PIL import Image, ImageOps, features
except ImportError:
    raise SystemExit('Install scripts/requirements-assets.txt in a virtual environment first.')
ROOT = Path(__file__).resolve().parents[1]

def main():
    if not features.check('webp'):
        raise SystemExit('This Pillow installation needs WebP support.')
    manifest_path = ROOT / 'scripts/assets.json'
    manifest = json.loads(manifest_path.read_text())
    before = after = 0
    for entry in manifest:
        source, output = ROOT / entry['source'], ROOT / entry['output']
        output.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
            image.thumbnail((entry['maxSize'], entry['maxSize']), Image.Resampling.LANCZOS)
            alpha = image.getchannel('A').tobytes() if image.mode == 'RGBA' else None
            entry['width'], entry['height'] = image.size
            entry['alpha'] = bool(alpha is not None and image.getchannel('A').getextrema()[0] < 255)
            image.save(output, 'WEBP', quality=entry.get('quality', 90), method=6, exact=True)
            with Image.open(output) as check:
                if check.size != image.size:
                    raise RuntimeError(f'Image dimensions changed: {output}')
                if alpha is not None and check.convert('RGBA').getchannel('A').tobytes() != alpha:
                    raise RuntimeError(f'Alpha channel changed: {output}')
        before += source.stat().st_size
        after += output.stat().st_size
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Built {len(manifest)} images: source {before/1024**2:.1f} MiB -> WebP {after/1024**2:.2f} MiB; alpha verified.')
if __name__ == '__main__':
    main()
