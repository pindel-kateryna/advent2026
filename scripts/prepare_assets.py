#!/usr/bin/env python3
"""Build smaller site images from untouched originals with macOS sips."""

import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    if not shutil.which("sips"):
        raise SystemExit("Rebuilding images requires macOS sips; the built site works without it.")
    manifest = json.loads((ROOT / "scripts/assets.json").read_text())
    before = after = 0
    for entry in manifest:
        source, output = ROOT / entry["source"], ROOT / entry["output"]
        output.parent.mkdir(parents=True, exist_ok=True)
        if entry.get("copy"):
            shutil.copy2(source, output)
        else:
            args = ["sips", "-Z", str(entry["maxSize"]), "-s", "format", entry["format"]]
            if entry["format"] == "jpeg":
                args += ["-s", "formatOptions", "88"]
            subprocess.run(args + [str(source), "--out", str(output)], check=True, capture_output=True)
        before += source.stat().st_size
        after += output.stat().st_size
    print(f"Built {len(manifest)} images: {before / 1024**2:.1f} → {after / 1024**2:.1f} MiB")


if __name__ == "__main__":
    main()
