#!/usr/bin/env python3
"""Attach an App Store Connect promo video to a release post.

The App Store Connect app can share a celebration video when an app is ready
for distribution; there is no API for it. Share it from the app with
Save to Files › iCloud Drive › Blog › Release videos, then run on the Mac:

  python3 scripts/attach_release_video.py liftcoach-1-0-1

The newest video in that folder is converted with macOS's built-in avconvert
(H.264, at most 1080p, source metadata such as location stripped), saved as
release.mp4 in the post bundle, referenced from both language files via
`video: release.mp4`, and pushed to the release/<slug> branch so it joins the
open pull request. Use --branch master for a post that is already published,
or --video to pick a specific file.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INBOX = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Blog/Release videos"
VIDEO_TYPES = {".mov", ".mp4", ".m4v"}


def run(*args: str, cwd: Path = ROOT) -> str:
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def newest_video() -> Path:
    videos = [p for p in INBOX.glob("*") if p.suffix.lower() in VIDEO_TYPES] if INBOX.exists() else []
    if not videos:
        raise SystemExit(f"No video found in {INBOX}. Save it there from the App Store Connect app, or pass --video.")
    return max(videos, key=lambda p: p.stat().st_mtime)


def add_video_param(post: Path) -> None:
    text = post.read_text()
    if re.search(r"^video:", text, re.M):
        text = re.sub(r"^video:.*$", 'video: "release.mp4"', text, count=1, flags=re.M)
    else:
        end = text.index("\n---", 3)
        text = text[:end] + '\nvideo: "release.mp4"' + text[end:]
    post.write_text(text)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("slug", help="post folder name under content/post, e.g. liftcoach-1-0-1")
    parser.add_argument("--video", type=Path, help="video file to use instead of the newest one in the inbox")
    parser.add_argument("--branch", help="branch to update (default: release/<slug>)")
    args = parser.parse_args()

    source = args.video or newest_video()
    branch = args.branch or f"release/{args.slug}"
    run("git", "fetch", "origin", branch)

    with tempfile.TemporaryDirectory(prefix="release-video-") as tmp:
        worktree = Path(tmp) / "site"
        run("git", "worktree", "add", "-B", branch, str(worktree), f"origin/{branch}")
        try:
            bundle = worktree / "content" / "post" / args.slug
            posts = sorted(bundle.glob("index*.md"))
            if not posts:
                raise SystemExit(f"{bundle.relative_to(worktree)} has no post on {branch}.")
            output = bundle / "release.mp4"
            print(f"Converting {source.name}…")
            run("avconvert", "--source", str(source), "--output", str(output), "--preset", "Preset1920x1080", "--replace")
            for post in posts:
                add_video_param(post)
            run("git", "add", str(output.relative_to(worktree)), *[str(p.relative_to(worktree)) for p in posts], cwd=worktree)
            run("git", "commit", "-m", f"Add the promo video to {args.slug}", cwd=worktree)
            run("git", "push", "origin", f"HEAD:{branch}", cwd=worktree)
            size = output.stat().st_size / 1_000_000
            print(f"Pushed release.mp4 ({size:.1f} MB) to {branch}.")
        finally:
            run("git", "worktree", "remove", "--force", str(worktree))
    return 0


if __name__ == "__main__":
    sys.exit(main())
