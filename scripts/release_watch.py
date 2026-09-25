#!/usr/bin/env python3
"""Open a blog-post pull request whenever one of my apps reaches the App Store.

Runs hourly from .github/workflows/release-watch.yml. For every app in
data/apps.yaml that has an `appStoreId`, it lists App Store versions through
the App Store Connect API. A version counts as released once App Store Connect
reports it as distributed (READY_FOR_DISTRIBUTION / READY_FOR_SALE).

Released versions are remembered as empty marker files in
.github/release-watch/seen/<appId>-<platform>-<version>, one file per version
so that parallel release PRs never conflict. A new release produces:

  * content/post/<slug>/index.en.md and index.zh-cn.md, written from the
    version's App Store localizations (What's New, promotional text,
    description) in English and Simplified Chinese;
  * a `store:` link in data/apps.yaml for an app's first release;
  * marker files for the versions it covers;

all on a `release/<slug>` branch with a pull request against master.
Merging publishes; closing the PR (and keeping its branch) skips the release,
because an existing branch is never recreated.

Local dry run with canned API data:
  python3 scripts/release_watch.py --fixture scripts/release_watch_fixture.json --out /tmp/preview
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
APPS_YAML = ROOT / "data" / "apps.yaml"
SEEN_DIR = ROOT / ".github" / "release-watch" / "seen"
POSTS_DIR = ROOT / "content" / "post"
API = "https://api.appstoreconnect.apple.com/v1"
RELEASED = {"READY_FOR_DISTRIBUTION", "READY_FOR_SALE"}
# App Store Connect platform -> (devices named in posts, tag)
PLATFORMS = {
    "IOS": (["iPhone", "iPad"], "iOS"),
    "MAC_OS": (["Mac"], "macOS"),
    "VISION_OS": (["Apple Vision Pro"], "visionOS"),
    "TV_OS": (["Apple TV"], "tvOS"),
}


def devices(platforms: list[str]) -> list[str]:
    return [d for p in platforms for d in PLATFORMS.get(p, ([p], p))[0]]
PRICE_PATTERN = re.compile(r"(US\$|\$\s?\d|€\s?\d|£\s?\d|¥\s?\d|￥\s?\d|\d\s?(元|美元)|per month|per year|/month|/year|每月|每年)", re.I)


# ---- data/apps.yaml (a flat list of scalar fields; parsed without PyYAML) ----

def load_apps() -> list[dict]:
    apps, current = [], None
    for line in APPS_YAML.read_text().splitlines():
        if line.startswith("- "):
            current = {}
            apps.append(current)
            line = "  " + line[2:]
        match = re.match(r"^  ([A-Za-z]+):\s*(.*)$", line)
        if current is not None and match:
            value = match.group(2).strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                value = value[1:-1]
            current[match.group(1)] = value
    return [app for app in apps if app.get("appStoreId")]


def add_store_link(app: dict) -> bool:
    """Give an app its App Store link in data/apps.yaml on its first release."""
    if app.get("store"):
        return False
    lines = APPS_YAML.read_text().splitlines(keepends=True)
    start = next(i for i, line in enumerate(lines) if line.rstrip() == f"- name: {app['name']}")
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("- ")), len(lines))
    anchor = next((i for i in range(start, end) if lines[i].startswith("  url:")), start)
    lines.insert(anchor + 1, f"  store: https://apps.apple.com/app/id{app['appStoreId']}\n")
    APPS_YAML.write_text("".join(lines))
    return True


# ---- App Store Connect API ---------------------------------------------------

class AppStoreConnect:
    def __init__(self) -> None:
        import jwt  # PyJWT with the cryptography extra

        missing = [n for n in ("ASC_KEY_ID", "ASC_ISSUER_ID", "ASC_PRIVATE_KEY") if not os.environ.get(n)]
        if missing:
            raise SystemExit(f"Missing App Store Connect credentials: {', '.join(missing)}")
        now = int(time.time())
        self.token = jwt.encode(
            {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 15 * 60, "aud": "appstoreconnect-v1"},
            os.environ["ASC_PRIVATE_KEY"],
            algorithm="ES256",
            headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"},
        )

    def get(self, path: str, params: dict) -> list[dict]:
        url, rows = f"{API}{path}?{urllib.parse.urlencode(params)}", []
        while url:
            request = urllib.request.Request(url, headers={"Authorization": f"Bearer {self.token}"})
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    body = json.load(response)
            except urllib.error.HTTPError as error:
                detail = error.read().decode(errors="replace")[:500]
                raise SystemExit(f"App Store Connect {error.code} for {path}: {detail}")
            rows += body.get("data", [])
            url = body.get("links", {}).get("next")
        return rows

    def versions(self, app_id: str) -> list[dict]:
        rows = self.get(f"/apps/{app_id}/appStoreVersions", {
            "limit": 200,
            "fields[appStoreVersions]": "versionString,platform,appStoreState,appVersionState",
        })
        return [{"id": r["id"], **r["attributes"]} for r in rows]

    def localizations(self, version_id: str) -> list[dict]:
        rows = self.get(f"/appStoreVersions/{version_id}/appStoreVersionLocalizations", {
            "limit": 50,
            "fields[appStoreVersionLocalizations]": "locale,whatsNew,promotionalText,description",
        })
        return [r["attributes"] for r in rows]


class Fixture:
    """Canned API responses: {"versions": {appId: [...]}, "localizations": {versionId: [...]}}."""

    def __init__(self, path: str) -> None:
        self.data = json.loads(Path(path).read_text())

    def versions(self, app_id: str) -> list[dict]:
        return self.data["versions"].get(app_id, [])

    def localizations(self, version_id: str) -> list[dict]:
        return self.data["localizations"].get(version_id, [])


# ---- Post writing ------------------------------------------------------------

def is_released(version: dict) -> bool:
    return version.get("appVersionState") in RELEASED or version.get("appStoreState") in RELEASED


def version_key(number: str) -> tuple[int, ...]:
    return tuple(int(part) for part in re.findall(r"\d+", number))


def marker(app_id: str, version: dict) -> str:
    return f"{app_id}-{version['platform']}-{version['versionString']}"


def pick(locs: list[dict], prefixes: tuple[str, ...]) -> dict:
    for prefix in prefixes:
        for loc in locs:
            if loc.get("locale", "").lower().startswith(prefix):
                return loc
    return {}


def store_text(text: str | None) -> str:
    """Turn App Store plain text into safe Markdown: bullets become lists, HTML is escaped."""
    if not text:
        return ""
    out = []
    for raw in text.strip().splitlines():
        line = raw.strip().replace("<", "&lt;").replace(">", "&gt;")
        bullet = re.match(r"^[•·・\-\*–—]\s*(.+)$", line)
        if bullet:
            if out and out[-1] and not out[-1].startswith("- "):
                out.append("")
            out.append(f"- {bullet.group(1)}")
        elif line:
            # Store text breaks lines between paragraphs; keep each one separate.
            if out and out[-1]:
                out.append("")
            out.append(re.sub(r"^(#+)", r"\\\1", line))
        elif out and out[-1]:
            out.append("")
    return "\n".join(out).strip()


def join_platforms(names: list[str], zh: bool) -> str:
    if len(names) == 1:
        return names[0]
    if zh:
        return "、".join(names[:-1]) + " 和 " + names[-1]
    return ", ".join(names[:-1]) + (", and " if len(names) > 2 else " and ") + names[-1]


def front_matter(fields: dict) -> str:
    lines = ["---"]
    for key, value in fields.items():
        lines.append(f"{key}: {json.dumps(value, ensure_ascii=False)}")
    lines.append("# Add a promo video with scripts/attach_release_video.py <slug>")
    lines.append("---")
    return "\n".join(lines)


def write_post(app: dict, version: str, platforms: list[str], locs: list[dict], launch: bool, slug: str, now: dt.datetime) -> list[Path]:
    store = f"https://apps.apple.com/app/id{app['appStoreId']}"
    name = app["name"]
    en_loc, zh_loc = pick(locs, ("en-us", "en")), pick(locs, ("zh-hans", "zh-cn", "zh"))
    tags = [name] + [PLATFORMS.get(p, ([p], p))[1] for p in platforms]
    date = now.isoformat(timespec="seconds")
    folder = POSTS_DIR / slug
    folder.mkdir(parents=True, exist_ok=True)
    written = []

    for lang, loc in (("en", en_loc), ("zh-cn", zh_loc)):
        zh = lang == "zh-cn"
        if zh and not loc:
            continue  # No Chinese store listing: publish the English post only.
        loc = loc or {}
        where = join_platforms(devices(platforms), zh)
        notes = store_text(loc.get("whatsNew"))
        promo = store_text(loc.get("promotionalText"))
        about = store_text(loc.get("description"))

        if zh:
            title = f"{name} 已上架 App Store" if launch else f"{name} {version} 已发布"
            lead = f"{name} {version} 已正式[上架 App Store]({store})，支持 {where}。"
            summary = f"{name} {version} 已上架，支持 {where}。"
        else:
            title = f"{name} is on the App Store" if launch else f"{name} {version} is out"
            lead = f"{name} {version} is now [available on the App Store]({store}) for {where}."
            summary = f"{name} {version} is now available for {where}."
        description = (promo.splitlines()[0] if promo else summary) if launch else summary

        body = [lead]
        if launch:
            if promo:
                body += ["", promo]
            if about:
                body += ["", f"## {'关于' if zh else 'About'} {name}", "", about]
        elif notes:
            body += ["", "## 更新内容" if zh else "## What’s new", "", notes]
        links = []
        if app.get("url"):
            links.append(f"[{'了解' if zh else 'Explore'} {name}]({app['url']})")
        if app.get("support"):
            links.append(f"[{'获取支持' if zh else 'get support'}]({app['support']})")
        if links:
            body += ["", ("，或" if zh else " or ").join(links) + ("。" if zh else ".")]

        matter = front_matter({
            "title": title,
            "slug": slug,
            "date": date,
            "draft": False,
            "description": description,
            "categories": ["apps"],
            "tags": tags,
        })
        path = folder / f"index.{lang}.md"
        path.write_text(matter + "\n\n" + "\n".join(body).strip() + "\n")
        written.append(path)
    return written


def slug_for(app: dict, version: str, launch: bool) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", app["name"].lower()).strip("-")
    slug = f"{base}-on-the-app-store" if launch else f"{base}-{version.replace('.', '-')}"
    if (POSTS_DIR / slug).exists():
        slug = f"{base}-{version.replace('.', '-')}"
    return slug


# ---- Git and GitHub ----------------------------------------------------------

def git(*args: str, check: bool = True) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=check, capture_output=True, text=True).stdout.strip()


def branch_exists(branch: str) -> bool:
    return bool(git("ls-remote", "--heads", "origin", branch))


def open_pull_request(branch: str, title: str, body: str, paths: list[Path]) -> None:
    # The files were written on a clean master checkout; carry them to a new branch.
    git("checkout", "-b", branch)
    for path in paths:
        git("add", str(path.relative_to(ROOT)))
    git("commit", "-m", title + "\n\nOpened by the App Store release watcher.")
    git("push", "origin", branch)
    subprocess.run(["gh", "pr", "create", "--base", "master", "--head", branch, "--title", title, "--body", body],
                   cwd=ROOT, check=True)
    git("checkout", "master")


# ---- Main --------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--fixture", help="read canned API responses instead of calling App Store Connect")
    parser.add_argument("--out", help="dry run: write posts under this directory instead of content/post")
    parser.add_argument("--create-prs", action="store_true", help="commit each release to a branch and open a PR")
    parser.add_argument("--seed", action="store_true", help="mark every released version as seen without posting")
    args = parser.parse_args()

    global POSTS_DIR
    if args.out:
        POSTS_DIR = Path(args.out)
    client = Fixture(args.fixture) if args.fixture else AppStoreConnect()
    seen = {p.name for p in SEEN_DIR.glob("*")} if SEEN_DIR.exists() else set()
    now = dt.datetime.now(ZoneInfo("America/Los_Angeles")).replace(microsecond=0)
    # A dry run keeps its markers next to the preview instead of in the repo.
    state_dir = Path(args.out) / "seen" if args.out else SEEN_DIR
    state_dir.mkdir(parents=True, exist_ok=True)

    for app in load_apps():
        released = [v for v in client.versions(app["appStoreId"]) if is_released(v)]
        fresh = [v for v in released if marker(app["appStoreId"], v) not in seen]
        # Only versions newer than anything already seen on that platform get a post,
        # so an old release that was never recorded can't surface as news.
        newest = {}
        for v in released:
            if marker(app["appStoreId"], v) in seen:
                newest[v["platform"]] = max(newest.get(v["platform"], ()), version_key(v["versionString"]))
        fresh = [v for v in fresh if version_key(v["versionString"]) > newest.get(v["platform"], ())]
        if args.seed:
            for version in fresh:
                (state_dir / marker(app["appStoreId"], version)).touch()
                print(f"seeded {app['name']} {version['platform']} {version['versionString']}")
            continue

        # One post per app version, covering every platform released together.
        by_version: dict[str, list[dict]] = {}
        for version in fresh:
            by_version.setdefault(version["versionString"], []).append(version)
        for number, versions in sorted(by_version.items()):
            launch = not any(marker(app["appStoreId"], v) in seen for v in released)
            platforms = sorted({v["platform"] for v in versions}, key=list(PLATFORMS).index)
            slug = slug_for(app, number, launch)
            branch = f"release/{slug}"
            if args.create_prs and branch_exists(branch):
                print(f"skip {app['name']} {number}: {branch} already exists")
                continue

            locs = client.localizations(versions[0]["id"])
            paths = write_post(app, number, platforms, locs, launch, slug, now)
            for version in versions:
                path = state_dir / marker(app["appStoreId"], version)
                path.touch()
                paths.append(path)
                seen.add(path.name)
            if launch and not args.out and add_store_link(app):
                paths.append(APPS_YAML)

            text = "\n".join(p.read_text() for p in paths if p.suffix == ".md")
            warnings = []
            if PRICE_PATTERN.search(text):
                warnings.append("- ⚠️ The store text mentions a price. App pages avoid prices; edit before merging if needed.")
            if not any(p.name == "index.zh-cn.md" for p in paths):
                warnings.append("- No Simplified Chinese App Store localization was found, so this is English-only.")
            if not (pick(locs, ("en",)).get("whatsNew") or launch):
                warnings.append("- This version has no English “What’s New” text; the post only announces availability.")
            title = f"Blog: {app['name']} {number} on the App Store"
            body = "\n".join([
                f"**{app['name']} {number}** is now released for {join_platforms(devices(platforms), False)}.",
                "",
                "This post was written from the App Store localizations. Review it, then merge to publish. "
                "Close this PR to skip the release; keep the branch so it isn't opened again.",
                "",
                f"To add the App Store Connect promo video, save it to iCloud Drive › Blog › Release videos and run "
                f"`python3 scripts/attach_release_video.py {slug}` on the Mac.",
                *([""] + warnings if warnings else []),
            ])
            if args.create_prs:
                open_pull_request(branch, title, body, paths)
            print(f"{'PR' if args.create_prs else 'wrote'} {slug}: {', '.join(str(p.relative_to(ROOT) if p.is_relative_to(ROOT) else p) for p in paths)}")
            if not args.create_prs:
                print(body)
    return 0


if __name__ == "__main__":
    sys.exit(main())
