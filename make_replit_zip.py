"""Builds wellness_replit.zip for uploading to Replit (see REPLIT_SETUP.md).

Run from this folder after code changes: python make_replit_zip.py
Leaves out installed packages, build output, local databases/secrets and Replit leftovers.
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "wellness_replit.zip")
FILES = [".replit", "start.sh", "REPLIT_SETUP.md"]
FOLDERS = ["wellness_planner", "wellness_frontend"]
# .replit-artifact: Replit's "artifact" settings from the original prototype make Replit run its own
# front-end copy (without the backend) and take over the Run button, so they stay out of the upload.
SKIP_DIRS = {"node_modules", "dist", "instance", "__pycache__", ".pytest_cache", ".venv", ".replit-artifact",
             "attached_assets"}
SKIP_EXT = (".pyc", ".tsbuildinfo", ".sqlite")

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for name in FILES:
        data = open(os.path.join(ROOT, name), "rb").read().replace(b"\r\n", b"\n")
        info = zipfile.ZipInfo(name)
        info.external_attr = (0o755 if name.endswith(".sh") else 0o644) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(info, data)
    for folder in FOLDERS:
        for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, folder)):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for f in filenames:
                if not f.endswith(SKIP_EXT):
                    path = os.path.join(dirpath, f)
                    z.write(path, os.path.relpath(path, ROOT))

print(f"Wrote {OUT} ({os.path.getsize(OUT) / 1e6:.1f} MB)")

# The same files as a folder, for Replit's "upload folder" option.
import shutil
FOLDER = os.path.join(ROOT, "wellness_replit")
shutil.rmtree(FOLDER, ignore_errors=True)
zipfile.ZipFile(OUT).extractall(FOLDER)
print(f"Wrote {FOLDER}")
