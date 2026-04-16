"""
agent/analyzer.py
-----------------
Walks a cloned repository and builds a structured summary of its
architecture: frameworks detected, directory map, key files, API
routes, models, components, and authentication modules.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any

from config.settings import Settings

logger = logging.getLogger("GitHubAgent.Analyzer")


# ── Pattern databases ───────────────────────────────────────────────────────

FRAMEWORK_PATTERNS: dict[str, list[str]] = {
    # Frontend
    "React":      ["react", "react-dom", "@react"],
    "Next.js":    ["next"],
    "Vue":        ["vue", "@vue"],
    "Angular":    ["@angular/core"],
    "Svelte":     ["svelte"],
    # Backend
    "Express":    ["express"],
    "Fastify":    ["fastify"],
    "NestJS":     ["@nestjs/core"],
    "Django":     ["django"],
    "FastAPI":    ["fastapi"],
    "Flask":      ["flask"],
    "Spring":     ["spring-boot"],
    # Database
    "Mongoose":   ["mongoose"],
    "Prisma":     ["prisma", "@prisma/client"],
    "Sequelize":  ["sequelize"],
    "SQLAlchemy": ["sqlalchemy"],
    # Auth
    "Passport":   ["passport"],
    "NextAuth":   ["next-auth"],
    "JWT":        ["jsonwebtoken", "pyjwt", "jwt"],
}

ROUTE_FILE_PATTERNS = [
    r"routes?[\\/]",
    r"api[\\/]",
    r"controllers?[\\/]",
    r"endpoints?[\\/]",
    r"views?\.py$",
    r"urls\.py$",
]

MODEL_FILE_PATTERNS = [
    r"models?[\\/]",
    r"schemas?[\\/]",
    r"entities[\\/]",
    r"db[\\/]",
]

COMPONENT_DIRS = {"components", "widgets", "ui", "views", "pages", "screens"}
AUTH_SIGNALS   = {"auth", "login", "register", "signup", "passport", "jwt", "session", "token"}


class RepositoryAnalyzer:
    """
    Produces a structured analysis dict for a single cloned repository.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def analyze(self, repo_path: Path) -> dict[str, Any]:
        if not repo_path.exists():
            logger.warning("Path does not exist: %s", repo_path)
            return {}

        logger.info("  Analysing %s", repo_path.name)

        frameworks = self._detect_frameworks(repo_path)
        safety = self._safety_scan(repo_path)

        return {
            "path":               str(repo_path),
            "directory_tree":     self._build_tree(repo_path, depth=3),
            "frameworks":         frameworks,
            "detected_stack":     self.detect_stack(repo_path, frameworks),
            "api_routes":         self._find_route_files(repo_path),
            "ui_components":      self._find_component_files(repo_path),
            "database_models":    self._find_model_files(repo_path),
            "auth_modules":       self._find_auth_modules(repo_path),
            "entry_points":       self._find_entry_points(repo_path),
            "config_files":       self._find_config_files(repo_path),
            "safety":             safety,
            "has_tests":          self._has_tests(repo_path),
            "has_docker":         self._has_file(repo_path, "Dockerfile"),
            "has_readme":         self._has_file(repo_path, "README*"),
            "file_count":         self._count_files(repo_path),
        }

    def detect_stack(self, repo_path: Path, frameworks: list[str] | None = None) -> str:
        frameworks = frameworks or self._detect_frameworks(repo_path)
        fw = set(frameworks)

        if {"React", "Express", "Mongoose"}.issubset(fw):
            return "MERN"
        if {"Angular", "Express"}.issubset(fw):
            return "MEAN"
        if "Next.js" in fw:
            return "NextJS"
        if "Django" in fw:
            return "Django"
        if "FastAPI" in fw:
            return "FastAPI"
        if "Spring" in fw:
            return "Spring"
        if "React" in fw:
            return "React"
        if "Vue" in fw:
            return "Vue"
        if "Express" in fw:
            return "Node"

        if (repo_path / "requirements.txt").exists():
            return "Python"
        if (repo_path / "pom.xml").exists():
            return "Java"
        if (repo_path / "package.json").exists():
            return "Node"
        return "unknown"

    def _safety_scan(self, root: Path) -> dict[str, Any]:
        report = {
            "allowed_license_hint": None,
            "dependency_conflict_flags": [],
            "malicious_code_flags": [],
            "safe_to_extract": True,
        }

        package_json = root / "package.json"
        if package_json.exists():
            try:
                data = json.loads(package_json.read_text(errors="ignore"))
                report["allowed_license_hint"] = data.get("license")
                scripts = data.get("scripts", {}) if isinstance(data, dict) else {}
                for key, value in scripts.items():
                    text = f"{key} {value}".lower()
                    if any(signal in text for signal in ["curl ", "wget ", "powershell -enc", "rm -rf /"]):
                        report["malicious_code_flags"].append(f"script:{key}")
            except Exception:
                pass

        req = root / "requirements.txt"
        if req.exists():
            raw = req.read_text(errors="ignore").lower()
            if "-e git+" in raw:
                report["dependency_conflict_flags"].append("editable_git_dependency")

        lockfiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock"]
        if sum(1 for lf in lockfiles if (root / lf).exists()) > 1:
            report["dependency_conflict_flags"].append("multiple_lockfiles_detected")

        report["safe_to_extract"] = not report["malicious_code_flags"]
        return report

    # ------------------------------------------------------------------
    # Framework detection
    # ------------------------------------------------------------------

    def _detect_frameworks(self, root: Path) -> list[str]:
        detected: set[str] = set()

        # Parse package.json
        pkg = root / "package.json"
        if pkg.exists():
            try:
                data = json.loads(pkg.read_text(errors="ignore"))
                deps = {
                    **data.get("dependencies", {}),
                    **data.get("devDependencies", {}),
                }
                for framework, signals in FRAMEWORK_PATTERNS.items():
                    if any(s in deps for s in signals):
                        detected.add(framework)
            except Exception:
                pass

        # Parse requirements.txt
        req = root / "requirements.txt"
        if req.exists():
            content = req.read_text(errors="ignore").lower()
            for framework, signals in FRAMEWORK_PATTERNS.items():
                if any(s in content for s in signals):
                    detected.add(framework)

        # Parse pom.xml / build.gradle (Java)
        for fname in ("pom.xml", "build.gradle"):
            f = root / fname
            if f.exists():
                content = f.read_text(errors="ignore").lower()
                for framework, signals in FRAMEWORK_PATTERNS.items():
                    if any(s in content for s in signals):
                        detected.add(framework)

        return sorted(detected)

    # ------------------------------------------------------------------
    # File-pattern finders
    # ------------------------------------------------------------------

    def _find_route_files(self, root: Path) -> list[str]:
        return self._find_by_patterns(root, ROUTE_FILE_PATTERNS, max_results=20)

    def _find_model_files(self, root: Path) -> list[str]:
        return self._find_by_patterns(root, MODEL_FILE_PATTERNS, max_results=20)

    def _find_component_files(self, root: Path) -> list[str]:
        results: list[str] = []
        for f in root.rglob("*"):
            if f.is_file() and any(d in f.parts for d in COMPONENT_DIRS):
                results.append(str(f.relative_to(root)))
            if len(results) >= 30:
                break
        return results

    def _find_auth_modules(self, root: Path) -> list[str]:
        results: list[str] = []
        for f in root.rglob("*"):
            if f.is_file():
                name_lower = f.name.lower()
                if any(sig in name_lower for sig in AUTH_SIGNALS):
                    results.append(str(f.relative_to(root)))
        return results[:15]

    def _find_entry_points(self, root: Path) -> list[str]:
        candidates = [
            "index.js", "app.js", "server.js", "main.js",
            "index.ts", "app.ts", "server.ts", "main.ts",
            "app.py", "main.py", "manage.py", "wsgi.py",
            "Application.java", "Main.java",
        ]
        found = []
        for name in candidates:
            if (root / name).exists():
                found.append(name)
        return found

    def _find_config_files(self, root: Path) -> list[str]:
        config_names = [
            ".env.example", ".env.sample", "config.js", "config.ts",
            "config.py", "settings.py", "next.config.js", "vite.config.ts",
            "docker-compose.yml", "docker-compose.yaml",
        ]
        return [n for n in config_names if (root / n).exists()]

    # ------------------------------------------------------------------
    # Utility methods
    # ------------------------------------------------------------------

    def _find_by_patterns(self, root: Path, patterns: list[str], max_results: int = 20) -> list[str]:
        results: list[str] = []
        compiled = [re.compile(p, re.IGNORECASE) for p in patterns]
        for f in root.rglob("*"):
            rel = str(f.relative_to(root)).replace("\\", "/")
            if any(rx.search(rel) for rx in compiled):
                results.append(rel)
            if len(results) >= max_results:
                break
        return results

    def _build_tree(self, root: Path, depth: int = 3) -> dict:
        def _recurse(path: Path, current_depth: int) -> Any:
            if current_depth == 0:
                return "…"
            if path.is_file():
                return None  # leaf, skip
            children = {}
            try:
                for child in sorted(path.iterdir()):
                    # Skip common noise directories
                    if child.name in {".git", "node_modules", "__pycache__", ".next", "dist", "build", ".venv"}:
                        continue
                    if child.is_dir():
                        subtree = _recurse(child, current_depth - 1)
                        if subtree is not None:
                            children[child.name + "/"] = subtree
                    else:
                        children[child.name] = "file"
            except PermissionError:
                pass
            return children

        return _recurse(root, depth)

    def _has_tests(self, root: Path) -> bool:
        test_dirs = {"test", "tests", "__tests__", "spec", "specs", "e2e"}
        return any((root / d).is_dir() for d in test_dirs)

    def _has_file(self, root: Path, pattern: str) -> bool:
        return bool(list(root.glob(pattern)))

    def _count_files(self, root: Path) -> int:
        try:
            return sum(1 for _ in root.rglob("*") if _.is_file())
        except Exception:
            return 0
