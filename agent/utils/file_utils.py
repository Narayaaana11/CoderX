"""
utils/file_utils.py
--------------------
General-purpose filesystem helpers used across the agent modules.
"""

import hashlib
import json
from pathlib import Path


def safe_read(path: Path, encoding: str = "utf-8") -> str:
    """Read a file, ignoring encoding errors."""
    try:
        return path.read_text(encoding=encoding, errors="ignore")
    except Exception:
        return ""


def write_json(data: dict, path: Path, indent: int = 2) -> None:
    """Serialise a dict to JSON and write to disk, creating parent dirs."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, default=str)


def read_json(path: Path) -> dict:
    """Load a JSON file; return {} on failure."""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def file_hash(path: Path) -> str:
    """Return the SHA-256 hex digest of a file's contents."""
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65_536), b""):
                h.update(chunk)
    except Exception:
        pass
    return h.hexdigest()


def dir_size_mb(path: Path) -> float:
    """Return the total size of all files under *path* in megabytes."""
    total = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
    return round(total / 1_048_576, 2)


def list_code_files(root: Path, extensions: tuple[str, ...] = (".js", ".ts", ".jsx", ".tsx", ".py")) -> list[Path]:
    """Recursively list all code files under *root* with the given extensions."""
    skip_dirs = {"node_modules", ".git", "dist", "build", "__pycache__", ".venv"}
    results: list[Path] = []
    for f in root.rglob("*"):
        if f.is_file() and f.suffix in extensions:
            if not any(d in f.parts for d in skip_dirs):
                results.append(f)
    return results
