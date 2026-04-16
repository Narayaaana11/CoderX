"""
agent/cloner.py
---------------
Clones selected GitHub repositories into the local workspace.
Handles shallow clones, duplicate detection, and storage management.
"""

import logging
import shutil
import subprocess
from pathlib import Path

from config.settings import Settings

logger = logging.getLogger("GitHubAgent.Cloner")


class RepositoryCloner:
    """
    Clones repositories using git (via subprocess) or falls back to
    a zip-download strategy for environments without git.
    """

    def __init__(self, settings: Settings):
        self.settings   = settings
        self.repos_root = Path(settings.repos_dir)
        self.repos_root.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def clone_all(self, repos: list[dict]) -> dict[str, Path]:
        """
        Clone all repos in the list.

        Returns
        -------
        dict  {repo_name: local_path}  (only successfully cloned repos)
        """
        results: dict[str, Path] = {}
        for repo in repos:
            path = self._clone_one(repo)
            if path:
                results[repo["name"]] = path
        return results

    def clone_one(self, repo: dict) -> Path | None:
        """Clone a single repository (public API for individual use)."""
        return self._clone_one(repo)

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    def _clone_one(self, repo: dict) -> Path | None:
        name      = repo["name"].replace("/", "__")
        clone_url = repo["clone_url"]
        dest      = self.repos_root / name

        # Duplicate detection
        if dest.exists():
            logger.info("  ↩  Already cloned: %s", name)
            return dest

        logger.info("  ⬇  Cloning %s …", name)
        success = self._git_clone(clone_url, dest)
        if success:
            logger.info("  ✔  Cloned → %s", dest)
            return dest

        # Fallback: zip download
        logger.warning("  ⚠  git clone failed, trying zip download …")
        success = self._zip_download(repo, dest)
        if success:
            logger.info("  ✔  Downloaded (zip) → %s", dest)
            return dest

        logger.error("  ✗  Failed to clone %s", name)
        return None

    def _git_clone(self, url: str, dest: Path) -> bool:
        cmd = [
            "git", "clone",
            "--depth", str(self.settings.clone_depth),
            "--single-branch",
            url,
            str(dest),
        ]
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.settings.clone_timeout_seconds,
            )
            if result.returncode == 0:
                return True
            logger.debug("git clone stderr: %s", result.stderr[:300])
            return False
        except subprocess.TimeoutExpired:
            logger.warning("Clone timed out for %s", url)
            shutil.rmtree(dest, ignore_errors=True)
            return False
        except FileNotFoundError:
            logger.warning("git executable not found — falling back to zip download")
            return False

    def _zip_download(self, repo: dict, dest: Path) -> bool:
        """
        Download the default-branch zip from GitHub and extract it.
        Works in environments where git is not installed.
        """
        import io
        import zipfile
        import requests

        # GitHub zip URL pattern
        zip_url = repo["html_url"] + "/archive/refs/heads/main.zip"
        fallback_url = repo["html_url"] + "/archive/refs/heads/master.zip"

        for url in (zip_url, fallback_url):
            try:
                resp = requests.get(
                    url,
                    headers=self.settings.github_api_headers,
                    timeout=self.settings.clone_timeout_seconds,
                    stream=True,
                )
                if resp.status_code != 200:
                    continue
                with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
                    # The zip contains a single top-level folder; extract into dest
                    top = zf.namelist()[0].split("/")[0]
                    zf.extractall(dest.parent)
                    extracted = dest.parent / top
                    if extracted != dest:
                        extracted.rename(dest)
                return True
            except Exception as e:
                logger.debug("Zip download attempt failed (%s): %s", url, e)

        return False

    # ------------------------------------------------------------------
    # Disk management helpers
    # ------------------------------------------------------------------

    def remove_repo(self, repo_name: str) -> None:
        """Delete a cloned repo to free up disk space."""
        path = self.repos_root / repo_name.replace("/", "__")
        if path.exists():
            shutil.rmtree(path)
            logger.info("Removed %s", path)

    def disk_usage_mb(self) -> float:
        """Return total disk usage of the repos workspace in megabytes."""
        total = sum(f.stat().st_size for f in self.repos_root.rglob("*") if f.is_file())
        return round(total / 1_048_576, 2)
